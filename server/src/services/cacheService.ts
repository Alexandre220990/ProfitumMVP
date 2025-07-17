import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

interface CacheConfig {
  ttl: number; // Time to live en secondes
  prefix: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private supabase: ReturnType<typeof createClient<Database>>;
  private config: CacheConfig;

  constructor(config: CacheConfig = { ttl: 300, prefix: 'marketplace' }) {
    this.config = config;
    this.supabase = createClient<Database>(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // Nettoyage automatique du cache
    this.setupCleanup();
  }

  private getCacheKey(key: string): string {
    return `${this.config.prefix}:${key}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl * 1000;
  }

  private setupCleanup() {
    // Nettoyer le cache toutes les 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cache nettoyé: ${cleanedCount} entrées supprimées`);
    }
  }

  // Méthodes de cache génériques
  async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.getCacheKey(key);
    const entry = this.cache.get(cacheKey);

    if (!entry || this.isExpired(entry)) {
      if (entry) {
        this.cache.delete(cacheKey);
      }
      return null;
    }

    return entry.data as T;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const cacheKey = this.getCacheKey(key);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl
    };

    this.cache.set(cacheKey, entry);
  }

  async delete(key: string): Promise<void> {
    const cacheKey = this.getCacheKey(key);
    this.cache.delete(cacheKey);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`🗑️ Cache invalidé: ${keysToDelete.length} clés supprimées`);
    }
  }

  // Méthodes spécialisées pour la marketplace
  async getExperts(): Promise<any[] | null> {
    return this.get<any[]>('experts:marketplace');
  }

  async setExperts(experts: any[]): Promise<void> {
    await this.set('experts:marketplace', experts, 600); // 10 minutes
  }

  async getExpertById(expertId: string): Promise<any | null> {
    return this.get<any>(`expert:${expertId}`);
  }

  async setExpert(expertId: string, expert: any): Promise<void> {
    await this.set(`expert:${expertId}`, expert, 300); // 5 minutes
  }

  async getAssignments(userId: string, userType: string): Promise<any[] | null> {
    return this.get<any[]>(`assignments:${userType}:${userId}`);
  }

  async setAssignments(userId: string, userType: string, assignments: any[]): Promise<void> {
    await this.set(`assignments:${userType}:${userId}`, assignments, 180); // 3 minutes
  }

  async getMessages(assignmentId: string): Promise<any[] | null> {
    return this.get<any[]>(`messages:${assignmentId}`);
  }

  async setMessages(assignmentId: string, messages: any[]): Promise<void> {
    await this.set(`messages:${assignmentId}`, messages, 60); // 1 minute
  }

  async getProducts(): Promise<any[] | null> {
    return this.get<any[]>('products:eligible');
  }

  async setProducts(products: any[]): Promise<void> {
    await this.set('products:eligible', products, 1800); // 30 minutes
  }

  // Méthodes d'invalidation spécialisées
  async invalidateExpert(expertId: string): Promise<void> {
    await this.delete(`expert:${expertId}`);
    await this.invalidatePattern('experts:*');
  }

  async invalidateAssignments(userId: string, userType: string): Promise<void> {
    await this.delete(`assignments:${userType}:${userId}`);
  }

  async invalidateMessages(assignmentId: string): Promise<void> {
    await this.delete(`messages:${assignmentId}`);
  }

  async invalidateAllAssignments(): Promise<void> {
    await this.invalidatePattern('assignments:*');
  }

  async invalidateAllMessages(): Promise<void> {
    await this.invalidatePattern('messages:*');
  }

  // Méthodes de préchargement
  async preloadExperts(): Promise<void> {
    try {
      console.log('🔄 Préchargement des experts...');
      
      const { data: experts, error } = await this.supabase
        .from('expert')
        .select(`
          id,
          name,
          company_name,
          email,
          phone,
          specializations,
          rating,
          hourly_rate,
          availability_status,
          created_at
        `)
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) {
        console.error('❌ Erreur préchargement experts:', error);
        return;
      }

      await this.setExperts(experts || []);
      console.log(`✅ ${experts?.length || 0} experts préchargés`);
    } catch (error) {
      console.error('❌ Erreur préchargement experts:', error);
    }
  }

  async preloadProducts(): Promise<void> {
    try {
      console.log('🔄 Préchargement des produits...');
      
      const { data: products, error } = await this.supabase
        .from('produiteligible')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('❌ Erreur préchargement produits:', error);
        return;
      }

      await this.setProducts(products || []);
      console.log(`✅ ${products?.length || 0} produits préchargés`);
    } catch (error) {
      console.error('❌ Erreur préchargement produits:', error);
    }
  }

  // Statistiques du cache
  getStats() {
    const totalEntries = this.cache.size;
    let expiredEntries = 0;
    let totalSize = 0;

    for (const entry of this.cache.values()) {
      if (this.isExpired(entry)) {
        expiredEntries++;
      }
      totalSize += JSON.stringify(entry.data).length;
    }

    return {
      totalEntries,
      expiredEntries,
      validEntries: totalEntries - expiredEntries,
      totalSizeBytes: totalSize,
      totalSizeKB: Math.round(totalSize / 1024 * 100) / 100
    };
  }

  // Nettoyage manuel
  async clear(): Promise<void> {
    this.cache.clear();
    console.log('🧹 Cache vidé manuellement');
  }
}

// Instance singleton pour l'application
export const cacheService = new CacheService({
  ttl: 300, // 5 minutes par défaut
  prefix: 'marketplace'
}); 