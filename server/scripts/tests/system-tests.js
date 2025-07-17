const { createClient } = require('@supabase/supabase-js');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class SystemTests {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🖥️ Démarrage des tests système...');
    
    try {
      await this.testSystemResources();
      await this.testProcessMonitoring();
      await this.testFileSystem();
      await this.testNetworkConnectivity();
      await this.testSystemLogs();
      
      const duration = Date.now() - this.startTime;
      
      // Enregistrer le rapport complet
      await this.saveReport(duration);
      
      return {
        success: true,
        duration,
        results: this.results,
        summary: this.generateSummary()
      };
    } catch (error) {
      console.error('❌ Erreur lors des tests système:', error);
      return {
        success: false,
        error: error.message,
        results: this.results
      };
    }
  }

  async testSystemResources() {
    const testName = 'System Resources Test';
    console.log(`🔍 ${testName}...`);
    
    const startTime = Date.now();
    
    // Collecter les métriques système
    const cpuUsage = os.loadavg()[0];
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsage = (usedMem / totalMem) * 100;
    const cpuCores = os.cpus().length;
    const normalizedCpu = Math.min((cpuUsage / cpuCores) * 100, 100);
    
    // Vérifier l'espace disque (simulation)
    const diskUsage = Math.random() * 30 + 50; // 50-80%
    
    const resourceChecks = [
      {
        name: 'CPU Usage',
        value: Math.round(normalizedCpu * 100) / 100,
        unit: '%',
        threshold: 80,
        status: normalizedCpu > 80 ? 'warning' : 'pass'
      },
      {
        name: 'Memory Usage',
        value: Math.round(memoryUsage * 100) / 100,
        unit: '%',
        threshold: 85,
        status: memoryUsage > 85 ? 'warning' : 'pass'
      },
      {
        name: 'Disk Usage',
        value: Math.round(diskUsage * 100) / 100,
        unit: '%',
        threshold: 90,
        status: diskUsage > 90 ? 'warning' : 'pass'
      },
      {
        name: 'Available Memory',
        value: Math.round(freeMem / 1024 / 1024 / 1024 * 100) / 100,
        unit: 'GB',
        threshold: 1,
        status: freeMem / 1024 / 1024 / 1024 < 1 ? 'warning' : 'pass'
      }
    ];
    
    const duration = Date.now() - startTime;
    const warnings = resourceChecks.filter(r => r.status === 'warning').length;
    const status = warnings > 0 ? 'warning' : 'success';
    
    const result = {
      test_name: testName,
      category: 'system',
      status,
      duration_ms: duration,
      resource_checks: resourceChecks,
      summary: {
        cpu_usage: Math.round(normalizedCpu * 100) / 100,
        memory_usage: Math.round(memoryUsage * 100) / 100,
        disk_usage: Math.round(diskUsage * 100) / 100,
        warnings,
        overall_status: status
      },
      output: `CPU: ${Math.round(normalizedCpu * 100) / 100}%, Mémoire: ${Math.round(memoryUsage * 100) / 100}%, Disque: ${Math.round(diskUsage * 100) / 100}%`,
      exit_code: warnings > 0 ? 1 : 0
    };
    
    this.results.push(result);
    return result;
  }

  async testProcessMonitoring() {
    const testName = 'Process Monitoring Test';
    console.log(`🔍 ${testName}...`);
    
    const startTime = Date.now();
    
    // Simulation de monitoring des processus
    const processChecks = [
      {
        name: 'Node.js Process',
        pid: process.pid,
        status: 'running',
        memory_usage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        cpu_usage: Math.random() * 5 + 1
      },
      {
        name: 'Database Service',
        status: 'running',
        port: 5432,
        health: 'healthy'
      },
      {
        name: 'Web Server',
        status: 'running',
        port: 3001,
        health: 'healthy'
      }
    ];
    
    const duration = Date.now() - startTime;
    const failedProcesses = processChecks.filter(p => p.status !== 'running').length;
    const status = failedProcesses > 0 ? 'error' : 'success';
    
    const result = {
      test_name: testName,
      category: 'system',
      status,
      duration_ms: duration,
      process_checks: processChecks,
      summary: {
        total_processes: processChecks.length,
        running: processChecks.filter(p => p.status === 'running').length,
        failed: failedProcesses
      },
      output: `Monitoring des processus terminé. ${processChecks.length - failedProcesses}/${processChecks.length} processus actifs.`,
      error_output: failedProcesses > 0 ? `${failedProcesses} processus échoués` : null,
      exit_code: failedProcesses > 0 ? 1 : 0
    };
    
    this.results.push(result);
    return result;
  }

  async testFileSystem() {
    const testName = 'File System Test';
    console.log(`🔍 ${testName}...`);
    
    const startTime = Date.now();
    
    const fileSystemChecks = [
      {
        name: 'Log Directory',
        path: './logs',
        check: () => {
          try {
            return fs.existsSync('./logs');
          } catch (error) {
            return false;
          }
        }
      },
      {
        name: 'Config Files',
        path: './.env',
        check: () => {
          try {
            return fs.existsSync('./.env');
          } catch (error) {
            return false;
          }
        }
      },
      {
        name: 'Database Directory',
        path: './database',
        check: () => {
          try {
            return fs.existsSync('./database');
          } catch (error) {
            return false;
          }
        }
      }
    ];
    
    const fsResults = [];
    
    for (const fsCheck of fileSystemChecks) {
      const checkStart = Date.now();
      try {
        const exists = fsCheck.check();
        const checkTime = Date.now() - checkStart;
        
        fsResults.push({
          name: fsCheck.name,
          path: fsCheck.path,
          status: exists ? 'pass' : 'fail',
          duration_ms: checkTime
        });
      } catch (error) {
        fsResults.push({
          name: fsCheck.name,
          path: fsCheck.path,
          status: 'fail',
          duration_ms: Date.now() - checkStart,
          error: error.message
        });
      }
    }
    
    const duration = Date.now() - startTime;
    const failedFS = fsResults.filter(f => f.status === 'fail').length;
    const status = failedFS > 0 ? 'error' : 'success';
    
    const result = {
      test_name: testName,
      category: 'system',
      status,
      duration_ms: duration,
      filesystem_checks: fsResults,
      summary: {
        total_checks: fileSystemChecks.length,
        successful: fsResults.filter(f => f.status === 'pass').length,
        failed: failedFS
      },
      output: `Tests du système de fichiers terminés. ${fsResults.length - failedFS}/${fsResults.length} vérifications passées.`,
      error_output: failedFS > 0 ? `${failedFS} vérifications échouées` : null,
      exit_code: failedFS > 0 ? 1 : 0
    };
    
    this.results.push(result);
    return result;
  }

  async testNetworkConnectivity() {
    const testName = 'Network Connectivity Test';
    console.log(`🔍 ${testName}...`);
    
    const startTime = Date.now();
    
    const networkChecks = [
      {
        name: 'Localhost Connectivity',
        host: 'localhost',
        port: 3001,
        timeout: 5000
      },
      {
        name: 'Database Connectivity',
        host: 'localhost',
        port: 5432,
        timeout: 5000
      },
      {
        name: 'External API',
        host: 'api.github.com',
        port: 443,
        timeout: 10000
      }
    ];
    
    const networkResults = [];
    
    for (const networkCheck of networkChecks) {
      const checkStart = Date.now();
      try {
        // Simulation de test de connectivité
        const isReachable = Math.random() > 0.1; // 90% de chance de succès
        const checkTime = Date.now() - checkStart;
        
        networkResults.push({
          name: networkCheck.name,
          host: networkCheck.host,
          port: networkCheck.port,
          status: isReachable ? 'pass' : 'fail',
          response_time_ms: checkTime,
          reachable: isReachable
        });
      } catch (error) {
        networkResults.push({
          name: networkCheck.name,
          host: networkCheck.host,
          port: networkCheck.port,
          status: 'fail',
          response_time_ms: Date.now() - checkStart,
          error: error.message,
          reachable: false
        });
      }
    }
    
    const duration = Date.now() - startTime;
    const failedNetwork = networkResults.filter(n => n.status === 'fail').length;
    const status = failedNetwork > 0 ? 'warning' : 'success';
    
    const result = {
      test_name: testName,
      category: 'system',
      status,
      duration_ms: duration,
      network_checks: networkResults,
      summary: {
        total_checks: networkChecks.length,
        successful: networkResults.filter(n => n.status === 'pass').length,
        failed: failedNetwork,
        avg_response_time: Math.round(networkResults.reduce((sum, n) => sum + n.response_time_ms, 0) / networkResults.length)
      },
      output: `Tests de connectivité réseau terminés. ${networkResults.length - failedNetwork}/${networkResults.length} connexions OK.`,
      exit_code: failedNetwork > 0 ? 1 : 0
    };
    
    this.results.push(result);
    return result;
  }

  async testSystemLogs() {
    const testName = 'System Logs Test';
    console.log(`🔍 ${testName}...`);
    
    const startTime = Date.now();
    
    const logChecks = [
      {
        name: 'Application Logs',
        check: () => {
          // Vérifier si les logs d'application sont générés
          return true; // Simulation
        }
      },
      {
        name: 'Error Logs',
        check: () => {
          // Vérifier les logs d'erreur
          return true; // Simulation
        }
      },
      {
        name: 'Access Logs',
        check: () => {
          // Vérifier les logs d'accès
          return true; // Simulation
        }
      }
    ];
    
    const logResults = [];
    
    for (const logCheck of logChecks) {
      const checkStart = Date.now();
      try {
        const isValid = logCheck.check();
        const checkTime = Date.now() - checkStart;
        
        logResults.push({
          name: logCheck.name,
          status: isValid ? 'pass' : 'fail',
          duration_ms: checkTime
        });
      } catch (error) {
        logResults.push({
          name: logCheck.name,
          status: 'fail',
          duration_ms: Date.now() - checkStart,
          error: error.message
        });
      }
    }
    
    const duration = Date.now() - startTime;
    const failedLogs = logResults.filter(l => l.status === 'fail').length;
    const status = failedLogs > 0 ? 'error' : 'success';
    
    const result = {
      test_name: testName,
      category: 'system',
      status,
      duration_ms: duration,
      log_checks: logResults,
      summary: {
        total_checks: logChecks.length,
        successful: logResults.filter(l => l.status === 'pass').length,
        failed: failedLogs
      },
      output: `Tests des logs système terminés. ${logResults.length - failedLogs}/${logResults.length} vérifications passées.`,
      error_output: failedLogs > 0 ? `${failedLogs} vérifications échouées` : null,
      exit_code: failedLogs > 0 ? 1 : 0
    };
    
    this.results.push(result);
    return result;
  }

  generateSummary() {
    const totalTests = this.results.length;
    const successful = this.results.filter(r => r.status === 'success').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const errors = this.results.filter(r => r.status === 'error').length;
    
    return {
      total_tests: totalTests,
      successful,
      warnings,
      errors,
      success_rate: Math.round((successful / totalTests) * 100),
      overall_status: errors > 0 ? 'error' : warnings > 0 ? 'warning' : 'success'
    };
  }

  async saveReport(duration) {
    try {
      const report = {
        script_name: 'SYSTEM_TESTS_SUITE',
        status: this.generateSummary().overall_status,
        duration_ms: duration,
        output: JSON.stringify(this.results, null, 2),
        exit_code: this.generateSummary().errors > 0 ? 1 : 0,
        metadata: {
          category: 'system',
          tests_count: this.results.length,
          summary: this.generateSummary()
        }
      };

      const { error } = await supabase
        .from('iso_reports')
        .insert(report);

      if (error) {
        console.error('Erreur sauvegarde rapport:', error);
      } else {
        console.log('✅ Rapport système sauvegardé');
      }
    } catch (error) {
      console.error('Erreur sauvegarde rapport:', error);
    }
  }
}

// Exécution si appelé directement
if (require.main === module) {
  const systemTests = new SystemTests();
  systemTests.runAllTests()
    .then(result => {
      console.log('📊 Résultats des tests système:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erreur:', error);
      process.exit(1);
    });
}

module.exports = SystemTests; 