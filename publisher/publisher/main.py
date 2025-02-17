from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="SBTS Publisher")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PublishBallotRequest(BaseModel):
    template_name: str
    ballot_fields: dict[str, Any]


class PublishBallotResponse(BaseModel):
    bucket_url: str


@app.get("/", operation_id="healthCheck")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/publish_ballot", operation_id="publishBallot")
def publish_ballot(request: PublishBallotRequest) -> PublishBallotResponse:
    pass
