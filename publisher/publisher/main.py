import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from publisher.bucket import upload_to_gcs
from publisher.latex import create_pdf_from_template
from publisher.utils import sha1_bytes

load_dotenv()

GCP_BUCKET_NAME = os.getenv("GCP_BUCKET_NAME")
GCP_PUBLIC_URL = os.getenv("GCP_PUBLIC_URL")

app = FastAPI(title="SBTS Publisher")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PublishRequest(BaseModel):
    request_id: str
    template_name: str
    ballot_fields: dict[str, Any]


class PublishResponse(BaseModel):
    request_id: str
    bucket_url: str


@app.get("/", operation_id="healthCheck")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/publish", operation_id="publish")
def publish(request: PublishRequest) -> PublishResponse:
    pdf = create_pdf_from_template(request.template_name, request.ballot_fields)
    pdf_hash = sha1_bytes(pdf)
    bucket_key = f"ballots/{pdf_hash[:2]}/{pdf_hash}.pdf"
    upload_to_gcs(GCP_BUCKET_NAME, bucket_key, pdf, "application/pdf")
    return PublishResponse(
        request_id=request.request_id, bucket_url=f"{GCP_PUBLIC_URL}/{bucket_key}"
    )
