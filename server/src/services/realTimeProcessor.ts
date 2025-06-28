import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { DecisionEngine, Answer, ProductEligibility } from './decisionEngine';

export interface EligibilityChange {
  simulationId: string;
  productId: string;
  previousScore: number;
  newScore: number;
  timestamp: Date;
}

export class RealTimeProcessor {
  private supabase;
  private decisionEngine: DecisionEngine;
  private processingQueue: Map<string, Promise<void>>;

  constructor() {
    this.supabase = createClient<Database>(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_ANON_KEY || ''
    );
    this.decisionEngine = new DecisionEngine();
    this.processingQueue = new Map();
  }

  // Traite une nouvelle réponse
  public async processAnswer(
    simulationId: string,
    answer: Answer
  ): Promise<void> {
    try {
      // Vérifier si une simulation est déjà en cours de traitement
      if (this.processingQueue.has(simulationId)) {
        await this.processingQueue.get(simulationId);
      }

      // Créer une nouvelle promesse de traitement
      const processingPromise = this.processAnswerInternal(simulationId, answer);
      this.processingQueue.set(simulationId, processingPromise);

      // Attendre la fin du traitement
      await processingPromise;
    } finally {
      // Nettoyer la file d'attente
      this.processingQueue.delete(simulationId);
    }
  }

  // Traitement interne d'une réponse
  private async processAnswerInternal(
    simulationId: string,
    answer: Answer
  ): Promise<void> {
    try {
      // Mettre à jour le statut de traitement
      await this.supabase
        .from('chatbotsimulation')
        .update({
          processing_status: 'processing',
          last_processed_at: new Date().toISOString()
        })
        .eq('id', simulationId);

      // Récupérer toutes les réponses existantes
      const { data: existingAnswers, error: answersError } = await this.supabase
        .from('Reponse')
        .select('*')
        .eq('simulationId', simulationId);

      if (answersError) {
        throw new Error('Erreur lors de la récupération des réponses existantes');
      }

      // Ajouter la nouvelle réponse
      const allAnswers: Answer[] = [
        ...(existingAnswers || []),
        answer
      ];

      // Évaluer l'éligibilité
      const eligibleProducts = await this.decisionEngine.evaluateEligibility(
        simulationId,
        allAnswers
      );

      // Notifier les changements
      await this.notifyChanges(simulationId, eligibleProducts);

    } catch (error) {
      console.error('Erreur lors du traitement de la réponse:', error);
      
      // Mettre à jour le statut en cas d'erreur
      await this.supabase
        .from('chatbotsimulation')
        .update({
          processing_status: 'error',
          last_processed_at: new Date().toISOString()
        })
        .eq('id', simulationId);

      throw error;
    }
  }

  // Met à jour l'éligibilité pour une simulation
  public async updateEligibility(simulationId: string): Promise<void> {
    try {
      // Récupérer toutes les réponses
      const { data: answers, error: answersError } = await this.supabase
        .from('Reponse')
        .select('*')
        .eq('simulationId', simulationId);

      if (answersError) {
        throw new Error('Erreur lors de la récupération des réponses');
      }

      // Évaluer l'éligibilité
      const eligibleProducts = await this.decisionEngine.evaluateEligibility(
        simulationId,
        answers || []
      );

      // Notifier les changements
      await this.notifyChanges(simulationId, eligibleProducts);

    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'éligibilité:', error);
      throw error;
    }
  }

  // Notifie les changements d'éligibilité
  private async notifyChanges(
    simulationId: string,
    newEligibility: ProductEligibility[]
  ): Promise<void> {
    try {
      // Récupérer l'éligibilité précédente
      const { data: simulation, error: simError } = await this.supabase
        .from('chatbotsimulation')
        .select('eligible_products')
        .eq('id', simulationId)
        .single();

      if (simError) {
        throw new Error('Erreur lors de la récupération de la simulation');
      }

      const previousEligibility = simulation.eligible_products || [];

      // Identifier les changements
      const changes: EligibilityChange[] = [];

      for (const newElig of newEligibility) {
        const prevElig = previousEligibility.find(
          (p: ProductEligibility) => p.productId === newElig.productId
        );

        if (!prevElig || prevElig.score !== newElig.score) {
          changes.push({
            simulationId,
            productId: newElig.productId,
            previousScore: prevElig?.score || 0,
            newScore: newElig.score,
            timestamp: new Date()
          });
        }
      }

      // Enregistrer les changements
      if (changes.length > 0) {
        await this.supabase
          .from('EligibilityChanges')
          .insert(changes);

        // Émettre un événement pour les changements
        await this.supabase
          .from('chatbotsimulation')
          .update({
            eligible_products: newEligibility,
            processing_status: 'completed',
            last_processed_at: new Date().toISOString()
          })
          .eq('id', simulationId);
      }

    } catch (error) {
      console.error('Erreur lors de la notification des changements:', error);
      throw error;
    }
  }
} 