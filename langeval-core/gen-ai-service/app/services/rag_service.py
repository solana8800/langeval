import fitz  # PyMuPDF
import uuid
import chromadb
from chromadb.config import Settings
try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
from typing import List, Dict, Optional
import os
from app.core.storage import s3_client

class RAGService:
    def __init__(self):
        # In-memory ChromaDB for prototype
        self.chroma_client = chromadb.Client(Settings(
            is_persistent=False,
            anonymized_telemetry=False
        ))
        self.collection = self.chroma_client.get_or_create_collection(name="transient_kb")
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )

    def ingest_pdf(self, file_path: str, metadata: Dict = {}) -> str:
        """
        Parses PDF, chunks it, and stores embeddings.
        Supports local paths or 's3://bucket/key'.
        Returns the Knowledge Base ID.
        """
        temp_file_path = file_path
        is_s3 = file_path.startswith("s3://")
        
        if is_s3:
            # Parse bucket/key from s3://bucket/key
            parts = file_path.replace("s3://", "").split("/", 1)
            # We simply let download_file handle logic if we pass the KEY (excluding bucket if client manages it)
            # Actually storage.py's download_file takes (object_name, file_path) and uses default bucket.
            # So here we assume the input is just the Object Key if it maps to default bucket, 
            # OR we parse it. For simplicity with current storage.py, let's assume file_path IS the key if likely,
            # BUT the storage.py return format is s3://bucket/key. 
            
            # Let's adjust storage.py usage:
            bucket_name = s3_client.bucket
            if file_path.startswith(f"s3://{bucket_name}/"):
                key = file_path.replace(f"s3://{bucket_name}/", "")
            else:
                # Fallback or error? For now assume it matches our bucket
                key = file_path 
            
            temp_file_path = f"/tmp/{uuid.uuid4()}.pdf"
            print(f"Downloading S3 object {key} to {temp_file_path}")
            success = s3_client.download_file(key, temp_file_path)
            if not success:
                raise Exception(f"Failed to download file from S3: {file_path}")

        try:
            doc = fitz.open(temp_file_path)
            full_text = ""
            for page in doc:
                full_text += page.get_text()
            
            chunks = self.text_splitter.split_text(full_text)
            
            ids = [str(uuid.uuid4()) for _ in chunks]
            metadatas = [metadata for _ in chunks]
            
            self.collection.add(
                documents=chunks,
                metadatas=metadatas,
                ids=ids
            )
            
            return f"kb_{uuid.uuid4()}_indexed_{len(chunks)}_chunks"
            
        finally:
            if is_s3 and os.path.exists(temp_file_path):
                os.remove(temp_file_path)

    def query(self, query_text: str, n_results: int = 3) -> List[str]:
        results = self.collection.query(
            query_texts=[query_text],
            n_results=n_results
        )
        # Flatten results (list of list)
        return results['documents'][0] if results['documents'] else []

# Singleton instance
rag_service = RAGService()
