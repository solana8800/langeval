from fastapi import APIRouter, File, UploadFile, HTTPException
from app.models.schemas import PersonaRequest, TestCaseRequest
from app.services.generators import generate_personas, generate_test_cases
from app.services.rag_service import rag_service
from app.core.storage import s3_client
import shutil
import uuid

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok", "service": "gen-ai-service"}

@router.post("/generate/personas")
async def create_personas(req: PersonaRequest):
    data = await generate_personas(req.count, req.context)
    return {"personas": data}

@router.post("/generate/test-cases")
async def create_cases(req: TestCaseRequest):
    cases = await generate_test_cases(req.persona, req.context)
    return {"test_cases": cases}

@router.post("/rag/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Uploads a PDF file to S3 and ingests it into the RAG system.
    """
    if file.filename.split('.')[-1].lower() != "pdf":
         raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    file_id = str(uuid.uuid4())
    s3_key = f"uploads/{file_id}_{file.filename}"
    
    try:
        # Upload to S3
        s3_url = s3_client.upload_file(file.file, s3_key)
        if not s3_url:
             raise HTTPException(status_code=500, detail="Failed to upload to S3.")
             
        # Ingest
        kb_id = rag_service.ingest_pdf(s3_url, metadata={"filename": file.filename})
        
        return {
            "status": "success",
            "s3_url": s3_url,
            "kb_id": kb_id
        }
    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
