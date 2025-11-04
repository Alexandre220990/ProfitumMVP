/**
 * DossierTimelineService
 * Service pour gérer la timeline des événements d'un dossier
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TimelineEvent {
  id?: string;
  dossier_id: string;
  date?: Date | string;
  type: 'document' | 'notification' | 'status_change' | 'comment' | 'rdv' | 'expert_action' | 'client_action' | 'admin_action' | 'system_action';
  actor_type: 'client' | 'expert' | 'admin' | 'system' | 'apporteur';
  actor_id?: string;
  actor_name: string;
  title: string;
  description?: string;
  metadata?: any;
  icon?: string;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
  action_url?: string;
}

export class DossierTimelineService {
  
  /**
   * Ajouter un événement à la timeline
   */
  static async addEvent(event: TimelineEvent): Promise<{ success: boolean; event_id?: string }> {
    try {
      const { data, error } = await supabase
        .from('dossier_timeline')
        .insert({
          dossier_id: event.dossier_id,
          date: event.date || new Date().toISOString(),
          type: event.type,
          actor_type: event.actor_type,
          actor_id: event.actor_id || null,
          actor_name: event.actor_name,
          title: event.title,
          description: event.description || null,
          metadata: event.metadata || null,
          icon: event.icon || null,
          color: event.color || 'blue',
          action_url: event.action_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Erreur ajout événement timeline:', error);
        return { success: false };
      }

      console.log(`✅ Événement timeline ajouté: ${event.title}`);
      return { success: true, event_id: data.id };

    } catch (error) {
      console.error('❌ Erreur addEvent:', error);
      return { success: false };
    }
  }

  /**
   * Récupérer la timeline d'un dossier
   */
  static async getTimeline(
    dossier_id: string,
    options?: {
      limit?: number;
      offset?: number;
      type?: string;
      actor_type?: string;
    }
  ): Promise<{ success: boolean; events?: TimelineEvent[]; total?: number }> {
    try {
      let query = supabase
        .from('dossier_timeline')
        .select('*', { count: 'exact' })
        .eq('dossier_id', dossier_id)
        .order('date', { ascending: false });

      // Filtres optionnels
      if (options?.type) {
        query = query.eq('type', options.type);
      }

      if (options?.actor_type) {
        query = query.eq('actor_type', options.actor_type);
      }

      // Pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Erreur récupération timeline:', error);
        return { success: false };
      }

      return {
        success: true,
        events: data || [],
        total: count || 0
      };

    } catch (error) {
      console.error('❌ Erreur getTimeline:', error);
      return { success: false };
    }
  }

  /**
   * Mettre à jour un événement
   */
  static async updateEvent(
    event_id: string,
    updates: Partial<TimelineEvent>
  ): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('dossier_timeline')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', event_id);

      if (error) {
        console.error('❌ Erreur mise à jour événement:', error);
        return { success: false };
      }

      console.log(`✅ Événement timeline mis à jour: ${event_id}`);
      return { success: true };

    } catch (error) {
      console.error('❌ Erreur updateEvent:', error);
      return { success: false };
    }
  }

  /**
   * Supprimer un événement (admin uniquement)
   */
  static async deleteEvent(event_id: string): Promise<{ success: boolean }> {
    try {
      const { error } = await supabase
        .from('dossier_timeline')
        .delete()
        .eq('id', event_id);

      if (error) {
        console.error('❌ Erreur suppression événement:', error);
        return { success: false };
      }

      console.log(`✅ Événement timeline supprimé: ${event_id}`);
      return { success: true };

    } catch (error) {
      console.error('❌ Erreur deleteEvent:', error);
      return { success: false };
    }
  }

  // ================================================================
  // MÉTHODES HELPER POUR LES ÉVÉNEMENTS COURANTS
  // ================================================================

  /**
   * Événement : Dossier créé
   */
  static async dossierCree(data: {
    dossier_id: string;
    client_name: string;
    product_type: string;
    montant?: number;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'status_change',
      actor_type: 'client',
      actor_name: data.client_name,
      title: '🆕 Dossier créé',
      description: `Simulation ${data.product_type}${data.montant ? ` - ${data.montant.toLocaleString('fr-FR')} €` : ''}`,
      icon: '🆕',
      color: 'blue'
    });
  }

  /**
   * Événement : Documents pré-éligibilité uploadés
   */
  static async documentsPreEligibiliteUploades(data: {
    dossier_id: string;
    client_name: string;
    documents_count: number;
    documents?: string[];
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'document',
      actor_type: 'client',
      actor_name: data.client_name,
      title: '📤 Documents de pré-éligibilité soumis',
      description: `${data.documents_count} documents uploadés${data.documents ? '\n' + data.documents.map(d => `• ${d}`).join('\n') : ''}`,
      metadata: { documents: data.documents },
      icon: '📤',
      color: 'blue'
    });
  }

  /**
   * Événement : Éligibilité validée par admin
   */
  static async eligibiliteValidee(data: {
    dossier_id: string;
    admin_name: string;
    notes?: string;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'admin_action',
      actor_type: 'admin',
      actor_name: data.admin_name,
      title: '✅ Pré-éligibilité validée',
      description: `Admin - Dossier éligible${data.notes ? '\nNote: ' + data.notes : ''}`,
      metadata: { notes: data.notes },
      icon: '✅',
      color: 'green'
    });
  }

  /**
   * Événement : Éligibilité refusée par admin
   */
  static async eligibiliteRefusee(data: {
    dossier_id: string;
    admin_name: string;
    reason: string;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'admin_action',
      actor_type: 'admin',
      actor_name: data.admin_name,
      title: '❌ Pré-éligibilité refusée',
      description: `Admin - ${data.reason}`,
      metadata: { reason: data.reason },
      icon: '❌',
      color: 'red'
    });
  }

  /**
   * Événement : Expert sélectionné par client
   */
  static async expertSelectionne(data: {
    dossier_id: string;
    client_name: string;
    expert_name: string;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'client_action',
      actor_type: 'client',
      actor_name: data.client_name,
      title: '👤 Expert sélectionné',
      description: `${data.expert_name} proposé`,
      metadata: { expert_name: data.expert_name },
      icon: '👤',
      color: 'blue'
    });
  }

  /**
   * Événement : Expert accepte le dossier
   */
  static async expertAccepte(data: {
    dossier_id: string;
    expert_name: string;
    notes?: string;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: data.expert_name,
      title: '✅ Expert a accepté le dossier',
      description: `${data.expert_name} - Dossier pris en charge${data.notes ? '\nNote: ' + data.notes : ''}`,
      metadata: { notes: data.notes },
      icon: '✅',
      color: 'green'
    });
  }

  /**
   * Événement : Expert refuse le dossier
   */
  static async expertRefuse(data: {
    dossier_id: string;
    expert_name: string;
    reason: string;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: data.expert_name,
      title: '❌ Expert a refusé le dossier',
      description: `${data.expert_name} - Non disponible\nRaison: ${data.reason}`,
      metadata: { reason: data.reason },
      icon: '❌',
      color: 'orange'
    });
  }

  /**
   * Événement : Documents complémentaires demandés
   */
  static async documentsComplementairesDemandes(data: {
    dossier_id: string;
    expert_name: string;
    documents_count: number;
    documents: string[];
    message?: string;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: data.expert_name,
      title: '📋 Documents complémentaires demandés',
      description: `Expert ${data.expert_name} - ${data.documents_count} documents requis\n${data.documents.map(d => `• ${d}`).join('\n')}${data.message ? '\nMessage: ' + data.message : ''}`,
      metadata: { documents: data.documents, message: data.message },
      icon: '📋',
      color: 'orange'
    });
  }

  /**
   * Événement : Documents complémentaires envoyés
   */
  static async documentsComplementairesEnvoyes(data: {
    dossier_id: string;
    client_name: string;
    documents_count: number;
    documents?: string[];
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'document',
      actor_type: 'client',
      actor_name: data.client_name,
      title: '📤 Documents complémentaires envoyés',
      description: `Client - ${data.documents_count}/${data.documents_count} documents uploadés${data.documents ? '\n' + data.documents.map(d => `• ${d}`).join('\n') : ''}`,
      metadata: { documents: data.documents },
      icon: '📤',
      color: 'blue'
    });
  }

  /**
   * Événement : Audit démarré
   */
  static async auditDemarre(data: {
    dossier_id: string;
    expert_name: string;
    documents_complementaires: boolean;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: data.expert_name,
      title: '🔍 Audit démarré',
      description: `Expert ${data.expert_name} - ${data.documents_complementaires ? 'Analyse en cours' : 'Aucun document complémentaire requis'}`,
      metadata: { documents_complementaires: data.documents_complementaires },
      icon: '🔍',
      color: 'purple'
    });
  }

  /**
   * Événement : Audit terminé
   */
  static async auditTermine(data: {
    dossier_id: string;
    expert_name: string;
    montant_final: number;
    rapport_url?: string;
    notes?: string;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: data.expert_name,
      title: '✅ Audit terminé',
      description: `Expert ${data.expert_name} - Montant final : ${data.montant_final.toLocaleString('fr-FR')} €${data.notes ? '\nNote: ' + data.notes : ''}${data.rapport_url ? '\n[📎 Voir rapport]' : ''}`,
      metadata: { montant_final: data.montant_final, rapport_url: data.rapport_url, notes: data.notes },
      icon: '✅',
      color: 'green',
      action_url: data.rapport_url
    });
  }

  /**
   * Événement : Audit accepté par client
   */
  static async auditAccepte(data: {
    dossier_id: string;
    client_name: string;
    montant_final: number;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'client_action',
      actor_type: 'client',
      actor_name: data.client_name,
      title: '✅ Audit accepté par le client',
      description: `Client - Lancement de la production\nMontant validé : ${data.montant_final.toLocaleString('fr-FR')} €`,
      metadata: { montant_final: data.montant_final },
      icon: '✅',
      color: 'green'
    });
  }

  /**
   * Événement : Audit refusé par client
   */
  static async auditRefuse(data: {
    dossier_id: string;
    client_name: string;
    reason: string;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'client_action',
      actor_type: 'client',
      actor_name: data.client_name,
      title: '❌ Audit refusé par le client',
      description: `Client - Audit non validé\nRaison: ${data.reason}`,
      metadata: { reason: data.reason },
      icon: '❌',
      color: 'red'
    });
  }

  /**
   * Événement : Demande en préparation
   */
  static async demandeEnPreparation(data: {
    dossier_id: string;
    expert_name: string;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: data.expert_name,
      title: '📝 Demande en cours de préparation',
      description: `Expert ${data.expert_name} - Finalisation du dossier administratif`,
      icon: '📝',
      color: 'orange'
    });
  }

  /**
   * Événement : Demande envoyée
   */
  static async demandeEnvoyee(data: {
    dossier_id: string;
    expert_name: string;
    montant: number;
    reference: string;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: data.expert_name,
      title: '📤 Demande de remboursement envoyée',
      description: `Expert ${data.expert_name} - Soumise à l'administration\nRéférence: ${data.reference}\nMontant: ${data.montant.toLocaleString('fr-FR')} €`,
      metadata: { reference: data.reference, montant: data.montant },
      icon: '📤',
      color: 'blue'
    });
  }

  /**
   * Événement : Remboursement obtenu
   */
  static async remboursementObtenu(data: {
    dossier_id: string;
    expert_name: string;
    montant: number;
    reference: string;
    date_remboursement: string;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'status_change',
      actor_type: 'expert',
      actor_name: data.expert_name,
      title: '🎉 Remboursement obtenu',
      description: `Expert ${data.expert_name} - Dossier terminé avec succès\nMontant: ${data.montant.toLocaleString('fr-FR')} €\nRéférence: ${data.reference}\nDate: ${data.date_remboursement}`,
      metadata: { montant: data.montant, reference: data.reference, date: data.date_remboursement },
      icon: '🎉',
      color: 'green'
    });
  }

  /**
   * Événement : Documents validés par l'expert
   */
  static async documentsValides(data: {
    dossier_id: string;
    expert_name: string;
    validated_count: number;
    rejected_count: number;
    total_count: number;
  }): Promise<void> {
    console.log('📋 DossierTimelineService.documentsValides appelé avec:', data);
    
    const parts = [];
    
    if (data.validated_count > 0) {
      parts.push(`${data.validated_count} document${data.validated_count > 1 ? 's validés' : ' validé'}`);
    }
    
    if (data.rejected_count > 0) {
      parts.push(`${data.rejected_count} rejeté${data.rejected_count > 1 ? 's' : ''}`);
    }

    const description = parts.length > 0 
      ? parts.join(', ') 
      : `${data.total_count} document${data.total_count > 1 ? 's' : ''} traité${data.total_count > 1 ? 's' : ''}`;

    console.log('📋 Description générée:', description);

    const result = await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: data.expert_name,
      title: '📋 Documents validés',
      description: `Expert ${data.expert_name} - ${description}`,
      metadata: {
        validated_count: data.validated_count,
        rejected_count: data.rejected_count,
        total_count: data.total_count
      },
      icon: '📋',
      color: 'green'
    });

    console.log('📋 Résultat addEvent:', result);
  }

  /**
   * Événement : Document rejeté par l'expert
   */
  static async documentRejete(data: {
    dossier_id: string;
    document_name: string;
    rejection_reason: string;
    expert_id: string;
  }): Promise<void> {
    // Récupérer le nom de l'expert
    let expertName = 'Expert';
    try {
      const { data: expertData } = await supabase
        .from('Expert')
        .select('name')
        .eq('id', data.expert_id)
        .single();
      
      if (expertData?.name) {
        expertName = expertData.name;
      }
    } catch (error) {
      console.error('⚠️ Erreur récupération nom expert:', error);
    }

    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_id: data.expert_id,
      actor_name: expertName,
      title: '❌ Document rejeté',
      description: `Expert ${expertName} a rejeté le document "${data.document_name}"\nRaison : ${data.rejection_reason}`,
      metadata: {
        document_name: data.document_name,
        rejection_reason: data.rejection_reason,
        expert_id: data.expert_id
      },
      icon: '❌',
      color: 'red'
    });
  }
}

