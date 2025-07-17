const { createClient } = require('@supabase/supabase-js');
const os = require('os');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

class SystemMonitor {
  constructor() {
    this.stats = {
      startTime: Date.now(),
      requests: 0,
      errors: 0,
      slowQueries: 0,
      memoryUsage: [],
      cpuUsage: [],
      databaseQueries: []
    };
    
    this.alerts = [];
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️  Le monitoring est déjà en cours');
      return;
    }

    this.isRunning = true;
    console.log('🔍 Démarrage du monitoring en temps réel...\n');

    // Monitoring système toutes les 30 secondes
    this.systemInterval = setInterval(() => {
      this.collectSystemStats();
    }, 30000);

    // Monitoring base de données toutes les 60 secondes
    this.databaseInterval = setInterval(() => {
      this.collectDatabaseStats();
    }, 60000);

    // Affichage des statistiques toutes les 30 secondes
    this.displayInterval = setInterval(() => {
      this.displayStats();
    }, 30000);

    // Collecte initiale
    this.collectSystemStats();
    this.collectDatabaseStats();

    console.log('✅ Monitoring démarré');
    console.log('📊 Statistiques affichées toutes les 30 secondes');
    console.log('🗄️  Vérifications DB toutes les 60 secondes');
    console.log('⏹️  Appuyez sur Ctrl+C pour arrêter\n');
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.systemInterval) clearInterval(this.systemInterval);
    if (this.databaseInterval) clearInterval(this.databaseInterval);
    if (this.displayInterval) clearInterval(this.displayInterval);

    console.log('\n🛑 Monitoring arrêté');
    this.displayFinalStats();
  }

  async collectSystemStats() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const loadAvg = os.loadavg();

    this.stats.memoryUsage.push({
      timestamp: Date.now(),
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024) // MB
    });

    this.stats.cpuUsage.push({
      timestamp: Date.now(),
      user: cpuUsage.user,
      system: cpuUsage.system,
      loadAverage: loadAvg[0]
    });

    // Garder seulement les 100 dernières mesures
    if (this.stats.memoryUsage.length > 100) {
      this.stats.memoryUsage.shift();
    }
    if (this.stats.cpuUsage.length > 100) {
      this.stats.cpuUsage.shift();
    }

    // Vérifier les alertes
    this.checkAlerts();
  }

  async collectDatabaseStats() {
    try {
      const start = Date.now();
      const { data, error } = await supabase
        .from('Client')
        .select('count')
        .limit(1);
      const duration = Date.now() - start;

      this.stats.databaseQueries.push({
        timestamp: Date.now(),
        duration,
        success: !error,
        error: error?.message
      });

      if (error) {
        this.stats.errors++;
        this.addAlert('DATABASE_ERROR', `Erreur DB: ${error.message}`);
      } else if (duration > 1000) {
        this.stats.slowQueries++;
        this.addAlert('SLOW_QUERY', `Requête lente: ${duration}ms`);
      }

      // Garder seulement les 50 dernières requêtes
      if (this.stats.databaseQueries.length > 50) {
        this.stats.databaseQueries.shift();
      }

    } catch (error) {
      this.stats.errors++;
      this.addAlert('DATABASE_ERROR', `Exception DB: ${error.message}`);
    }
  }

  checkAlerts() {
    const memoryUsage = this.stats.memoryUsage[this.stats.memoryUsage.length - 1];
    const cpuUsage = this.stats.cpuUsage[this.stats.cpuUsage.length - 1];

    if (memoryUsage && memoryUsage.rss > 1000) { // Plus de 1GB
      this.addAlert('HIGH_MEMORY', `Mémoire élevée: ${memoryUsage.rss}MB`);
    }

    if (cpuUsage && cpuUsage.loadAverage > os.cpus().length) {
      this.addAlert('HIGH_CPU', `Charge CPU élevée: ${cpuUsage.loadAverage.toFixed(2)}`);
    }

    // Nettoyer les alertes anciennes (plus de 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    this.alerts = this.alerts.filter(alert => alert.timestamp > fiveMinutesAgo);
  }

  addAlert(type, message) {
    const alert = {
      type,
      message,
      timestamp: Date.now()
    };

    this.alerts.push(alert);
    console.log(`🚨 ${new Date().toLocaleTimeString()} - ${message}`);
  }

  displayStats() {
    const uptime = Math.round((Date.now() - this.stats.startTime) / 1000);
    const memoryUsage = this.stats.memoryUsage[this.stats.memoryUsage.length - 1];
    const cpuUsage = this.stats.cpuUsage[this.stats.cpuUsage.length - 1];

    // Calculer les moyennes
    const avgMemoryRss = this.stats.memoryUsage.length > 0 
      ? Math.round(this.stats.memoryUsage.reduce((sum, m) => sum + m.rss, 0) / this.stats.memoryUsage.length)
      : 0;

    const avgDbDuration = this.stats.databaseQueries.length > 0
      ? Math.round(this.stats.databaseQueries.reduce((sum, q) => sum + q.duration, 0) / this.stats.databaseQueries.length)
      : 0;

    const successRate = this.stats.databaseQueries.length > 0
      ? Math.round((this.stats.databaseQueries.filter(q => q.success).length / this.stats.databaseQueries.length) * 100)
      : 100;

    console.clear();
    console.log('📊 Monitoring Profitum - Temps réel');
    console.log('='.repeat(50));
    console.log(`⏱️  Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`);
    console.log(`🔄 Requêtes DB: ${this.stats.databaseQueries.length}`);
    console.log(`✅ Taux de succès: ${successRate}%`);
    console.log(`🐌 Requêtes lentes: ${this.stats.slowQueries}`);
    console.log(`❌ Erreurs: ${this.stats.errors}`);
    console.log('');
    
    if (memoryUsage) {
      console.log('💾 Mémoire:');
      console.log(`   RSS: ${memoryUsage.rss}MB (moy: ${avgMemoryRss}MB)`);
      console.log(`   Heap: ${memoryUsage.heapUsed}MB / ${memoryUsage.heapTotal}MB`);
      console.log(`   External: ${memoryUsage.external}MB`);
    }

    if (cpuUsage) {
      console.log('🖥️  CPU:');
      console.log(`   Load Average: ${cpuUsage.loadAverage.toFixed(2)}`);
      console.log(`   User: ${Math.round(cpuUsage.user / 1000)}ms`);
      console.log(`   System: ${Math.round(cpuUsage.system / 1000)}ms`);
    }

    console.log('🗄️  Base de données:');
    console.log(`   Durée moyenne: ${avgDbDuration}ms`);
    console.log(`   Dernière requête: ${this.stats.databaseQueries.length > 0 ? this.stats.databaseQueries[this.stats.databaseQueries.length - 1].duration + 'ms' : 'N/A'}`);

    if (this.alerts.length > 0) {
      console.log('\n🚨 Alertes récentes:');
      this.alerts.slice(-5).forEach(alert => {
        const time = new Date(alert.timestamp).toLocaleTimeString();
        console.log(`   ${time} - ${alert.message}`);
      });
    }

    console.log('\n' + '='.repeat(50));
  }

  displayFinalStats() {
    const uptime = Math.round((Date.now() - this.stats.startTime) / 1000);
    
    console.log('\n📈 Statistiques finales:');
    console.log(`⏱️  Durée totale: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`);
    console.log(`🔄 Requêtes DB totales: ${this.stats.databaseQueries.length}`);
    console.log(`🐌 Requêtes lentes: ${this.stats.slowQueries}`);
    console.log(`❌ Erreurs totales: ${this.stats.errors}`);
    
    if (this.stats.databaseQueries.length > 0) {
      const avgDuration = Math.round(this.stats.databaseQueries.reduce((sum, q) => sum + q.duration, 0) / this.stats.databaseQueries.length);
      const maxDuration = Math.max(...this.stats.databaseQueries.map(q => q.duration));
      const successRate = Math.round((this.stats.databaseQueries.filter(q => q.success).length / this.stats.databaseQueries.length) * 100);
      
      console.log(`📊 Performance DB:`);
      console.log(`   Durée moyenne: ${avgDuration}ms`);
      console.log(`   Durée max: ${maxDuration}ms`);
      console.log(`   Taux de succès: ${successRate}%`);
    }
  }
}

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt demandé...');
  if (monitor) {
    monitor.stop();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt demandé...');
  if (monitor) {
    monitor.stop();
  }
  process.exit(0);
});

// Démarrer le monitoring
const monitor = new SystemMonitor();
monitor.start(); 