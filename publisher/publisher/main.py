import os
from typing import Annotated, Any

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from publisher.bucket import upload_to_gcs
from publisher.latex import create_pdf_from_template
from publisher.utils import sha1_bytes

load_dotenv()

GCP_BUCKET_NAME = os.getenv("GCP_BUCKET_NAME")
GCP_PUBLIC_URL = os.getenv("GCP_PUBLIC_URL")
_API_KEY = os.getenv("PUBLISHER_API_KEY")

security = HTTPBearer()
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


def verify_api_key(
    credentials: Annotated[HTTPAuthorizationCredentials, Security(security)],
) -> None:
    if credentials.credentials != _API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


@app.get("/", operation_id="healthCheck")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/publish", operation_id="publish")
def publish(
    request: PublishRequest, _: Annotated[None, Depends(verify_api_key)]
) -> PublishResponse:
    pdf = create_pdf_from_template(request.template_name, request.ballot_fields)
    pdf_hash = sha1_bytes(pdf)
    bucket_key = f"sbts/{pdf_hash[:2]}/{pdf_hash}.pdf"
    upload_to_gcs(GCP_BUCKET_NAME, bucket_key, pdf, "application/pdf")
    return PublishResponse(
        request_id=request.request_id, bucket_url=f"{GCP_PUBLIC_URL}/{bucket_key}"
    )
