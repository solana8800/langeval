from google.oauth2 import id_token
from google.auth.transport import requests
import os

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "Please set GOOGLE_CLIENT_ID")

class GoogleAuth:
    @staticmethod
    def verify_token(token: str) -> dict:
        try:
            # Verify the token with Google's public keys
            id_info = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)

            # Check if the issuer is Google
            if id_info['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')

            return {
                "google_id": id_info['sub'],
                "email": id_info['email'],
                "name": id_info.get('name'),
                "picture": id_info.get('picture'),
                "email_verified": id_info.get('email_verified')
            }
        except ValueError as e:
            # Token is invalid
            print(f"Invalid Token: {e}")
            return None
