import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types pour la conformité
export enum ComplianceStandard {
  ISO_27001 = 'iso_27001',
  SOC_2 = 'soc_2',
  RGPD = 'rgpd',
  PCI_DSS = 'pci_dss',
  HIPAA = 'hipaa'
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  IN_PROGRESS = 'in_progress',
  NOT_APPLICABLE = 'not_applicable'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AuditType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  PENETRATION_TEST = 'penetration_test',
  VULNERABILITY_ASSESSMENT = 'vulnerability_assessment'
}

export interface ComplianceControl {
  id: string;
  standard: ComplianceStandard;
  control_id: string;
  title: string;
  description: string;
  category: string;
  risk_level: RiskLevel;
  status: ComplianceStatus;
  implementation_date?: string;
  last_review_date?: string;
  next_review_date: string;
  responsible_person: string;
  evidence: string[];
  notes?: string;
  metadata?: any;
}

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: RiskLevel;
  incident_type: string;
  affected_systems: string[];
  affected_users: number;
  detected_at: string;
  resolved_at?: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  root_cause?: string;
  remediation_actions: string[];
  lessons_learned?: string;
  created_at: string;
  updated_at: string;
}

export interface DataSubjectRequest {
  id: string;
  subject_id: string;
  request_type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  submitted_at: string;
  completed_at?: string;
  response_data?: any;
  notes?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  success: boolean;
  details: any;
  compliance_impact?: ComplianceStandard[];
}

export interface ComplianceReport {
  id: string;
  standard: ComplianceStandard;
  report_type: 'assessment' | 'audit' | 'certification';
  period_start: string;
  period_end: string;
  overall_status: ComplianceStatus;
  compliance_score: number; // 0-100
  findings: {
    compliant: number;
    non_compliant: number;
    in_progress: number;
    not_applicable: number;
  };
  recommendations: string[];
  auditor?: string;
  audit_date: string;
  next_audit_date: string;
  created_at: string;
}

export class ComplianceService {

  // ===== ISO 27001 - SÉCURITÉ DE L'INFORMATION =====

