import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { exportExcel, exportPdf } from "../export";

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.disable("x-powered-by");

  // Healthcheck
  app.get("/health", (_req, res) => {
    res.status(200).json({
      ok: true,
      service: "meu-ganho-pessoal",
      environment: process.env.NODE_ENV ?? "development",
      timestamp: new Date().toISOString(),
    });
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Export routes
  app.get("/api/export/excel", exportExcel);
  app.get("/api/export/pdf", exportPdf);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const rawPort = process.env.PORT ?? "3000";
  const port = Number.parseInt(rawPort, 10);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${port} is already in use. Refusing to start with a fallback port.`
      );
    } else {
      console.error("Server failed to start:", error);
    }

    process.exit(1);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received. Shutting down server gracefully...`);

    server.close(err => {
      if (err) {
        console.error("Error while closing server:", err);
        process.exit(1);
      }

      console.log("Server stopped.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch(error => {
  console.error("Fatal startup error:", error);
  process.exit(1);
});
