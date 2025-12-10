#!/bin/bash
set -e

docker compose build
docker compose config

docker build -t sawayuuh/tdepsi-api:latest ./api
docker build -t sawayuuh/tdepsi-frontend:latest ./frontend

docker trust sign sawayuuh/tdepsi-api:latest
docker trust sign sawayuuh/tdepsi-frontend:latest

docker push sawayuuh/tdepsi-api:latest
docker push sawayuuh/tdepsi-frontend:latest

docker compose up -d
