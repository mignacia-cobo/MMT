#!/bin/bash
# =============================================================
# build-and-push.sh — Construye imágenes y las sube a Docker Hub
# Uso:  bash build-and-push.sh [tag]
# Ej:   bash build-and-push.sh v1.2
#       bash build-and-push.sh        (usa "latest")
# =============================================================
set -e

# ---- CONFIGURA ESTO ----
DOCKERHUB_USER="TU_USUARIO_DOCKERHUB"   # ← tu usuario de hub.docker.com
VITE_API_URL="http://64.176.11.46:3001" # URL pública del backend
# -------------------------

TAG="${1:-latest}"
BACKEND_IMAGE="$DOCKERHUB_USER/mmt-backend:$TAG"
FRONTEND_IMAGE="$DOCKERHUB_USER/mmt-frontend:$TAG"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo -e "${GREEN}"
echo "  ╔═══════════════════════════════════╗"
echo "  ║  MMT Valpo Hub  •  Build & Push   ║"
echo "  ╚═══════════════════════════════════╝"
echo -e "${NC}"

# ---- Login a Docker Hub ----
echo -e "${YELLOW}[1/4] Login Docker Hub...${NC}"
docker login -u "$DOCKERHUB_USER"

# ---- Build backend ----
echo -e "${YELLOW}[2/4] Build backend → $BACKEND_IMAGE${NC}"
docker build \
  -f Dockerfile.backend \
  -t "$BACKEND_IMAGE" \
  .

# ---- Build frontend ----
echo -e "${YELLOW}[3/4] Build frontend → $FRONTEND_IMAGE${NC}"
docker build \
  -f Dockerfile.frontend \
  --build-arg "VITE_API_URL=$VITE_API_URL" \
  -t "$FRONTEND_IMAGE" \
  .

# ---- Push ----
echo -e "${YELLOW}[4/4] Push a Docker Hub...${NC}"
docker push "$BACKEND_IMAGE"
docker push "$FRONTEND_IMAGE"

echo ""
echo -e "${GREEN}=== Listo ===${NC}"
echo "  docker.io/$BACKEND_IMAGE"
echo "  docker.io/$FRONTEND_IMAGE"
echo ""
echo "Ahora en el servidor:"
echo "  ssh root@64.176.11.46 'cd /opt/mmt && bash deploy.sh'"
