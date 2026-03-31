#!/bin/bash

if [[ "$1" == "prod" ]]; then
    echo "[PROD] Arrêt de l'app et MongoDB..."
    docker-compose -f docker/prod/docker-compose.yml down
elif [[ "$1" == "dev" ]]; then
    echo "[DEV] Arrêt de l'app et MongoDB..."
    docker-compose -f docker/dev/docker-compose.yml down
    echo "[DEV] Suppression du réseau Docker..."
    docker network rm workboard_network
else
    echo "Usage: $0 [prod|dev]"
    exit 1
fi