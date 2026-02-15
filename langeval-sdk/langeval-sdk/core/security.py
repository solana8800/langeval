import re

def mask_pii(text: str) -> str:
    if not isinstance(text, str):
        return text
        
    # Mask Email
    text = re.sub(r'[\w\.-]+@[\w\.-]+', '<EMAIL>', text)
    
    # Mask Phone (Vietnam format +84 or 03/05/07/08/09)
    # Simple regex for demo
    text = re.sub(r'(84|0[3|5|7|8|9])([0-9]{8})\b', '<PHONE>', text)
    
    return text
