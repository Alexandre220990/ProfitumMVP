import { supabase } from '../lib/supabase';
import { config } from '../config/env';

export interface QuestionnaireQuestion {
  id: string;
  question_id: string;
  question_order: number;
  question_text: string;
  question_type: string;
  options?: any;
  validation_rules?: any;
  conditions?: any;
  produits_cibles: string[];
  phase: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionnaireResponse {
  id: string;
  session_id: string;
  question_id: string;
  response_value: any;
  created_at: string;
}

export class QuestionnaireService { /**
   * Charger toutes les questions TICPE
   */
  static async loadTICPEQuestions(): Promise<QuestionnaireQuestion[]> {
    try {
      const { data, error } = await supabase
        .from('QuestionnaireQuestion')
        .select('*')
        .contains('produits_cibles', ['TICPE'])
        .order('question_order', { ascending: true });

      if (error) {
        console.error('Erreur lors du chargement des questions TICPE: ', error);
        throw new Error('Impossible de charger les questions TICPE');
      }

      return data || [];
    } catch (error) {
      console.error('Erreur QuestionnaireService.loadTICPEQuestions: ', error);
      throw error;
    }
  }

  /**
   * Charger les questions par produit
   */
  static async loadQuestionsByProduct(product: string): Promise<QuestionnaireQuestion[]> {
    try {
      const { data, error } = await supabase
        .from('QuestionnaireQuestion')
        .select('*')
        .contains('produits_cibles', [product])
        .order('question_order', { ascending: true });

      if (error) {
        console.error(`Erreur lors du chargement des questions ${product}:`, error);
        throw new Error(`Impossible de charger les questions ${product}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erreur QuestionnaireService.loadQuestionsByProduct: ', error);
      throw error;
    }
  }

  /**
   * Charger toutes les questions du simulateur
   */
  static async loadAllQuestions(): Promise<QuestionnaireQuestion[]> {
    try {
      const { data, error } = await supabase
        .from('QuestionnaireQuestion')
        .select('*')
        .order('question_order', { ascending: true });

      if (error) {
        console.error('Erreur lors du chargement des questions: ', error);
        throw new Error('Impossible de charger les questions');
      }

      return data || [];
    } catch (error) {
      console.error('Erreur QuestionnaireService.loadAllQuestions: ', error);
      throw error;
    }
  }

  /**
   * Sauvegarder une réponse
   */
  static async saveResponse(
    sessionId: string,
    questionId: string,
    responseValue: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('QuestionnaireResponse')
        .upsert({ session_id: sessionId, question_id: questionId, response_value: responseValue }, { onConflict: 'session_id, question_id' });

      if (error) {
        console.error('Erreur lors de la sauvegarde de la réponse: ', error);
        throw new Error('Impossible de sauvegarder la réponse');
      }
    } catch (error) {
      console.error('Erreur QuestionnaireService.saveResponse: ', error);
      throw error;
    }
  }

  /**
   * Charger les réponses d'une session
   */
  static async loadSessionResponses(sessionId: string): Promise<Record<string, any>> {
    try {
      const { data, error } = await supabase
        .from('QuestionnaireResponse')
        .select('*')
        .eq('session_id', sessionId);

      if (error) {
        console.error('Erreur lors du chargement des réponses: ', error);
        throw new Error('Impossible de charger les réponses');
      }

      // Convertir en format Record<string, any>
      const responses: Record<string, any> = {};
      data?.forEach(response => {
        responses[response.question_id] = response.response_value;
      });

      return responses;
    } catch (error) {
      console.error('Erreur QuestionnaireService.loadSessionResponses: ', error);
      throw error;
    }
  }

  /**
   * Supprimer les réponses d'une session
   */
  static async clearSessionResponses(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('QuestionnaireResponse')
        .delete()
        .eq('session_id', sessionId);

      if (error) {
        console.error('Erreur lors de la suppression des réponses: ', error);
        throw new Error('Impossible de supprimer les réponses');
      }
    } catch (error) {
      console.error('Erreur QuestionnaireService.clearSessionResponses: ', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des questions TICPE
   */
  static async getTICPEStats(): Promise<{
    totalQuestions: number;
    questionsByPhase: Record<number, number>;
    requiredQuestions: number;
  }> {
    try {
      const questions = await this.loadTICPEQuestions();
      
      const questionsByPhase: Record<number, number> = {};
      let requiredQuestions = 0;

      questions.forEach(question => {
        // Compter par phase
        questionsByPhase[question.phase] = (questionsByPhase[question.phase] || 0) + 1;
        
        // Compter les questions requises
        if (question.validation_rules?.required) {
          requiredQuestions++;
        }
      });

      return { totalQuestions: questions.length, questionsByPhase, requiredQuestions };
    } catch (error) {
      console.error('Erreur QuestionnaireService.getTICPEStats: ', error);
      throw error;
    }
  }

  /**
   * Vérifier si une question est visible selon les conditions
   */
  static isQuestionVisible(
    question: QuestionnaireQuestion,
    responses: Record<string, any>
  ): boolean {
    if (!question.conditions?.depends_on) return true;

    const { question_id, answer, operator = '=' } = question.conditions.depends_on;
    const responseValue = responses[question_id];

    if (responseValue === undefined) return false;

    switch (operator) {
      case '=':
        return responseValue === answer;
      case '!=':
        return responseValue !== answer;
      case 'in':
        return Array.isArray(answer) && answer.includes(responseValue);
      case 'not_in':
        return Array.isArray(answer) && !answer.includes(responseValue);
      default:
        return responseValue === answer;
    }
  }

  /**
   * Filtrer les questions selon les réponses actuelles
   */
  static filterQuestionsByResponses(
    questions: QuestionnaireQuestion[],
    responses: Record<string, any>
  ): QuestionnaireQuestion[] {
    return questions.filter(question => 
      this.isQuestionVisible(question, responses)
    ).sort((a, b) => a.question_order - b.question_order);
  }
} 