const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage du Dashboard Admin FinancialTracker...');
console.log('📡 Migration 100% terminée - Système prêt');

// Configuration des chemins
const projectRoot = path.join(__dirname, '../..');
const clientPath = path.join(projectRoot, 'client');
const serverPath = path.join(projectRoot, 'server');

console.log(`📁 Project root: ${projectRoot}`);
console.log(`📁 Client path: ${clientPath}`);
console.log(`📁 Server path: ${serverPath}`);

// Fonction pour démarrer le serveur backend
function startBackend() {
  console.log('\n🔧 Démarrage du serveur backend...');
  
  const backend = spawn('python3', ['app.py'], {
    cwd: serverPath,
    stdio: 'inherit',
    shell: true
  });
  
  backend.on('error', (error) => {
    console.error('❌ Erreur backend:', error);
  });
  
  backend.on('close', (code) => {
    console.log(`🔧 Backend terminé avec le code: ${code}`);
  });
  
  return backend;
}

// Fonction pour démarrer le frontend
function startFrontend() {
  console.log('\n🎨 Démarrage du frontend...');
  
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: clientPath,
    stdio: 'inherit',
    shell: true
  });
  
  frontend.on('error', (error) => {
    console.error('❌ Erreur frontend:', error);
  });
  
  frontend.on('close', (code) => {
    console.log(`🎨 Frontend terminé avec le code: ${code}`);
  });
  
  return frontend;
}

// Fonction pour afficher les informations de connexion
function displayConnectionInfo() {
  console.log('\n🌐 Informations de Connexion:');
  console.log('=============================');
  console.log('📱 Frontend: http://localhost:5173');
  console.log('🔧 Backend: http://localhost:5000');
  console.log('📊 Dashboard Admin: http://localhost:5173/admin');
  console.log('');
  console.log('🔑 Identifiants Admin:');
  console.log('- Email: admin@profitum.fr');
  console.log('- Mot de passe: admin123');
  console.log('');
  console.log('💡 Fonctionnalités disponibles:');
  console.log('- Gestion des assignations expert/client');
  console.log('- Tableau de bord avec statistiques');
  console.log('- Messagerie temps réel');
  console.log('- Gestion des produits éligibles');
  console.log('- Rapports et analyses');
  console.log('- Gestion documentaire');
}

// Fonction pour gérer l'arrêt propre
function setupGracefulShutdown(backend, frontend) {
  const shutdown = () => {
    console.log('\n🛑 Arrêt en cours...');
    
    if (backend) {
      backend.kill('SIGTERM');
    }
    
    if (frontend) {
      frontend.kill('SIGTERM');
    }
    
    setTimeout(() => {
      console.log('✅ Arrêt terminé');
      process.exit(0);
    }, 2000);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Fonction principale
async function main() {
  try {
    console.log('🎯 Démarrage du système FinancialTracker...\n');
    
    // Afficher les informations de connexion
    displayConnectionInfo();
    
    // Démarrer le backend
    const backend = startBackend();
    
    // Attendre un peu avant de démarrer le frontend
    setTimeout(() => {
      const frontend = startFrontend();
      
      // Configurer l'arrêt propre
      setupGracefulShutdown(backend, frontend);
      
      console.log('\n🎉 Système démarré avec succès !');
      console.log('📱 Accédez au dashboard: http://localhost:5173/admin');
      console.log('🛑 Appuyez sur Ctrl+C pour arrêter');
      
    }, 3000);
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
    process.exit(1);
  }
}

// Exécuter le script
main(); 