/**
 * Script pour réinitialiser le rate limit
 * Usage: node scripts/reset-rate-limit.js
 */

require('dotenv').config({ path: './server/.env' });

const { createClient } = require('@supabase/supabase-js');
const Redis = require('ioredis');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const redisUrl = process.env.REDIS_URL;

console.log('🔧 Configuration:');
console.log('   Supabase URL:', supabaseUrl ? '✅ Défini' : '❌ Manquant');
console.log('   Redis URL:', redisUrl ? '✅ Défini' : '❌ Manquant');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetRateLimit() {
  try {
    console.log('\n🔄 Réinitialisation du rate limit...\n');

    // Si Redis est configuré, essayer de se connecter et nettoyer
    if (redisUrl) {
      try {
        console.log('🔌 Connexion à Redis...');
        const redis = new Redis(redisUrl);
        
        // Nettoyer toutes les clés de rate limit
        const keys = await redis.keys('rl:*');
        console.log(`📊 Trouvé ${keys.length} clés de rate limit`);
        
        if (keys.length > 0) {
          await redis.del(...keys);
          console.log('✅ Toutes les clés de rate limit supprimées de Redis');
        }
        
        await redis.quit();
      } catch (redisError) {
        console.log('⚠️ Redis non disponible ou erreur:', redisError.message);
        console.log('   Le rate limit est peut-être en mémoire locale');
      }
    } else {
      console.log('ℹ️ Redis non configuré - Rate limit en mémoire');
      console.log('   Redémarrez le serveur pour réinitialiser le rate limit');
    }

    console.log('\n✅ ✅ ✅ TERMINÉ ! ✅ ✅ ✅');
    console.log('\n📋 Actions recommandées:');
    console.log('   1. Redémarrez le serveur backend');
    console.log('   2. Videz le cache du navigateur (Ctrl+Shift+Delete)');
    console.log('   3. Effacez le localStorage :');
    console.log('      - Ouvrez la console (F12)');
    console.log('      - Tapez: localStorage.clear()');
    console.log('      - Tapez: sessionStorage.clear()');
    console.log('   4. Rechargez la page (Ctrl+F5)');
    console.log('   5. Réessayez de vous connecter');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

// Exécuter
resetRateLimit();

