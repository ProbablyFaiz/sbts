import os

import s3fs

BUCKET_NAME = os.getenv("BUCKET_NAME")
BUCKET_PUBLIC_URL = os.getenv("BUCKET_PUBLIC_URL")
BUCKET_ACCESS_KEY_ID = os.getenv("BUCKET_ACCESS_KEY_ID")
BUCKET_SECRET_ACCESS_KEY = os.getenv("BUCKET_SECRET_ACCESS_KEY")
BUCKET_ENDPOINT = os.getenv("BUCKET_ENDPOINT")


def upload_bytes(data: bytes, key: str) -> str:
    """Upload bytes to S3 and return public URL"""
    fs = s3fs.S3FileSystem(
        key=BUCKET_ACCESS_KEY_ID,
        secret=BUCKET_SECRET_ACCESS_KEY,
        endpoint_url=BUCKET_ENDPOINT,
    )

    full_key = f"{BUCKET_NAME}/{key}"
    with fs.open(full_key, "wb") as f:
        f.write(data)
    return f"{BUCKET_PUBLIC_URL}/{key}"
