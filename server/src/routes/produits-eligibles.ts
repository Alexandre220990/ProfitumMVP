import express, { Router, Request, Response } from 'express';
import { createClient } from "@supabase/supabase-js";
import { ClientProduitEligibleSchema, ClientProduitEligible } from "../validations/clientProduitEligible";
import { authenticateUser } from '../middleware/authenticate';
import { supabase } from '../lib/supabase';

// Types pour l'authentification
interface AuthUser {
  id: string;
  email: string;
  type: 'client' | 'expert' | 'admin';
  user_metadata?: any;
  app_metadata?: any;
  aud?: string;
  created_at?: string;
}

const router = express.Router();

// Créer une connexion Supabase avec la clé de service
const supabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Route de debug pour vérifier que le router fonctionne
router.get("/debug", (req, res) => {
  console.log('🔍 Route debug produits-eligibles appelée');
  res.json({
    success: true,
    message: 'Router produits-eligibles fonctionne',
    timestamp: new Date().toISOString()
  });
});

// Route pour récupérer tous les produits éligibles
router.get("/", async (req, res) => {
  try {
    const { data: produits, error } = await supabaseClient
      .from('ProduitEligible')
      .select('*');
    
    if (error) throw error;
    
    return res.json({
      success: true,
      data: produits
    });
  } catch (error: any) {
    console.error("Erreur lors de la récupération des produits éligibles:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Une erreur est survenue"
    });
  }
});

// Route pour récupérer tous les produits éligibles (alias)
router.get("/produits-eligibles", async (req, res) => {
  try {
    const { data: produits, error } = await supabaseClient
      .from('ProduitEligible')
      .select('*');
    
    if (error) throw error;
    
    return res.json({
      success: true,
      data: produits
    });
  } catch (error: any) {
    console.error("Erreur lors de la récupération des produits éligibles:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Une erreur est survenue"
    });
  }
});

// Route pour obtenir les produits éligibles d'un client
router.get("/client/:clientId", authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { clientId } = req.params;

    // Vérifier l'accès
    if (authUser.type !== 'expert' && authUser.id !== clientId) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer les produits éligibles
    const { data: produits, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible (*)
      `)
      .eq('clientId', clientId);

    if (error) {
      console.error('Erreur lors de la récupération des produits éligibles:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    res.json({
      success: true,
      data: produits
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits éligibles:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour obtenir les détails d'un produit éligible
router.get("/produits-eligibles/details/:produitId", authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { produitId } = req.params;

    // Récupérer les détails du produit
    const { data: produit, error } = await supabase
      .from('ProduitEligible')
      .select('*')
      .eq('id', produitId)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération du produit:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    if (!produit) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    res.json({
      success: true,
      data: produit
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router; 