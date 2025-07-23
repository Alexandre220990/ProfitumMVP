import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser } from '../../middleware/authenticate';

const router = Router();

// Configuration Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Route pour signer la charte d'un produit éligible
router.post('/:id/sign-charte', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { produit_id, charte_accepted } = req.body;
    const clientId = req.user?.id;

    if (!clientId) {
      return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
    }

    // Vérifier que le produit appartient au client
    const { data: clientProduit, error: fetchError } = await supabase
      .from('client_produits_eligibles')
      .select('*')
      .eq('id', id)
      .eq('client_id', clientId)
      .single();

    if (fetchError || !clientProduit) {
      return res.status(404).json({ success: false, message: 'Produit éligible non trouvé' });
    }

    // Mettre à jour le statut de signature de charte
    const { data: updatedProduit, error: updateError } = await supabase
      .from('client_produits_eligibles')
      .update({ 
        charte_signed: true,
        charte_signed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('client_id', clientId)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur lors de la mise à jour de la charte:', updateError);
      return res.status(500).json({ success: false, message: 'Erreur lors de la signature de la charte' });
    }

    // Log de l'activité
    console.log(`Charte signée pour le produit ${id} par le client ${clientId}`);

    return res.json({ 
      success: true, 
      message: 'Charte signée avec succès',
      data: updatedProduit
    });

  } catch (error) {
    console.error('Erreur lors de la signature de la charte:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router; 