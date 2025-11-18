import express, { Router, Request, Response } from 'express';
import { AuthUser } from '../types/auth';
import { supabase } from '../lib/supabase';
import { enhancedAuthMiddleware } from '../middleware/auth-enhanced';
import { DossierStatus, LEGACY_STATUS_MAP } from '../utils/dossierStatus';

const router = express.Router();

// ============================================================================
// TYPES
// ============================================================================

interface PrioritizedDossier {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  productName: string;
  apporteurName: string;
  statut: string;
  validationState: string;
  montantFinal: number;
  priorityScore: number;
  urgenceScore: number;
  valeurScore: number;
  probabiliteScore: number;
  faciliteScore: number;
  nextAction: string;
  lastContact: string;
  daysSinceLastContact: number;
  daysWaitingDocuments?: number; // Jours depuis la demande de documents
  documentRequestDate?: string; // Date de la demande de documents
  hasDocumentRequest?: boolean; // Si une demande de documents est en attente
  hasPendingDocuments?: boolean; // Si des documents sont en attente de validation
  pendingDocumentsCount?: number; // Nombre de documents en attente de validation
  actionType?: 'documents_pending_validation' | 'documents_requested' | 'other'; // Type d'action urgente
}

interface Alert {
  id: string;
  type: 'critique' | 'important' | 'attention';
  category: 'rdv' | 'dossier' | 'documents' | 'prospect';
  title: string;
  description: string;
  dossierId?: string;
  clientName: string;
  urgency: number;
  actionLabel: string;
  actionUrl: string;
  createdAt: string;
}

interface RevenuePipeline {
  prospects: {
    count: number;
    montantTotal: number;
    montantPotentiel: number;
    probability: number;
  };
  enSignature: {
    count: number;
    montantTotal: number;
    montantPotentiel: number;
    probability: number;
  };
  signes: {
    count: number;
    montantTotal: number;
    commissionExpert: number;
  };
  totalPrevisionnel: number;
}

// ============================================================================
// ROUTE 1 : DOSSIERS PRIORISÉS (SCORE DE CLOSING)
// ============================================================================

