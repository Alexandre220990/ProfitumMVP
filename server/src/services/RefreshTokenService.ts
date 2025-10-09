/**
 * Service de gestion des refresh tokens
 * Permet de gérer les sessions longues sans exposer les credentials
 */

import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import supabase from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';

interface TokenPayload {
  id: string;
  email: string;
  type: 'client' | 'expert' | 'admin' | 'apporteur';
  database_id?: string;
}

interface RefreshTokenData {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
  last_used_at: string;
  user_agent?: string;
  ip_address?: string;
}

export class RefreshTokenService {
  
  /**
   * Génère une paire access token + refresh token
   */
  static generateTokenPair(payload: TokenPayload): { accessToken: string; refreshToken: string } {
    // Access token (courte durée)
    const accessToken = jwt.sign(
      payload,
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    // Refresh token (longue durée)
    const refreshToken = jwt.sign(
      { ...payload, tokenId: uuidv4() },
      jwtConfig.secret,
      { expiresIn: jwtConfig.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Stocke un refresh token en base de données
   */
  static async storeRefreshToken(
    userId: string,
    refreshToken: string,
    metadata?: { userAgent?: string; ipAddress?: string }
  ): Promise<void> {
    try {
      const decoded = jwt.decode(refreshToken) as any;
      const expiresAt = new Date(decoded.exp * 1000).toISOString();

      await supabase
        .from('user_sessions')
        .insert({
          id: decoded.tokenId,
          user_id: userId,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
          last_used_at: new Date().toISOString(),
          user_agent: metadata?.userAgent || null,
          ip_address: metadata?.ipAddress || null,
          is_active: true
        });

      console.log('✅ Refresh token stocké:', decoded.tokenId);
    } catch (error) {
      console.error('❌ Erreur lors du stockage du refresh token:', error);
      throw new Error('Impossible de stocker le refresh token');
    }
  }

  /**
   * Vérifie et renouvelle un refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      // 1. Vérifier la validité du refresh token
      const decoded = jwt.verify(refreshToken, jwtConfig.secret) as any;

      // 2. Vérifier que le token existe en base et est actif
      const { data: session, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('id', decoded.tokenId)
        .eq('is_active', true)
        .single();

      if (error || !session) {
        console.log('❌ Refresh token invalide ou inactif');
        return null;
      }

      // 3. Vérifier que le token n'est pas expiré
      if (new Date(session.expires_at) < new Date()) {
        console.log('❌ Refresh token expiré');
        await this.revokeRefreshToken(decoded.tokenId);
        return null;
      }

      // 4. Mettre à jour la date de dernière utilisation
      await supabase
        .from('user_sessions')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', decoded.tokenId);

      // 5. Générer une nouvelle paire de tokens
      const payload: TokenPayload = {
        id: decoded.id,
        email: decoded.email,
        type: decoded.type,
        database_id: decoded.database_id
      };

      const newTokens = this.generateTokenPair(payload);

      // 6. Stocker le nouveau refresh token
      await this.storeRefreshToken(decoded.id, newTokens.refreshToken);

      // 7. Révoquer l'ancien refresh token
      await this.revokeRefreshToken(decoded.tokenId);

      console.log('✅ Tokens renouvelés avec succès pour:', decoded.email);
      return newTokens;

    } catch (error) {
      console.error('❌ Erreur lors du renouvellement du token:', error);
      return null;
    }
  }

  /**
   * Révoque un refresh token
   */
  static async revokeRefreshToken(tokenId: string): Promise<void> {
    try {
      await supabase
        .from('user_sessions')
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq('id', tokenId);

      console.log('✅ Refresh token révoqué:', tokenId);
    } catch (error) {
      console.error('❌ Erreur lors de la révocation du token:', error);
    }
  }

  /**
   * Révoque tous les refresh tokens d'un utilisateur
   */
  static async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      await supabase
        .from('user_sessions')
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_active', true);

      console.log('✅ Tous les tokens de l\'utilisateur révoqués:', userId);
    } catch (error) {
      console.error('❌ Erreur lors de la révocation des tokens:', error);
    }
  }

  /**
   * Nettoie les refresh tokens expirés
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .lt('expires_at', now)
        .eq('is_active', true);

      console.log('✅ Tokens expirés nettoyés');
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des tokens:', error);
    }
  }

  /**
   * Récupère toutes les sessions actives d'un utilisateur
   */
  static async getUserActiveSessions(userId: string): Promise<RefreshTokenData[]> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_used_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des sessions:', error);
      return [];
    }
  }
}

