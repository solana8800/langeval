import os
from typing import List
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from app.core.utils import LoggingCallbackHandler
from app.models.schemas import PersonaList

async def generate_personas(count: int, context: str) -> List[dict]:
    """
    Generate synthetic personas using LLM (Real Logic).
    """
    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com")
    model_name = os.getenv("MODEL_NAME", "deepseek-chat")
    
    if not api_key or "placeholder" in api_key:
        return [
           {"name": f"Mock User {i}", "age": 30, "job": "Tester", "pain_points": "Mock"} 
           for i in range(count)
        ]

    llm = ChatOpenAI(
        model=model_name, 
        temperature=0.7, 
        api_key=api_key,
        base_url=base_url
    )
    
    parser = JsonOutputParser(pydantic_object=PersonaList)
    
    prompt = PromptTemplate(
        template="Generate {count} synthetic user personas useful for testing a {context} application.\n{format_instructions}",
        input_variables=["count", "context"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )
    
    chain = prompt | llm | parser
    
    try:
        response = await chain.ainvoke(
            {"count": count, "context": context},
            config={"callbacks": [LoggingCallbackHandler("gen-ai-service")]}
        )
        # JsonOutputParser returns dict, check structure
        return [p.dict() if hasattr(p, 'dict') else p for p in response.get('personas', [])]
    except Exception as e:
        print(f"GenAI Error: {e}")
        return []

async def generate_test_cases(persona: dict, context: str) -> List[str]:
    """
    Generate test cases based on persona.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com")
    model_name = os.getenv("MODEL_NAME", "deepseek-chat")
    
    if not api_key: return ["Mock Test Case 1", "Mock Test Case 2"]
    
    llm = ChatOpenAI(
        model=model_name, 
        temperature=0.7, 
        api_key=api_key,
        base_url=base_url
    )
    
    prompt = PromptTemplate(
        template="You are {name}, a {age} year old {job} with this pain point: {pain_points}.\nWrite 3 natural user messages you would send to a chatbot about {context}. Return as a JSON list of strings.",
        input_variables=["name", "age", "job", "pain_points", "context"]
    )
    
    # Simple JSON List Parser
    from langchain_core.output_parsers import JsonOutputParser
    chain = prompt | llm | JsonOutputParser()
    
    try:
        return await chain.ainvoke(
            {
                "name": persona.get("name"), 
                "age": persona.get("age"), 
                "job": persona.get("job"),
                "pain_points": persona.get("pain_points"),
                "context": context
            },
            config={"callbacks": [LoggingCallbackHandler("gen-ai-service")]}
        )
    except Exception as e:
        print(f"GenAI Error: {e}")
        return ["Error generating test cases"]
