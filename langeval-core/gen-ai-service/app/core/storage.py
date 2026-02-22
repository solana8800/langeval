
import boto3
import os
from botocore.exceptions import NoCredentialsError

class S3Client:
    def __init__(self):
        self.bucket = os.getenv("S3_BUCKET_NAME", "raw-documents")
        self.s3 = boto3.client(
            's3',
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "minio"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "minio123"),
            endpoint_url=os.getenv("S3_ENDPOINT_URL", "http://minio:9000")
        )

    def upload_file(self, file_obj, object_name=None):
        """Upload a file-like object to S3."""
        if object_name is None:
            raise ValueError("Object name must be specified")

        try:
            self.s3.upload_fileobj(file_obj, self.bucket, object_name)
            return f"s3://{self.bucket}/{object_name}"
        except NoCredentialsError:
            print("Credentials not available")
            return None
        except Exception as e:
            print(f"Failed to upload to S3: {e}")
            raise e

    def download_file(self, object_name, file_path):
        """Download a file from S3 to a local path."""
        try:
            self.s3.download_file(self.bucket, object_name, file_path)
            return True
        except Exception as e:
            print(f"Failed to download from S3: {e}")
            return False

# Singleton
s3_client = S3Client()
