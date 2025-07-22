import express, { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthUser } from '../types/auth';
import { NotificationService } from '../services/NotificationService';
import { authenticateUser } from '../middleware/authenticate';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Route pour obtenir le profil client
router.get('/profile', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    
    // Vérifier que l'utilisateur est client
    if (authUser.type !== 'client') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer le profil client
    const { data: client, error } = await supabase
      .from('Client')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération du profil client:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil client:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour mettre à jour le profil client
router.put('/profile', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { nom, prenom, telephone, adresse, ville, code_postal } = req.body;
    
    // Vérifier que l'utilisateur est client
    if (authUser.type !== 'client') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Mettre à jour le profil client
    const { data: client, error } = await supabase
      .from('Client')
      .update({
        nom,
        prenom,
        telephone,
        adresse,
        ville,
        code_postal,
        updatedAt: new Date().toISOString()
      })
      .eq('id', authUser.id)
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la mise à jour du profil client:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil client:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/client/produits-eligibles - Récupérer les produits éligibles du client
router.get('/produits-eligibles', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    
    // Vérifier que l'utilisateur est client
    if (authUser.type !== 'client') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer d'abord le client par email pour obtenir l'ID de la table Client
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('id')
      .eq('email', authUser.email)
      .single();

    if (clientError || !client) {
      console.error('Erreur lors de la récupération du client:', clientError);
      return res.status(500).json({ success: false, message: 'Client non trouvé' });
    }

    // Récupérer les produits éligibles du client avec les détails des produits
    const { data: produitsData, error: produitsError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        clientId,
        produitId,
        statut,
        expert_id,
        charte_signed,
        charte_signed_at,
        created_at,
        updated_at,
        ProduitEligible (
          id,
          nom,
          description,
          category
        )
      `)
      .eq('clientId', client.id) // Utiliser l'ID de la table Client
      .order('created_at', { ascending: false });

    if (produitsError) {
      throw produitsError;
    }

    res.json({
      success: true,
      data: produitsData
    });

  } catch (error) {
    console.error('Error fetching client products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching client products'
    });
  }
});

// PUT /api/client/produits-eligibles/:id/assign-expert - Attribuer un expert à un produit éligible
router.put('/produits-eligibles/:id/assign-expert', async (req, res) => {
  try {
    const { id } = req.params;
    const { expert_id } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
    }

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    // Vérifier que l'utilisateur est un client
    const { data: clientData, error: clientError } = await supabase
      .from('Client')
      .select('id, company_name')
      .eq('email', user.email)
      .single();

    if (clientError || !clientData) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients'
      });
    }

    // Vérifier que le produit éligible appartient au client
    const { data: produitData, error: produitError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('id', id)
      .eq('clientId', clientData.id)
      .single();

    if (produitError || !produitData) {
      return res.status(404).json({
        success: false,
        message: 'Produit éligible non trouvé'
      });
    }

    // Vérifier que l'expert existe et est actif
    const { data: expertData, error: expertError } = await supabase
      .from('Expert')
      .select('id, name, specializations')
      .eq('id', expert_id)
      .eq('status', 'active')
      .single();

    if (expertError || !expertData) {
      return res.status(404).json({
        success: false,
        message: 'Expert non trouvé ou inactif'
      });
    }

    // Mettre à jour le produit éligible avec l'expert assigné
    const { data: updatedProduit, error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({ 
        expert_id: expert_id,
        statut: 'en_cours',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      throw updateError;
    }

    // Envoyer une notification à l'expert
    try {
      await NotificationService.sendPreselectionNotification(
        expert_id,
        clientData.company_name || 'Client',
        produitData.ProduitEligible?.nom || 'Produit',
        produitData.montant_final
      );
    } catch (notificationError) {
      console.error('Erreur lors de l\'envoi de la notification:', notificationError);
      // Ne pas faire échouer la requête si la notification échoue
    }

    res.json({
      success: true,
      data: updatedProduit,
      message: 'Expert assigné avec succès'
    });

  } catch (error) {
    console.error('Error assigning expert:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning expert'
    });
  }
});

// POST /api/client/produits-eligibles/:id/sign-charte - Signer la charte d'un produit éligible
router.post('/produits-eligibles/:id/sign-charte', async (req, res) => {
  try {
    const { id } = req.params;
    const { produit_id, charte_accepted } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
    }

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    // Vérifier que l'utilisateur est un client
    const { data: clientData, error: clientError } = await supabase
      .from('Client')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (clientError || !clientData) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients'
      });
    }

    // Vérifier que le produit appartient au client
    const { data: clientProduit, error: fetchError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('id', id)
      .eq('clientId', clientData.id)
      .single();

    if (fetchError || !clientProduit) {
      return res.status(404).json({ 
        success: false, 
        message: 'Produit éligible non trouvé' 
      });
    }

    // Mettre à jour le statut de signature de charte
    const { data: updatedProduit, error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update({ 
        charte_signed: true,
        charte_signed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('clientId', clientData.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur lors de la mise à jour de la charte:', updateError);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la signature de la charte' 
      });
    }

    // Log de l'activité
    console.log(`Charte signée pour le produit ${id} par le client ${clientData.id}`);

    res.json({ 
      success: true, 
      message: 'Charte signée avec succès',
      data: updatedProduit
    });

  } catch (error) {
    console.error('Erreur lors de la signature de la charte:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/client/produits-eligibles/:id/workflow - Mettre à jour le workflow
router.put('/produits-eligibles/:id/workflow', async (req, res) => {
  try {
    const { id } = req.params;
    const { current_step, progress, metadata } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
    }

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    // Vérifier que l'utilisateur est un client
    const { data: clientData, error: clientError } = await supabase
      .from('Client')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (clientError || !clientData) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux clients'
      });
    }

    // Vérifier que le produit appartient au client
    const { data: clientProduit, error: fetchError } = await supabase
      .from('ClientProduitEligible')
      .select('*')
      .eq('id', id)
      .eq('clientId', clientData.id)
      .single();

    if (fetchError || !clientProduit) {
      return res.status(404).json({ 
        success: false, 
        message: 'Produit éligible non trouvé' 
      });
    }

    // Mettre à jour le workflow
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (current_step !== undefined) {
      updateData.current_step = current_step;
    }

    if (progress !== undefined) {
      updateData.progress = progress;
    }

    if (metadata !== undefined) {
      updateData.metadata = metadata;
    }

    const { data: updatedProduit, error: updateError } = await supabase
      .from('ClientProduitEligible')
      .update(updateData)
      .eq('id', id)
      .eq('clientId', clientData.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur lors de la mise à jour du workflow:', updateError);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la mise à jour du workflow' 
      });
    }

    // Log de l'activité
    console.log(`Workflow mis à jour pour le produit ${id}: étape ${current_step}, progression ${progress}%`);

    res.json({ 
      success: true, 
      message: 'Workflow mis à jour avec succès',
      data: updatedProduit
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du workflow:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour obtenir les assignations d'un client
router.get('/:clientId/assignments', authenticateUser, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const authUser = req.user as AuthUser;
    const { clientId } = req.params;
    
    // Vérifier que l'utilisateur a accès à ce client
    if (authUser.type !== 'admin' && authUser.id !== clientId) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // Récupérer les assignations du client
    const { data: assignments, error } = await supabase
      .from('ExpertAssignment')
      .select(`
        *,
        Expert (
          id,
          name,
          company_name,
          rating,
          specializations
        ),
        ProduitEligible (
          id,
          nom,
          description
        )
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des assignations:', error);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }

    res.json({
      success: true,
      data: {
        assignments: assignments || []
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des assignations:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router; 