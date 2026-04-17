#!/bin/bash
set -e
echo "=== Deploy Meu Ganho Pessoal ==="

if [ ! -f ".env" ]; then
  echo "ERRO: arquivo .env não encontrado!"
  echo "Copie o .env.example para .env e preencha as variáveis."
  exit 1
fi

echo "[1/4] Instalando dependências..."
pnpm install

echo "[2/4] Fazendo build..."
pnpm build

echo "[3/4] Rodando migrations..."
pnpm db:push

echo "[4/4] Iniciando/reiniciando processo PM2..."
if pm2 describe pessoal > /dev/null 2>&1; then
  pm2 restart pessoal
else
  pm2 start dist/index.js --name "pessoal" --env production
fi
pm2 save

echo ""
echo "=== Deploy concluído! ==="
echo "Aplicação rodando em http://localhost:3002"
echo "Verifique com: pm2 logs pessoal"
