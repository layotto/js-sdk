#!/bin/bash

# Setup MinIO for testing
# This script creates the required bucket for OSS tests

set -e

# Wait for MinIO to be ready
echo "Waiting for MinIO to be ready..."
for i in {1..30}; do
  if curl -sf http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo "MinIO is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "MinIO failed to start"
    exit 1
  fi
  echo "Waiting for MinIO... ($i/30)"
  sleep 1
done

# Install MinIO client if not available
if ! command -v mc &> /dev/null; then
  echo "Installing MinIO client..."
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    curl -sSL https://dl.min.io/client/mc/release/linux-amd64/mc -o /tmp/mc
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    curl -sSL https://dl.min.io/client/mc/release/darwin-amd64/mc -o /tmp/mc
  else
    echo "Unsupported OS: $OSTYPE"
    exit 1
  fi
  chmod +x /tmp/mc
  MC_CMD="/tmp/mc"
else
  MC_CMD="mc"
fi

# Configure MinIO alias
echo "Configuring MinIO client..."
$MC_CMD alias set myminio http://localhost:9000 layotto layotto_secret

# Create test bucket
echo "Creating test bucket..."
$MC_CMD mb myminio/layotto-test-bucket --ignore-existing

echo "MinIO setup complete!"
