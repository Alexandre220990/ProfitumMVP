/**
 * Service de rapport d'activité quotidien V2 - Design Haute Couture
 * Génère et envoie un rapport quotidien premium avec :
 * - Actions du jour non traitées (documents, experts, simulations, leads)
 * - Rapports RDV non remis
 * - RDV du lendemain
 * - Design premium différenciant
 * 
 * ✅ REFACTORISÉ : Utilise BaseReportService pour logique commune
 * ✅ OPTIMISÉ : Parallélisation des requêtes (déjà implémenté)
 * ✅ CACHE : Utilise ReportCacheService pour améliorer les performances
 */

import { createClient } from '@supabase/supabase-js';
import { EmailService } from './EmailService';
import { SecureLinkService } from './secure-link-service';
import { NotificationPreferencesChecker } from './notification-preferences-checker';
import { BaseReportService, REPORT_LIMITS } from './base-report-service';
import { ReportCacheService } from './report-cache-service';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RDVData {
  id: string;
  title: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  meeting_type: string;
  location?: string;
  meeting_url?: string;
  Client?: {
    id: string;
    name?: string;
    company_name?: string;
    email?: string;
  };
  Expert?: {
    id: string;
    name?: string;
    email?: string;
  };
  ApporteurAffaires?: {
    id: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
  };
}

interface PendingAction {
  type: 'document_validation' | 'expert_application' | 'client_simulation' | 'lead';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  link: string;
  metadata?: any;
}

interface RDVWithoutReport {
  id: string;
  title: string;
  scheduled_date: string;
  scheduled_time: string;
  Client?: {
    company_name?: string;
    name?: string;
  };
  hasReport: boolean;
  reportLink: string;
}

interface DailyReportDataV2 {
  reportDate: string;
  pendingActions: PendingAction[];
  rdvWithoutReports: RDVWithoutReport[];
  rdvTomorrow: RDVData[];
  stats: {
    totalPendingActions: number;
    totalRDVWithoutReports: number;
    totalRDVTomorrow: number;
  };
}

export class DailyActivityReportServiceV2 {
  /**
   * Générer le rapport d'activité V2 pour une date donnée
   * ✅ OPTIMISÉ : Utilise le cache et parallélise les requêtes
   */
  static async generateDailyReport(
    date: Date = new Date(), 
    adminId?: string, 
    adminType?: string,
    useCache: boolean = true
  ): Promise<DailyReportDataV2> {
    const dateStr = date.toISOString().split('T')[0];
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const cacheParams = { date: dateStr, type: 'daily_v2', adminId: adminId || 'all' };

    // Vérifier le cache
    if (useCache) {
      const cached = await ReportCacheService.get<DailyReportDataV2>('daily_v2', cacheParams);
      if (cached) {
        console.log(`📊 Rapport d'activité V2 récupéré depuis le cache pour le ${dateStr}`);
        return cached;
      }
    }

    console.log(`📊 Génération rapport d'activité V2 pour le ${dateStr}`);

    // ✅ PARALLÉLISATION : Exécuter les requêtes indépendantes en parallèle
    const [
      pendingActions,
      rdvWithoutReports,
      { data: rdvTomorrow, error: rdvTomorrowError }
    ] = await Promise.all([
      // 1. Actions non traitées
      this.getPendingActions(adminId, adminType),
      
      // 2. RDV complétés sans rapport
      this.getRDVWithoutReports(adminId, adminType),
      
      // 3. RDV du lendemain
      BaseReportService.createBaseRDVQuery()
        .eq('scheduled_date', tomorrowStr)
        .order('scheduled_time', { ascending: true })
    ]);

    if (rdvTomorrowError) {
      console.error('❌ Erreur récupération RDV du lendemain:', rdvTomorrowError);
    }

    // Normaliser les RDV
    const rdvTomorrowNormalized = BaseReportService.normalizeRDVs(rdvTomorrow || []);

    const result: DailyReportDataV2 = {
      reportDate: dateStr,
      pendingActions,
      rdvWithoutReports,
      rdvTomorrow: rdvTomorrowNormalized,
      stats: {
        totalPendingActions: pendingActions.length,
        totalRDVWithoutReports: rdvWithoutReports.length,
        totalRDVTomorrow: rdvTomorrowNormalized.length
      }
    };

    // Mettre en cache le résultat
    if (useCache) {
      await ReportCacheService.set('daily_v2', cacheParams, result, REPORT_LIMITS.CACHE_TTL_SECONDS);
    }

    return result;
  }

