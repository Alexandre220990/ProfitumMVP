import express, { Router, Request, Response } from 'express';
import { AuthUser } from '../types/auth';
import { supabase } from '../lib/supabase';
import { enhancedAuthMiddleware } from '../middleware/auth-enhanced';

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
    const { data: dossiers, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        "clientId",
        "produitId",
        statut,
        metadata,
        "montantFinal",
        created_at,
        updated_at,
        Client:clientId (
          id,
          name,
          company_name,
          email,
          phone,
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
      .in('statut', ['eligible', 'en_cours']);

    if (error) {
      console.error('❌ Erreur récupération dossiers:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des dossiers' 
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
      if (dossier.statut === 'eligible') {
        nextAction = 'Planifier RDV';
      } else if (dossier.statut === 'en_cours') {
        if (daysSinceLastContact > 7) {
          nextAction = 'Relancer client';
        } else {
          nextAction = 'Demander documents';
        }
      }

      return {
        id: dossier.id,
        clientId: dossier.clientId,
        clientName: dossier.Client?.company_name || dossier.Client?.name || 'Client',
        clientEmail: dossier.Client?.email || '',
        clientPhone: dossier.Client?.phone || '',
        productName: dossier.ProduitEligible?.nom || 'Produit',
        apporteurName: dossier.Client?.ApporteurAffaires?.company_name || 'Direct',
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
    console.error('❌ Erreur dashboard prioritized:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
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
    const alerts: Alert[] = [];

    // 1. ALERTES RDV
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const in48h = new Date();
    in48h.setDate(in48h.getDate() + 2);

    const { data: rdvs } = await supabase
      .from('RDV')
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        status,
        Client:client_id (
          company_name,
          name
        )
      `)
      .eq('expert_id', expertId)
      .in('status', ['proposed', 'confirmed'])
      .gte('scheduled_date', new Date().toISOString().split('T')[0])
      .lte('scheduled_date', in48h.toISOString().split('T')[0]);

    (rdvs || []).forEach((rdv: any) => {
      if (rdv.status === 'proposed') {
        alerts.push({
          id: `rdv-${rdv.id}`,
          type: 'critique',
          category: 'rdv',
          title: 'RDV NON CONFIRMÉ',
          description: `RDV ${rdv.scheduled_date} à ${rdv.scheduled_time} - Pas de confirmation client`,
          clientName: rdv.Client?.company_name || rdv.Client?.name || 'Client',
          urgency: 100,
          actionLabel: 'Confirmer',
          actionUrl: `/expert/agenda?rdv=${rdv.id}`,
          createdAt: new Date().toISOString()
        });
      }
    });

    // 2. ALERTES DOSSIERS BLOQUÉS
    const { data: dossiersBloqués } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        updated_at,
        statut,
        Client:clientId (
          company_name,
          name
        )
      `)
      .eq('expert_id', expertId)
      .eq('statut', 'en_cours');

    const now = new Date();
    (dossiersBloqués || []).forEach((dossier: any) => {
      const daysSinceUpdate = Math.floor((now.getTime() - new Date(dossier.updated_at).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceUpdate >= 8) {
        alerts.push({
          id: `dossier-${dossier.id}`,
          type: 'critique',
          category: 'dossier',
          title: 'DOSSIER BLOQUÉ',
          description: `Pas d'interaction depuis ${daysSinceUpdate} jours`,
          dossierId: dossier.id,
          clientName: dossier.Client?.company_name || dossier.Client?.name || 'Client',
          urgency: 90,
          actionLabel: 'Relancer',
          actionUrl: `/expert/dossier/${dossier.id}`,
          createdAt: new Date().toISOString()
        });
      } else if (daysSinceUpdate >= 5) {
        alerts.push({
          id: `dossier-${dossier.id}`,
          type: 'important',
          category: 'dossier',
          title: 'DOSSIER INACTIF',
          description: `Pas d'interaction depuis ${daysSinceUpdate} jours`,
          dossierId: dossier.id,
          clientName: dossier.Client?.company_name || dossier.Client?.name || 'Client',
          urgency: 70,
          actionLabel: 'Voir dossier',
          actionUrl: `/expert/dossier/${dossier.id}`,
          createdAt: new Date().toISOString()
        });
      }
    });

    // 3. ALERTES PROSPECTS CHAUDS SANS RDV
    const { data: prospectsChauds } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        "clientId",
        "montantFinal",
        Client:clientId (
          company_name,
          name
        )
      `)
      .eq('expert_id', expertId)
      .eq('statut', 'eligible');

    // Vérifier si un RDV existe pour chaque prospect
    for (const prospect of (prospectsChauds || [])) {
      const { data: rdvExists } = await supabase
        .from('RDV')
        .select('id')
        .eq('client_id', prospect.clientId)
        .eq('expert_id', expertId)
        .limit(1);

      if (!rdvExists || rdvExists.length === 0) {
        if ((prospect.montantFinal || 0) >= 20000) {
          // Gérer le cas où Client peut être un array ou un objet
          const client = Array.isArray(prospect.Client) ? prospect.Client[0] : prospect.Client;
          
          alerts.push({
            id: `prospect-${prospect.id}`,
            type: 'important',
            category: 'prospect',
            title: 'PROSPECT CHAUD SANS RDV',
            description: `Prospect éligible • ${(prospect.montantFinal || 0).toLocaleString()}€ potentiel`,
            dossierId: prospect.id,
            clientName: client?.company_name || client?.name || 'Client',
            urgency: 80,
            actionLabel: 'Planifier RDV',
            actionUrl: `/expert/dossier/${prospect.id}`,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

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
    const commissionRate = 0.10; // 10% de commission expert
    const commissionExpert = signesTotal * commissionRate;

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
// ROUTE 4 : OVERVIEW COMPLET (KPIs + Données)
// ============================================================================

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
      .in('statut', ['eligible', 'en_cours']);

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

export default router;