  /**
   * Initialiser les contrôles ISO 27001
   */
  async initializeISO27001Controls(): Promise<void> {
    const iso27001Controls = [
      // A.5 - Politiques de sécurité de l'information
      {
        id: 'iso_27001_a_5_1_1',
        standard: ComplianceStandard.ISO_27001,
        control_id: 'A.5.1.1',
        title: 'Politiques de sécurité de l\'information',
        description: 'Établir et maintenir des politiques de sécurité de l\'information',
        category: 'Politiques de sécurité',
        risk_level: RiskLevel.HIGH,
        status: ComplianceStatus.COMPLIANT,
        next_review_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: 'CISO',
        evidence: ['Politique de sécurité documentée', 'Processus de révision annuelle'],
        notes: 'Politique mise à jour annuellement'
      },
      {
        id: 'iso_27001_a_6_1_1',
        standard: ComplianceStandard.ISO_27001,
        control_id: 'A.6.1.1',
        title: 'Attribution des responsabilités',
        description: 'Définir et allouer les responsabilités de sécurité',
        category: 'Organisation de la sécurité',
        risk_level: RiskLevel.HIGH,
        status: ComplianceStatus.COMPLIANT,
        next_review_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: 'CISO',
        evidence: ['Matrice RACI', 'Descriptions de poste'],
        notes: 'Responsabilités clairement définies'
      },
      {
        id: 'iso_27001_a_7_1_1',
        standard: ComplianceStandard.ISO_27001,
        control_id: 'A.7.1.1',
        title: 'Vérification préalable',
        description: 'Vérifier les antécédents des candidats',
        category: 'Ressources humaines',
        risk_level: RiskLevel.MEDIUM,
        status: ComplianceStatus.COMPLIANT,
        next_review_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: 'RH',
        evidence: ['Processus de recrutement', 'Vérifications d\'antécédents'],
        notes: 'Processus documenté et appliqué'
      },
      {
        id: 'iso_27001_a_8_1_1',
        standard: ComplianceStandard.ISO_27001,
        control_id: 'A.8.1.1',
        title: 'Inventaire des actifs',
        description: 'Maintenir un inventaire des actifs d\'information',
        category: 'Gestion des actifs',
        risk_level: RiskLevel.MEDIUM,
        status: ComplianceStatus.IN_PROGRESS,
        next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: 'IT Manager',
        evidence: ['Inventaire partiel', 'Processus d\'inventaire'],
        notes: 'Inventaire en cours de finalisation'
      },
      {
        id: 'iso_27001_a_9_1_1',
        standard: ComplianceStandard.ISO_27001,
        control_id: 'A.9.1.1',
        title: 'Politique de contrôle d\'accès',
        description: 'Établir une politique de contrôle d\'accès',
        category: 'Contrôle d\'accès',
        risk_level: RiskLevel.HIGH,
        status: ComplianceStatus.COMPLIANT,
        next_review_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: 'IT Manager',
        evidence: ['Politique d\'accès', 'Matrice de permissions'],
        notes: 'Politique basée sur le principe du moindre privilège'
      },
      {
        id: 'iso_27001_a_10_1_1',
        standard: ComplianceStandard.ISO_27001,
        control_id: 'A.10.1.1',
        title: 'Politique de cryptage',
        description: 'Établir une politique de cryptage',
        category: 'Cryptographie',
        risk_level: RiskLevel.HIGH,
        status: ComplianceStatus.COMPLIANT,
        next_review_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: 'CISO',
        evidence: ['Politique de cryptage', 'Algorithmes approuvés'],
        notes: 'Utilisation d\'AES-256-GCM pour les données sensibles'
      },
      {
        id: 'iso_27001_a_12_1_1',
        standard: ComplianceStandard.ISO_27001,
        control_id: 'A.12.1.1',
        title: 'Politique de développement sécurisé',
        description: 'Établir des règles de développement sécurisé',
        category: 'Sécurité des opérations',
        risk_level: RiskLevel.HIGH,
        status: ComplianceStatus.COMPLIANT,
        next_review_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: 'Lead Developer',
        evidence: ['Guide de développement', 'Revues de code'],
        notes: 'Intégration continue avec tests de sécurité'
      },
      {
        id: 'iso_27001_a_13_1_1',
        standard: ComplianceStandard.ISO_27001,
        control_id: 'A.13.1.1',
        title: 'Politique de sauvegarde',
        description: 'Établir une politique de sauvegarde',
        category: 'Continuité d\'activité',
        risk_level: RiskLevel.HIGH,
        status: ComplianceStatus.COMPLIANT,
        next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: 'IT Manager',
        evidence: ['Politique de sauvegarde', 'Tests de restauration'],
        notes: 'Sauvegardes quotidiennes avec chiffrement'
      },
      {
        id: 'iso_27001_a_16_1_1',
        standard: ComplianceStandard.ISO_27001,
        control_id: 'A.16.1.1',
        title: 'Gestion des incidents',
        description: 'Établir un processus de gestion des incidents',
        category: 'Gestion des incidents',
        risk_level: RiskLevel.HIGH,
        status: ComplianceStatus.COMPLIANT,
        next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: 'CISO',
        evidence: ['Processus d\'incident', 'Équipe de réponse'],
        notes: 'Processus documenté avec escalade'
      }
    ];

    for (const control of iso27001Controls) {
      await this.createComplianceControl(control);
    }
  }

  // ===== SOC 2 - CONTRÔLES DE SÉCURITÉ =====

