#!/bin/bash

echo "Step 1 - building the web app"

npm run build

echo "Step 2 - copying the files to the server"

ssh root@64.176.164.119 "rm -rf /var/www/psynth/*"

scp -r /Users/tal/dev/psynth/psynth-webapp/dist/* root@64.176.164.119:/var/www/psynth

echo "Deploy successful!"