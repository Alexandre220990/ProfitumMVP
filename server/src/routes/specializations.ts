import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

// Créer une connexion Supabase avec la clé de service
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Route publique pour récupérer toutes les spécialisations (pas d'authentification requise)
router.get("/", async (req, res) => {
  try {
    console.log('🔍 Récupération des spécialisations depuis ProduitEligible...');
    
    const { data: produits, error } = await supabase
      .from('ProduitEligible')
      .select('id, nom, description')
      .order('nom', { ascending: true });

    if (error) {
      console.error('❌ Erreur récupération ProduitEligible:', error);
      throw error;
    }

    console.log(`✅ ${produits?.length || 0} spécialisations trouvées`);

    // Transformer les données pour correspondre à l'interface frontend
    const specializations = produits?.map(produit => ({
      id: produit.id,
      name: produit.nom,
      description: produit.description
    })) || [];

    console.log('📋 Spécialisations formatées:', specializations);

    return res.json({
      success: true,
      data: specializations,
      message: `${specializations.length} spécialisations trouvées`
    });

  } catch (error: any) {
    console.error("❌ Erreur lors de la récupération des spécialisations:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Une erreur est survenue lors de la récupération des spécialisations"
    });
  }
});

// Route publique pour récupérer une spécialisation par ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: produit, error } = await supabase
      .from('ProduitEligible')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Erreur récupération spécialisation:', error);
      return res.status(404).json({
        success: false,
        error: "Spécialisation non trouvée"
      });
    }

    const specialization = {
      id: produit.id,
      name: produit.nom,
      description: produit.description
    };

    return res.json({
      success: true,
      data: specialization
    });

  } catch (error: any) {
    console.error("❌ Erreur lors de la récupération de la spécialisation:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Une erreur est survenue"
    });
  }
});

export default router; 