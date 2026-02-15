from cryptography.fernet import Fernet
import os
import base64

# Generate a default key for dev if not present
# In production, this should be loaded from a secure vault or env var
DEFAULT_KEY = "ChangeThisToASecureKeyInProduction================="
SECRET_KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key().decode())

def get_cipher_suit():
    try:
        return Fernet(SECRET_KEY.encode())
    except Exception:
         # Fallback for dev if key is invalid format (32 url-safe base64-encoded bytes)
         # Using a newly generated key for this session (Note: Persisted data won't be decryptable if service restarts)
         return Fernet(Fernet.generate_key())

cipher_suite = get_cipher_suit()

def encrypt_value(value: str) -> str:
    if not value:
        return None
    encrypted_bytes = cipher_suite.encrypt(value.encode())
    return encrypted_bytes.decode()

def decrypt_value(encrypted_value: str) -> str:
    if not encrypted_value:
        return None
    try:
        decrypted_bytes = cipher_suite.decrypt(encrypted_value.encode())
        return decrypted_bytes.decode()
    except Exception:
        # If decryption fails (key changed or invalid data), return the original
        # This is a fallback to avoid crashing on legacy data
        return encrypted_value
