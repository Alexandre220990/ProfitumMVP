import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { authMiddleware } from "../middleware/auth";
import { ClientProduitEligibleSchema, ClientProduitEligible } from "../validations/clientProduitEligible";

const router = Router();

// Créer une connexion Supabase avec la clé de service
const supabase = createClient(
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
router.get("/produits-eligibles", async (req, res) => {
  try {
    const { data: produits, error } = await supabase
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

// Route pour récupérer les produits éligibles d'un client (SANS AUTHENTIFICATION)
router.get("/client/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    console.log('🔍 Recherche des produits éligibles pour le client:', clientId);
    
    // D'abord, vérifier si c'est un ID Supabase Auth ou un ancien ID client
    let actualClientId = clientId;
    
    // Si c'est un UUID (format Supabase Auth), chercher dans la table Client
    if (clientId.includes('-') && clientId.length > 20) {
      console.log('🔍 ID Supabase Auth détecté, recherche dans la table Client...');
      const { data: client, error: clientError } = await supabase
        .from('Client')
        .select('id')
        .eq('id', clientId)
        .single();
      
      if (clientError) {
        console.error('❌ Erreur récupération Client par ID:', clientError);
        return res.status(404).json({
          success: false,
          error: 'Client non trouvé avec cet ID'
        });
      }
      
      if (!client) {
        console.log('❌ Aucun client trouvé avec cet ID:', clientId);
        return res.status(404).json({
          success: false,
          error: 'Client non trouvé'
        });
      }
      
      actualClientId = client.id;
      console.log('✅ Client trouvé, ID client:', actualClientId);
    } else {
      console.log('🔍 Utilisation de l\'ID client fourni:', actualClientId);
    }
    
    // Récupérer les produits éligibles du client
    const { data: clientProduits, error: clientError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('clientId', actualClientId)
      .order('created_at', { ascending: false });
    
    if (clientError) {
      console.error('❌ Erreur récupération ClientProduitEligible:', clientError);
      throw clientError;
    }
    
    console.log(`✅ ${clientProduits?.length || 0} produits trouvés pour le client ${actualClientId}`);
    
    if (!clientProduits || clientProduits.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'Aucun produit éligible pour le moment'
      });
    }
    
    // Récupérer les détails des produits éligibles
    const produitIds = clientProduits.map(cp => cp.produitId);
    const { data: produits, error: produitsError } = await supabase
      .from('ProduitEligible')
      .select('*')
      .in('id', produitIds);
    
    if (produitsError) {
      console.error('❌ Erreur récupération ProduitEligible:', produitsError);
      throw produitsError;
    }
    
    // Combiner les données avec les vrais noms de colonnes
    const produitsComplets = clientProduits.map(cp => {
      const produit = produits?.find(p => p.id === cp.produitId);
      return {
        id: cp.id,
        client_id: cp.clientId,
        produit_id: cp.produitId,
        simulation_id: cp.simulationId,
        taux_final: cp.tauxFinal,
        montant_final: cp.montantFinal,
        duree_finale: cp.dureeFinale,
        statut: cp.statut,
        current_step: cp.current_step || 0,
        progress: cp.progress || 0,
        created_at: cp.created_at,
        updated_at: cp.updated_at,
        produit: produit ? {
          nom: produit.nom,
          description: produit.description,
          tauxMin: produit.tauxMin,
          tauxMax: produit.tauxMax,
          montantMin: produit.montantMin,
          montantMax: produit.montantMax,
          dureeMin: produit.dureeMin,
          dureeMax: produit.dureeMax
        } : null
      };
    });
    
    console.log('📊 Données combinées:', produitsComplets.length, 'produits');
    console.log('📈 Avancement des produits:', produitsComplets.map(p => ({
      id: p.id,
      nom: p.produit?.nom,
      current_step: p.current_step,
      progress: p.progress
    })));
    
    // Retourner directement les données sans validation Zod pour l'instant
    return res.json({
      success: true,
      data: produitsComplets,
      message: produitsComplets.length > 0 
        ? `${produitsComplets.length} produits éligibles trouvés`
        : 'Aucun produit éligible pour le moment'
    });
  } catch (error: any) {
    console.error("❌ Erreur lors de la récupération des produits éligibles:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Une erreur est survenue lors de la récupération des produits"
    });
  }
});

// Route pour récupérer les détails d'un produit éligible spécifique
router.get("/produits-eligibles/details/:produitId", authMiddleware, async (req, res) => {
  try {
    const { produitId } = req.params;
    
    // Déterminer si c'est un ID de ClientProduitEligible ou un ID de ProduitEligible
    let produit;
    
    if (produitId.startsWith("pe_")) {
      // C'est un ID de ProduitEligible
      const peId = produitId.substring(3); // Enlever le préfixe "pe_"
      
      const { data: results, error } = await supabase
        .from('ProduitEligible')
        .select('*')
        .eq('id', peId)
        .single();
      
      if (error) throw error;
      produit = results;
    } else {
      // C'est probablement un ID de ClientProduitEligible
      const { data: results, error } = await supabase
        .from('ClientProduitEligible')
        .select(`
          *,
          ProduitEligible (
            nom,
            description,
            conditions
          )
        `)
        .eq('id', produitId)
        .single();
      
      if (error) throw error;
      produit = results;
    }
    
    if (!produit) {
      return res.status(404).json({
        success: false,
        error: "Produit éligible non trouvé"
      });
    }
    
    return res.json({
      success: true,
      data: produit
    });
  } catch (error: any) {
    console.error("Erreur lors de la récupération des détails du produit éligible:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Une erreur est survenue"
    });
  }
});

export default router; 