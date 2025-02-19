import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http"; // ✅ Ajout de `createServer`
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
const server = createServer(app); // ✅ Création du serveur HTTP

// ✅ Middleware JSON & URL Encoded
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ Middleware de logging API
app.use((req, res, next) => {
  const start = Date.now();
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.call(this, bodyJson, ...args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      let logLine = `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 150) {
        logLine = logLine.slice(0, 149) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// ✅ Initialisation du serveur avec gestion des erreurs
(async () => {
  try {
    // Enregistrement des routes
    registerRoutes(app);

    // ✅ Configuration de Vite en mode développement
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ✅ Middleware de gestion des erreurs
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Erreur interne du serveur";
      console.error("❌ Erreur serveur:", err);
      res.status(status).json({ success: false, message });
    });

    // ✅ Correction de l'erreur listen (conversion PORT en number)
    const PORT = parseInt(process.env.PORT || "5000", 10); // ✅ Conversion sécurisée en number
    server.listen(PORT, "0.0.0.0", () => {
      log(`🚀 Server running on http://localhost:${PORT}`);
    });

    // ✅ Gestion des erreurs globales pour éviter les crashs
    process.on("unhandledRejection", (err) => {
      console.error("❌ Unhandled promise rejection:", err);
    });

    process.on("uncaughtException", (err) => {
      console.error("❌ Uncaught exception:", err);
      process.exit(1);
    });

  } catch (err) {
    console.error("❌ Erreur lors de l'initialisation du serveur:", err);
    process.exit(1); // Quitter proprement si l'initialisation échoue
  }
})();