  /**
   * Initialiser les contrôles SOC 2
   */
  async initializeSOC2Controls(): Promise<void> {
    const soc2Controls = [
      // CC1 - Contrôle environnement
      {
        id: 'soc2_cc1_1',
        standard: ComplianceStandard.SOC_2,
        control_id: 'CC1.1',
        title: 'Engagement de la direction',
        description: 'La direction démontre son engagement envers la sécurité',
        category: 'Contrôle environnement',
        risk_level: RiskLevel.HIGH,
        status: ComplianceStatus.COMPLIANT,
        next_review_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: 'CEO',
        evidence: ['Politique de sécurité', 'Budget sécurité'],
        notes: 'Engagement démontré par le budget et les politiques'
      },
      // CC2 - Communication
      {
        id: 'soc2_cc2_1',
        standard: ComplianceStandard.SOC_2,
        control_id: 'CC2.1',
        title: 'Politiques de sécurité',
        description: 'Politiques de sécurité documentées et communiquées',
        category: 'Communication',
        risk_level: RiskLevel.HIGH,
        status: ComplianceStatus.COMPLIANT,
        next_review_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: 'CISO',
        evidence: ['Politiques documentées', 'Formations'],
        notes: 'Politiques accessibles à tous les employés'
      },
      // CC3 - Évaluation des risques
      {
        id: 'soc2_cc3_1',
        standard: ComplianceStandard.SOC_2,
        control_id: 'CC3.1',
        title: 'Évaluation des risques',
        description: 'Processus d\'évaluation des risques de sécurité',
        category: 'Évaluation des risques',
        risk_level: RiskLevel.HIGH,
        status: ComplianceStatus.COMPLIANT,
        next_review_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: 'CISO',
        evidence: ['Matrice de risques', 'Évaluations trimestrielles'],
        notes: 'Évaluations régulières avec mise à jour'
      },
      // CC4 - Monitoring
      {
        id: 'soc2_cc4_1',
        standard: ComplianceStandard.SOC_2,
        control_id: 'CC4.1',
        title: 'Monitoring continu',
        description: 'Monitoring continu des contrôles de sécurité',
        category: 'Monitoring',
        risk_level: RiskLevel.HIGH,
        status: ComplianceStatus.COMPLIANT,
        next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: 'IT Manager',
        evidence: ['Outils de monitoring', 'Alertes configurées'],
        notes: 'Monitoring 24/7 avec alertes'
      },
      // CC5 - Contrôles de contrôle
      {
        id: 'soc2_cc5_1',
        standard: ComplianceStandard.SOC_2,
        control_id: 'CC5.1',
        title: 'Contrôles de contrôle',
        description: 'Processus d\'évaluation des contrôles',
        category: 'Contrôles de contrôle',
        risk_level: RiskLevel.MEDIUM,
        status: ComplianceStatus.COMPLIANT,
        next_review_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: 'CISO',
        evidence: ['Audits internes', 'Tests de contrôles'],
        notes: 'Audits trimestriels avec rapports'
      }
    ];

    for (const control of soc2Controls) {
      await this.createComplianceControl(control);
    }
  }

  // ===== RGPD - PROTECTION DES DONNÉES =====

  /**
   * Initialiser les contrôles RGPD
   */
  async initializeRGPDControls(): Promise<void> {
    const rgpdControls = [
      {
        id: 'rgpd_article_5_1_a',
        standard: ComplianceStandard.RGPD,
        control_id: 'Article 5.1.a',
        title: 'Licéité du traitement',
        description: 'Traitement licite, loyal et transparent',
        category: 'Principes de traitement',
        risk_level: RiskLevel.HIGH,
        status: ComplianceStatus.COMPLIANT,
        next_review_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: 'DPO',
        evidence: ['Base légale documentée', 'Consentements'],
        notes: 'Base légale claire pour chaque traitement'
      },
      {
        id: 'rgpd_article_6',
        standard: ComplianceStandard.RGPD,
        control_id: 'Article 6',
        title: 'Base légale du traitement',
        description: 'Base légale appropriée pour le traitement',
        category: 'Base légale',
        risk_level: RiskLevel.HIGH,
        status: ComplianceStatus.COMPLIANT,
        next_review_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: 'DPO',
        evidence: ['Analyse d\'impact', 'Documentation'],
        notes: 'Bases légales documentées et justifiées'
      },
      {
        id: 'rgpd_article_7',
        standard: ComplianceStandard.RGPD,
        control_id: 'Article 7',
        title: 'Conditions du consentement',
        description: 'Consentement libre, spécifique, éclairé et univoque',
        category: 'Consentement',
        risk_level: RiskLevel.HIGH,
        status: ComplianceStatus.COMPLIANT,
        next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: 'DPO',
        evidence: ['Formulaires de consentement', 'Processus de retrait'],
        notes: 'Consentement granulaire avec retrait facile'
      },
      {
        id: 'rgpd_article_25',
        standard: ComplianceStandard.RGPD,
        control_id: 'Article 25',
        title: 'Protection des données dès la conception',
        description: 'Mesures techniques et organisationnelles appropriées',
        category: 'Privacy by Design',
        risk_level: RiskLevel.HIGH,
        status: ComplianceStatus.COMPLIANT,
        next_review_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: 'Lead Developer',
        evidence: ['Architecture sécurisée', 'Chiffrement'],
        notes: 'Chiffrement de bout en bout implémenté'
      },
      {
        id: 'rgpd_article_30',
        standard: ComplianceStandard.RGPD,
        control_id: 'Article 30',
        title: 'Registre des activités de traitement',
        description: 'Registre des activités de traitement maintenu',
        category: 'Obligations documentaires',
        risk_level: RiskLevel.MEDIUM,
        status: ComplianceStatus.COMPLIANT,
        next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: 'DPO',
        evidence: ['Registre des traitements', 'Mise à jour régulière'],
        notes: 'Registre automatisé et à jour'
      },
      {
        id: 'rgpd_article_32',
        standard: ComplianceStandard.RGPD,
        control_id: 'Article 32',
        title: 'Sécurité du traitement',
        description: 'Mesures de sécurité appropriées',
        category: 'Sécurité',
        risk_level: RiskLevel.HIGH,
        status: ComplianceStatus.COMPLIANT,
        next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: 'CISO',
        evidence: ['Chiffrement', 'Contrôle d\'accès', 'Sauvegardes'],
        notes: 'Mesures de sécurité robustes implémentées'
      },
      {
        id: 'rgpd_article_33',
        standard: ComplianceStandard.RGPD,
        control_id: 'Article 33',
        title: 'Notification de violation',
        description: 'Processus de notification des violations',
        category: 'Violations de données',
        risk_level: RiskLevel.HIGH,
        status: ComplianceStatus.COMPLIANT,
        next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        responsible_person: 'DPO',
        evidence: ['Processus de notification', 'Équipe de réponse'],
        notes: 'Processus de notification en 72h'
      }
    ];

    for (const control of rgpdControls) {
      await this.createComplianceControl(control);
    }
  }

