import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { nanoid } from "nanoid";

export function registerOAuthRoutes(app: Express) {
  // Tela de login
  app.get("/login", (_req: Request, res: Response) => {
    res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Meu Ganho Pessoal — Login</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh}
    .card{background:#fff;border-radius:16px;padding:40px 36px;width:100%;max-width:400px;
      box-shadow:0 4px 24px rgba(0,0,0,.08);border:1px solid #e2e8f0}
    .logo{width:56px;height:56px;background:#6366f1;border-radius:14px;display:flex;
      align-items:center;justify-content:center;margin:0 auto 20px;font-size:24px}
    h1{text-align:center;font-size:22px;font-weight:700;color:#0f172a;margin-bottom:6px}
    p{text-align:center;color:#64748b;font-size:14px;margin-bottom:28px}
    label{display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:6px}
    input{width:100%;padding:11px 14px;border:1px solid #d1d5db;border-radius:9px;
      font-size:14px;outline:none;transition:border .15s}
    input:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.12)}
    .field{margin-bottom:18px}
    button{width:100%;padding:12px;background:#6366f1;color:#fff;border:none;
      border-radius:9px;font-size:15px;font-weight:600;cursor:pointer;margin-top:6px;transition:background .15s}
    button:hover{background:#4f46e5}
    .err{color:#ef4444;font-size:13px;text-align:center;margin-top:12px;display:none}
    .link{text-align:center;margin-top:20px;font-size:13px;color:#64748b}
    .link a{color:#6366f1;text-decoration:none;font-weight:500}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">💰</div>
    <h1>Meu Ganho Pessoal</h1>
    <p>Gestão financeira pessoal</p>
    <form id="form">
      <div class="field">
        <label>E-mail</label>
        <input type="email" id="email" placeholder="seu@email.com" required autocomplete="email"/>
      </div>
      <div class="field">
        <label>Senha</label>
        <input type="password" id="password" placeholder="••••••••" required autocomplete="current-password"/>
      </div>
      <button type="submit" id="btn">Entrar</button>
      <div class="err" id="err"></div>
    </form>
    <div class="link">Não tem conta? <a href="/register">Cadastre-se grátis</a></div>
  </div>
  <script>
    document.getElementById('form').onsubmit = async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn');
      const err = document.getElementById('err');
      btn.textContent = 'Entrando...';
      btn.disabled = true;
      err.style.display = 'none';
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao entrar');
        window.location.href = '/';
      } catch(e) {
        err.textContent = e.message;
        err.style.display = 'block';
        btn.textContent = 'Entrar';
        btn.disabled = false;
      }
    };
  </script>
</body>
</html>`);
  });

  // Tela de cadastro
  app.get("/register", (_req: Request, res: Response) => {
    res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Meu Ganho Pessoal — Cadastro</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh}
    .card{background:#fff;border-radius:16px;padding:40px 36px;width:100%;max-width:400px;
      box-shadow:0 4px 24px rgba(0,0,0,.08);border:1px solid #e2e8f0}
    .logo{width:56px;height:56px;background:#6366f1;border-radius:14px;display:flex;
      align-items:center;justify-content:center;margin:0 auto 20px;font-size:24px}
    h1{text-align:center;font-size:22px;font-weight:700;color:#0f172a;margin-bottom:6px}
    p{text-align:center;color:#64748b;font-size:14px;margin-bottom:28px}
    label{display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:6px}
    input{width:100%;padding:11px 14px;border:1px solid #d1d5db;border-radius:9px;
      font-size:14px;outline:none;transition:border .15s}
    input:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.12)}
    .field{margin-bottom:18px}
    button{width:100%;padding:12px;background:#6366f1;color:#fff;border:none;
      border-radius:9px;font-size:15px;font-weight:600;cursor:pointer;margin-top:6px;transition:background .15s}
    button:hover{background:#4f46e5}
    .err{color:#ef4444;font-size:13px;text-align:center;margin-top:12px;display:none}
    .link{text-align:center;margin-top:20px;font-size:13px;color:#64748b}
    .link a{color:#6366f1;text-decoration:none;font-weight:500}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">💰</div>
    <h1>Criar conta</h1>
    <p>Comece a controlar suas finanças</p>
    <form id="form">
      <div class="field">
        <label>Nome</label>
        <input type="text" id="name" placeholder="Seu nome" required/>
      </div>
      <div class="field">
        <label>E-mail</label>
        <input type="email" id="email" placeholder="seu@email.com" required autocomplete="email"/>
      </div>
      <div class="field">
        <label>Senha</label>
        <input type="password" id="password" placeholder="Mínimo 8 caracteres" required minlength="8"/>
      </div>
      <button type="submit" id="btn">Criar conta</button>
      <div class="err" id="err"></div>
    </form>
    <div class="link">Já tem conta? <a href="/login">Entrar</a></div>
  </div>
  <script>
    document.getElementById('form').onsubmit = async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn');
      const err = document.getElementById('err');
      btn.textContent = 'Criando conta...';
      btn.disabled = true;
      err.style.display = 'none';
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao criar conta');
        window.location.href = '/';
      } catch(e) {
        err.textContent = e.message;
        err.style.display = 'block';
        btn.textContent = 'Criar conta';
        btn.disabled = false;
      }
    };
  </script>
</body>
</html>`);
  });

  // API: Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "E-mail e senha são obrigatórios" });
        return;
      }

      const { createHash } = await import("crypto");
      const hashedPassword = createHash("sha256").update(password).digest("hex");

      const user = await db.getUserByEmailAndPassword(email, hashedPassword);
      if (!user) {
        res.status(401).json({ error: "E-mail ou senha incorretos" });
        return;
      }

      if (user.isBlocked) {
        res.status(403).json({ error: "Conta bloqueada. Entre em contato com o suporte." });
        return;
      }

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });

      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Erro interno. Tente novamente." });
    }
  });

  // API: Registro
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        res.status(400).json({ error: "Todos os campos são obrigatórios" });
        return;
      }
      if (password.length < 8) {
        res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres" });
        return;
      }

      const existing = await db.getUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: "Este e-mail já está cadastrado" });
        return;
      }

      const { createHash } = await import("crypto");
      const hashedPassword = createHash("sha256").update(password).digest("hex");
      const openId = `pessoal_${nanoid(21)}`;

      await db.upsertUser({
        openId,
        name,
        email,
        loginMethod: "email",
        password: hashedPassword,
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId(openId);
      if (!user) {
        res.status(500).json({ error: "Erro ao criar usuário" });
        return;
      }

      const sessionToken = await sdk.createSessionToken(openId, {
        name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Register failed", error);
      res.status(500).json({ error: "Erro interno. Tente novamente." });
    }
  });
}
