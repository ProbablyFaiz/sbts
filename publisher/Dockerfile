# Build stage
FROM python:3.11-slim-bookworm AS builder

# Install uv and git
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --compile-bytecode --no-install-project

# Copy and install the project
COPY publisher/ publisher/
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --compile-bytecode --no-editable

# Final stage
FROM python:3.11-slim-bookworm

# Install texlive-base and fonts
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        texlive-base \
        texlive-latex-base \
        texlive-latex-extra \
        texlive-fonts-recommended \
        texlive-fonts-extra && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -U app

# Copy only the venv from builder
COPY --from=builder --chown=app:app /app/.venv /app/.venv

COPY templates/ /app/templates/

# Set environment
ENV PATH="/app/.venv/bin:$PATH"
USER app
WORKDIR /app

CMD ["gunicorn", "publisher.main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:80"]
