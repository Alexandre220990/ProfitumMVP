import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

/**
 * Service de migration des sessions temporaires vers des comptes clients
 * ======================================================================
 * 
 * Ce service gère la transformation des données temporaires du simulateur
 * en véritables comptes clients avec leurs produits éligibles.
 */

export interface MigrationData {
  sessionToken: string;
  sessionId: string;
  clientData: {
    email: string;
    password: string;
    username: string;
    company_name: string;
    phone_number: string;
    address: string;
    city: string;
    postal_code: string;
    siren: string;
    // Données extraites des réponses du simulateur
    secteurActivite?: string;
    nombreEmployes?: number;
    revenuAnnuel?: number;
    ancienneteEntreprise?: number;
  };
}

export interface MigrationResult {
  success: boolean;
  clientId?: string;
  migratedProducts?: any[];
  error?: string;
  details?: {
    sessionMigrated: boolean;
    responsesMigrated: boolean;
    eligibilityMigrated: boolean;
    clientCreated: boolean;
  };
}

export class SessionMigrationService {
  
  /**
   * Migrer une session temporaire vers un compte client
   * Processus optimisé avec gestion d'erreur robuste
   */
  static async migrateSessionToClient(migrationData: MigrationData): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      details: {
        sessionMigrated: false,
        responsesMigrated: false,
        eligibilityMigrated: false,
        clientCreated: false
      }
    };

    try {
      console.log('🔄 Début de la migration session → client:', migrationData.sessionToken.substring(0, 8));

      // 1. Vérifier que la session peut être migrée
      const canMigrate = await this.canMigrateSession(migrationData.sessionId);
      if (!canMigrate) {
        result.error = 'Session non éligible à la migration (expirée ou déjà migrée)';
        return result;
      }

      // 2. Récupérer les données de session
      const sessionData = await this.getSessionData(migrationData.sessionId);
      if (!sessionData) {
        result.error = 'Session temporaire non trouvée';
        return result;
      }
      result.details!.sessionMigrated = true;

      // 3. Récupérer les réponses du simulateur
      const responses = await this.getSessionResponses(migrationData.sessionId);
      if (!responses || responses.length === 0) {
        result.error = 'Aucune réponse trouvée pour cette session';
        return result;
      }
      result.details!.responsesMigrated = true;

      // 4. Récupérer les résultats d'éligibilité
      const eligibilityResults = await this.getSessionEligibility(migrationData.sessionId);
      if (!eligibilityResults || eligibilityResults.length === 0) {
        result.error = 'Aucun résultat d\'éligibilité trouvé';
        return result;
      }
      result.details!.eligibilityMigrated = true;

      // 5. Extraire les données client des réponses
      const extractedClientData = this.extractClientDataFromResponses(responses);
      
      // 6. Créer le compte client avec données enrichies
      const clientId = await this.createClientAccount({
        ...migrationData.clientData,
        ...extractedClientData,
        session_migrated_from: migrationData.sessionToken
      });

      if (!clientId) {
        result.error = 'Échec de la création du compte client';
        return result;
      }
      result.clientId = clientId;
      result.details!.clientCreated = true;

      result.clientId = clientId;
      result.details!.clientCreated = true;

      // 6. Créer les ClientProduitEligible
      const migratedProducts = await this.createClientProduitEligibles(
        clientId,
        eligibilityResults,
        responses
      );

      if (migratedProducts) {
        result.migratedProducts = migratedProducts;
        result.details!.eligibilityMigrated = true;
      }

      // 7. Marquer la session comme migrée
      await this.markSessionAsMigrated(migrationData.sessionId, clientId);
      result.details!.sessionMigrated = true;

      // 8. Sauvegarder les réponses dans la table simulations
      await this.saveSimulationData(clientId, responses, eligibilityResults);
      result.details!.responsesMigrated = true;

      result.success = true;
      console.log('✅ Migration réussie pour le client:', clientId);

      return result;

    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      result.error = error instanceof Error ? error.message : 'Erreur inconnue';
      return result;
    }
  }

  /**
   * Récupérer les données de session temporaire
   */
  private static async getSessionData(sessionIdOrToken: string) {
    // Essayer d'abord par ID, puis par token
    let { data, error } = await supabase
      .from('TemporarySession')
      .select('*')
      .eq('id', sessionIdOrToken)
      .single();

    if (error) {
      // Si pas trouvé par ID, essayer par token
      const { data: tokenData, error: tokenError } = await supabase
        .from('TemporarySession')
        .select('*')
        .eq('session_token', sessionIdOrToken)
        .single();

      if (tokenError) {
        console.error('Erreur récupération session:', tokenError);
        return null;
      }
      data = tokenData;
    }

    return data;
  }

  /**
   * Récupérer les réponses de la session
   */
  private static async getSessionResponses(sessionIdOrToken: string) {
    // D'abord récupérer la session pour avoir l'ID
    const sessionData = await this.getSessionData(sessionIdOrToken);
    if (!sessionData) {
      return null;
    }

    const { data, error } = await supabase
      .from('TemporaryResponse')
      .select(`
        *,
        QuestionnaireQuestion (
          question_text,
          question_type,
          produits_cibles
        )
      `)
      .eq('session_id', sessionData.id);

    if (error) {
      console.error('Erreur récupération réponses:', error);
      return null;
    }

    return data;
  }

  /**
   * Récupérer les résultats d'éligibilité
   */
  private static async getSessionEligibility(sessionIdOrToken: string) {
    // D'abord récupérer la session pour avoir l'ID
    const sessionData = await this.getSessionData(sessionIdOrToken);
    if (!sessionData) {
      return null;
    }

    const { data, error } = await supabase
      .from('TemporaryEligibility')
      .select('*')
      .eq('session_id', sessionData.id);

    if (error) {
      console.error('Erreur récupération éligibilité:', error);
      return null;
    }

    return data;
  }

  /**
   * Extraire les données client des réponses du simulateur
   */
  static extractClientDataFromResponses(responses: any[]) {
    const extractedData: any = {};

    responses.forEach(response => {
      const questionText = response.QuestionnaireQuestion?.question_text?.toLowerCase() || '';
      const responseValue = response.response_value;

      // Secteur d'activité
      if (questionText.includes('secteur') || questionText.includes('activité')) {
        extractedData.secteurActivite = responseValue;
      }

      // Nombre d'employés
      if (questionText.includes('employé') || questionText.includes('salarié')) {
        if (responseValue.includes('5 à 20')) {
          extractedData.nombreEmployes = 12;
        } else if (responseValue.includes('Plus de 20')) {
          extractedData.nombreEmployes = 50;
        } else if (responseValue.includes('Moins de 5')) {
          extractedData.nombreEmployes = 3;
        }
      }

      // Revenu annuel (estimation basée sur le secteur et nombre d'employés)
      if (extractedData.secteurActivite && extractedData.nombreEmployes) {
        const revenuParEmploye = this.estimateRevenuePerEmployee(extractedData.secteurActivite);
        extractedData.revenuAnnuel = extractedData.nombreEmployes * revenuParEmploye;
      }

      // Ancienneté (estimation par défaut)
      extractedData.ancienneteEntreprise = 5; // Valeur par défaut
    });

    return extractedData;
  }

  /**
   * Estimer le revenu par employé selon le secteur
   */
  private static estimateRevenuePerEmployee(secteur: string): number {
    const estimations: Record<string, number> = {
      'transport': 80000,
      'logistique': 75000,
      'industrie': 90000,
      'commerce': 70000,
      'services': 85000,
      'immobilier': 120000,
      'agriculture': 60000,
      'construction': 80000,
      'technologie': 100000
    };

    const secteurLower = secteur.toLowerCase();
    for (const [key, value] of Object.entries(estimations)) {
      if (secteurLower.includes(key)) {
        return value;
      }
    }

    return 80000; // Valeur par défaut
  }

  /**
   * Créer le compte client
   */
  private static async createClientAccount(clientData: any): Promise<string | null> {
    try {
      // 1. Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: clientData.email,
        password: clientData.password,
        email_confirm: true,
        user_metadata: {
          username: clientData.username,
          type: 'client',
          company_name: clientData.company_name,
          siren: clientData.siren,
          phone_number: clientData.phone_number
        }
      });

      if (authError) {
        console.error('Erreur création utilisateur Auth:', authError);
        return null;
      }

      const authUserId = authData.user.id;

      // 2. Créer le client dans la table Client avec statut 'en_attente'
      const { data: clientDataResult, error: clientError } = await supabase
        .from('Client')
        .insert({
          auth_id: authUserId,
          email: clientData.email,
          name: clientData.username,
          company_name: clientData.company_name,
          phone_number: clientData.phone_number,
          address: clientData.address,
          city: clientData.city,
          postal_code: clientData.postal_code,
          siren: clientData.siren,
          secteurActivite: clientData.secteurActivite,
          nombreEmployes: clientData.nombreEmployes,
          revenuAnnuel: clientData.revenuAnnuel,
          ancienneteEntreprise: clientData.ancienneteEntreprise,
          type: 'client',
          statut: 'en_attente', // Statut spécial pour les clients en cours d'inscription
          derniereConnexion: new Date().toISOString(),
          dateCreation: new Date().toISOString(),
          metadata: {
            source: 'simulator_migration',
            session_token: clientData.sessionToken || null,
            migration_date: new Date().toISOString()
          }
        })
        .select('id')
        .single();

      if (clientError) {
        console.error('Erreur création client:', clientError);
        return null;
      }

      return clientDataResult.id;

    } catch (error) {
      console.error('Erreur création compte client:', error);
      return null;
    }
  }

  /**
   * Créer les ClientProduitEligible
   */
  private static async createClientProduitEligibles(
    clientId: string,
    eligibilityResults: any[],
    responses: any[]
  ): Promise<any[] | null> {
    try {
      const clientProduitEligibles = [];

      for (const result of eligibilityResults) {
        // Récupérer le produit éligible correspondant
        const { data: produit, error: produitError } = await supabase
          .from('ProduitEligible')
          .select('*')
          .eq('nom', result.produit_id)
          .single();

        if (produitError || !produit) {
          console.warn(`Produit non trouvé: ${result.produit_id}`);
          continue;
        }

        // Créer le ClientProduitEligible
        const { data: cpe, error: cpeError } = await supabase
          .from('ClientProduitEligible')
          .insert({
            clientId: clientId,
            produitId: produit.id,
            statut: result.eligibility_score >= 70 ? 'eligible' : 'en_cours',
            tauxFinal: result.eligibility_score / 100,
            montantFinal: result.estimated_savings,
            dureeFinale: 12, // Durée par défaut
            metadata: {
              source: 'simulator_migration',
              eligibility_score: result.eligibility_score,
              confidence_level: result.confidence_level,
              recommendations: result.recommendations,
              session_responses: responses.length
            },
            notes: `Migration depuis simulateur - Score: ${result.eligibility_score}%`,
            priorite: result.eligibility_score >= 70 ? 1 : 2,
            dateEligibilite: new Date().toISOString()
          })
          .select('*')
          .single();

        if (cpeError) {
          console.error('Erreur création ClientProduitEligible:', cpeError);
          continue;
        }

        // 🔧 GÉNÉRATION AUTOMATIQUE DES ÉTAPES
        try {
          const { DossierStepGenerator } = require('./dossierStepGenerator');
          const stepsGenerated = await DossierStepGenerator.generateStepsForDossier(cpe.id);
          
          if (stepsGenerated) {
            console.log(`✅ Étapes générées automatiquement pour le dossier migré: ${cpe.id}`);
          } else {
            console.warn(`⚠️ Échec de la génération automatique des étapes pour le dossier migré: ${cpe.id}`);
          }
        } catch (stepError) {
          console.error('❌ Erreur génération automatique des étapes:', stepError);
          // Ne pas faire échouer la migration si la génération d'étapes échoue
        }

        clientProduitEligibles.push(cpe);
      }

      return clientProduitEligibles;

    } catch (error) {
      console.error('Erreur création ClientProduitEligible:', error);
      return null;
    }
  }

  /**
   * Marquer la session comme migrée
   */
  private static async markSessionAsMigrated(sessionIdOrToken: string, clientId: string) {
    // D'abord récupérer la session pour avoir l'ID
    const sessionData = await this.getSessionData(sessionIdOrToken);
    if (!sessionData) {
      console.error('Session non trouvée pour marquage migrée');
      return;
    }

    const { error } = await supabase
      .from('TemporarySession')
      .update({
        migrated_to_account: true,
        migrated_at: new Date().toISOString(),
        client_id: clientId
      })
      .eq('id', sessionData.id);

    if (error) {
      console.error('Erreur marquage session migrée:', error);
    }
  }

  /**
   * Sauvegarder les données de simulation
   */
  private static async saveSimulationData(
    clientId: string,
    responses: any[],
    eligibilityResults: any[]
  ) {
    try {
      // Créer une simulation
      const { data: simulation, error: simulationError } = await supabase
        .from('Simulation')
        .insert({
          clientId: clientId,
          answers: responses.map(r => ({
            question_id: r.question_id,
            question_text: r.QuestionnaireQuestion?.question_text,
            response_value: r.response_value,
            question_type: r.QuestionnaireQuestion?.question_type
          })),
          results: eligibilityResults,
          source: 'simulator_migration',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (simulationError) {
        console.error('Erreur sauvegarde simulation:', simulationError);
      } else {
        console.log('✅ Simulation sauvegardée:', simulation.id);
      }

    } catch (error) {
      console.error('Erreur sauvegarde données simulation:', error);
    }
  }

  /**
   * Vérifier si une session peut être migrée
   */
  static async canMigrateSession(sessionIdOrToken: string): Promise<boolean> {
    try {
      // D'abord récupérer la session pour avoir l'ID
      const sessionData = await this.getSessionData(sessionIdOrToken);
      if (!sessionData) {
        return false;
      }

      return sessionData.completed && !sessionData.migrated_to_account;
    } catch (error) {
      console.error('Erreur vérification migration:', error);
      return false;
    }
  }

  /**
   * Récupérer les statistiques de migration
   */
  static async getMigrationStats() {
    try {
      const { data: sessions, error } = await supabase
        .from('TemporarySession')
        .select('migrated_to_account, completed, created_at');

      if (error) {
        console.error('Erreur récupération stats:', error);
        return null;
      }

      const total = sessions.length;
      const completed = sessions.filter(s => s.completed).length;
      const migrated = sessions.filter(s => s.migrated_to_account).length;
      const conversionRate = total > 0 ? (migrated / total) * 100 : 0;

      return {
        total_sessions: total,
        completed_sessions: completed,
        migrated_sessions: migrated,
        conversion_rate: Math.round(conversionRate * 100) / 100
      };
    } catch (error) {
      console.error('Erreur calcul stats migration:', error);
      return null;
    }
  }

  /**
   * Créer directement un compte client (sans dépendance au simulateur)
   */
  static async createClientAccountDirect(clientData: any): Promise<string | null> {
    try {
      // 1. Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: clientData.email,
        password: clientData.password,
        email_confirm: true,
        user_metadata: {
          username: clientData.username,
          type: 'client',
          company_name: clientData.company_name,
          siren: clientData.siren,
          phone_number: clientData.phone_number
        }
      });

      if (authError) {
        console.error('Erreur création utilisateur Auth:', authError);
        return null;
      }

      const authUserId = authData.user.id;

      // 2. Hash du mot de passe pour la table Client
      const hashedPassword = await bcrypt.hash(clientData.password, 10);

      // 3. Créer le client dans la table Client
      // Seules les colonnes réellement présentes dans la table Client (d'après le dump SQL)
      const { data: clientDataResult, error: clientError } = await supabase
        .from('Client')
        .insert({
          auth_id: authUserId, // Lier à l'utilisateur Supabase Auth
          email: clientData.email,
          password: hashedPassword, // Mot de passe hashé
          name: clientData.username,
          company_name: clientData.company_name,
          phone_number: clientData.phone_number,
          address: clientData.address,
          city: clientData.city,
          postal_code: clientData.postal_code,
          siren: clientData.siren,
          type: 'client',
          statut: 'actif',
          derniereConnexion: new Date().toISOString(),
          dateCreation: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          // Colonnes optionnelles (peuvent être null)
          revenuAnnuel: clientData.revenuAnnuel || null,
          secteurActivite: clientData.secteurActivite || null,
          nombreEmployes: clientData.nombreEmployes || null,
          ancienneteEntreprise: clientData.ancienneteEntreprise || null,
          typeProjet: clientData.typeProjet || null,
          dateSimulation: clientData.dateSimulation || null,
          simulationId: clientData.simulationId || null,
          chiffreAffaires: clientData.chiffreAffaires || null,
          metadata: {
            source: 'direct_migration',
            migration_date: new Date().toISOString()
          }
        })
        .select('id')
        .single();

      if (clientError) {
        console.error('Erreur création client:', clientError);
        // Nettoyer l'utilisateur Auth en cas d'erreur
        await supabase.auth.admin.deleteUser(authUserId);
        return null;
      }

      console.log('✅ Client créé avec succès:', clientDataResult.id);
      return clientDataResult.id;

    } catch (error) {
      console.error('Erreur création compte client:', error);
      return null;
    }
  }

  /**
   * Créer les ClientProduitEligible directement
   */
  static async createClientProduitEligiblesDirect(
    clientId: string,
    eligibilityResults: any[]
  ): Promise<any[] | null> {
    try {
      const clientProduitEligibles = [];

      for (const result of eligibilityResults) {
        // Récupérer le produit éligible correspondant
        const { data: produit, error: produitError } = await supabase
          .from('ProduitEligible')
          .select('*')
          .eq('nom', result.produit_id)
          .single();

        if (produitError || !produit) {
          console.warn(`Produit non trouvé: ${result.produit_id}`);
          continue;
        }

        // Créer le ClientProduitEligible
        const { data: cpe, error: cpeError } = await supabase
          .from('ClientProduitEligible')
          .insert({
            clientId: clientId,
            produitId: produit.id,
            statut: result.eligibility_score >= 70 ? 'eligible' : 'en_cours',
            tauxFinal: result.eligibility_score / 100,
            montantFinal: result.estimated_savings,
            dureeFinale: 12, // Durée par défaut
            metadata: {
              source: 'direct_migration',
              eligibility_score: result.eligibility_score,
              confidence_level: result.confidence_level,
              recommendations: result.recommendations || []
            },
            notes: `Migration directe - Score: ${result.eligibility_score}%`,
            priorite: result.eligibility_score >= 70 ? 1 : 2,
            dateEligibilite: new Date().toISOString()
          })
          .select('*')
          .single();

        if (cpeError) {
          console.error('Erreur création ClientProduitEligible:', cpeError);
          continue;
        }

        clientProduitEligibles.push(cpe);
      }

      console.log(`✅ ${clientProduitEligibles.length} produits éligibles créés`);
      return clientProduitEligibles;

    } catch (error) {
      console.error('Erreur création ClientProduitEligible:', error);
      return null;
    }
  }

  /**
   * Sauvegarder les données de simulation directement
   */
  static async saveSimulationDataDirect(
    clientId: string,
    eligibilityResults: any[]
  ) {
    try {
      // Créer une simulation
      const { data: simulation, error: simulationError } = await supabase
        .from('Simulation')
        .insert({
          clientId: clientId,
          answers: [], // Pas de réponses détaillées dans la migration directe
          results: eligibilityResults,
          source: 'direct_migration',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (simulationError) {
        console.error('Erreur sauvegarde simulation:', simulationError);
      } else {
        console.log('✅ Simulation sauvegardée:', simulation.id);
      }

    } catch (error) {
      console.error('Erreur sauvegarde données simulation:', error);
    }
  }
} 