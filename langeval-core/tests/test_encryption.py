
import sys
import os

# Adapt path to import from backend
sys.path.append(os.path.join(os.getcwd(), "backend/resource-service"))

try:
    from app.core.security import encrypt_value, decrypt_value
    
    key = "test-api-key"
    print(f"Encrypting: {key}")
    enc = encrypt_value(key)
    print(f"Encrypted: {enc}")
    
    dec = decrypt_value(enc)
    print(f"Decrypted: {dec}")
    
    assert key == dec
    print("Encryption Test Passed!")
    
except Exception as e:
    print(f"Test Failed: {e}")
