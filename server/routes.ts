import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // ================================
  // ✅ ROUTES CLIENTS
  // ================================
  app.get("/api/requests/client", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const requests = await storage.getRequestsByClient(req.user.id);
    res.json(requests);
  });

  app.post("/api/requests", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const request = await storage.createRequest({
      ...req.body,
      clientId: req.user.id,
    });
    res.json(request);
  });

  // ================================
  // ✅ ROUTES EXPERTS
  // ================================
  app.get("/api/requests/available", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    if (req.user.type !== "partner") return res.sendStatus(403);
    const requests = await storage.getRequestsForPartners();
    res.json(requests);
  });

  app.get("/api/quotes/partner", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    if (req.user.type !== "partner") return res.sendStatus(403);
    const quotes = await storage.getQuotesByPartner(req.user.id);
    res.json(quotes);
  });

  app.post("/api/quotes", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    if (req.user.type !== "partner") return res.sendStatus(403);
    const quote = await storage.createQuote({
      ...req.body,
      partnerId: req.user.id,
    });
    res.json(quote);
  });

  app.get("/api/quotes/:requestId", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const quotes = await storage.getQuotesByRequest(parseInt(req.params.requestId));
    res.json(quotes);
  });

  // ================================
  // ✅ ROUTE API QUESTIONNAIRE
  // ================================
  app.post("/components/questionnaire", async (req, res) => {
    try {
      if (!req.user) return res.sendStatus(401);

      const { answers } = req.body;
      if (!answers) {
        return res.status(400).json({ message: "Données invalides" });
      }

      const response = await storage.saveQuestionnaireResponse(req.user.id, answers);
      res.json({ message: "Réponses enregistrées", response });
    } catch (error) {
      console.error("Erreur API questionnaire:", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  // ================================
  // ✅ SERVEUR HTTP
  // ================================
  const httpServer = createServer(app);
  return httpServer;
}
