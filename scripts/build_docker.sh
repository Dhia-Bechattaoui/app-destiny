#!/bin/bash
set -e

# Ensure docker buildx is available
if ! docker buildx version > /dev/null 2>&1; then
  echo "Error: 'docker buildx' is not available. Please install Docker Desktop or buildx."
  exit 1
fi

# Create a new builder instance if one doesn't exist
if ! docker buildx inspect mybuilder > /dev/null 2>&1; then
  echo "Creating new builder instance 'mybuilder'..."
  docker buildx create --use --name mybuilder --driver docker-container
else
  echo "Using existing builder instance 'mybuilder'..."
  docker buildx use mybuilder
fi

echo "Building Docker image with attestations..."

# Get metadata
GIT_COMMIT=$(git rev-parse HEAD)
GIT_REPO_URL=$(git config --get remote.origin.url)
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

IMAGE_NAME="pix3lman/app-destiny:latest"

echo "Repo: $GIT_REPO_URL"
echo "Commit: $GIT_COMMIT"
echo "Date: $BUILD_DATE"

# Build with attestations
# --provenance=mode=max enables full provenance
# --sbom=true generates an SBOM
# --load loads the image into the local docker daemon (remove if pushing directly)
docker buildx build \
  --tag "$IMAGE_NAME" \
  --provenance=mode=max \
  --sbom=true \
  --build-arg GIT_COMMIT="$GIT_COMMIT" \
  --build-arg GIT_REPO_URL="$GIT_REPO_URL" \
  --build-arg BUILD_DATE="$BUILD_DATE" \
  --load \
  .

echo "Build complete: $IMAGE_NAME"
echo "To verify attestations, run: docker buildx imagetools inspect $IMAGE_NAME"
