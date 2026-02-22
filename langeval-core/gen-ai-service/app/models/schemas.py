from pydantic import BaseModel, Field
from typing import List

# Request Models
class PersonaRequest(BaseModel):
    count: int = 5
    context: str = "Banking App"

    model_config = {
        "json_schema_extra": {
            "example": {
                "count": 3,
                "context": "E-commerce platform for fashion"
            }
        }
    }

class TestCaseRequest(BaseModel):
    persona: dict
    context: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "persona": {
                    "name": "Sarah",
                    "age": 28,
                    "job": "Software Engineer",
                    "pain_points": "Needs fast checkout"
                },
                "context": "Mobile Shopping App"
            }
        }
    }

# Logic Models
class Persona(BaseModel):
    name: str = Field(description="Name of the user")
    age: int = Field(description="Age of the user")
    job: str = Field(description="Job title")
    pain_points: str = Field(description="Current problem")

class PersonaList(BaseModel):
    personas: List[Persona]
