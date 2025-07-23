import express, { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/authenticate';
import { AuthUser } from '../types/auth';
import { supabase } from '../lib/supabase';

const router = express.Router();

// Route pour signer la charte (correspond à l'appel côté client)
router.post('/charte-signature', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { clientProduitEligibleId, userAgent } = req.body;

    console.log('🔍 Signature charte - Données reçues:', {
      authUser: { id: authUser.id, type: authUser.type },
      clientProduitEligibleId,
      userAgent
    });

    // Récupérer les informations du ClientProduitEligible
    const { data: clientProduit, error: clientProduitError } = await supabase
      .from('ClientProduitEligible')
      .select('clientId, produitId')
      .eq('id', clientProduitEligibleId)
      .single();

    if (clientProduitError || !clientProduit) {
      console.error('Erreur lors de la récupération du ClientProduitEligible:', clientProduitError);
      return res.status(404).json({ success: false, message: 'Produit éligible non trouvé' });
    }

    console.log('🔍 ClientProduitEligible trouvé:', clientProduit);

    // Vérifier que l'utilisateur a le droit de signer pour ce client
    if (authUser.type !== 'expert' && authUser.id !== clientProduit.clientId) {
      console.log('❌ Accès refusé:', {
        authUserType: authUser.type,
        authUserId: authUser.id,
        clientId: clientProduit.clientId
      });
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Vérifier si la charte n'est pas déjà signée
    const { data: existingSignature, error: checkError } = await supabase
      .from('client_charte_signature')
      .select('*')
      .eq('client_produit_eligible_id', clientProduitEligibleId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Erreur lors de la vérification de signature existante:', checkError);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    if (existingSignature) {
      console.log('⚠️ Charte déjà signée pour ce produit');
      return res.status(400).json({ success: false, message: 'Charte déjà signée pour ce produit' });
    }

    // Enregistrer la signature dans la table client_charte_signature
    const { data, error } = await supabase
      .from('client_charte_signature')
      .insert({
        client_id: clientProduit.clientId,
        produit_id: clientProduit.produitId,
        client_produit_eligible_id: clientProduitEligibleId,
        signature_date: new Date().toISOString(),
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: userAgent || req.headers['user-agent'] || null
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de l\'enregistrement de la signature:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    // Mettre à jour le statut dans ClientProduitEligible
    const { error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({
        charte_signed: true,
        charte_signed_at: new Date().toISOString()
      })
      .eq('id', clientProduitEligibleId);

    if (updateError) {
      console.error('Erreur lors de la mise à jour du statut:', updateError);
      // Ne pas retourner d'erreur car la signature est enregistrée
    }

    console.log('✅ Signature enregistrée avec succès:', data);

    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erreur lors de la signature:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour vérifier la signature (correspond à l'appel côté client)
router.get('/charte-signature/:clientProduitEligibleId', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { clientProduitEligibleId } = req.params;

    // Vérifier la signature dans la table client_charte_signature
    const { data, error } = await supabase
      .from('client_charte_signature')
      .select('*')
      .eq('client_produit_eligible_id', clientProduitEligibleId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erreur lors de la vérification de la signature:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    return res.json({
      success: true,
      data: {
        signed: !!data,
        signature: data
      }
    });
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour signer la charte (ancienne route pour compatibilité)
router.post('/sign', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { clientId, produitId, signature } = req.body;

    // Vérifier que l'utilisateur a le droit de signer pour ce client
    if (authUser.type !== 'expert' && authUser.id !== clientId) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Enregistrer la signature
    const { data, error } = await supabase
      .from('CharteSignature')
      .insert({
        clientId,
        produitId,
        signature,
        signedBy: authUser.id,
        signedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de l\'enregistrement de la signature:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Erreur lors de la signature:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour vérifier la signature (ancienne route pour compatibilité)
router.get('/verify/:clientId/:produitId', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { clientId, produitId } = req.params;

    // Vérifier que l'utilisateur a le droit de vérifier cette signature
    if (authUser.type !== 'expert' && authUser.id !== clientId) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Vérifier la signature
    const { data, error } = await supabase
      .from('CharteSignature')
      .select('*')
      .eq('clientId', clientId)
      .eq('produitId', produitId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erreur lors de la vérification de la signature:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    return res.json({
      success: true,
      data: {
        signed: !!data,
        signature: data
      }
    });
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;
