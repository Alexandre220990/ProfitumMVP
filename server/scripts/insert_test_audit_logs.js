const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function insertTestAuditLogs() {
  console.log('🔍 Insertion des logs d\'audit de test...');

  // Logs système (nouvelle structure)
  const systemLogs = [
    {
      level: 'info',
      category: 'security',
      message: 'Connexion utilisateur réussie',
      details: { user_id: 'user_123', ip: '192.168.1.100' },
      user_email: 'admin@profitum.com',
      ip_address: '192.168.1.100',
      resource_type: 'auth',
      resource_id: 'login',
      success: true
    },
    {
      level: 'info',
      category: 'database',
      message: 'Requête base de données exécutée',
      details: { query_time: 45, table: 'clients' },
      ip_address: '192.168.1.101',
      resource_type: 'database',
      resource_id: 'clients_table',
      success: true
    },
    {
      level: 'info',
      category: 'api',
      message: 'Requête API monitoring traitée',
      details: { response_time: 120, endpoint: '/api/monitoring' },
      ip_address: '192.168.1.102',
      resource_type: 'api',
      resource_id: '/api/monitoring',
      success: true
    },
    {
      level: 'warning',
      category: 'security',
      message: 'Tentatives de connexion échouées détectées',
      details: { attempts: 5, ip: '192.168.1.103' },
      ip_address: '192.168.1.103',
      resource_type: 'security',
      resource_id: 'failed_login',
      success: false
    },
    {
      level: 'error',
      category: 'performance',
      message: 'Utilisation mémoire élevée détectée',
      details: { memory_usage: '85%', threshold: '80%' },
      ip_address: '192.168.1.104',
      resource_type: 'system',
      resource_id: 'memory_usage',
      success: false
    }
  ];

  // Rapports ISO
  const isoReports = [
    {
      script_name: 'ISO_27001_AUDIT',
      status: 'success',
      duration_ms: 45000,
      output: 'Audit ISO 27001 terminé avec succès. 15 contrôles validés.',
      exit_code: 0,
      metadata: { controls_passed: 15, controls_failed: 0 }
    },
    {
      script_name: 'SECURITY_SCAN',
      status: 'warning',
      duration_ms: 30000,
      output: 'Scan de sécurité terminé. 2 vulnérabilités mineures détectées.',
      exit_code: 1,
      metadata: { vulnerabilities: 2, severity: 'low' }
    },
    {
      script_name: 'BACKUP_VERIFICATION',
      status: 'success',
      duration_ms: 15000,
      output: 'Vérification des sauvegardes réussie. Toutes les données sont sauvegardées.',
      exit_code: 0,
      metadata: { backup_count: 3, total_size: '2.5GB' }
    },
    {
      script_name: 'PERFORMANCE_TEST',
      status: 'error',
      duration_ms: 60000,
      output: 'Test de performance échoué. Temps de réponse trop élevé.',
      error_output: 'Timeout après 60 secondes',
      exit_code: 2,
      metadata: { response_time: 65000, threshold: 5000 }
    }
  ];

  // Logs terminal
  const terminalLogs = [
    {
      command: 'npm run build',
      output: 'Build completed successfully in 2.3s',
      exit_code: 0,
      duration_ms: 2300,
      username: 'admin',
      working_directory: '/app/client'
    },
    {
      command: 'docker ps',
      output: 'CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS   PORTS   NAMES\nabc123   nginx   ...',
      exit_code: 0,
      duration_ms: 150,
      username: 'admin',
      working_directory: '/app'
    },
    {
      command: 'npm test',
      output: 'Tests passed: 45/45',
      exit_code: 0,
      duration_ms: 8500,
      username: 'admin',
      working_directory: '/app/client'
    },
    {
      command: 'git pull origin main',
      output: 'Already up to date.',
      exit_code: 0,
      duration_ms: 800,
      username: 'admin',
      working_directory: '/app'
    },
    {
      command: 'npm install',
      output: 'added 15 packages in 3.2s',
      exit_code: 0,
      duration_ms: 3200,
      username: 'admin',
      working_directory: '/app/client'
    }
  ];

  try {
    // Insertion des logs système
    for (const log of systemLogs) {
      const { error } = await supabase
        .from('audit_logs')
        .insert(log);
      
      if (error) {
        console.log('Erreur insertion log système:', error);
      }
    }

    // Insertion des rapports ISO
    for (const report of isoReports) {
      const { error } = await supabase
        .from('iso_reports')
        .insert(report);
      
      if (error) {
        console.log('Erreur insertion rapport ISO:', error);
      }
    }

    // Insertion des logs terminal
    for (const log of terminalLogs) {
      const { error } = await supabase
        .from('terminal_logs')
        .insert(log);
      
      if (error) {
        console.log('Erreur insertion log terminal:', error);
      }
    }

    console.log('✅ Logs d\'audit de test insérés avec succès');
    console.log(`📊 ${systemLogs.length} logs système`);
    console.log(`📊 ${isoReports.length} rapports ISO`);
    console.log(`📊 ${terminalLogs.length} logs terminal`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion:', error);
  }
}

insertTestAuditLogs(); 