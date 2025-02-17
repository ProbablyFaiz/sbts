set dotenv-load := true

default:
    just --list

publisher-build:
    cd publisher && docker build -t $GCP_CONTAINER_TAG .

publisher-push:
    cd publisher && docker push $GCP_CONTAINER_TAG

publisher-deploy:
    cd publisher && gcloud run deploy publisher \
        --image $GCP_CONTAINER_TAG \
        --platform managed \
        --region us-central1 \
        --port 80 \
        --memory 3Gi \
        --cpu 2 \
        --min-instances 0 \
        --max-instances 10 \
        --timeout 60s \
        --concurrency 1 \
        --allow-unauthenticated
