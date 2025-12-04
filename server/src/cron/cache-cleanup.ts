/**
 * Cron Job de Nettoyage du Cache
 * Nettoie le cache mémoire expiré toutes les heures
 */

import ProspectCacheService from '../services/ProspectCacheService';

/**
 * Nettoyer le cache mémoire toutes les heures
 */
export async function cleanupCache() {
  try {
    console.log('🧹 Démarrage nettoyage cache...');
    
    ProspectCacheService.cleanMemoryCache();
    
    const stats = ProspectCacheService.getCacheStats();
    console.log(`✅ Cache nettoyé: ${stats.memory_entries} entrées, ${stats.memory_size_mb.toFixed(2)} MB`);
    
  } catch (error) {
    console.error('❌ Erreur nettoyage cache:', error);
  }
}

// Exporter pour utilisation dans le scheduler
export default cleanupCache;

