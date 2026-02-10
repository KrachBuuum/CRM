#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# KMU CRM Pro - Raspberry Pi One-Click Deployment
# Login-Bypass: AKTIV (Dashboard direkt erreichbar ohne Login)
# Optimiert fuer ARM-Architektur / Raspberry Pi
# ══════════════════════════════════════════════════════════════════════════════
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="$HOME/crm-pro"
REPO_URL="https://github.com/KrachBuuum/CRM.git"
BRANCH="claude/deep-analysis-verification-PPdaP"

echo -e "${GREEN}══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  KMU CRM Pro - Raspberry Pi Deployment${NC}"
echo -e "${GREEN}  Login-Bypass: AKTIV${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════${NC}"
echo ""

# ─── [1/7] Systempakete ─────────────────────────────────────────────────────
echo -e "${YELLOW}[1/7] Systempakete aktualisieren...${NC}"
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential ca-certificates gnupg lsb-release

# ─── [2/7] Docker ────────────────────────────────────────────────────────────
echo -e "${YELLOW}[2/7] Docker installieren (falls nicht vorhanden)...${NC}"
if ! command -v docker &> /dev/null; then
  echo "Docker wird installiert..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER"
  echo -e "${GREEN}Docker installiert.${NC}"
  # Fuer Docker-Gruppenrechte: newgrp verwenden
  if ! groups | grep -q docker; then
    echo -e "${YELLOW}>>> HINWEIS: Docker-Gruppe wurde hinzugefuegt.${NC}"
    echo -e "${YELLOW}>>> Falls 'permission denied' auftritt: ausloggen und neu einloggen.${NC}"
  fi
else
  echo "Docker bereits vorhanden: $(docker --version)"
fi

# Docker Compose pruefen
if ! docker compose version &> /dev/null 2>&1; then
  if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose Plugin installieren..."
    sudo apt install -y docker-compose-plugin 2>/dev/null || sudo apt install -y docker-compose
  fi
fi

# Docker-Dienst starten
sudo systemctl enable docker
sudo systemctl start docker

# ─── [3/7] Node.js 20 ───────────────────────────────────────────────────────
echo -e "${YELLOW}[3/7] Node.js 20 installieren (fuer Frontend-Build)...${NC}"
if ! command -v node &> /dev/null || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
fi
echo "Node.js: $(node -v) / npm: $(npm -v)"

# ─── [4/7] Repository klonen ────────────────────────────────────────────────
echo -e "${YELLOW}[4/7] CRM-Projekt von GitHub klonen...${NC}"
if [ -d "$PROJECT_DIR" ]; then
  echo "Vorhandenes Projekt sichern..."
  mv "$PROJECT_DIR" "${PROJECT_DIR}.backup.$(date +%s)"
fi

git clone -b "$BRANCH" "$REPO_URL" "$PROJECT_DIR"
cd "$PROJECT_DIR"
echo -e "${GREEN}Repository geklont: $BRANCH${NC}"

# ─── [5/7] Frontend bauen ───────────────────────────────────────────────────
echo -e "${YELLOW}[5/7] Frontend-Dependencies installieren und bauen...${NC}"
cd "$PROJECT_DIR"

# Pi-Optimierung: npm mit reduziertem Speicher
export NODE_OPTIONS="--max-old-space-size=512"
npm install --prefer-offline 2>/dev/null || npm install

echo "Frontend wird gebaut (kann auf Pi einige Minuten dauern)..."
npm run build

if [ ! -d "$PROJECT_DIR/dist" ]; then
  echo -e "${RED}FEHLER: Build fehlgeschlagen - dist/ Verzeichnis nicht gefunden${NC}"
  exit 1
fi
echo -e "${GREEN}Frontend erfolgreich gebaut: $(du -sh dist/ | cut -f1)${NC}"

# ─── [6/7] Docker Container starten ─────────────────────────────────────────
echo -e "${YELLOW}[6/7] Docker Container bauen und starten...${NC}"
cd "$PROJECT_DIR"

# Docker Compose starten (mit Compose V2 oder V1 Fallback)
if docker compose version &> /dev/null 2>&1; then
  sudo docker compose down 2>/dev/null || true
  sudo docker compose up -d --build
else
  sudo docker-compose down 2>/dev/null || true
  sudo docker-compose up -d --build
fi

# ─── [7/7] Health-Check ─────────────────────────────────────────────────────
echo -e "${YELLOW}[7/7] Warte auf Backend-Start...${NC}"
MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
  if curl -s http://localhost/api/health | grep -q '"ok":true' 2>/dev/null; then
    echo -e "${GREEN}Backend ist bereit!${NC}"
    break
  fi
  sleep 3
  WAITED=$((WAITED + 3))
  echo "  Warte... (${WAITED}s/${MAX_WAIT}s)"
done

if [ $WAITED -ge $MAX_WAIT ]; then
  echo -e "${YELLOW}Backend antwortet noch nicht. Container-Status:${NC}"
  if docker compose version &> /dev/null 2>&1; then
    sudo docker compose ps
    sudo docker compose logs --tail=20 backend
  else
    sudo docker-compose ps
    sudo docker-compose logs --tail=20 backend
  fi
  echo -e "${YELLOW}Tipp: 'sudo docker compose logs -f' fuer Live-Logs${NC}"
fi

# ─── Fertig ──────────────────────────────────────────────────────────────────
PI_IP=$(hostname -I | awk '{print $1}')
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  INSTALLATION ABGESCHLOSSEN!${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Dashboard:  ${GREEN}http://${PI_IP}${NC}"
echo -e "  API-Health: ${GREEN}http://${PI_IP}/api/health${NC}"
echo ""
echo -e "  Login-Bypass: ${YELLOW}AKTIV${NC} (kein Login erforderlich)"
echo -e "  Admin-Login:  admin / admin123 (falls Bypass deaktiviert)"
echo ""
echo -e "  ${YELLOW}Um Login zu reaktivieren:${NC}"
echo -e "    1. docker-compose.yml: LOGIN_BYPASS=false setzen"
echo -e "    2. sudo docker compose up -d --build"
echo ""
echo -e "  Nuetzliche Befehle:"
echo -e "    Logs:     sudo docker compose logs -f"
echo -e "    Neustart: sudo docker compose restart"
echo -e "    Stoppen:  sudo docker compose down"
echo ""
