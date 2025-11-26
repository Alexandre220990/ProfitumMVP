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
   * Récupérer la timeline d'un dossier (inclut les commentaires DossierComment)
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
      // Récupérer les événements de la timeline
      let timelineQuery = supabase
        .from('dossier_timeline')
        .select('*')
        .eq('dossier_id', dossier_id);

      if (options?.type) {
        timelineQuery = timelineQuery.eq('type', options.type);
      }

      if (options?.actor_type) {
        timelineQuery = timelineQuery.eq('actor_type', options.actor_type);
      }

      const { data: timelineEvents, error: timelineError } = await timelineQuery;

      if (timelineError) {
        console.error('❌ Erreur récupération timeline:', timelineError);
      }

      // Récupérer les commentaires DossierComment
      let commentsQuery = supabase
        .from('DossierComment')
        .select('*')
        .eq('dossier_id', dossier_id)
        .is('deleted_at', null)
        .eq('comment_type', 'manual');

      if (options?.actor_type) {
        commentsQuery = commentsQuery.eq('created_by_type', options.actor_type);
      }

      const { data: comments, error: commentsError } = await commentsQuery;

      if (commentsError) {
        console.error('❌ Erreur récupération commentaires:', commentsError);
      }

      // Fusionner et convertir les commentaires en événements timeline
      const commentEvents: TimelineEvent[] = (comments || []).map((comment: any) => {
        // Déterminer le type d'acteur
        let actorType: 'client' | 'expert' | 'admin' | 'system' | 'apporteur' = 'system';
        if (comment.created_by_type === 'admin') actorType = 'admin';
        else if (comment.created_by_type === 'expert') actorType = 'expert';
        else if (comment.created_by_type === 'apporteur') actorType = 'apporteur';

        // Extraire le nom de l'acteur depuis le contenu ou utiliser le type
        const contentMatch = comment.content.match(/^Commentaire (Admin|Expert|Apporteur) : (.+)$/);
        const actorName = contentMatch ? contentMatch[1] : (comment.created_by_type || 'Système');
        const description = contentMatch ? contentMatch[2] : comment.content;

        return {
          id: comment.id, // Utiliser l'ID du commentaire comme ID de l'événement
          dossier_id: comment.dossier_id,
          date: comment.created_at,
          type: 'comment',
          actor_type: actorType,
          actor_id: comment.created_by,
          actor_name: actorName,
          title: `Commentaire ${actorName}`,
          description: description,
          icon: '💬',
          color: actorType === 'admin' ? 'red' : actorType === 'expert' ? 'purple' : 'green',
          metadata: { 
            comment_id: comment.id,
            timeline_event_id: comment.metadata?.timeline_event_id 
          }
        };
      });

      // Récupérer les RDV liés au dossier
      const rdvEvents: TimelineEvent[] = [];
      try {
        let rdvQuery = supabase
          .from('RDV')
          .select('*')
          .or(`dossier_id.eq.${dossier_id},metadata->>dossier_id.eq.${dossier_id}`);

        if (options?.type && options.type === 'rdv') {
          // Si on filtre par type rdv, on garde la requête
        } else if (options?.type && options.type !== 'rdv') {
          // Si on filtre par un autre type, on exclut les RDV
          rdvQuery = rdvQuery.limit(0);
        }

        const { data: rdvs, error: rdvError } = await rdvQuery;

        if (!rdvError && rdvs) {
          rdvs.forEach((rdv: any) => {
            // Vérifier que le RDV est bien lié à ce dossier
            if (rdv.dossier_id === dossier_id || rdv.metadata?.dossier_id === dossier_id) {
              const rdvDate = new Date(`${rdv.scheduled_date}T${rdv.scheduled_time}`);
              rdvEvents.push({
                id: `rdv-${rdv.id}`,
                dossier_id,
                date: rdvDate.toISOString(),
                type: 'rdv',
                actor_type: 'admin', // Par défaut, peut être ajusté selon created_by
                actor_id: rdv.created_by || null,
                actor_name: 'Système',
                title: `Rendez-vous : ${rdv.title || 'Sans titre'}`,
                description: rdv.description || `Rendez-vous prévu le ${rdvDate.toLocaleDateString('fr-FR')} à ${rdvDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}${rdv.location ? ` - ${rdv.location}` : ''}`,
                metadata: {
                  rdv_id: rdv.id,
                  client_id: rdv.client_id,
                  scheduled_date: rdv.scheduled_date,
                  scheduled_time: rdv.scheduled_time,
                  duration_minutes: rdv.duration_minutes,
                  location: rdv.location,
                  meeting_url: rdv.meeting_url,
                  meeting_type: rdv.meeting_type,
                  ...(rdv.metadata || {})
                },
                icon: '📅',
                color: 'blue',
                action_url: `${process.env.FRONTEND_URL || ''}/admin/agenda-admin?event=${rdv.id}`
              });
            }
          });
        }
      } catch (rdvErr) {
        console.warn('⚠️ Erreur récupération RDV pour timeline dossier:', rdvErr);
      }

      // Fusionner tous les événements
      const allEvents = [
        ...(timelineEvents || []).map((e: any) => ({
          ...e,
          date: e.date || e.created_at
        })),
        ...commentEvents,
        ...rdvEvents
      ];

      // Trier par date (plus récent en premier)
      allEvents.sort((a, b) => {
        const dateA = new Date(a.date || a.created_at || 0).getTime();
        const dateB = new Date(b.date || b.created_at || 0).getTime();
        return dateB - dateA;
      });

      // Appliquer la pagination
      let paginatedEvents = allEvents;
      if (options?.limit) {
        const offset = options.offset || 0;
        paginatedEvents = allEvents.slice(offset, offset + options.limit);
      }

      return {
        success: true,
        events: paginatedEvents,
        total: allEvents.length
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
    rapport_detaille?: string;
    notes?: string;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: data.expert_name,
      title: '✅ Audit terminé',
      description: `Expert ${data.expert_name} - Montant final : ${data.montant_final.toLocaleString('fr-FR')} €${data.notes ? '\nNote: ' + data.notes : ''}${data.rapport_url ? '\n[📎 Voir rapport]' : ''}${data.rapport_detaille ? '\n📋 Rapport détaillé disponible' : ''}`,
      metadata: { montant_final: data.montant_final, rapport_url: data.rapport_url, rapport_detaille: data.rapport_detaille, notes: data.notes },
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

  /**
   * Événement : Document validé individuellement par l'expert
   */
  static async documentValideIndividuel(data: {
    dossier_id: string;
    document_name: string;
    expert_id: string;
    expert_name: string;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_id: data.expert_id,
      actor_name: data.expert_name,
      title: '✅ Document validé',
      description: `Expert ${data.expert_name} a validé le document "${data.document_name}"`,
      metadata: {
        document_name: data.document_name,
        expert_id: data.expert_id,
        validation_type: 'individual'
      },
      icon: '✅',
      color: 'green'
    });
  }

  /**
   * Événement : Expert assigné au dossier
   */
  static async expertAssigne(data: {
    dossier_id: string;
    expert_id: string;
    expert_name: string;
    product_name: string;
    client_name: string;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_id: data.expert_id,
      actor_name: data.expert_name,
      title: '👨‍💼 Expert assigné',
      description: `Expert ${data.expert_name} a accepté le dossier ${data.product_name} de ${data.client_name}`,
      metadata: {
        expert_id: data.expert_id,
        expert_name: data.expert_name,
        product_name: data.product_name,
        client_name: data.client_name
      },
      icon: '👨‍💼',
      color: 'blue'
    });
  }

  /**
   * Événement : Documents complémentaires demandés par l'expert
   */
  static async documentsComplementairesDemandes(data: {
    dossier_id: string;
    expert_name: string;
    validated_count: number;
    rejected_count: number;
    requested_count: number;
    requested_documents?: string[];
  }): Promise<void> {
    const parts = [];
    
    if (data.validated_count > 0) {
      parts.push(`${data.validated_count} validé${data.validated_count > 1 ? 's' : ''}`);
    }
    
    if (data.rejected_count > 0) {
      parts.push(`${data.rejected_count} rejeté${data.rejected_count > 1 ? 's' : ''}`);
    }
    
    if (data.requested_count > 0) {
      parts.push(`${data.requested_count} complémentaire${data.requested_count > 1 ? 's' : ''}`);
    }

    const description = `Expert ${data.expert_name} - ${parts.join(', ')}`;

    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: data.expert_name,
      title: '📄 Documents complémentaires demandés',
      description: description,
      metadata: {
        validated_count: data.validated_count,
        rejected_count: data.rejected_count,
        requested_count: data.requested_count,
        requested_documents: data.requested_documents || []
      },
      icon: '📄',
      color: 'orange'
    });
  }

  /**
   * Événement : Client envoie des documents complémentaires
   */
  static async documentsComplementairesUploades(data: {
    dossier_id: string;
    client_name: string;
    documents_count: number;
    documents?: string[];
  }): Promise<void> {
    const description = `Client ${data.client_name} - ${data.documents_count} document${data.documents_count > 1 ? 's uploadés' : ' uploadé'}${
      data.documents && data.documents.length > 0 
        ? '\n\n• ' + data.documents.join('\n• ') 
        : ''
    }`;

    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'document',
      actor_type: 'client',
      actor_name: data.client_name,
      title: '📤 Documents complémentaires envoyés',
      description: description,
      metadata: {
        documents_count: data.documents_count,
        documents: data.documents || [],
        is_complementary: true
      },
      icon: '📤',
      color: 'blue'
    });
  }

  static async documentsComplementairesValides(data: {
    dossier_id: string;
    expert_name: string;
    documents_count: number;
    documents?: string[];
    notes?: string;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: data.expert_name,
      title: '✅ Documents complémentaires validés',
      description: `${data.expert_name} a validé ${data.documents_count} document${data.documents_count > 1 ? 's' : ''} complémentaire${data.documents_count > 1 ? 's' : ''}.${data.notes ? '\nNote : ' + data.notes : ''}${data.documents && data.documents.length ? '\n\n• ' + data.documents.join('\n• ') : ''}`,
      metadata: {
        documents_count: data.documents_count,
        documents: data.documents || [],
        notes: data.notes || null
      },
      icon: '✅',
      color: 'green'
    });
  }

  static async documentsComplementairesRefuses(data: {
    dossier_id: string;
    expert_name: string;
    rejected_documents?: string[];
    reason?: string;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: data.expert_name,
      title: '⚠️ Documents complémentaires refusés',
      description: `${data.expert_name} a rejeté les documents complémentaires.${data.reason ? '\nMotif : ' + data.reason : ''}${data.rejected_documents && data.rejected_documents.length ? '\n\n• ' + data.rejected_documents.join('\n• ') : ''}`,
      metadata: {
        rejected_documents: data.rejected_documents || [],
        reason: data.reason || null
      },
      icon: '⚠️',
      color: 'orange'
    });
  }

  static async charteEnvoyee(data: {
    dossier_id: string;
    actor_name: string;
    message?: string;
    document_url?: string;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: data.actor_name,
      title: '📑 Charte commerciale envoyée',
      description: data.message ? data.message : `${data.actor_name} a envoyé la charte de collaboration pour signature.`,
      metadata: {
        document_url: data.document_url || null
      },
      icon: '📑',
      color: 'orange',
      action_url: data.document_url || undefined
    });
  }

  static async charteSignee(data: {
    dossier_id: string;
    client_name: string;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'client_action',
      actor_type: 'client',
      actor_name: data.client_name,
      title: '✍️ Charte commerciale signée',
      description: `${data.client_name} a signé la charte commerciale.`,
      icon: '✍️',
      color: 'green'
    });
  }

  static async implementationEnCours(data: {
    dossier_id: string;
    expert_name: string;
    organisme?: string;
    reference?: string;
    submission_date?: string;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: data.expert_name,
      title: '🛠️ Mise en œuvre en cours',
      description: `${data.expert_name} a confirmé la transmission du dossier à l'administration.${data.organisme ? `
Organisme : ${data.organisme}` : ''}${data.reference ? `
Référence : ${data.reference}` : ''}${data.submission_date ? `
Date : ${data.submission_date}` : ''}`,
      metadata: {
        organisme: data.organisme || null,
        reference: data.reference || null,
        submission_date: data.submission_date || null
      },
      icon: '🛠️',
      color: 'blue'
    });
  }

  static async implementationValidee(data: {
    dossier_id: string;
    expert_name: string;
    montant_accorde: number;
    decision: 'accepte' | 'partiel' | 'refuse';
    difference?: number;
    date_retour?: string;
  }): Promise<void> {
    const icon = data.decision === 'accepte' ? '✅' : data.decision === 'partiel' ? '⚠️' : '❌';
    const color = data.decision === 'accepte' ? 'green' : data.decision === 'partiel' ? 'orange' : 'red';

    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: data.expert_name,
      title: `${icon} Résultat de l'administration`,
      description: `${data.expert_name} a confirmé le retour de l'administration (${data.decision}). Montant accordé : ${data.montant_accorde.toLocaleString('fr-FR')} €${typeof data.difference === 'number' && data.difference !== 0 ? ` (${data.difference > 0 ? '+' : ''}${data.difference.toLocaleString('fr-FR')} € vs estimation)` : ''}${data.date_retour ? `
Date : ${data.date_retour}` : ''}`,
      metadata: {
        decision: data.decision,
        montant_accorde: data.montant_accorde,
        difference: data.difference || null,
        date_retour: data.date_retour || null
      },
      icon,
      color
    });
  }

  static async paiementDemande(data: {
    dossier_id: string;
    expert_name: string;
    montant: number;
    facture_reference?: string;
    notes?: string;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'expert_action',
      actor_type: 'expert',
      actor_name: data.expert_name,
      title: '💶 Remboursement obtenu – facture émise',
      description: `${data.expert_name} a confirmé le remboursement et émis la facture de ${data.montant.toLocaleString('fr-FR')} €.${data.facture_reference ? `
Facture : ${data.facture_reference}` : ''}${data.notes ? `
Note : ${data.notes}` : ''}`,
      metadata: {
        montant: data.montant,
        facture_reference: data.facture_reference || null,
        notes: data.notes || null
      },
      icon: '💶',
      color: 'purple'
    });
  }

  static async paiementEnCours(data: {
    dossier_id: string;
    montant: number;
    mode: 'virement' | 'en_ligne';
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'client_action',
      actor_type: 'client',
      actor_name: 'Client',
      title: '💳 Paiement en cours',
      description: `Le client a initié un paiement de ${data.montant.toLocaleString('fr-FR')} € (${data.mode === 'virement' ? 'virement bancaire' : 'paiement en ligne'}).`,
      metadata: {
        montant: data.montant,
        mode: data.mode
      },
      icon: '💳',
      color: 'blue'
    });
  }

  static async remboursementTermine(data: {
    dossier_id: string;
    montant: number;
    paiement_date?: string;
  }): Promise<void> {
    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'system_action',
      actor_type: 'system',
      actor_name: 'Système',
      title: '✅ Paiement confirmé – dossier clôturé',
      description: `Paiement final de ${data.montant.toLocaleString('fr-FR')} € confirmé.${data.paiement_date ? `
Date : ${data.paiement_date}` : ''}`,
      metadata: {
        montant: data.montant,
        paiement_date: data.paiement_date || null
      },
      icon: '✅',
      color: 'green'
    });
  }

  /**
   * Événement : Relance système envoyée
   */
  static async relanceSystemeEnvoyee(data: {
    dossier_id: string;
    type_relance: 'relance_1' | 'relance_2' | 'relance_3' | 'relance_critical';
    action_type: string;
    jours_attente: number;
    message: string;
    produit_nom?: string;
    client_nom?: string;
  }): Promise<void> {
    const relanceLabels = {
      'relance_1': 'Relance 1',
      'relance_2': 'Relance 2',
      'relance_3': 'Relance 3',
      'relance_critical': 'Relance critique'
    };

    const relanceLabel = relanceLabels[data.type_relance] || 'Relance système';

    await this.addEvent({
      dossier_id: data.dossier_id,
      type: 'system_action',
      actor_type: 'system',
      actor_name: 'Système',
      title: `📧 ${relanceLabel} envoyée`,
      description: `${relanceLabel} envoyée automatiquement${data.produit_nom ? ` pour ${data.produit_nom}` : ''}${data.client_nom ? ` - ${data.client_nom}` : ''}\n${data.message}\nJours d'attente : ${data.jours_attente} jour${data.jours_attente > 1 ? 's' : ''}`,
      metadata: {
        type_relance: data.type_relance,
        action_type: data.action_type,
        jours_attente: data.jours_attente,
        message: data.message,
        produit_nom: data.produit_nom || null,
        client_nom: data.client_nom || null
      },
      icon: '📧',
      color: 'gray'
    });
  }
}

