from google.cloud import storage


def upload_to_gcs(bucket_name: str, bucket_key: str, data: bytes) -> str:
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(bucket_key)
    blob.upload_from_string(data)
    return f"gs://{bucket_name}/{bucket_key}"
