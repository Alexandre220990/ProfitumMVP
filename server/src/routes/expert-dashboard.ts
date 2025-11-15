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

    // Calculer le score de priorité pour chaque dossier
    const prioritizedDossiers: PrioritizedDossier[] = (dossiers || []).map((dossier: any) => {
      const now = new Date();
      const updatedAt = new Date(dossier.updated_at);
      const daysSinceLastContact = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));

      // 1. URGENCE (40 points) - Plus c'est ancien, plus c'est urgent
      let urgenceScore = 0;
      if (daysSinceLastContact <= 1) urgenceScore = 10;
      else if (daysSinceLastContact <= 3) urgenceScore = 20;
      else if (daysSinceLastContact <= 7) urgenceScore = 30;
      else urgenceScore = 40; // Très urgent

      // 2. VALEUR (30 points) - Montant du dossier
      const montant = dossier.montantFinal || 0;
      let valeurScore = 0;
      if (montant >= 50000) valeurScore = 30;
      else if (montant >= 30000) valeurScore = 25;
      else if (montant >= 15000) valeurScore = 20;
      else if (montant >= 5000) valeurScore = 15;
      else valeurScore = 10;

      // 3. PROBABILITÉ (20 points) - Statut du dossier
      let probabiliteScore = 0;
      const validationState = dossier.metadata?.validation_state || '';
      if (dossier.statut === 'en_cours') probabiliteScore = 20;
      else if (validationState === 'eligibility_validated') probabiliteScore = 15;
      else probabiliteScore = 10;

      // 4. FACILITÉ (10 points) - Statut de validation
      let faciliteScore = 0;
      if (validationState === 'eligibility_validated') faciliteScore = 10;
      else if (validationState === 'pending_expert_validation') faciliteScore = 5;
      else faciliteScore = 3;

      // SCORE TOTAL
      const priorityScore = urgenceScore + valeurScore + probabiliteScore + faciliteScore;

      // Déterminer la prochaine action
      let nextAction = '';
      if (dossier.statut === 'eligible' || dossier.statut === 'admin_validated' || dossier.statut === 'expert_assigned') {
        nextAction = 'Examiner documents';
      } else if (dossier.statut === 'documents_requested') {
        nextAction = 'Attendre documents client';
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
        daysSinceLastContact
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

    // Dossiers en cours
    const { count: dossiersEnCours } = await supabase
      .from('ClientProduitEligible')
      .select('*', { count: 'exact', head: true })
      .eq('expert_id', expertId)
      .eq('statut', 'en_cours');

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

    // Récupérer tous les dossiers
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
      .eq('expert_id', expertId)
      .in('statut', RAW_ACTIVE_STATUSES)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur récupération dossiers:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur' 
      });
    }

    const dossiersList = (dossiers || []).map((d: any) => {
      const client = Array.isArray(d.Client) ? d.Client[0] : d.Client;
      const produit = Array.isArray(d.ProduitEligible) ? d.ProduitEligible[0] : d.ProduitEligible;
      
      return {
        id: d.id,
        client_name: client?.company_name || client?.name || 'Client',
        client_email: client?.email,
        produit_nom: produit?.nom || 'Produit',
        statut: d.statut,
        montant: d.montantFinal,
        priorite: d.priorite,
        current_step: d.current_step,
        progress: d.progress,
        created_at: d.created_at,
        updated_at: d.updated_at,
        validation_state: d.metadata?.validation_state
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

