import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Types pour les sessions temporaires
export interface SimulationData {
  answers: Record<string, any>;
  eligibleProducts: any[];
  simulationId: string;
  metadata?: any;
}

export interface SessionResult {
  sessionId: string;
  expiresAt: Date;
  accessToken: string;
}

export interface ClientRegistrationData {
  email: string;
  password: string;
  username: string;
  company_name: string;
  phone_number: string;
  address: string;
  city: string;
  postal_code: string;
  siren: string;
  revenuAnnuel?: number;
  secteurActivite?: string;
  nombreEmployes?: number;
  ancienneteEntreprise?: number;
}

export interface MigrationResult {
  clientId: string;
  migratedProducts: any[];
  success: boolean;
  error?: string;
}

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Service de gestion des sessions temporaires pour les simulations
 * Permet de créer des sessions temporaires et de les migrer vers des comptes clients permanents
 */
export class SimulationSessionService {
  
  /**
   * Créer une session temporaire pour les résultats de simulation
   */
  static async createTemporarySession(simulationData: SimulationData): Promise<SessionResult> {
    try {
      const sessionId = randomUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
      
      console.log('🔄 Création session temporaire:', sessionId);
      
      // 1. Stocker les données de simulation
      await this.storeSimulationData(sessionId, simulationData);
      
      // 2. Créer les ClientProduitEligible temporaires
      await this.createTemporaryClientProduitEligible(sessionId, simulationData);
      
      // 3. Générer le token d'accès
      const accessToken = this.generateAccessToken(sessionId);
      
      console.log('✅ Session temporaire créée:', sessionId);
      
      return {
        sessionId,
        expiresAt,
        accessToken
      };
    } catch (error) {
      console.error('❌ Erreur création session temporaire:', error);
      throw error;
    }
  }
  
  /**
   * Stocker les données de simulation dans la table temporaire
   */
  private static async storeSimulationData(sessionId: string, simulationData: SimulationData): Promise<void> {
    const { error } = await supabase
      .from('TemporarySimulationSession')
      .insert({
        sessionId,
        simulationData,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          source: 'simulation_service',
          created_at: new Date().toISOString()
        }
      });
    
