
import unittest
import sys
import os
from pydantic import ValidationError

# Fix sys.path to find 'app'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.models.domain import AgentCreate, ScenarioCreate, NodeItem, EdgeItem, Position

class TestValidation(unittest.TestCase):

    def test_agent_create_url_validation(self):
        """Test AgentCreate endpoint_url validation"""
        # Valid URL
        agent = AgentCreate(name="Test Agent", endpoint_url="http://localhost:8000")
        self.assertEqual(agent.endpoint_url, "http://localhost:8000")
        
        agent = AgentCreate(name="Test Agent", endpoint_url="https://api.example.com/v1")
        self.assertEqual(agent.endpoint_url, "https://api.example.com/v1")

        # Invalid URL
        with self.assertRaises(ValidationError):
            AgentCreate(name="Test Agent", endpoint_url="not-a-url")

        with self.assertRaises(ValidationError):
            AgentCreate(name="Test Agent", endpoint_url="ftp:///missing-host")

    def test_scenario_create_strict_typing(self):
        """Test ScenarioCreate strict typing for nodes and edges"""
        # Valid Scenario
        nodes = [
            NodeItem(id="1", type="start", position=Position(x=0, y=0), data={})
        ]
        edges = []
        scenario = ScenarioCreate(name="Strict Scenario", nodes=nodes, edges=edges)
        self.assertEqual(len(scenario.nodes), 1)

        # Invalid Node (Raw Dict instead of NodeItem)
        # Pydantic *might* coerce dict to model if fields match, but let's check strictness.
        # Actually SQLModel/Pydantic defaults to coercion. 
        # But if we pass something that CANNOT be coerced, it should fail.
        
        with self.assertRaises(ValidationError):
            ScenarioCreate(name="Bad Scenario", nodes=[{"id": "1", "type": "start"}], edges=[])
            # Missing position, should fail

if __name__ == "__main__":
    unittest.main()
