#!/usr/bin/env bash
# set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo hello
echo $REPO_ROOT

npm --prefix "${REPO_ROOT}/client" run build
npm --prefix "${REPO_ROOT}/server" run build

docker build --platform=linux/amd64 -t talarbatov/psynth-app "${REPO_ROOT}"
docker push talarbatov/psynth-app:latest
