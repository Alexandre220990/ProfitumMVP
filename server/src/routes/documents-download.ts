/**
 * Route sécurisée pour télécharger des documents depuis Storage privé
 */

import express, { Request, Response } from 'express';
import { enhancedAuthMiddleware } from '../middleware/auth-enhanced';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/documents/download/:documentId
 * Télécharger un document avec vérification des permissions
 */
router.get('/download/:documentId', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    console.log(`📥 Demande téléchargement document: ${documentId} par ${user.type} ${user.email}`);

    // 1. Récupérer les infos du document
    const { data: document, error: docError } = await supabase
      .from('ClientProcessDocument')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('❌ Document non trouvé:', docError);
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // 2. Récupérer le dossier associé (via client_id + produit_id)
    let dossier = null;
    if (document.client_id && document.produit_id) {
      const { data: dossierData } = await supabase
        .from('ClientProduitEligible')
        .select('id, clientId, expert_id, statut')
        .eq('clientId', document.client_id)
        .eq('produitId', document.produit_id)
        .single();
      
      dossier = dossierData;
    }

    // Ajouter le dossier au document pour vérification permissions
    document.ClientProduitEligible = dossier;

    // 3. Vérifier les permissions
    const hasPermission = checkDocumentPermission(user, document);

    if (!hasPermission) {
      console.warn(`⚠️ Accès refusé: ${user.type} ${user.email} ne peut pas accéder au document ${documentId}`);
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas la permission d\'accéder à ce document'
      });
    }

    // 3. Générer une URL signée (valide 1 heure)
    const { data: signedUrlData, error: urlError } = await supabase
      .storage
      .from(document.bucket_name)
      .createSignedUrl(document.storage_path, 3600); // 3600 secondes = 1 heure

    if (urlError || !signedUrlData) {
      console.error('❌ Erreur génération URL signée:', urlError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération de l\'URL de téléchargement'
      });
    }

    console.log(`✅ URL signée générée pour document ${documentId}`);

    // 4. Retourner l'URL signée
    return res.json({
      success: true,
      data: {
        signedUrl: signedUrlData.signedUrl,
        filename: document.filename,
        mimeType: document.mime_type,
        expiresIn: 3600 // secondes
      }
    });

  } catch (error) {
    console.error('❌ Erreur route download:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

/**
 * Vérifier si l'utilisateur a la permission d'accéder au document
 */
function checkDocumentPermission(user: any, document: any): boolean {
  const userType = user.type;
  const userId = user.database_id;

  // Admin : accès total
  if (userType === 'admin') {
    console.log('✅ Accès admin autorisé');
    return true;
  }

  // Client : peut voir ses propres documents
  if (userType === 'client') {
    const isOwnDocument = document.client_id === userId;
    console.log(`${isOwnDocument ? '✅' : '❌'} Accès client ${isOwnDocument ? 'autorisé' : 'refusé'}`);
    return isOwnDocument;
  }

  // Expert : peut voir les documents des dossiers qui lui sont assignés
  if (userType === 'expert') {
    const dossier = document.ClientProduitEligible;
    if (dossier && dossier.expert_id === userId) {
      console.log('✅ Accès expert autorisé (dossier assigné)');
      return true;
    }
    console.log('❌ Accès expert refusé (dossier non assigné)');
    return false;
  }

  // Apporteur : PAS d'accès aux documents (peut voir timeline mais pas télécharger)
  if (userType === 'apporteur') {
    console.log('❌ Accès apporteur refusé (ne peut pas visualiser les documents)');
    return false;
  }

  console.log('❌ Type utilisateur inconnu:', userType);
  return false;
}

export default router;

