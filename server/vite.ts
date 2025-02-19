import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const viteLogger = createLogger();

/**
 * 🔹 Fonction de logging formatée
 */
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * 🔥 Configuration et démarrage de Vite en mode middleware
 */
export async function setupVite(app: Express, server: Server) {
  const ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "05a189ee-dcb6-4ffd-bc12-eec721f22742-00-187ulkq5m4u9j.riker.replit.dev", // ✅ Ajout de l'hôte Replit
  ];

  const serverOptions = {
    middlewareMode: true,
    hmr: {
      server,
      protocol: "wss",
      host: "05a189ee-dcb6-4ffd-bc12-eec721f22742-00-187ulkq5m4u9j.riker.replit.dev",
    },
    allowedHosts: ALLOWED_HOSTS, // ✅ Liste des hôtes autorisés
  };

  try {
    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          viteLogger.error(msg, options);
          process.exit(1);
        },
      },
      server: serverOptions, // ✅ Correction complète
      appType: "custom",
    });

    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");

        // ✅ Recharge toujours `index.html` pour éviter les caches
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`, // 🔥 Ajout d'un ID unique pour éviter les conflits de cache
        );

        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    log("✅ Vite middleware activé !", "vite");
  } catch (error) {
    console.error("❌ Erreur lors de la configuration de Vite:", error);
    process.exit(1);
  }
}

/**
 * 📦 Gestion des fichiers statiques en mode production
 */
export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "client", "dist"); // ✅ Correction du chemin

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `❌ Dossier de build introuvable : ${distPath}. Assurez-vous d'avoir compilé le client avec "npm run build".`
    );
  }

  app.use(express.static(distPath));

  // ✅ Redirection vers `index.html` si la route n'existe pas
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });

  log("📦 Fichiers statiques servis depuis " + distPath, "express");
}
