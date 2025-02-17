set dotenv-load := true

default:
    just --list

publisher-build:
    cd publisher && docker build -t $GCP_CONTAINER_TAG . --build-arg GCP_BUCKET_NAME=$GCP_BUCKET_NAME --build-arg GCP_PUBLIC_URL=$GCP_PUBLIC_URL

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

fanout-build:
    cd publisher/fanout && npm run build

fanout-deploy:
    cd publisher/fanout && gcloud functions deploy publisher_fanout \
        --gen2 \
        --runtime=nodejs22 \
        --region=us-central1 \
        --source=. \
        --entry-point=handler \
        --trigger-http \
        --allow-unauthenticated \
        --set-env-vars FANOUT_PUBLISHER_ENDPOINT=$GCP_PUBLISHER_ENDPOINT
