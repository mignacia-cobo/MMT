#!/bin/bash
# =============================================================
# deploy.sh — Corre en el SERVIDOR para actualizar la app
# El servidor solo hace pull de Docker Hub, sin compilar nada
# Uso: bash deploy.sh [tag]   (default: latest)
# =============================================================
set -e

TAG="${1:-latest}"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

echo -e "${GREEN}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║   MMT Valpo Hub  •  Deploy           ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

if [ ! -f .env.production ]; then
  echo -e "${RED}ERROR: Falta .env.production${NC}"
  exit 1
fi

echo -e "${YELLOW}[1/3] Descargando imágenes (tag: $TAG)...${NC}"
IMAGE_TAG=$TAG docker compose -f docker-compose.prod.yml --env-file .env.production pull

echo -e "${YELLOW}[2/3] Reiniciando servicios...${NC}"
IMAGE_TAG=$TAG docker compose -f docker-compose.prod.yml --env-file .env.production up -d

echo -e "${YELLOW}[3/3] Estado de contenedores...${NC}"
sleep 3
docker compose -f docker-compose.prod.yml ps

echo ""
echo -e "${GREEN}=== Deploy completado ===${NC}"
echo "  Frontend:  http://64.176.11.46:3000"
echo "  Backend:   http://64.176.11.46:3001/api/salud"
echo ""
echo "Logs: docker logs mmt_backend -f"
