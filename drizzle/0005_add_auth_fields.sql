-- Migration: adicionar auth próprio na tabela users do Pessoal
-- Executar no banco meuganho_pessoal ANTES do primeiro deploy

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password VARCHAR(64) NULL AFTER loginMethod,
  ADD COLUMN IF NOT EXISTS isBlocked BOOLEAN NOT NULL DEFAULT FALSE AFTER password,
  ADD COLUMN IF NOT EXISTS blockedReason TEXT NULL AFTER isBlocked;