  /**
   * Récupérer les actions non traitées du jour
   * ✅ OPTIMISATION: Parallélisation des requêtes indépendantes avec Promise.all
   */
  private static async getPendingActions(adminId?: string, adminType?: string): Promise<PendingAction[]> {
    const actions: PendingAction[] = [];

    // ✅ OPTIMISATION: Exécuter les 4 requêtes en parallèle au lieu de séquentiellement
    const today = new Date().toISOString().split('T')[0];
    
    const [
      { data: pendingDocs, error: docsError },
      { data: pendingExperts, error: expertsError },
      { data: simulations, error: simulationsError },
      { data: untreatedLeads, error: leadsError }
    ] = await Promise.all([
      // 1. Documents à valider - GROUPÉS PAR CLIENT
      supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          Client:clientId(id, company_name, name),
          ProduitEligible:produitId(id, nom)
        `)
        .or('admin_eligibility_status.eq.pending,admin_eligibility_status.is.null')
        .limit(REPORT_LIMITS.MAX_PENDING_ACTIONS),
      
      // 2. Experts souhaitant rejoindre la plateforme
      supabase
        .from('Expert')
        .select('id, name, email, approval_status')
        .eq('approval_status', 'pending')
        .limit(10),
      
      // 3. Simulations client effectuées (avec produits éligibles détectés)
      supabase
        .from('simulations')
        .select(`
          id,
          client_id,
          created_at,
          status,
          Client:client_id(id, name, company_name, email)
        `)
        .eq('status', 'completed')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)
        .limit(20),
      
      // 4. Leads non traités avec temps de dépassement
      supabase
        .from('notification')
        .select('id, title, message, created_at, metadata')
        .eq('user_type', 'admin')
        .in('notification_type', ['contact_message', 'lead_to_treat'])
        .eq('is_read', false)
        .in('status', ['unread', 'active'])
        .order('created_at', { ascending: true })
        .limit(REPORT_LIMITS.MAX_PENDING_CONTACTS)
    ]);

    // Traiter les erreurs
    if (docsError) console.error('❌ Erreur récupération documents à valider:', docsError);
    if (expertsError) console.error('❌ Erreur récupération experts en attente:', expertsError);
    if (simulationsError) console.error('❌ Erreur récupération simulations:', simulationsError);
    if (leadsError) console.error('❌ Erreur récupération leads non traités:', leadsError);

    // 1. Traiter les documents à valider - GROUPÉS PAR CLIENT
    // ✅ OPTIMISÉ : Utilise la méthode de groupement de BaseReportService si possible
    try {
      if (pendingDocs) {
        // Grouper les dossiers par client
        const groupedByClient = pendingDocs.reduce((acc: any, dossier: any) => {
          const client = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
          const clientId = client?.id;
          
          if (!clientId) return acc;
          
          if (!acc[clientId]) {
            acc[clientId] = {
              client_id: clientId,
              client_name: client.company_name || client.name,
              dossiers: []
            };
          }
          
          const produit = Array.isArray(dossier.ProduitEligible) ? dossier.ProduitEligible[0] : dossier.ProduitEligible;
          acc[clientId].dossiers.push({
            id: dossier.id,
            nom: produit?.nom || 'Dossier'
          });
          return acc;
        }, {});

        // Créer une action groupée par client
        for (const [clientId, data] of Object.entries(groupedByClient)) {
          const clientData = data as any;
          const dossiersNames = clientData.dossiers
            .slice(0, 3)
            .map((d: any) => d.nom)
            .join(', ');
          const moreCount = clientData.dossiers.length > 3 ? ` +${clientData.dossiers.length - 3}` : '';
          
          actions.push({
            type: 'document_validation',
            title: `Documents à valider - ${clientData.client_name}`,
            description: `${clientData.dossiers.length} dossier${clientData.dossiers.length > 1 ? 's' : ''} : ${dossiersNames}${moreCount}`,
            priority: 'high',
            link: SecureLinkService.generateSimpleLink(`/admin/clients/${clientId}`, adminId, adminType || 'admin'),
            metadata: { 
              client_id: clientId,
              dossiers_count: clientData.dossiers.length 
            }
          });
        }
      }
    } catch (error) {
      console.error('❌ Erreur traitement documents à valider:', error);
    }

    // 2. Traiter les experts en attente
    try {
      if (pendingExperts) {
        for (const expert of pendingExperts) {
          actions.push({
            type: 'expert_application',
            title: `Expert ${expert.name || expert.email} souhaite rejoindre la plateforme`,
            description: `Vérifier le profil et valider la candidature`,
            priority: 'medium',
            link: SecureLinkService.generateSimpleLink(`/admin/experts/${expert.id}`, adminId, adminType || 'admin')
          });
        }
      }
    } catch (error) {
      console.error('❌ Erreur traitement experts en attente:', error);
    }

    // 3. Traiter les simulations (nécessite requêtes supplémentaires pour produits éligibles)
    try {
      if (simulations) {
        // ✅ OPTIMISATION: Paralléliser les requêtes de produits éligibles
        const simulationPromises = simulations.map(async (sim: any) => {
          const client = Array.isArray(sim.Client) ? sim.Client[0] : sim.Client;
          
          // Récupérer les produits éligibles via ClientProduitEligible avec simulationId
          const { data: eligibleProducts } = await supabase
            .from('ClientProduitEligible')
            .select('id')
            .eq('simulationId', sim.id)
            .in('statut', ['eligible', 'pending_upload', 'pending_admin_validation', 'admin_validated']);

          const productsCount = eligibleProducts?.length || 0;

          if (productsCount > 0) {
            return {
              type: 'client_simulation' as const,
              title: `Simulation client effectuée - ${client?.email || 'Email'}`,
              description: `${productsCount} produit${productsCount > 1 ? 's' : ''} éligible${productsCount > 1 ? 's' : ''} détecté${productsCount > 1 ? 's' : ''} - Voir le client`,
              priority: 'medium' as const,
              link: SecureLinkService.generateSimpleLink(`/admin/clients/${client?.id || sim.client_id}`, adminId, adminType || 'admin'),
              metadata: { productsCount }
            };
          }
          return null;
        });

        const simulationActions = await Promise.all(simulationPromises);
        const validActions = simulationActions.filter((a): a is NonNullable<typeof a> => a !== null);
        actions.push(...validActions);
      }
    } catch (error) {
      console.error('❌ Erreur traitement simulations:', error);
    }

    // 4. Traiter les leads non traités
    try {
      if (untreatedLeads) {
        const now = new Date();
        for (const lead of untreatedLeads) {
          const createdAt = new Date(lead.created_at);
          const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          const daysElapsed = Math.floor(hoursElapsed / 24);
          
          let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
          if (hoursElapsed >= 120) priority = 'urgent';
          else if (hoursElapsed >= 48) priority = 'high';

          const metadata = lead.metadata || {};
          // Format intelligent : "2 jours 5h" ou "18h" ou "moins d'1h"
          let timeDisplay = '';
          if (daysElapsed > 0) {
            const remainingHours = Math.floor(hoursElapsed % 24);
            timeDisplay = `${daysElapsed} jour${daysElapsed > 1 ? 's' : ''}${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
          } else if (hoursElapsed >= 1) {
            timeDisplay = `${Math.floor(hoursElapsed)}h`;
          } else {
            timeDisplay = 'moins d\'1h';
          }

          actions.push({
            type: 'lead',
            title: lead.title || 'Lead à traiter',
            description: `${timeDisplay} de dépassement - ${metadata.name || metadata.email || 'Contact'}`,
            priority,
            link: SecureLinkService.generateSimpleLink(lead.metadata?.action_url || '/admin/contact', adminId, adminType || 'admin'),
            metadata: { hoursElapsed, daysElapsed }
          });
        }
      }
    } catch (error) {
      console.error('❌ Erreur récupération leads non traités:', error);
    }

