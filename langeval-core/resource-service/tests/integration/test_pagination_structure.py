
import unittest
import sys
import os
from unittest.mock import MagicMock, patch

# Fix sys.path to find 'app'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi.testclient import TestClient
from app.main import app
from app.models.domain import Page, AgentRef

class TestPaginationStructure(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    @patch("app.api.v1.endpoints.agents.AgentService")
    def test_get_agents_pagination(self, mock_service_cls):
        """Test GET /agents returns Page structure"""
        # Mock Service
        mock_service = mock_service_cls.return_value
        
        # Mock Page Response
        dummy_agents = [
            AgentRef(name="Agent 1", endpoint_url="http://localhost:1", id="1"),
            AgentRef(name="Agent 2", endpoint_url="http://localhost:2", id="2")
        ]
        
        mock_page = Page(
            items=dummy_agents,
            total=50,
            page=1,
            size=10,
            pages=5
        )
        
        mock_service.get_agents.return_value = mock_page
        
        # Call API
        response = self.client.get("/resource/agents?page=1&page_size=10")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify Structure
        self.assertIn("items", data)
        self.assertIn("total", data)
        self.assertIn("page", data)
        self.assertIn("size", data)
        self.assertIn("pages", data)
        
        self.assertEqual(len(data["items"]), 2)
        self.assertEqual(data["total"], 50)
        self.assertEqual(data["page"], 1)

if __name__ == "__main__":
    unittest.main()