    if (error) {
      console.error('❌ Erreur stockage données simulation:', error);
      throw error;
    }
  }
  
  /**
   * Créer des ClientProduitEligible temporaires
   */
  private static async createTemporaryClientProduitEligible(sessionId: string, simulationData: SimulationData): Promise<void> {
    const eligibleProducts = simulationData.eligibleProducts || [];
    
    for (const product of eligibleProducts) {
      const { error } = await supabase
        .from('ClientProduitEligible')
        .insert({
          id: randomUUID(),
          sessionId: sessionId,
          produitId: product.id,
          statut: 'eligible',
          tauxFinal: product.tauxFinal || 0.8,
          montantFinal: product.montantFinal || 0,
          dureeFinale: product.dureeFinale || 12,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            source: 'temporary_session',
            sessionId: sessionId,
            simulationId: simulationData.simulationId,
            originalData: product
          }
        });
      
      if (error) {
        console.error('❌ Erreur création ClientProduitEligible temporaire:', error);
        throw error;
      }
    }
    
    console.log(`✅ ${eligibleProducts.length} produits éligibles temporaires créés`);
  }
  
  /**
   * Générer un token d'accès pour la session
   */
  private static generateAccessToken(sessionId: string): string {
    return jwt.sign(
      { 
        sessionId, 
        type: 'temporary_session',
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24h
      },
      process.env.JWT_SECRET || 'votre_secret_jwt_super_securise'
    );
  }
  
  /**
   * Valider une session temporaire
   */
  static async validateSession(sessionToken: string): Promise<boolean> {
    try {
      // Décoder le token
      const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET || 'votre_secret_jwt_super_securise') as any;
      
      if (!decoded.sessionId || decoded.type !== 'temporary_session') {
        return false;
      }
      
      // Vérifier que la session existe et n'est pas expirée
      const { data: session, error } = await supabase
        .from('TemporarySimulationSession')
        .select('sessionId, expiresAt')
        .eq('sessionId', decoded.sessionId)
        .single();
      
      if (error || !session) {
        return false;
      }
      
      // Vérifier l'expiration
      if (new Date(session.expiresAt) < new Date()) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erreur validation session:', error);
      return false;
    }
  }
  
  /**
   * Récupérer les données d'une session
   */
  static async getSessionData(sessionId: string): Promise<any> {
    const { data: session, error } = await supabase
      .from('TemporarySimulationSession')
      .select('*')
      .eq('sessionId', sessionId)
      .single();
    
    if (error || !session) {
      throw new Error('Session non trouvée');
    }
    
    return session;
  }
  
  /**
   * Migrer une session vers un compte client permanent
   */
  static async migrateSessionToClient(sessionId: string, clientData: ClientRegistrationData): Promise<MigrationResult> {
    try {
      console.log('🔄 Début migration session vers client:', sessionId);
      
      // 1. Récupérer les données de session
      const sessionData = await this.getSessionData(sessionId);
      if (!sessionData) {
        throw new Error('Session expirée ou invalide');
      }
      
      // 2. Créer le compte client
      const clientId = await this.createClientAccount(clientData);
      
      // 3. Migrer les ClientProduitEligible
      const migratedProducts = await this.migrateClientProduitEligible(sessionId, clientId);
      
      // 4. Nettoyer la session temporaire
      await this.cleanupSession(sessionId);
      
      console.log('✅ Migration réussie:', { clientId, migratedCount: migratedProducts.length });
      
      return {
        clientId,
        migratedProducts,
        success: true
      };
    } catch (error) {
      console.error('❌ Erreur migration session:', error);
      return {
        clientId: '',
        migratedProducts: [],
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }
  
  /**
   * Créer le compte client
   */
  private static async createClientAccount(clientData: ClientRegistrationData): Promise<string> {
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
        console.error('❌ Erreur création utilisateur Auth:', authError);
        throw authError;
      }
      
      const authUserId = authData.user.id;
      
      // 2. Hash du mot de passe pour la table Client
      const hashedPassword = await bcrypt.hash(clientData.password, 10);
      
      // 3. Créer le client dans la table Client
      const { data: clientDataResult, error: clientError } = await supabase
        .from('Client')
        .insert({
          auth_id: authUserId,
          email: clientData.email,
          password: hashedPassword,
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
          revenuAnnuel: clientData.revenuAnnuel || null,
          secteurActivite: clientData.secteurActivite || null,
          nombreEmployes: clientData.nombreEmployes || null,
          ancienneteEntreprise: clientData.ancienneteEntreprise || null,
          metadata: {
            source: 'session_migration',
            migration_date: new Date().toISOString()
          }
        })
        .select('id')
        .single();
      
      if (clientError) {
        console.error('❌ Erreur création client:', clientError);
        // Nettoyer l'utilisateur Auth en cas d'erreur
        await supabase.auth.admin.deleteUser(authUserId);
        throw clientError;
      }
      
      console.log('✅ Client créé avec succès:', clientDataResult.id);
      return clientDataResult.id;
    } catch (error) {
      console.error('❌ Erreur création compte client:', error);
      throw error;
    }
  }
  
  /**
   * Migrer les ClientProduitEligible vers un client permanent
   */
  private static async migrateClientProduitEligible(sessionId: string, clientId: string): Promise<any[]> {
    try {
      // 1. Récupérer tous les ClientProduitEligible temporaires
      const { data: temporaryProducts, error } = await supabase
        .from('ClientProduitEligible')
        .select('*')
        .eq('sessionId', sessionId);
      
      if (error) throw error;
      
      console.log(`📊 Migration de ${temporaryProducts?.length || 0} produits éligibles`);
      
      // 2. Migrer chaque produit
      const migratedProducts = [];
      for (const product of temporaryProducts || []) {
        const { data: migratedProduct, error: migrationError } = await supabase
          .from('ClientProduitEligible')
          .update({
            clientId: clientId,
            sessionId: null, // Supprimer la référence temporaire
            updated_at: new Date().toISOString(),
            metadata: {
              ...product.metadata,
              migrated_at: new Date().toISOString(),
              original_session_id: sessionId
            }
          })
          .eq('id', product.id)
          .select()
          .single();
        
        if (migrationError) throw migrationError;
        migratedProducts.push(migratedProduct);
      }
      
      console.log(`✅ ${migratedProducts.length} produits migrés avec succès`);
      return migratedProducts;
    } catch (error) {
      console.error('❌ Erreur migration produits éligibles:', error);
      throw error;
    }
  }
  
  /**
   * Nettoyer une session temporaire
   */
  private static async cleanupSession(sessionId: string): Promise<void> {
    try {
      // Supprimer la session temporaire
      const { error } = await supabase
        .from('TemporarySimulationSession')
        .delete()
        .eq('sessionId', sessionId);
      
      if (error) {
        console.error('❌ Erreur nettoyage session:', error);
      } else {
        console.log('✅ Session temporaire nettoyée:', sessionId);
      }
    } catch (error) {
      console.error('❌ Erreur nettoyage session:', error);
    }
  }
  
  /**
   * Récupérer les produits éligibles d'une session temporaire
   */
  static async getSessionProducts(sessionId: string): Promise<any[]> {
    const { data: products, error } = await supabase
      .from('ClientProduitEligible')
      .select(`
        *,
        ProduitEligible (
          id,
          nom,
          description,
          category
        )
      `)
      .eq('sessionId', sessionId);
    
    if (error) {
      console.error('❌ Erreur récupération produits session:', error);
      throw error;
    }
    
    return products || [];
  }
} 