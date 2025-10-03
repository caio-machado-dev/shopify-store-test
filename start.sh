#!/bin/bash

# ============================================================================
# BaziCash - Script de Inicialização
# ============================================================================

echo "🚀 Iniciando BaziCash Backend..."
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se está na raiz do projeto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script na raiz do projeto${NC}"
    exit 1
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Instale: https://nodejs.org${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js encontrado: $(node --version)${NC}"

# Verificar se dependências estão instaladas
if [ ! -d "server/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependências não encontradas. Instalando...${NC}"
    cd server && npm install && cd ..
    echo -e "${GREEN}✅ Dependências instaladas${NC}"
fi

# Verificar se .env existe
if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
    echo -e "${YELLOW}📝 Criando .env a partir do exemplo...${NC}"
    
    if [ -f "server/.env.example" ]; then
        cp server/.env.example server/.env
        echo -e "${YELLOW}✅ Arquivo .env criado. Configure suas credenciais em server/.env${NC}"
        echo -e "${RED}⚠️  ATENÇÃO: Configure o .env antes de continuar!${NC}"
        echo ""
        echo "Edite o arquivo: nano server/.env"
        echo ""
        exit 1
    else
        echo -e "${RED}❌ Arquivo .env.example não encontrado${NC}"
        exit 1
    fi
fi

# Verificar se credenciais estão configuradas
if grep -q "sua_secret_key_aqui" server/.env || grep -q "shpca_xxxxxxxx" server/.env; then
    echo -e "${RED}❌ Credenciais não configuradas no .env${NC}"
    echo -e "${YELLOW}Configure suas credenciais: nano server/.env${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Arquivo .env configurado${NC}"
echo ""

# Iniciar servidor
echo -e "${GREEN}🚀 Iniciando servidor...${NC}"
echo ""
cd server && npm run dev