  // ===== MÉTHODES DE GESTION =====

  /**
   * Créer un contrôle de conformité
   */
  async createComplianceControl(control: Partial<ComplianceControl>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('ComplianceControl')
        .insert({
          id: control.id,
          standard: control.standard,
          control_id: control.control_id,
          title: control.title,
          description: control.description,
          category: control.category,
          risk_level: control.risk_level,
          status: control.status,
          implementation_date: control.implementation_date,
          last_review_date: control.last_review_date,
          next_review_date: control.next_review_date,
          responsible_person: control.responsible_person,
          evidence: control.evidence,
          notes: control.notes,
          metadata: control.metadata,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;

    } catch (error) {
      console.error('Erreur création contrôle conformité:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un contrôle de conformité
   */
  async updateComplianceControl(
    controlId: string,
    updates: Partial<ComplianceControl>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('ComplianceControl')
        .update({
          ...updates,
          last_review_date: new Date().toISOString()
        })
        .eq('id', controlId);

      if (error) throw error;

    } catch (error) {
      console.error('Erreur mise à jour contrôle conformité:', error);
      throw error;
    }
  }

  /**
   * Obtenir les contrôles par standard
   */
  async getComplianceControls(standard: ComplianceStandard): Promise<ComplianceControl[]> {
    try {
      const { data, error } = await supabase
        .from('ComplianceControl')
        .select('*')
        .eq('standard', standard)
        .order('control_id', { ascending: true });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Erreur récupération contrôles conformité:', error);
      return [];
    }
  }

  /**
   * Créer un rapport de conformité
   */
  async generateComplianceReport(
    standard: ComplianceStandard,
    periodStart: string,
    periodEnd: string
  ): Promise<ComplianceReport> {
    try {
      const controls = await this.getComplianceControls(standard);
      
      const findings = {
        compliant: controls.filter(c => c.status === ComplianceStatus.COMPLIANT).length,
        non_compliant: controls.filter(c => c.status === ComplianceStatus.NON_COMPLIANT).length,
        in_progress: controls.filter(c => c.status === ComplianceStatus.IN_PROGRESS).length,
        not_applicable: controls.filter(c => c.status === ComplianceStatus.NOT_APPLICABLE).length
      };

      const complianceScore = Math.round(
        (findings.compliant / controls.length) * 100
      );

      const recommendations = this.generateRecommendations(controls);

      const report: ComplianceReport = {
        id: crypto.randomUUID(),
        standard,
        report_type: 'assessment',
        period_start: periodStart,
        period_end: periodEnd,
        overall_status: complianceScore >= 80 ? ComplianceStatus.COMPLIANT : 
                       complianceScore >= 60 ? ComplianceStatus.IN_PROGRESS : 
                       ComplianceStatus.NON_COMPLIANT,
        compliance_score: complianceScore,
        findings,
        recommendations,
        audit_date: new Date().toISOString(),
        next_audit_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      };

      // Sauvegarder le rapport
      await supabase
        .from('ComplianceReport')
        .insert(report);

      return report;

    } catch (error) {
      console.error('Erreur génération rapport conformité:', error);
      throw error;
    }
  }

  /**
   * Générer des recommandations basées sur les contrôles
   */
  private generateRecommendations(controls: ComplianceControl[]): string[] {
    const recommendations: string[] = [];

    const nonCompliantControls = controls.filter(c => c.status === ComplianceStatus.NON_COMPLIANT);
    const highRiskControls = controls.filter(c => c.risk_level === RiskLevel.HIGH);

    if (nonCompliantControls.length > 0) {
      recommendations.push(
        `Prioriser la mise en conformité de ${nonCompliantControls.length} contrôles non conformes`
      );
    }

    const highRiskNonCompliant = highRiskControls.filter(c => c.status === ComplianceStatus.NON_COMPLIANT);
    if (highRiskNonCompliant.length > 0) {
      recommendations.push(
        `Traiter en urgence ${highRiskNonCompliant.length} contrôles à haut risque non conformes`
      );
    }

    const overdueReviews = controls.filter(c => 
      c.next_review_date && new Date(c.next_review_date) < new Date()
    );
    if (overdueReviews.length > 0) {
      recommendations.push(
        `Effectuer ${overdueReviews.length} revues de contrôles en retard`
      );
    }

    return recommendations;
  }

  /**
   * Enregistrer un incident de sécurité
   */
  async recordSecurityIncident(incident: Partial<SecurityIncident>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('SecurityIncident')
        .insert({
          id: crypto.randomUUID(),
          title: incident.title,
          description: incident.description,
          severity: incident.severity,
          incident_type: incident.incident_type,
          affected_systems: incident.affected_systems,
          affected_users: incident.affected_users,
          detected_at: incident.detected_at,
          status: incident.status || 'open',
          root_cause: incident.root_cause,
          remediation_actions: incident.remediation_actions,
          lessons_learned: incident.lessons_learned,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;

    } catch (error) {
      console.error('Erreur enregistrement incident sécurité:', error);
      throw error;
    }
  }

  /**
   * Traiter une demande RGPD
   */
  async processDataSubjectRequest(request: Partial<DataSubjectRequest>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('DataSubjectRequest')
        .insert({
          id: crypto.randomUUID(),
          subject_id: request.subject_id,
          request_type: request.request_type,
          description: request.description,
          status: request.status || 'pending',
          submitted_at: request.submitted_at || new Date().toISOString(),
          response_data: request.response_data,
          notes: request.notes
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;

    } catch (error) {
      console.error('Erreur traitement demande RGPD:', error);
      throw error;
    }
  }

  /**
   * Enregistrer un audit log
   */
  async logAuditEvent(
    userId: string | undefined,
    action: string,
    resourceType: string,
    resourceId: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    details: any,
    complianceImpact?: ComplianceStandard[]
  ): Promise<void> {
    try {
      await supabase
        .from('AuditLog')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          ip_address: ipAddress,
          user_agent: userAgent,
          timestamp: new Date().toISOString(),
          success,
          details,
          compliance_impact: complianceImpact
        });

    } catch (error) {
      console.error('Erreur enregistrement audit log:', error);
    }
  }

  /**
   * Obtenir les statistiques de conformité
   */
  async getComplianceStats(): Promise<any> {
    try {
      const { data: controls, error } = await supabase
        .from('ComplianceControl')
        .select('standard, status, risk_level');

      if (error) throw error;

      const stats = {
        total_controls: controls?.length || 0,
        by_standard: {} as any,
        by_status: {} as any,
        by_risk: {} as any
      };

      for (const control of controls || []) {
        // Par standard
        if (!stats.by_standard[control.standard]) {
          stats.by_standard[control.standard] = { total: 0, compliant: 0 };
        }
        stats.by_standard[control.standard].total++;
        if (control.status === ComplianceStatus.COMPLIANT) {
          stats.by_standard[control.standard].compliant++;
        }

        // Par statut
        stats.by_status[control.status] = (stats.by_status[control.status] || 0) + 1;

        // Par niveau de risque
        stats.by_risk[control.risk_level] = (stats.by_risk[control.risk_level] || 0) + 1;
      }

      return stats;

    } catch (error) {
      console.error('Erreur calcul statistiques conformité:', error);
      return null;
    }
  }
}

export default ComplianceService; 