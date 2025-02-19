import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// ✅ Gestion de `__dirname` en ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const simulationsDir = path.join(__dirname, "../client/src/api");

// 📌 Vérifie si le dossier `api` existe, sinon le crée
if (!fs.existsSync(simulationsDir)) {
  fs.mkdirSync(simulationsDir, { recursive: true });
  console.log("✅ Dossier API créé :", simulationsDir);
}

// ✅ Vérifie que le serveur fonctionne
router.get("/api/health", (req: Request, res: Response) => {
  res.json({ success: true, message: "API en ligne" });
});

// ✅ Route pour inscrire un utilisateur et créer son fichier JSON
router.post("/api/register", async (req: Request, res: Response) => {
  try {
    const { userId, email, password } = req.body;

    if (!userId || !email || !password) {
      return res.status(400).json({ success: false, message: "Données incomplètes : userId, email et password requis." });
    }

    console.log(`📌 Inscription de l'utilisateur: userId=${userId}`);

    const fileName = `save-simulation-${userId}.json`;
    const filePath = path.join(simulationsDir, fileName);

    if (!fs.existsSync(filePath)) {
      const initialData = { userId, answers: {}, date: new Date().toISOString() };
      fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
      console.log(`✅ Fichier créé: ${filePath}`);
    }

    res.json({ success: true, message: "Utilisateur créé avec succès", userId });
  } catch (error) {
    console.error("❌ Erreur lors de l'inscription:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ✅ Route pour sauvegarder une simulation
router.post("/api/save-simulation/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { answers } = req.body;

    if (!userId || !answers) {
      return res.status(400).json({ success: false, message: "Données incomplètes : userId et answers requis." });
    }

    const fileName = `save-simulation-${userId}.json`;
    const filePath = path.join(simulationsDir, fileName);

    console.log(`📌 Sauvegarde de la simulation pour userId=${userId}`);

    const simulationData = { userId, answers, date: new Date().toISOString() };

    fs.writeFileSync(filePath, JSON.stringify(simulationData, null, 2));

    console.log(`✅ Fichier mis à jour: ${filePath}`);
    res.json({ success: true, message: "Simulation enregistrée", data: simulationData });
  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ✅ Route pour récupérer une simulation spécifique
router.get("/api/get-simulation/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "Données incomplètes : userId requis." });
    }

    const fileName = `save-simulation-${userId}.json`;
    const filePath = path.join(simulationsDir, fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "Simulation non trouvée pour cet utilisateur." });
    }

    const data = fs.readFileSync(filePath, "utf8");
    const simulationData = JSON.parse(data);

    res.json({ success: true, data: simulationData });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de la simulation:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ✅ Route pour récupérer un audit spécifique
router.get("/api/produits/:auditType/:userId", async (req: Request, res: Response) => {
  try {
    const { auditType, userId } = req.params;

    if (!auditType || !userId) {
      return res.status(400).json({ success: false, message: "Données incomplètes : auditType et userId requis." });
    }

    console.log(`📌 Requête pour audit ${auditType} de l'utilisateur ${userId}`);

    // Création d'une réponse statique pour éviter l'erreur
    const auditData = {
      auditType,
      userId,
      status: "pending",
      message: "Données d'audit fictives chargées avec succès."
    };

    res.json({ success: true, data: auditData });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de l'audit:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ✅ Ajout d'une fonction pour enregistrer les routes
export const registerRoutes = (app: express.Application) => {
  app.use(router);
};

export default router;
