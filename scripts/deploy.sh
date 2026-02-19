#!/bin/bash

echo "Step 1 - building the web app"

npm run build

echo "Step 2 - copying the files to the server"

scp -r /Users/tal/dev/psynth/psynth-web/dist root@64.176.164.119:/root/dev/psynth-web-static-files

echo "Deploy successful!"