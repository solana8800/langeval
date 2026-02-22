
import os
from cryptography.fernet import Fernet

SECRET_KEY = os.getenv("ENCRYPTION_KEY")
cipher_suite = Fernet(SECRET_KEY.encode()) if SECRET_KEY else None

def decrypt_value(encrypted_value: str) -> str:
    """
    Decrypts a value using the shared ENCRYPTION_KEY.
    Returns the original value if decryption fails or key is missing.
    """
    if not encrypted_value or not cipher_suite:
        return encrypted_value
    try:
        decrypted_bytes = cipher_suite.decrypt(encrypted_value.encode())
        return decrypted_bytes.decode()
    except Exception as e:
        print(f"Decryption failed: {e}")
        return encrypted_value