router.get('/prioritized', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    
    if (!authUser || authUser.type !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    const expertId = authUser.database_id || authUser.id;

    // Récupérer tous les dossiers de l'expert avec jointures
    let dossiers: any[] = [];
    let documentRequests: any[] = [];
    let error: any = null;
    
    try {
      const result = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          clientId,
          produitId,
          statut,
          metadata,
          montantFinal,
          created_at,
          updated_at,
          Client:clientId (
            id,
            name,
            company_name,
            email,
            phone_number,
            apporteur_id,
            ApporteurAffaires:apporteur_id (
              company_name
            )
          ),
          ProduitEligible:produitId (
            nom
          )
        `)
        .eq('expert_id', expertId)
        .in('statut', RAW_ACTIVE_STATUSES);

      dossiers = result.data || [];
      error = result.error;

      // Récupérer les demandes de documents en attente pour ces dossiers
      // ET les documents en attente de validation
      if (!error && dossiers.length > 0) {
        const dossierIds = dossiers.map(d => d.id);
        
        // Récupérer les demandes de documents
        const { data: requests } = await supabase
          .from('document_request')
          .select('id, dossier_id, created_at, status')
          .in('dossier_id', dossierIds)
          .in('status', ['pending', 'in_progress'])
          .order('created_at', { ascending: false });
        documentRequests = requests || [];
      }
    } catch (catchError: any) {
      console.error('❌ Exception requête Supabase:', catchError);
      error = catchError;
    }

    if (error) {
      console.error('❌ Erreur récupération dossiers:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des dossiers',
        error: error.message || error
      });
    }

    // Créer un map des demandes de documents par dossier_id
    const documentRequestMap = new Map<string, { created_at: string; daysWaiting: number }>();
    const now = new Date();
    documentRequests.forEach(req => {
      const requestDate = new Date(req.created_at);
      const daysWaiting = Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
      documentRequestMap.set(req.dossier_id, {
        created_at: req.created_at,
        daysWaiting
      });
    });

    // Récupérer les documents en attente de validation pour ces dossiers
    // ET vérifier si des documents ont été uploadés
    const pendingDocumentsMap = new Map<string, number>();
    const hasDocumentsMap = new Map<string, boolean>(); // Map pour vérifier si des documents ont été uploadés
    if (dossiers.length > 0) {
      const dossierIds = dossiers.map(d => d.id);
      
      // Récupérer tous les documents de ces dossiers
      const { data: allDocs, error: allDocsError } = await supabase
        .from('ClientProcessDocument')
        .select('client_produit_id, validation_status, status')
        .in('client_produit_id', dossierIds);

      if (!allDocsError && allDocs) {
        // Compter les documents en attente de validation
        // ET vérifier si des documents ont été uploadés
        allDocs.forEach((doc: any) => {
          const dossierId = doc.client_produit_id;
          const validationStatus = doc.validation_status;
          const status = doc.status;
          
          // Marquer qu'au moins un document a été uploadé pour ce dossier
          hasDocumentsMap.set(dossierId, true);
          
          // Document en attente si validation_status est pending/null et pas rejeté
          const isPending = (
            (validationStatus === 'pending' || validationStatus === null) &&
            status !== 'rejected' &&
            validationStatus !== 'validated'
          );
          
          if (isPending) {
            const currentCount = pendingDocumentsMap.get(dossierId) || 0;
            pendingDocumentsMap.set(dossierId, currentCount + 1);
          }
        });
      }
    }

    // Calculer le score de priorité pour chaque dossier
    const prioritizedDossiers: PrioritizedDossier[] = (dossiers || []).map((dossier: any) => {
      const updatedAt = new Date(dossier.updated_at);
      const daysSinceLastContact = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      // Récupérer la demande de documents si elle existe
      const docRequest = documentRequestMap.get(dossier.id);
      
      // Récupérer le nombre de documents en attente de validation
      const pendingDocsCount = pendingDocumentsMap.get(dossier.id) || 0;
      const hasPendingDocs = pendingDocsCount > 0;
      
      // Vérifier si des documents ont été uploadés pour ce dossier
      const hasUploadedDocuments = hasDocumentsMap.get(dossier.id) || false;

      // DÉTERMINER LE TYPE D'ACTION EN PREMIER (avant le calcul du score)
      // Action à faire par l'expert = priorité maximale (score très élevé)
      // Action en attente du client = moins prioritaire (score moyen)
      let actionType: 'documents_pending_validation' | 'documents_requested' | 'other' = 'other';
      
      if (hasPendingDocs) {
        actionType = 'documents_pending_validation';
      } else if (docRequest) {
        actionType = 'documents_requested';
      } else if (dossier.statut === 'documents_requested') {
        actionType = 'documents_requested';
      } else if ((dossier.statut === 'en_cours' || dossier.statut === 'audit_en_cours') && daysSinceLastContact >= 5) {
        actionType = 'documents_requested';
      } else if ((dossier.statut === 'eligible' || dossier.statut === 'admin_validated' || dossier.statut === 'expert_assigned') && !hasUploadedDocuments) {
        actionType = 'documents_requested';
      }
      
      // Variables communes pour le calcul du score
      const validationState = dossier.metadata?.validation_state || '';
      const montant = dossier.montantFinal || 0;
      
      // CALCULER LE SCORE DE PRIORITÉ
      let priorityScore = 0;
      let urgenceScore = 0;
      let valeurScore = 0;
      let probabiliteScore = 0;
      let faciliteScore = 0;
      
      if (hasPendingDocs) {
        // PRIORITÉ MAXIMALE : Action à faire par l'expert
        // Les documents sont en attente de validation par l'expert
        // Score fixe très élevé pour toujours apparaître en haut, indépendant du temps
        priorityScore = 1000 + montant / 1000; // 1000+ avec petit bonus par montant
        // Pour les scores détaillés, utiliser des valeurs minimales car le score total est déjà très élevé
        urgenceScore = 0;
        valeurScore = 0;
        probabiliteScore = 0;
        faciliteScore = 0;
      } else if (actionType === 'documents_requested') {
        // PRIORITÉ MOYENNE : Action en attente du client
        // L'expert attend que le client fournisse des documents
        // Score modéré qui diminue légèrement avec le temps (mais reste inférieur aux actions expert)
        const daysWaiting = docRequest?.daysWaiting || daysSinceLastContact || 0;
        let baseScore = 200; // Base pour actions client
        
        // Légère pénalité pour temps long (mais jamais en dessous de la base)
        if (daysWaiting >= 15) {
          baseScore = 150; // Légère pénalité si très long
        } else if (daysWaiting >= 10) {
          baseScore = 170;
        } else if (daysWaiting >= 5) {
          baseScore = 185;
        }
        
        // Ajouter valeur et probabilité
        if (montant >= 50000) valeurScore = 50;
        else if (montant >= 30000) valeurScore = 40;
        else if (montant >= 15000) valeurScore = 30;
        else if (montant >= 5000) valeurScore = 20;
        else valeurScore = 10;
        
        if (dossier.statut === 'en_cours') probabiliteScore = 20;
        else if (validationState === 'eligibility_validated') probabiliteScore = 15;
        else probabiliteScore = 10;
        
        urgenceScore = 0;
        faciliteScore = 0;
        priorityScore = baseScore + valeurScore + probabiliteScore;
      } else {
        // AUTRES CAS : Score normal basé sur valeur, probabilité, etc.
        // Le temps ne pèse plus beaucoup (juste un indicateur, pas une pénalité importante)
        
        // 1. VALEUR (40 points) - Montant du dossier (le plus important)
        if (montant >= 50000) valeurScore = 40;
        else if (montant >= 30000) valeurScore = 35;
        else if (montant >= 15000) valeurScore = 30;
        else if (montant >= 5000) valeurScore = 25;
        else valeurScore = 20;

        // 2. PROBABILITÉ (30 points) - Statut du dossier
        if (dossier.statut === 'en_cours') probabiliteScore = 30;
        else if (validationState === 'eligibility_validated') probabiliteScore = 25;
        else probabiliteScore = 15;

        // 3. FACILITÉ (20 points) - Statut de validation
        if (validationState === 'eligibility_validated') faciliteScore = 20;
        else if (validationState === 'pending_expert_validation') faciliteScore = 15;
        else faciliteScore = 10;

        // 4. URGENCE (10 points) - Temps sans contact (poids réduit)
        // Le temps pèse beaucoup moins dans le calcul final
        if (daysSinceLastContact <= 1) urgenceScore = 10;
        else if (daysSinceLastContact <= 3) urgenceScore = 8;
        else if (daysSinceLastContact <= 7) urgenceScore = 6;
        else if (daysSinceLastContact <= 14) urgenceScore = 4;
        else urgenceScore = 2; // Même très ancien, pénalité minime

        priorityScore = valeurScore + probabiliteScore + faciliteScore + urgenceScore;
      }

      // Déterminer la prochaine action - PRIORISER les documents en attente de validation
      let nextAction = '';
      
      if (hasPendingDocs) {
        // PRIORITÉ 1 : Documents reçus, en attente de validation
        // Afficher aussi les jours d'attente du client si > 0
        const daysInfo = daysSinceLastContact > 0 
          ? `. Client en attente depuis ${daysSinceLastContact} jour${daysSinceLastContact > 1 ? 's' : ''}`
          : '';
        nextAction = `${pendingDocsCount} document${pendingDocsCount > 1 ? 's' : ''} à vérifier${daysInfo}`;
        actionType = 'documents_pending_validation';
      } else if (docRequest) {
        // PRIORITÉ 2 : On attend des documents du client (demande explicite dans document_request)
        actionType = 'documents_requested';
        if (docRequest.daysWaiting >= 15) {
          nextAction = `En attente documents client depuis ${docRequest.daysWaiting} jours - Relance 3 envoyée`;
        } else if (docRequest.daysWaiting >= 10) {
          nextAction = `En attente documents client depuis ${docRequest.daysWaiting} jours - Relance 2 envoyée`;
        } else if (docRequest.daysWaiting >= 5) {
          nextAction = `En attente documents client depuis ${docRequest.daysWaiting} jours - Relance 1 envoyée`;
        } else {
          nextAction = `En attente documents client depuis ${docRequest.daysWaiting} jour${docRequest.daysWaiting > 1 ? 's' : ''}`;
        }
      } else if (dossier.statut === 'documents_requested') {
        // Statut explicite : documents demandés
        actionType = 'documents_requested';
        nextAction = `En attente documents client depuis ${daysSinceLastContact} jour${daysSinceLastContact > 1 ? 's' : ''}`;
      } else if ((dossier.statut === 'en_cours' || dossier.statut === 'audit_en_cours') && daysSinceLastContact >= 5) {
        // Dossier en cours avec plus de 5 jours sans contact = probablement en attente de documents
        actionType = 'documents_requested';
        if (daysSinceLastContact >= 15) {
          nextAction = `En attente documents client depuis ${daysSinceLastContact} jours - Relance 3 envoyée`;
        } else if (daysSinceLastContact >= 10) {
          nextAction = `En attente documents client depuis ${daysSinceLastContact} jours - Relance 2 envoyée`;
        } else if (daysSinceLastContact >= 5) {
          nextAction = `En attente documents client depuis ${daysSinceLastContact} jours - Relance 1 envoyée`;
        } else {
          nextAction = `En attente documents client depuis ${daysSinceLastContact} jour${daysSinceLastContact > 1 ? 's' : ''}`;
        }
      } else if (dossier.statut === 'eligible' || dossier.statut === 'admin_validated' || dossier.statut === 'expert_assigned') {
        // Vérifier si des documents ont été uploadés avant de dire "Examiner documents"
        if (hasUploadedDocuments) {
          nextAction = 'Examiner documents';
        } else {
          // Aucun document uploadé : on est en attente des documents
          actionType = 'documents_requested';
          if (daysSinceLastContact >= 15) {
            nextAction = `En attente documents client depuis ${daysSinceLastContact} jours - Relance 3 envoyée`;
          } else if (daysSinceLastContact >= 10) {
            nextAction = `En attente documents client depuis ${daysSinceLastContact} jours - Relance 2 envoyée`;
          } else if (daysSinceLastContact >= 5) {
            nextAction = `En attente documents client depuis ${daysSinceLastContact} jours - Relance 1 envoyée`;
          } else {
            nextAction = `En attente documents client depuis ${daysSinceLastContact} jour${daysSinceLastContact > 1 ? 's' : ''}`;
          }
        }
      } else if (dossier.statut === 'en_cours' || dossier.statut === 'audit_en_cours') {
        if (daysSinceLastContact > 7) {
          nextAction = 'Relancer client';
        } else {
          nextAction = 'Demander documents';
        }
      }

      const client = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
      const produit = Array.isArray(dossier.ProduitEligible) ? dossier.ProduitEligible[0] : dossier.ProduitEligible;
      const apporteur = Array.isArray(client?.ApporteurAffaires) ? client.ApporteurAffaires[0] : client?.ApporteurAffaires;

      return {
        id: dossier.id,
        clientId: dossier.clientId,
        clientName: client?.company_name || client?.name || 'Client',
        clientEmail: client?.email || '',
        clientPhone: client?.phone_number || '',
        productName: produit?.nom || 'Produit',
        apporteurName: apporteur?.company_name || 'Direct',
        statut: dossier.statut,
        validationState: validationState,
        montantFinal: montant,
        priorityScore,
        urgenceScore,
        valeurScore,
        probabiliteScore,
        faciliteScore,
        nextAction,
        lastContact: dossier.updated_at,
        daysSinceLastContact,
        daysWaitingDocuments: docRequest?.daysWaiting || (actionType === 'documents_requested' ? daysSinceLastContact : undefined),
        documentRequestDate: docRequest?.created_at,
        hasDocumentRequest: !!docRequest || actionType === 'documents_requested',
        hasPendingDocuments: hasPendingDocs,
        pendingDocumentsCount: pendingDocsCount,
        actionType
      };
    });

    // Trier par score décroissant
    prioritizedDossiers.sort((a, b) => b.priorityScore - a.priorityScore);

    return res.json({
      success: true,
      data: prioritizedDossiers,
      count: prioritizedDossiers.length
    });

  } catch (error) {
    console.error('❌ EXCEPTION ROUTE /prioritized:', error);
    console.error('❌ Stack:', error instanceof Error ? error.stack : 'N/A');
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// ============================================================================
// ROUTE 2 : ALERTES PROACTIVES (ACTIONS URGENTES)
// ============================================================================

// ============================================================================
// ROUTE : DOSSIERS REFUSÉS PAR LE CLIENT
// ============================================================================

router.get('/rejected-audits', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    
    if (!authUser || authUser.type !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    const expertId = authUser.database_id || authUser.id;

    // Récupérer les dossiers refusés par le client
    const { data: dossiers, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        "clientId",
        "produitId",
        "montantFinal",
        statut,
        metadata,
        created_at,
        updated_at,
        Client:clientId (
          id,
          company_name,
          nom,
          prenom,
          first_name,
          last_name,
          email
        ),
        ProduitEligible:produitId (
          id,
          nom
        )
      `)
      .eq('expert_id', expertId)
      .eq('statut', 'audit_rejected_by_client')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération dossiers refusés:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }

    // Enrichir avec les informations de refus
    const enrichedDossiers = (dossiers || []).map((dossier: any) => {
      const clientInfo = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
      const produitInfo = Array.isArray(dossier.ProduitEligible) ? dossier.ProduitEligible[0] : dossier.ProduitEligible;
      
      const clientName = clientInfo?.company_name 
        || `${clientInfo?.first_name || clientInfo?.prenom || ''} ${clientInfo?.last_name || clientInfo?.nom || ''}`.trim()
        || 'Client inconnu';
      
      const rejectionInfo = dossier.metadata?.client_validation || {};
      const rejectionDate = rejectionInfo.validated_at 
        ? new Date(rejectionInfo.validated_at)
        : new Date(dossier.updated_at);
      
      const daysSinceRejection = Math.floor((Date.now() - rejectionDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: dossier.id,
        clientId: dossier.clientId,
        clientName,
        clientEmail: clientInfo?.email || '',
        produitId: dossier.produitId,
        produitName: produitInfo?.nom || 'Produit inconnu',
        montantFinal: dossier.montantFinal || 0,
        rejectionReason: rejectionInfo.reason || 'Aucune raison spécifiée',
        rejectionDate: rejectionDate.toISOString(),
        daysSinceRejection,
        previousAuditResult: dossier.metadata?.audit_result || null,
        revisionNumber: dossier.metadata?.audit_result?.revision?.revision_number || 0
      };
    });

    return res.json({
      success: true,
      data: enrichedDossiers
    });

  } catch (error) {
    console.error('❌ Erreur rejected-audits:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.get('/alerts', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    
    if (!authUser || authUser.type !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    const expertId = authUser.database_id || authUser.id;
    const expertAuthUserId = authUser.id; // auth_user_id utilisé dans la table notification

    // ✅ CORRECTION: Récupérer les notifications actionnables depuis la table notification
    const { data: notifications, error: notificationsError } = await supabase
      .from('notification')
      .select('*')
      .eq('user_id', expertAuthUserId)
      .eq('user_type', 'expert')
      .eq('is_read', false)
      .in('notification_type', [
        'dossier_pending_acceptance',
        'documents_completed',
        'audit_required',
        'audit_validated',
        'audit_rejected',
        'audit_rejected_by_client',
        'audit_revised',
        'client_message'
      ])
      .order('created_at', { ascending: false })
      .limit(20);

    if (notificationsError) {
      console.error('❌ Erreur récupération notifications:', notificationsError);
    }

    // Transformer les notifications en alertes formatées
    const alerts: Alert[] = (notifications || []).map((notif: any) => {
      // Extraire les infos du dossier depuis action_data
      const actionData = notif.action_data || {};
      const client_produit_id = actionData.client_produit_id || '';
      const clientName = actionData.client_company || actionData.client_name || 'Client';
      const productName = actionData.product_name || actionData.product_type || 'Produit';

      // Déterminer le type et la catégorie selon notification_type
      let type: 'critique' | 'important' | 'attention' = 'important';
      let category: 'rdv' | 'dossier' | 'documents' | 'prospect' = 'dossier';
      let actionLabel = 'Voir dossier';
      
      if (notif.notification_type === 'dossier_pending_acceptance') {
        type = 'critique';
        category = 'dossier';
        actionLabel = 'Accepter ou refuser';
      } else if (notif.notification_type === 'documents_completed') {
        type = 'important';
        category = 'documents';
        actionLabel = 'Commencer l\'audit';
      } else if (notif.notification_type === 'audit_required') {
        type = 'important';
        category = 'dossier';
        actionLabel = 'Envoyer rapport';
      } else if (notif.notification_type === 'audit_validated') {
        type = 'attention';
        category = 'dossier';
        actionLabel = 'Voir dossier';
      } else if (notif.notification_type === 'audit_rejected' || notif.notification_type === 'audit_rejected_by_client') {
        type = 'critique';
        category = 'dossier';
        actionLabel = 'Créer nouvelle proposition';
      } else if (notif.notification_type === 'audit_revised') {
        type = 'important';
        category = 'dossier';
        actionLabel = 'Voir nouvelle proposition';
      }

      // Urgence basée sur la priorité et le type
      let urgency = 80;
      if (notif.priority === 'high' || type === 'critique') {
        urgency = 100;
      } else if (type === 'attention') {
        urgency = 60;
      }

      // Construire l'URL d'action
      let actionUrl = notif.action_url || '';
      if (!actionUrl && client_produit_id) {
        actionUrl = `/expert/dossier/${client_produit_id}`;
      }

      return {
        id: notif.id,
        type,
        category,
        title: notif.title || 'Action requise',
        description: notif.message || notif.description || '',
        dossierId: client_produit_id,
        clientName,
        productName,
        urgency,
        actionLabel,
        actionUrl,
        createdAt: notif.created_at
      };
    });

    // Trier par urgence décroissante
    alerts.sort((a, b) => b.urgency - a.urgency);

    return res.json({
      success: true,
      data: alerts,
      count: alerts.length,
      summary: {
        critique: alerts.filter(a => a.type === 'critique').length,
        important: alerts.filter(a => a.type === 'important').length,
        attention: alerts.filter(a => a.type === 'attention').length
      }
    });

  } catch (error) {
    console.error('❌ Erreur dashboard alerts:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// ============================================================================
// ROUTE 3 : REVENUE PIPELINE (MONTANT RÉCUPÉRABLE POTENTIEL)
// ============================================================================

router.get('/revenue-pipeline', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    
    if (!authUser || authUser.type !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    const expertId = authUser.database_id || authUser.id;

    // Récupérer le taux de commission de l'expert
    const { data: expertData } = await supabase
      .from('Expert')
      .select('compensation:client_fee_percentage')
      .eq('id', expertId)
      .single();

    const expertCommissionRate = (expertData?.compensation || 10) / 100; // Convertir en décimal

    // 1. PROSPECTS (statut = 'eligible')
    const { data: prospects } = await supabase
      .from('ClientProduitEligible')
      .select('"montantFinal"')
      .eq('expert_id', expertId)
      .eq('statut', 'eligible');

    const prospectsTotal = (prospects || []).reduce((sum, p) => sum + (p.montantFinal || 0), 0);
    const prospectsProbability = 0.30; // 30% de conversion
    const prospectsPotentiel = prospectsTotal * prospectsProbability;

    // 2. EN SIGNATURE (validation_state = 'eligibility_validated' ou en_cours récent)
    const { data: enSignature } = await supabase
      .from('ClientProduitEligible')
      .select('"montantFinal", updated_at')
      .eq('expert_id', expertId)
      .eq('statut', 'en_cours');

    // Filtrer ceux récemment mis à jour (< 30 jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const enSignatureFiltered = (enSignature || []).filter(d => 
      new Date(d.updated_at) >= thirtyDaysAgo
    );

    const enSignatureTotal = enSignatureFiltered.reduce((sum, d) => sum + (d.montantFinal || 0), 0);
    const enSignatureProbability = 0.85; // 85% de conversion
    const enSignaturePotentiel = enSignatureTotal * enSignatureProbability;

    // 3. SIGNÉS (statut = 'termine')
    const { data: signes } = await supabase
      .from('ClientProduitEligible')
      .select('"montantFinal"')
      .eq('expert_id', expertId)
      .eq('statut', 'termine');

    const signesTotal = (signes || []).reduce((sum, s) => sum + (s.montantFinal || 0), 0);
    const commissionExpert = signesTotal * expertCommissionRate; // Commission personnalisée expert

    // TOTAL PRÉVISIONNEL
    const totalPrevisionnel = prospectsPotentiel + enSignaturePotentiel + commissionExpert;

    const pipeline: RevenuePipeline = {
      prospects: {
        count: prospects?.length || 0,
        montantTotal: prospectsTotal,
        montantPotentiel: prospectsPotentiel,
        probability: prospectsProbability
      },
      enSignature: {
        count: enSignatureFiltered.length,
        montantTotal: enSignatureTotal,
        montantPotentiel: enSignaturePotentiel,
        probability: enSignatureProbability
      },
      signes: {
        count: signes?.length || 0,
        montantTotal: signesTotal,
        commissionExpert: commissionExpert
      },
      totalPrevisionnel
    };

    return res.json({
      success: true,
      data: pipeline
    });

  } catch (error) {
    console.error('❌ Erreur revenue pipeline:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// ============================================================================
// ROUTE : DOSSIERS PAR STATUT (Pour mes-affaires)
// ============================================================================

router.get('/dossiers-by-status/:status', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    
    if (!authUser || authUser.type !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    const expertId = authUser.database_id || authUser.id;
    const status = req.params.status; // 'prospects', 'en_signature', 'signes'

    let dossiers: any[] = [];

    if (status === 'prospects') {
      // PROSPECTS (statut = 'eligible')
      const { data, error } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          "montantFinal",
          "tauxFinal",
          created_at,
          updated_at,
          "clientId",
          "produitId"
        `)
        .eq('expert_id', expertId)
        .eq('statut', 'eligible')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur récupération prospects:', error);
      }

      // Enrichir avec les données Client et ProduitEligible
      const enrichedDossiers = await Promise.all(
        (data || []).map(async (d: any) => {
          const [clientRes, produitRes] = await Promise.all([
            supabase.from('Client').select('id, nom, prenom, company_name').eq('id', d.clientId).single(),
            supabase.from('ProduitEligible').select('nom').eq('id', d.produitId).single()
          ]);
          
          return {
            id: d.id,
            clientName: clientRes.data?.company_name || `${clientRes.data?.prenom || ''} ${clientRes.data?.nom || ''}`.trim() || 'Client inconnu',
            produit: produitRes.data?.nom || 'Produit inconnu',
            montant: d.montantFinal || 0,
            taux: d.tauxFinal || 0,
            dateCreation: d.created_at,
            dateUpdate: d.updated_at,
            statut: 'Prospect'
          };
        })
      );

      dossiers = enrichedDossiers;

    } else if (status === 'en_signature') {
      // EN SIGNATURE (statut = 'en_cours' récent)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          "montantFinal",
          "tauxFinal",
          created_at,
          updated_at,
          "clientId",
          "produitId"
        `)
        .eq('expert_id', expertId)
        .eq('statut', 'en_cours')
        .gte('updated_at', thirtyDaysAgo.toISOString())
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur récupération en_signature:', error);
      }

      // Enrichir avec les données Client et ProduitEligible
      const enrichedDossiers = await Promise.all(
        (data || []).map(async (d: any) => {
          const [clientRes, produitRes] = await Promise.all([
            supabase.from('Client').select('id, nom, prenom, company_name').eq('id', d.clientId).single(),
            supabase.from('ProduitEligible').select('nom').eq('id', d.produitId).single()
          ]);
          
          return {
            id: d.id,
            clientName: clientRes.data?.company_name || `${clientRes.data?.prenom || ''} ${clientRes.data?.nom || ''}`.trim() || 'Client inconnu',
            produit: produitRes.data?.nom || 'Produit inconnu',
            montant: d.montantFinal || 0,
            taux: d.tauxFinal || 0,
            dateCreation: d.created_at,
            dateUpdate: d.updated_at,
            statut: 'En signature'
          };
        })
      );

      dossiers = enrichedDossiers;

    } else if (status === 'signes') {
      // SIGNÉS (statut = 'termine')
      const { data, error } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          "montantFinal",
          "tauxFinal",
          created_at,
          updated_at,
          "clientId",
          "produitId"
        `)
        .eq('expert_id', expertId)
        .eq('statut', 'termine')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Erreur récupération signés:', error);
      }

      // Enrichir avec les données Client et ProduitEligible
      const enrichedDossiers = await Promise.all(
        (data || []).map(async (d: any) => {
          const [clientRes, produitRes] = await Promise.all([
            supabase.from('Client').select('id, nom, prenom, company_name').eq('id', d.clientId).single(),
            supabase.from('ProduitEligible').select('nom').eq('id', d.produitId).single()
          ]);
          
          return {
            id: d.id,
            clientName: clientRes.data?.company_name || `${clientRes.data?.prenom || ''} ${clientRes.data?.nom || ''}`.trim() || 'Client inconnu',
            produit: produitRes.data?.nom || 'Produit inconnu',
            montant: d.montantFinal || 0,
            taux: d.tauxFinal || 0,
            dateCreation: d.created_at,
            dateUpdate: d.updated_at,
            statut: 'Signé'
          };
        })
      );

      dossiers = enrichedDossiers;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    return res.json({
      success: true,
      data: dossiers
    });

  } catch (error) {
    console.error('❌ Erreur dossiers by status:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// ============================================================================
// ROUTE 4 : OVERVIEW COMPLET (KPIs + Données)
// ============================================================================

const ALL_NORMALIZED_STATUSES: DossierStatus[] = [
  'pending_upload',
  'pending_admin_validation',
  'admin_validated',
  'admin_rejected',
  'expert_assigned',
  'expert_pending_validation',
  'expert_validated',
  'charte_pending',
  'charte_signed',
  'documents_requested',
  'complementary_documents_upload_pending',
  'complementary_documents_sent',
  'complementary_documents_validated',
  'complementary_documents_refused',
  'audit_in_progress',
  'audit_completed',
  'validation_pending',
  'validated',
  'implementation_in_progress',
  'implementation_validated',
  'payment_requested',
  'payment_in_progress',
  'refund_completed'
];

const INACTIVE_NORMALIZED_STATUSES: DossierStatus[] = [
  'admin_rejected',
  'refund_completed'
];

const ACTIVE_NORMALIZED_STATUSES = ALL_NORMALIZED_STATUSES.filter(
  status => !INACTIVE_NORMALIZED_STATUSES.includes(status)
);

const LEGACY_ACTIVE_STATUSES = Object.entries(LEGACY_STATUS_MAP)
  .filter(([, normalized]) => ACTIVE_NORMALIZED_STATUSES.includes(normalized))
  .map(([legacy]) => legacy);

const RAW_ACTIVE_STATUSES = Array.from(new Set([
  ...ACTIVE_NORMALIZED_STATUSES,
  ...LEGACY_ACTIVE_STATUSES,
  // Statuts temporaires encore stockés tels quels côté BDD
  'documents_completes',
  'audit_en_cours'
]));

router.get('/overview', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    
    if (!authUser || authUser.type !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    const expertId = authUser.database_id || authUser.id;

    // KPIs
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    // Clients actifs
    const { count: clientsActifs } = await supabase
      .from('ClientProduitEligible')
      .select('clientId', { count: 'exact', head: true })
      .eq('expert_id', expertId)
      .in('statut', RAW_ACTIVE_STATUSES);

    // RDV cette semaine
    const { count: rdvCetteSemaine } = await supabase
      .from('RDV')
      .select('*', { count: 'exact', head: true })
      .eq('expert_id', expertId)
      .gte('scheduled_date', startOfWeek.toISOString().split('T')[0])
      .lte('scheduled_date', endOfWeek.toISOString().split('T')[0])
      .neq('status', 'cancelled');

    // Mes dossiers (tous les dossiers de l'expert, quel que soit le statut)
    const { count: dossiersEnCours } = await supabase
      .from('ClientProduitEligible')
      .select('*', { count: 'exact', head: true })
      .eq('expert_id', expertId);

    // Apporteurs avec statistiques détaillées
    const { data: apporteursData } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        statut,
        created_at,
        Client:clientId (
          apporteur_id,
          ApporteurAffaires:apporteur_id (
            id,
            company_name,
            email
          )
        )
      `)
      .eq('expert_id', expertId);

    // Calculer les stats par apporteur
    const apporteursMap = new Map();
    (apporteursData || []).forEach((item: any) => {
      const apporteurData = Array.isArray(item.Client) ? item.Client[0] : item.Client;
      const apporteur = Array.isArray(apporteurData?.ApporteurAffaires) 
        ? apporteurData.ApporteurAffaires[0] 
        : apporteurData?.ApporteurAffaires;
      
      if (apporteur && apporteur.id) {
        if (!apporteursMap.has(apporteur.id)) {
          apporteursMap.set(apporteur.id, {
            id: apporteur.id,
            company_name: apporteur.company_name,
            email: apporteur.email,
            prospectsActifs: 0,
            clientsEnCours: 0,
            dernierProspect: null
          });
        }
        
        const stats = apporteursMap.get(apporteur.id);
        
        if (item.statut === 'eligible') {
          stats.prospectsActifs++;
        } else if (item.statut === 'en_cours') {
          stats.clientsEnCours++;
        }
        
        if (!stats.dernierProspect || new Date(item.created_at) > new Date(stats.dernierProspect)) {
          stats.dernierProspect = item.created_at;
        }
      }
    });

    const apporteursList = Array.from(apporteursMap.values());

    return res.json({
      success: true,
      data: {
        kpis: {
          clientsActifs: clientsActifs || 0,
          rdvCetteSemaine: rdvCetteSemaine || 0,
          dossiersEnCours: dossiersEnCours || 0,
          apporteursActifs: apporteursList.length
        },
        apporteurs: apporteursList
      }
    });

  } catch (error) {
    console.error('❌ Erreur dashboard overview:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// ============================================================================
// ROUTE 5 : LISTE DES CLIENTS (Tableau filtrable)
// ============================================================================

router.get('/clients-list', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    
    if (!authUser || authUser.type !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    const expertId = authUser.database_id || authUser.id;

    // Récupérer tous les clients uniques avec dossiers en cours
    const { data: cpes, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        clientId,
        Client:clientId (
          id,
          company_name,
          name,
          email,
          phone_number,
          status,
          apporteur_id,
          ApporteurAffaires:apporteur_id (
            company_name
          )
        )
      `)
      .eq('expert_id', expertId)
      .in('statut', RAW_ACTIVE_STATUSES);

    if (error) {
      console.error('❌ Erreur récupération clients:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur' 
      });
    }

    // Dédupliquer les clients et compter leurs dossiers
    const clientsMap = new Map();
    
    (cpes || []).forEach((cpe: any) => {
      const client = Array.isArray(cpe.Client) ? cpe.Client[0] : cpe.Client;
      if (!client) return;
      
      const clientId = cpe.clientId;
      if (!clientsMap.has(clientId)) {
        const apporteur = Array.isArray(client.ApporteurAffaires) ? client.ApporteurAffaires[0] : client.ApporteurAffaires;
        clientsMap.set(clientId, {
          id: client.id,
          company_name: client.company_name,
          name: client.name,
          email: client.email,
          phone_number: client.phone_number,
          status: client.status,
          apporteur_name: apporteur?.company_name || 'Direct',
          dossiers_count: 0
        });
      }
      
      const clientData = clientsMap.get(clientId);
      clientData.dossiers_count += 1;
    });

    const clientsList = Array.from(clientsMap.values());

    return res.json({
      success: true,
      data: clientsList
    });

  } catch (error) {
    console.error('❌ Erreur liste clients:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// ============================================================================
// ROUTE 6 : LISTE DES DOSSIERS (Tableau filtrable)
// ============================================================================

router.get('/dossiers-list', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    
    if (!authUser || authUser.type !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    const expertId = authUser.database_id || authUser.id;

    // Récupérer TOUS les dossiers de l'expert (quel que soit le statut)
    // Inclut les dossiers où expert_id = expertId OU expert_pending_id = expertId
    const { data: dossiers, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        clientId,
        produitId,
        statut,
        metadata,
        montantFinal,
        priorite,
        current_step,
        progress,
        expert_id,
        expert_pending_id,
        created_at,
        updated_at,
        Client:clientId (
          company_name,
          name,
          email
        ),
        ProduitEligible:produitId (
          nom
        )
      `)
      .or(`expert_id.eq.${expertId},expert_pending_id.eq.${expertId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération dossiers:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur' 
      });
    }

    // Récupérer les informations sur les documents en attente de validation
    const dossierIds = (dossiers || []).map((d: any) => d.id);
    let documentsPending: any[] = [];
    let auditCompleted: any[] = [];

    if (dossierIds.length > 0) {
      // Documents en attente de validation
      const { data: docsData } = await supabase
        .from('Document')
        .select('dossier_id, validation_status')
        .in('dossier_id', dossierIds)
        .eq('validation_status', 'pending');

      documentsPending = docsData || [];

      // Audits complétés (pour identifier ceux en attente de soumission)
      const { data: auditsData } = await supabase
        .from('AuditRapport')
        .select('dossier_id, created_at')
        .in('dossier_id', dossierIds);

      auditCompleted = auditsData || [];
    }

    // Créer un map pour les documents en attente par dossier
    const docsPendingByDossier = new Map<string, number>();
    documentsPending.forEach((doc: any) => {
      const count = docsPendingByDossier.get(doc.dossier_id) || 0;
      docsPendingByDossier.set(doc.dossier_id, count + 1);
    });

    // Créer un map pour les audits complétés par dossier
    const auditsByDossier = new Map<string, boolean>();
    auditCompleted.forEach((audit: any) => {
      auditsByDossier.set(audit.dossier_id, true);
    });

    const dossiersList = (dossiers || []).map((d: any) => {
      const client = Array.isArray(d.Client) ? d.Client[0] : d.Client;
      const produit = Array.isArray(d.ProduitEligible) ? d.ProduitEligible[0] : d.ProduitEligible;
      
      // Déterminer les actions prioritaires
      const hasPendingAcceptance = d.expert_pending_id === expertId && !d.expert_id;
      const hasPendingDocuments = (docsPendingByDossier.get(d.id) || 0) > 0;
      const hasAuditToSubmit = auditsByDossier.has(d.id) && (d.statut === 'audit_completed' || d.statut === 'audit_en_cours');
      
      const hasPriorityAction = hasPendingAcceptance || hasPendingDocuments || hasAuditToSubmit;
      
      return {
        id: d.id,
        client_name: client?.company_name || client?.name || 'Client',
        client_email: client?.email,
        produit_nom: produit?.nom || 'Produit',
        statut: d.statut,
        montant: d.montantFinal || 0,
        priorite: d.priorite,
        current_step: d.current_step,
        progress: d.progress || 0,
        created_at: d.created_at,
        updated_at: d.updated_at,
        validation_state: d.metadata?.validation_state,
        // Actions prioritaires
        hasPendingAcceptance,
        hasPendingDocuments,
        hasAuditToSubmit,
        hasPriorityAction,
        pendingDocumentsCount: docsPendingByDossier.get(d.id) || 0
      };
    });

    return res.json({
      success: true,
      data: dossiersList
    });

  } catch (error) {
    console.error('❌ Erreur liste dossiers:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// ============================================================================
// ROUTE 7 : LISTE DES APPORTEURS (Tableau filtrable)
// ============================================================================

router.get('/apporteurs-list', enhancedAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const authUser = req.user as AuthUser;
    
    if (!authUser || authUser.type !== 'expert') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès non autorisé' 
      });
    }

    const expertId = authUser.database_id || authUser.id;

    // Récupérer les apporteurs via les clients
    const { data: cpes, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        Client:clientId (
          apporteur_id,
          status,
          ApporteurAffaires:apporteur_id (
            id,
            company_name,
            email,
            phone,
            status
          )
        )
      `)
      .eq('expert_id', expertId)
      .in('statut', ['eligible', 'en_cours']);

    if (error) {
      console.error('❌ Erreur récupération apporteurs:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur' 
      });
    }

    // Grouper par apporteur
    const apporteursMap = new Map();
    
    (cpes || []).forEach((cpe: any) => {
      const client = Array.isArray(cpe.Client) ? cpe.Client[0] : cpe.Client;
      if (!client || !client.apporteur_id) return;
      
      const apporteur = Array.isArray(client.ApporteurAffaires) ? client.ApporteurAffaires[0] : client.ApporteurAffaires;
      if (!apporteur) return;
      
      const apporteurId = client.apporteur_id;
      if (!apporteursMap.has(apporteurId)) {
        apporteursMap.set(apporteurId, {
          id: apporteur.id,
          company_name: apporteur.company_name,
          email: apporteur.email,
          phone: apporteur.phone,
          status: apporteur.status,
          prospects_count: 0,
          clients_count: 0,
          total_dossiers: 0
        });
      }
      
      const apporteurData = apporteursMap.get(apporteurId);
      apporteurData.total_dossiers += 1;
      
      if (client.status === 'prospect') {
        apporteurData.prospects_count += 1;
      } else {
        apporteurData.clients_count += 1;
      }
    });

    const apporteursList = Array.from(apporteursMap.values());

    return res.json({
      success: true,
      data: apporteursList
    });

  } catch (error) {
    console.error('❌ Erreur liste apporteurs:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

export default router;

