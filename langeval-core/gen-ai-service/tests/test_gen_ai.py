import unittest
import sys
import os
from unittest.mock import MagicMock, patch

# Global Mocks
sys.modules["fitz"] = MagicMock()
sys.modules["chromadb"] = MagicMock()
sys.modules["chromadb.config"] = MagicMock()
sys.modules["langchain"] = MagicMock()
sys.modules["langchain.text_splitter"] = MagicMock()

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.optimizer import optimizer
from app.services.rag_service import rag_service

class TestGenAIService(unittest.TestCase):

    def test_gepa_optimizer(self):
        """
        Test GEPA mock implementation.
        """
        prompt = "Test prompt"
        history = optimizer.optimize(prompt, n_generations=2)
        
        self.assertEqual(len(history), 2)
        self.assertGreater(history[0]["score"], 0)
        print("GEPA Optimizer verified!")

    def test_rag_ingest(self):
        """
        Test RAG ingestion (with mocked PyMuPDF).
        """
        with patch("app.services.rag_service.fitz.open") as mock_open:
            mock_doc = MagicMock()
            mock_page = MagicMock()
            mock_page.get_text.return_value = "This is some PDF content. " * 50
            mock_doc.__iter__.return_value = [mock_page]
            mock_open.return_value = mock_doc
            
            kb_id = rag_service.ingest_pdf("dummy.pdf")
            
            self.assertIn("indexed", kb_id)
            print(f"RAG Ingest verified: {kb_id}")

if __name__ == "__main__":
    unittest.main()
