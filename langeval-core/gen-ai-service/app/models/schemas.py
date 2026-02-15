from pydantic import BaseModel, Field
from typing import List

# Request Models
class PersonaRequest(BaseModel):
    count: int = 5
    context: str = "Banking App"

class TestCaseRequest(BaseModel):
    persona: dict
    context: str

# Logic Models
class Persona(BaseModel):
    name: str = Field(description="Name of the user")
    age: int = Field(description="Age of the user")
    job: str = Field(description="Job title")
    pain_points: str = Field(description="Current problem")

class PersonaList(BaseModel):
    personas: List[Persona]
