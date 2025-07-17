export const GUIDE_HEBERGEMENT_DOC = { id: 'guide-hebergement, ', title: 'GUIDE-HEBERGEMENT-TEMPORAIRE.md, ', category: 'guides, ', description: 'Guide d\'hébergement temporaire sur réseau local, ', content: `
    <h1>🌐 Guide d'Hébergement Temporaire - FinancialTracker</h1>
    <h2>🚀 Solution Recommandée : Hébergement Local WiFi</h2>
    <h3>Avantages</h3>
    <ul>
      <li>✅ <strong>Sécurisé</strong> : Accès uniquement sur votre réseau local</li>
      <li>✅ <strong>Rapide</strong> : Pas de latence internet</li>
      <li>✅ <strong>Gratuit</strong> : Aucun coût d'hébergement</li>
      <li>✅ <strong>Simple</strong> : Configuration automatique</li>
    </ul>
    <h2>📋 Instructions de Démarrage</h2>
    <h3>Étape 1 : Préparation</h3>
    <pre><code># Dans le termina, l, à la racine du projet
cd /Users/alex/Desktop/FinancialTracker

# Rendre le script exécutable (si pas déjà fait)
chmod +x start-network.sh</code></pre>
    <h3>Étape 2 : Démarrer l'Application</h3>
    <pre><code># Lancer le script de démarrage réseau
./start-network.sh</code></pre>
    <h3>Étape 3 : Obtenir l'Adresse IP</h3>
    <p>Le script affichera automatiquement :</p>
    <pre><code>📡 Adresse IP locale détectée: 192.168.1.XX
🌐 L'application sera accessible sur:
   Frontend: http://192.168.1.XX:3000
   Backend:  http://192.168.1.XX:5001</code></pre>
    <h2>📱 Instructions pour l'Utilisateur</h2>
    <h3>1. Connexion WiFi</h3>
    <ul>
      <li>Se connecter à votre réseau WiFi</li>
      <li>Noter l'adresse IP affichée (ex: <code>192.168.1.XX</code>)</li>
    </ul>
    <h3>2. Accès à l'Application</h3>
    <ul>
      <li>Ouvrir un navigateur (Chrom, e, Safari, Firefox)</li>
      <li>Aller sur : <code>http: //192.168.1.XX:3000</code></li>
      <li>L'application se chargera automatiquement</li>
    </ul>
    <h3>3. Connexion</h3>
    <ul>
      <li><strong>Email</strong> : <code>grandjean.alexandre5@gmail.com</code></li>
      <li><strong>Mot de passe</strong> : <code>test123</code></li>
      <li>Cliquer sur "Se connecter"</li>
    </ul>
    <h3>4. Navigation</h3>
    <ul>
      <li><strong>Dashboard Admin</strong> : Accès complet aux fonctionnalités</li>
      <li><strong>Pilotage des Tests</strong> : <code>/admin/tests</code></li>
      <li><strong>Monitoring</strong> : <code>/admin/monitoring</code></li>
      <li><strong>Gestion des Clients</strong> : <code>/admin/gestion-clients</code></li>
    </ul>
    <h2>🔧 Configuration Technique</h2>
    <h3>Frontend (Vite)</h3>
    <ul>
      <li><strong>Port</strong> : 3000</li>
      <li><strong>Host</strong> : 0.0.0.0 (accessible depuis le réseau)</li>
      <li><strong>CORS</strong> : Configuré pour le réseau local</li>
    </ul>
    <h3>Backend (Express)</h3>
    <ul>
      <li><strong>Port</strong> : 5001</li>
      <li><strong>Host</strong> : 0.0.0.0 (accessible depuis le réseau)</li>
      <li><strong>CORS</strong> : Autorise les requêtes du frontend</li>
    </ul>
    <h3>Base de Données</h3>
    <ul>
      <li><strong>Supabase</strong> : Hébergée en cloud (pas de configuration locale nécessaire)</li>
      <li><strong>Authentification</strong> : Fonctionnelle</li>
    </ul>
    <h2>🛡️ Sécurité</h2>
    <h3>Mesures Implémentées</h3>
    <ul>
      <li>✅ <strong>Authentification Supabase</strong> : Sécurisée</li>
      <li>✅ <strong>CORS Configuré</strong> : Limité au réseau local</li>
      <li>✅ <strong>Rate Limiting</strong> : 100 requêtes/15min par IP</li>
      <li>✅ <strong>Validation des Entrées</strong> : Protection contre les injections</li>
      <li>✅ <strong>Logs d'Accès</strong> : Traçabilité complète</li>
    </ul>
    <h3>Recommandations</h3>
    <ul>
      <li>🔒 <strong>WiFi Sécurisé</strong> : Utiliser un mot de passe fort</li>
      <li>🔒 <strong>Session Limitée</strong> : Tester pendant une durée limitée</li>
      <li>🔒 <strong>Surveillance</strong> : Vérifier les logs d'accès</li>
    </ul>
    <h2>🚨 Dépannage</h2>
    <h3>Problème : L'utilisateur ne peut pas accéder</h3>
    <p><strong>Solution</strong> :</p>
    <ol>
      <li>Vérifier que l'utilisateur est sur le même WiFi</li>
      <li>Vérifier l'adresse IP affichée</li>
      <li>Tester avec <code>ping 192.168.1.XX</code></li>
    </ol>
    <h3>Problème : Erreur de connexion</h3>
    <p><strong>Solution</strong> :</p>
    <ol>
      <li>Vérifier que les deux serveurs sont démarrés</li>
      <li>Vérifier les logs dans le terminal</li>
      <li>Redémarrer avec <code>./start-network.sh</code></li>
    </ol>
    <h3>Problème : Page blanche</h3>
    <p><strong>Solution</strong> :</p>
    <ol>
      <li>Vider le cache du navigateur</li>
      <li>Essayer un autre navigateur</li>
      <li>Vérifier la console du navigateur (F12)</li>
    </ol>
    <h2>📊 Fonctionnalités Disponibles</h2>
    <h3>Dashboard Admin</h3>
    <ul>
      <li>✅ <strong>Vue d'ensemble</strong> : Statistiques et KPIs</li>
      <li>✅ <strong>Gestion des clients</strong> : CRUD complet</li>
      <li>✅ <strong>Gestion des experts</strong> : CRUD complet</li>
      <li>✅ <strong>Monitoring système</strong> : CP, U, mémoire, logs</li>
      <li>✅ <strong>Pilotage des tests</strong> : Tests automatisés</li>
    </ul>
    <h3>Tests Disponibles</h3>
    <ul>
      <li>🔒 <strong>Sécurité</strong> : Audit ISO 27001, vulnérabilités</li>
      <li>⚡ <strong>Performance</strong> : Charge, métriques système</li>
      <li>🗄️ <strong>Base de données</strong> : Intégrité, sauvegardes</li>
      <li>🌐 <strong>API</strong> : Endpoints, authentification</li>
      <li>💻 <strong>Système</strong> : Ressources, processus</li>
    </ul>
    <h2>🎯 Scénarios de Test</h2>
    <h3>Test Complet (Recommandé)</h3>
    <ol>
      <li><strong>Connexion</strong> : Vérifier l'authentification</li>
      <li><strong>Dashboard</strong> : Explorer les fonctionnalités</li>
      <li><strong>Tests</strong> : Lancer quelques tests de catégories</li>
      <li><strong>Monitoring</strong> : Vérifier les métriques système</li>
      <li><strong>Gestion</strong> : Tester l'ajout/modification de données</li>
    </ol>
    <h3>Test Rapide</h3>
    <ol>
      <li><strong>Connexion</strong> : Se connecter</li>
      <li><strong>Tests</strong> : Lancer "Tous les tests"</li>
      <li><strong>Résultats</strong> : Vérifier les logs et résultats</li>
    </ol>
    <h2>🛑 Arrêt de l'Application</h2>
    <h3>Arrêt Propre</h3>
    <pre><code># Dans le terminal où l'application tourne
Ctrl + C</code></pre>
    <h3>Arrêt Forcé (si nécessaire)</h3>
    <pre><code># Arrêter tous les processus Node.js
pkill -f "node"</code></pre>
    <h2>📞 Support</h2>
    <h3>En Cas de Problème</h3>
    <ol>
      <li><strong>Vérifier les logs</strong> dans le terminal</li>
      <li><strong>Redémarrer</strong> l'application</li>
      <li><strong>Vérifier la connexion WiFi</strong></li>
      <li><strong>Tester avec un autre appareil</strong></li>
    </ol>
    <h3>Informations Utiles</h3>
    <ul>
      <li><strong>Adresse IP</strong> : Affichée au démarrage</li>
      <li><strong>Ports</strong> : 3000 (frontend), 5001 (backend)</li>
      <li><strong>Logs</strong> : Visibles dans le terminal</li>
      <li><strong>Base de données</strong> : Supabase (cloud)</li>
    </ul>
    <p><strong>🎉 L'application est maintenant prête pour les tests !</strong></p>
  `, filePath: 'GUIDE-HEBERGEMENT-TEMPORAIRE.md, ', lastModified: new Date('2024-01-30'), tags: ['hébergement, ', 'guide', 'réseau', 'local'], readTime: 8 }; 