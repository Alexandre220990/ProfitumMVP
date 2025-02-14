import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Routes pour les clients
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

  // Routes pour les experts
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

  // Route pour les devis d'une demande
  app.get("/api/quotes/:requestId", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    const quotes = await storage.getQuotesByRequest(parseInt(req.params.requestId));
    res.json(quotes);
  });

  const httpServer = createServer(app);
  return httpServer;
}