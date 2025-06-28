import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { RequestWithUser } from "../types/auth";

const router = Router();

// Créer une connexion Supabase avec la clé de service
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Route pour enregistrer une signature de charte
router.post("/charte-signature", async (req: Request, res: Response) => {
  try {
    const { clientProduitEligibleId, ipAddress, userAgent } = req.body;
    const typedReq = req as RequestWithUser;
    const userId = typedReq.user?.id;

    console.log('📝 Enregistrement signature charte:', {
      userId,
      clientProduitEligibleId,
      ipAddress,
      userAgent: userAgent ? userAgent.substring(0, 100) + '...' : 'non fourni'
    });

    // Validation des données
    if (!clientProduitEligibleId) {
      return res.status(400).json({
        success: false,
        error: "clientProduitEligibleId est requis"
      });
    }

    // Vérifier que le ClientProduitEligible existe et appartient à l'utilisateur
    const { data: clientProduit, error: clientProduitError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('id', clientProduitEligibleId)
      .single();

    if (clientProduitError || !clientProduit) {
      console.error('❌ ClientProduitEligible non trouvé:', clientProduitEligibleId);
      return res.status(404).json({
        success: false,
        error: "Produit éligible non trouvé"
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (clientProduit.clientId !== userId) {
      console.error('❌ Permission refusée: clientId ne correspond pas à l\'utilisateur');
      console.error('  - Utilisateur connecté:', userId);
      console.error('  - Propriétaire du produit:', clientProduit.clientId);
      return res.status(403).json({
        success: false,
        error: "Vous n'êtes pas autorisé à signer cette charte"
      });
    }

    // Vérifier qu'une signature n'existe pas déjà
    const { data: existingSignature, error: checkError } = await supabase
      .from('client_charte_signature')
      .select('*')
      .eq('client_produit_eligible_id', clientProduitEligibleId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Erreur lors de la vérification de signature existante:', checkError);
      return res.status(500).json({
        success: false,
        error: "Erreur lors de la vérification de signature existante"
      });
    }

    if (existingSignature) {
      console.log('⚠️ Signature déjà existante pour ce produit');
      return res.status(409).json({
        success: false,
        error: "Une signature existe déjà pour ce produit"
      });
    }

    // Enregistrer la signature
    const signatureData = {
      client_id: userId,
      produit_id: clientProduit.produitId,
      client_produit_eligible_id: clientProduitEligibleId,
      ip_address: ipAddress || null,
      user_agent: userAgent || null
    };

    console.log('💾 Données de signature à insérer:', signatureData);

    const { data: signature, error: insertError } = await supabase
      .from('client_charte_signature')
      .insert([signatureData])
      .select('*')
      .single();

    if (insertError) {
      console.error('❌ Erreur lors de l\'insertion de la signature:', insertError);
      return res.status(500).json({
        success: false,
        error: "Erreur lors de l'enregistrement de la signature"
      });
    }

    console.log('✅ Signature enregistrée avec succès:', signature.id);

    // Mettre à jour l'avancement dans ClientProduitEligible
    const { error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        current_step: 1,
        progress: 25,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientProduitEligibleId);

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour de l\'avancement:', updateError);
      // Ne pas échouer complètement, la signature est déjà enregistrée
      console.log('⚠️ Signature enregistrée mais avancement non mis à jour');
    } else {
      console.log('✅ Avancement mis à jour: étape 1 (25%)');
    }

    return res.json({
      success: true,
      data: signature,
      message: "Charte signée avec succès"
    });

  } catch (error: any) {
    console.error("❌ Erreur lors de l'enregistrement de la signature:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Une erreur est survenue lors de l'enregistrement de la signature"
    });
  }
});

// Route pour vérifier si une signature existe
router.get("/charte-signature/:clientProduitEligibleId", async (req: Request, res: Response) => {
  try {
    const { clientProduitEligibleId } = req.params;
    const typedReq = req as RequestWithUser;
    const userId = typedReq.user?.id;

    console.log('🔍 Vérification signature charte:', {
      userId,
      clientProduitEligibleId
    });

    // Vérifier que le ClientProduitEligible existe et appartient à l'utilisateur
    const { data: clientProduit, error: clientProduitError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('id', clientProduitEligibleId)
      .single();

    if (clientProduitError || !clientProduit) {
      console.error('❌ ClientProduitEligible non trouvé:', clientProduitEligibleId);
      return res.status(404).json({
        success: false,
        error: "Produit éligible non trouvé"
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (clientProduit.clientId !== userId) {
      console.error('❌ Permission refusée: clientId ne correspond pas à l\'utilisateur');
      return res.status(403).json({
        success: false,
        error: "Vous n'êtes pas autorisé à accéder à cette signature"
      });
    }

    // Rechercher la signature
    const { data: signature, error: signatureError } = await supabase
      .from('client_charte_signature')
      .select('*')
      .eq('client_produit_eligible_id', clientProduitEligibleId)
      .single();

    if (signatureError && signatureError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Erreur lors de la recherche de signature:', signatureError);
      return res.status(500).json({
        success: false,
        error: "Erreur lors de la recherche de signature"
      });
    }

    return res.json({
      success: true,
      data: {
        signed: !!signature,
        signature: signature || null
      },
      message: signature ? "Signature trouvée" : "Aucune signature trouvée"
    });

  } catch (error: any) {
    console.error("❌ Erreur lors de la vérification de signature:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Une erreur est survenue lors de la vérification de signature"
    });
  }
});

export default router;