    return actions;
  }

  /**
   * Récupérer les RDV complétés sans rapport (seulement ceux en retard)
   */
  private static async getRDVWithoutReports(adminId?: string, adminType?: string): Promise<RDVWithoutReport[]> {
    try {
      const now = new Date();
      // Limiter aux RDV complétés dans les 30 derniers jours
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateLimit = thirtyDaysAgo.toISOString().split('T')[0];

      // Récupérer les RDV complétés récents
      const { data: completedRDVs } = await supabase
        .from('RDV')
        .select(`
          id,
          title,
          scheduled_date,
          scheduled_time,
          status,
          updated_at,
          Client:client_id(id, company_name, name)
        `)
        .eq('status', 'completed')
        .gte('scheduled_date', dateLimit)
        .order('scheduled_date', { ascending: false })
        .order('scheduled_time', { ascending: false })
        .limit(100);

      if (!completedRDVs || completedRDVs.length === 0) {
        return [];
      }

      // Vérifier quels RDV ont un rapport
      const rdvIds = completedRDVs.map(rdv => rdv.id);
      const { data: reports } = await supabase
        .from('RDV_Report')
        .select('rdv_id')
        .in('rdv_id', rdvIds);

      const rdvWithReports = new Set((reports || []).map(r => r.rdv_id));

      // Filtrer les RDV sans rapport ET qui sont en retard (complétés depuis plus de 24h)
      return completedRDVs
        .filter(rdv => {
          if (rdvWithReports.has(rdv.id)) return false; // A déjà un rapport
          
          // Vérifier si le RDV est en retard (complété depuis plus de 24h)
          const updatedAt = rdv.updated_at ? new Date(rdv.updated_at) : new Date(`${rdv.scheduled_date}T${rdv.scheduled_time}`);
          const hoursSinceCompletion = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
          
          return hoursSinceCompletion >= 24; // En retard si complété depuis plus de 24h
        })
        .map(rdv => {
          const client = Array.isArray(rdv.Client) ? rdv.Client[0] : rdv.Client;
          // Vérifier si un rapport existe vraiment (pour afficher "Modifier" si présent)
          const hasReport = rdvWithReports.has(rdv.id);
          
          return {
            id: rdv.id,
            title: rdv.title || 'RDV sans titre',
            scheduled_date: rdv.scheduled_date,
            scheduled_time: rdv.scheduled_time,
            Client: client,
            hasReport: hasReport,
            reportLink: SecureLinkService.generateSimpleLink(`/admin/agenda-admin?rdvId=${rdv.id}&tab=report`, undefined, 'admin')
          };
        });
    } catch (error) {
      console.error('❌ Erreur récupération RDV sans rapport:', error);
      return [];
    }
  }

  /**
   * Formater le rapport en HTML premium
   */
  static formatReportAsHTML(reportData: DailyReportDataV2, adminName: string, adminId?: string, adminType?: string): string {
    const reportDate = new Date(reportData.reportDate);
    const formattedDate = reportDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formatTime = (time: string) => time.substring(0, 5);
    const getClientName = (rdv: RDVData) => rdv.Client?.company_name || rdv.Client?.name || 'Client non renseigné';
    const getExpertName = (rdv: RDVData) => rdv.Expert?.name || 'Expert non assigné';

    // Message engageant et motivant
    const motivationalMessage = reportData.stats.totalPendingActions > 0
      ? `Vous avez ${reportData.stats.totalPendingActions} action${reportData.stats.totalPendingActions > 1 ? 's' : ''} en attente qui nécessitent votre attention. Chaque action traitée rapproche un client de son objectif. 💪`
      : `Excellent travail ! Toutes les actions du jour ont été traitées. 🎉`;

    const priorityColors = {
      urgent: { bg: '#fef2f2', border: '#dc2626', text: '#991b1b', icon: '🚨' },
      high: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', icon: '⚠️' },
      medium: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', icon: '📋' },
      low: { bg: '#f9fafb', border: '#6b7280', text: '#374151', icon: 'ℹ️' }
    };

    const getActionIcon = (type: string) => {
      const icons: Record<string, string> = {
        document_validation: '📄',
        expert_application: '👤',
        client_simulation: '💡',
        lead: '🎯'
      };
      return icons[type] || '📌';
    };

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport quotidien - ${formattedDate}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
    }
    .email-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 60px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: pulse 20s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    .header-content {
      position: relative;
      z-index: 1;
    }
    .header h1 {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 10px;
      letter-spacing: -1px;
    }
    .header .date {
      font-size: 18px;
      opacity: 0.95;
      font-weight: 400;
    }
    .motivational-banner {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-left: 4px solid #f59e0b;
      padding: 24px 32px;
      margin: 32px;
      border-radius: 12px;
      font-size: 16px;
      color: #92400e;
      font-weight: 500;
      line-height: 1.6;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 32px;
      background: #f9fafb;
    }
    .stat-card {
      background: white;
      padding: 24px;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
    }
    .stat-card:hover {
      transform: translateY(-2px);
    }
    .stat-number {
      font-size: 42px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
    }
    .stat-label {
      font-size: 14px;
      color: #6b7280;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section {
      padding: 40px;
      border-bottom: 1px solid #e5e7eb;
    }
    .section:last-child {
      border-bottom: none;
    }
    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
    }
    .section-icon {
      font-size: 32px;
      margin-right: 16px;
    }
    .section-title {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
    }
    .section-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin-top: 4px;
    }
    .action-item {
      background: white;
      border-left: 4px solid;
      padding: 20px 24px;
      margin-bottom: 16px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: all 0.2s;
    }
    .action-item:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      transform: translateX(4px);
    }
    .action-header {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    .action-icon {
      font-size: 20px;
      margin-right: 12px;
    }
    .action-title {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      flex: 1;
    }
    .action-priority {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .action-description {
      font-size: 14px;
      color: #4b5563;
      margin-top: 8px;
      line-height: 1.5;
    }
    .action-link {
      display: inline-block;
      margin-top: 12px;
      padding: 10px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      transition: transform 0.2s;
    }
    .action-link:hover {
      transform: scale(1.05);
    }
    .rdv-item {
      background: white;
      padding: 20px 24px;
      margin-bottom: 16px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border-left: 4px solid #3b82f6;
    }
    .rdv-header {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }
    .rdv-details {
      font-size: 14px;
      color: #4b5563;
      margin: 4px 0;
    }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #9ca3af;
    }
    .empty-state-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    .empty-state-text {
      font-size: 16px;
      font-style: italic;
    }
    .footer {
      background: #f9fafb;
      padding: 32px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.6;
    }
    .footer-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }
    @media only screen and (max-width: 600px) {
      .email-container { margin: 0; border-radius: 0; }
      .header { padding: 40px 20px; }
      .section { padding: 24px 20px; }
      .stats-grid { grid-template-columns: 1fr; padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="header-content">
        <h1>📊 Rapport Quotidien</h1>
        <div class="date">${formattedDate}</div>
      </div>
    </div>

    ${reportData.stats.totalPendingActions > 0 ? `
    <div class="motivational-banner">
      ${motivationalMessage}
    </div>
    ` : ''}

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">${reportData.stats.totalPendingActions}</div>
        <div class="stat-label">Actions en attente</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${reportData.stats.totalRDVWithoutReports}</div>
        <div class="stat-label">Rapports à compléter</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">${reportData.stats.totalRDVTomorrow}</div>
        <div class="stat-label">RDV demain</div>
      </div>
    </div>

    ${reportData.pendingActions.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">⚡</div>
        <div>
          <div class="section-title">Actions du jour</div>
          <div class="section-subtitle">${reportData.pendingActions.length} action${reportData.pendingActions.length > 1 ? 's' : ''} nécessitant votre attention</div>
        </div>
      </div>
      ${reportData.pendingActions.map(action => {
        const priorityStyle = priorityColors[action.priority];
        const isGrouped = action.metadata?.dossiers_count > 1;
        return `
          <div class="action-item" style="border-left-color: ${priorityStyle.border}; background: ${priorityStyle.bg};">
            <div class="action-header">
              <div class="action-icon">${getActionIcon(action.type)}</div>
              <div class="action-title">${action.title}</div>
              ${isGrouped ? `<span style="display: inline-block; padding: 4px 12px; background: ${priorityStyle.border}; color: white; border-radius: 20px; font-size: 11px; font-weight: 600; margin: 0 8px;">${action.metadata.dossiers_count} dossiers</span>` : ''}
              <div class="action-priority" style="background: ${priorityStyle.border}; color: white;">
                ${action.priority}
              </div>
            </div>
            <div class="action-description" style="color: ${priorityStyle.text};">
              ${action.description}
            </div>
            <a href="${action.link}" class="action-link">Voir les détails →</a>
          </div>
        `;
      }).join('')}
    </div>
    ` : ''}

    ${reportData.rdvWithoutReports.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📝</div>
        <div>
          <div class="section-title">Rapports RDV à compléter</div>
          <div class="section-subtitle">${reportData.rdvWithoutReports.length} RDV complété${reportData.rdvWithoutReports.length > 1 ? 's' : ''} sans rapport</div>
        </div>
      </div>
      ${reportData.rdvWithoutReports.map(rdv => {
        const clientName = rdv.Client?.company_name || rdv.Client?.name || 'Client';
        return `
          <div class="rdv-item">
            <div class="rdv-header">${rdv.title}</div>
            <div class="rdv-details"><strong>Client:</strong> ${clientName}</div>
            <div class="rdv-details"><strong>Date:</strong> ${new Date(rdv.scheduled_date).toLocaleDateString('fr-FR')} à ${formatTime(rdv.scheduled_time)}</div>
            <a href="${rdv.reportLink}" class="action-link" style="margin-top: 12px;">${rdv.hasReport ? 'Modifier le rapport' : 'Ajouter le rapport'} →</a>
          </div>
        `;
      }).join('')}
    </div>
    ` : ''}

    ${reportData.rdvTomorrow.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">📅</div>
        <div>
          <div class="section-title">RDV du lendemain</div>
          <div class="section-subtitle">${reportData.rdvTomorrow.length} rendez-vous prévu${reportData.rdvTomorrow.length > 1 ? 's' : ''}</div>
        </div>
      </div>
      ${reportData.rdvTomorrow.map(rdv => `
        <div class="rdv-item">
          <div class="rdv-header">${rdv.title || 'RDV sans titre'}</div>
          <div class="rdv-details"><strong>Expert:</strong> ${getExpertName(rdv)}</div>
          <div class="rdv-details"><strong>Client:</strong> ${getClientName(rdv)}</div>
          <div class="rdv-details"><strong>Heure:</strong> ${formatTime(rdv.scheduled_time)} (${rdv.duration_minutes || 60} min)</div>
          <div class="rdv-details"><strong>Type:</strong> ${rdv.meeting_type || 'Non spécifié'}</div>
          ${rdv.location ? `<div class="rdv-details"><strong>Lieu:</strong> ${rdv.location}</div>` : ''}
          ${rdv.meeting_url ? `<div class="rdv-details"><strong>Lien:</strong> <a href="${rdv.meeting_url}" style="color: #667eea;">${rdv.meeting_url}</a></div>` : ''}
        </div>
      `).join('')}
    </div>
    ` : `
    <div class="section">
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <div class="empty-state-text">Aucun RDV prévu demain</div>
      </div>
    </div>
    `}

    <div class="footer">
      <div class="footer-text">
        <p>Rapport généré automatiquement par Profitum</p>
        <p style="margin-top: 12px;">
          <a href="${SecureLinkService.generateSimpleLink('/admin/dashboard-optimized', adminId, adminType || 'admin')}" class="footer-link">
            Accéder au dashboard →
          </a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Envoyer le rapport d'activité quotidien V2 à un admin
   */
  static async sendDailyReport(adminEmail: string, adminName: string, adminId?: string, adminType?: string, date?: Date): Promise<boolean> {
    try {
      console.log(`📧 Génération et envoi du rapport d'activité V2 pour ${adminEmail}`);

      // ✅ VERROU ANTI-DOUBLON : Vérifier si un rapport a déjà été envoyé aujourd'hui
      const reportDate = date || new Date();
      const startOfDay = new Date(reportDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(reportDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: existingReport, error: checkError } = await supabase
        .from('EmailTracking')
        .select('id, sent_at')
        .eq('recipient', adminEmail)
        .eq('template_name', 'daily_activity_report')
        .gte('sent_at', startOfDay.toISOString())
        .lte('sent_at', endOfDay.toISOString())
        .maybeSingle();

      if (checkError) {
        console.error(`⚠️ Erreur vérification doublon rapport pour ${adminEmail}:`, checkError);
        // Continuer quand même en cas d'erreur de vérification
      } else if (existingReport) {
        console.log(`🔒 Rapport quotidien déjà envoyé aujourd'hui à ${adminEmail} (${existingReport.sent_at}) - envoi ignoré pour éviter doublon`);
        return true; // Retourner true car le rapport a bien été envoyé (juste pas maintenant)
      }

      // Vérifier les préférences avant d'envoyer (activé par défaut mais vérifiable)
      if (adminId) {
        const shouldSendEmail = await NotificationPreferencesChecker.shouldSendEmail(
          adminId,
          'admin',
          'daily_activity_report'
        );

        if (!shouldSendEmail) {
          console.log(`⏭️ Rapport quotidien non envoyé à ${adminEmail} - préférences utilisateur désactivées pour daily_activity_report`);
          return false;
        }
      }

      const reportData = await this.generateDailyReport(date, adminId, adminType);
      const html = this.formatReportAsHTML(reportData, adminName, adminId, adminType);

      const text = `
Rapport d'activité quotidien - ${new Date(reportData.reportDate).toLocaleDateString('fr-FR')}

Actions en attente (${reportData.stats.totalPendingActions}) :
${reportData.pendingActions.map(a => `- ${a.title}: ${a.description}`).join('\n') || 'Aucune action'}

Rapports RDV à compléter (${reportData.stats.totalRDVWithoutReports}) :
${reportData.rdvWithoutReports.map(r => `- ${r.title} - ${r.Client?.company_name || r.Client?.name || 'Client'}`).join('\n') || 'Aucun rapport manquant'}

RDV du lendemain (${reportData.stats.totalRDVTomorrow}) :
${reportData.rdvTomorrow.map(r => `- ${r.title || 'RDV'} : ${r.scheduled_time} avec ${r.Expert?.name || 'Expert'} et ${r.Client?.company_name || r.Client?.name || 'Client'}`).join('\n') || 'Aucun RDV'}
      `.trim();

      const subject = `📊 Rapport quotidien - ${new Date(reportData.reportDate).toLocaleDateString('fr-FR')}`;
      const success = await EmailService.sendDailyReportEmail(adminEmail, subject, html, text);

      if (success) {
        console.log(`✅ Rapport d'activité V2 envoyé avec succès à ${adminEmail}`);
        
        // ✅ Enregistrer dans EmailTracking pour le verrou anti-doublon
        try {
          await supabase
            .from('EmailTracking')
            .insert({
              email_id: crypto.randomUUID(),
              recipient: adminEmail,
              subject: subject,
              template_name: 'daily_activity_report',
              sent_at: new Date().toISOString(),
              status: 'sent',
              metadata: {
                admin_id: adminId || null,
                admin_type: adminType || 'admin',
                report_date: reportData.reportDate
              }
            });
          console.log(`📝 Tracking créé pour rapport quotidien envoyé à ${adminEmail}`);
        } catch (trackError) {
          console.error(`⚠️ Erreur création tracking (non bloquant):`, trackError);
          // Ne pas faire échouer l'envoi si le tracking échoue
        }
      } else {
        console.error(`❌ Échec envoi rapport d'activité V2 à ${adminEmail}`);
      }

      return success;
    } catch (error: any) {
      console.error('❌ Erreur génération/envoi rapport d\'activité V2:', error);
      return false;
    }
  }
}

