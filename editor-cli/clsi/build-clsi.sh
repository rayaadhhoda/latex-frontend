#!/bin/bash
# Build script for Overleaf CLSI Docker image
# Clones the Overleaf repository, builds the image, and cleans up

set -e  # Exit on error

IMAGE_NAME="${IMAGE_NAME:-overleaf/clsi}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
REPO_URL="https://github.com/overleaf/overleaf.git"
TEMP_DIR=$(mktemp -d)

# Cleanup function
cleanup() {
    if [ -d "$TEMP_DIR" ]; then
        echo "Cleaning up temporary directory..."
        rm -rf "$TEMP_DIR"
    fi
}

# Set trap to cleanup on exit
trap cleanup EXIT

echo "Building CLSI Docker image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo "=========================================="

# Clone only the necessary directories using sparse checkout
echo "Cloning Overleaf repository (required directories only)..."
git clone --filter=blob:none --sparse --depth 1 "$REPO_URL" "$TEMP_DIR" || {
    echo "Error: Failed to clone Overleaf repository"
    exit 1
}

# Configure sparse checkout to include required paths for CLSI build
cd "$TEMP_DIR"
# Enable pattern matching mode and set directories and root JSON files
git sparse-checkout set --no-cone \
    services/clsi \
    libraries/fetch-utils \
    libraries/logger \
    libraries/metrics \
    libraries/o-error \
    libraries/promise-utils \
    libraries/settings \
    libraries/stream-utils \
    patches \
    '*.json' || {
    echo "Error: Failed to configure sparse checkout"
    exit 1
}

echo "Pulling texlive/texlive image..."
docker pull texlive/texlive || {
    echo "Error: Failed to pull texlive/texlive image"
    exit 1
}

# Build the Docker image
echo "Building Docker image..."
docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" -f services/clsi/Dockerfile . || {
    echo "Error: Failed to build Docker image"
    exit 1
}

echo "=========================================="
echo "Successfully built ${IMAGE_NAME}:${IMAGE_TAG}"
echo "Image is ready to use with docker-compose"

