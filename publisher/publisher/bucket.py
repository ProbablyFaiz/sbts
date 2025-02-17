from google.cloud import storage


def upload_to_gcs(
    bucket_name: str, bucket_key: str, data: bytes, content_type: str | None = None
) -> str:
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(bucket_key)
    blob.upload_from_string(data, content_type=content_type)
    return f"gs://{bucket_name}/{bucket_key}"
