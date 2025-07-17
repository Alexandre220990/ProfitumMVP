const { createClient } = require('@supabase/supabase-js');
const os = require('os');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function healthCheck() {
  console.log('🏥 Vérification de la santé du système Profitum\n');

  const checks = {
    system: {},
    database: {},
    api: {},
    performance: {}
  };

  // ===== VÉRIFICATIONS SYSTÈME =====
  console.log('1️⃣ Vérifications système...');
  
  checks.system = {
    nodeVersion: process.version,
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    memory: {
      total: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 100) / 100 + ' GB',
      free: Math.round(os.freemem() / 1024 / 1024 / 1024 * 100) / 100 + ' GB',
      used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024 * 100) / 100 + ' GB'
    },
    uptime: Math.round(os.uptime() / 3600 * 100) / 100 + ' heures',
    loadAverage: os.loadavg()
  };

  console.log(`   ✅ Node.js: ${checks.system.nodeVersion}`);
  console.log(`   ✅ Plateforme: ${checks.system.platform} (${checks.system.arch})`);
  console.log(`   ✅ CPU: ${checks.system.cpus} cœurs`);
  console.log(`   ✅ Mémoire: ${checks.system.memory.used}/${checks.system.memory.total} utilisée`);
  console.log(`   ✅ Uptime: ${checks.system.uptime}`);

  // ===== VÉRIFICATIONS BASE DE DONNÉES =====
  console.log('\n2️⃣ Vérifications base de données...');
  
  try {
    // Test de connexion
    const connectionStart = Date.now();
    const { data: connectionTest, error: connectionError } = await supabase
      .from('Client')
      .select('count')
      .limit(1);
    const connectionDuration = Date.now() - connectionStart;

    if (connectionError) {
      throw connectionError;
    }

    checks.database.connection = {
      status: 'OK',
      duration: connectionDuration + 'ms'
    };

    // Vérifier les tables principales
    const tables = ['Expert', 'Client', 'Simulation', 'ClientProduitEligible', 'Audit', 'Admin'];
    const tableChecks = {};

    for (const table of tables) {
      try {
        const start = Date.now();
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        const duration = Date.now() - start;

        if (error) {
          tableChecks[table] = { status: 'ERROR', error: error.message };
        } else {
          tableChecks[table] = { 
            status: 'OK', 
            count: count || 0, 
            duration: duration + 'ms' 
          };
        }
      } catch (error) {
        tableChecks[table] = { status: 'ERROR', error: error.message };
      }
    }

    checks.database.tables = tableChecks;

    console.log(`   ✅ Connexion: ${checks.database.connection.duration}`);
    
    for (const [table, info] of Object.entries(tableChecks)) {
      if (info.status === 'OK') {
        console.log(`   ✅ ${table}: ${info.count} enregistrements (${info.duration})`);
      } else {
        console.log(`   ❌ ${table}: ${info.error}`);
      }
    }

  } catch (error) {
    checks.database.connection = {
      status: 'ERROR',
      error: error.message
    };
    console.log(`   ❌ Connexion: ${error.message}`);
  }

  // ===== VÉRIFICATIONS API =====
  console.log('\n3️⃣ Vérifications API...');
  
  try {
    const apiUrl = process.env.API_URL || 'http://localhost:5001';
    const healthUrl = `${apiUrl}/api/health`;
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    if (response.ok) {
      const healthData = await response.json();
      checks.api.health = {
        status: 'OK',
        data: healthData
      };
      console.log(`   ✅ API Health: ${response.status} - ${healthData.message}`);
    } else {
      checks.api.health = {
        status: 'ERROR',
        statusCode: response.status
      };
      console.log(`   ❌ API Health: ${response.status}`);
    }
  } catch (error) {
    checks.api.health = {
      status: 'ERROR',
      error: error.message
    };
    console.log(`   ❌ API Health: ${error.message}`);
  }

  // ===== VÉRIFICATIONS PERFORMANCE =====
  console.log('\n4️⃣ Vérifications performance...');
  
  const performanceTests = [
    {
      name: 'Requête experts approuvés',
      query: () => supabase.from('Expert').select('*').eq('approval_status', 'approved').limit(10)
    },
    {
      name: 'Requête clients récents',
      query: () => supabase.from('Client').select('*').order('created_at', { ascending: false }).limit(10)
    },
    {
      name: 'Requête simulations actives',
      query: () => supabase.from('Simulation').select('*').eq('statut', 'en_cours').limit(10)
    }
  ];

  const performanceResults = {};

  for (const test of performanceTests) {
    try {
      const start = Date.now();
      const { data, error } = await test.query();
      const duration = Date.now() - start;

      if (error) {
        performanceResults[test.name] = { status: 'ERROR', error: error.message };
        console.log(`   ❌ ${test.name}: ${error.message}`);
      } else {
        performanceResults[test.name] = { 
          status: 'OK', 
          duration: duration + 'ms',
          count: data?.length || 0
        };
        console.log(`   ✅ ${test.name}: ${duration}ms (${data?.length || 0} résultats)`);
      }
    } catch (error) {
      performanceResults[test.name] = { status: 'ERROR', error: error.message };
      console.log(`   ❌ ${test.name}: ${error.message}`);
    }
  }

  checks.performance = performanceResults;

  // ===== RÉSUMÉ GLOBAL =====
  console.log('\n📊 Résumé de la santé du système');
  console.log('='.repeat(50));

  const systemOk = true; // Système toujours OK
  const dbOk = checks.database.connection?.status === 'OK';
  const apiOk = checks.api.health?.status === 'OK';
  const perfOk = Object.values(checks.performance).every(p => p.status === 'OK');

  const overallStatus = systemOk && dbOk && apiOk && perfOk ? 'HEALTHY' : 'UNHEALTHY';

  console.log(`🏥 Statut global: ${overallStatus}`);
  console.log(`💻 Système: ${systemOk ? '✅' : '❌'}`);
  console.log(`🗄️  Base de données: ${dbOk ? '✅' : '❌'}`);
  console.log(`🌐 API: ${apiOk ? '✅' : '❌'}`);
  console.log(`⚡ Performance: ${perfOk ? '✅' : '❌'}`);

  if (overallStatus === 'UNHEALTHY') {
    console.log('\n🚨 Problèmes détectés:');
    
    if (!dbOk) {
      console.log('   • Problème de connexion à la base de données');
    }
    
    if (!apiOk) {
      console.log('   • Problème avec l\'API');
    }
    
    if (!perfOk) {
      console.log('   • Problèmes de performance détectés');
    }
  } else {
    console.log('\n🎉 Tous les systèmes fonctionnent correctement !');
  }

  // Recommandations
  console.log('\n💡 Recommandations:');
  
  const memoryUsage = (os.totalmem() - os.freemem()) / os.totalmem();
  if (memoryUsage > 0.8) {
    console.log('   ⚠️  Utilisation mémoire élevée - considérez redémarrer le serveur');
  }
  
  const loadAvg = os.loadavg()[0];
  if (loadAvg > os.cpus().length) {
    console.log('   ⚠️  Charge système élevée - surveillez les performances');
  }

  return {
    status: overallStatus,
    checks,
    timestamp: new Date().toISOString()
  };
}

// Exécuter la vérification
if (require.main === module) {
  healthCheck().catch(error => {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  });
}

module.exports = { healthCheck }; 