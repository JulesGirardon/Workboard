#!/bin/bash

if [[ "$1" == "prod" ]]; then
    echo "[PROD] Build et lancement de l'app et MongoDB..."
    docker-compose -f docker/prod/docker-compose.yml up -d --build
elif [[ "$1" == "dev" ]]; then
    echo "[DEV] Création du réseau Docker (si besoin)..."
    docker network inspect workboard_network >/dev/null 2>&1 || docker network create workboard_network
    echo "[DEV] Lancement de l'app (hot reload) et MongoDB..."
    docker-compose -f docker/dev/docker-compose.yml up -d --build
else
    echo "Usage: $0 [prod|dev]"
    exit 1
fi