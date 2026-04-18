#!/bin/bash
# =============================================================
# deploy.sh — Despliegue MMT Valpo Hub en servidor
# Uso: bash deploy.sh
# =============================================================
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║   MMT Valpo Hub  •  Deploy           ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# Verificar que existe .env.production
if [ ! -f .env.production ]; then
  echo -e "${RED}ERROR: No existe .env.production${NC}"
  echo "Crea el archivo con las variables de producción antes de desplegar."
  exit 1
fi

echo -e "${YELLOW}[1/4] Actualizando código...${NC}"
git pull origin master

echo -e "${YELLOW}[2/4] Construyendo imágenes Docker...${NC}"
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache

echo -e "${YELLOW}[3/4] Iniciando servicios...${NC}"
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

echo -e "${YELLOW}[4/4] Verificando estado...${NC}"
sleep 5
docker compose -f docker-compose.prod.yml ps

echo ""
echo -e "${GREEN}=== Despliegue completado ===${NC}"
echo ""
echo "  Frontend:  http://64.176.11.46:3000"
echo "  Backend:   http://64.176.11.46:3001/api/salud"
echo ""
echo "Logs backend:  docker logs mmt_backend -f"
echo "Logs frontend: docker logs mmt_frontend -f"
