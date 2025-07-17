export const DEVELOPER_QUICKSTART_DOC = { id: 'developer-quickstart, ', title: 'Guide de Démarrage Rapide Développeur, ', category: 'technical, ', description: 'Guide complet pour démarrer rapidement le développement sur FinancialTracker, ', content: `
    <h1>🚀 Guide de Démarrage Rapide - FinancialTracker</h1>
    
    <p><strong>Date de mise à jour :</strong> 3 Janvier 2025<br>
    <strong>Version :</strong> 1.0<br>
    <strong>Public :</strong> Développeurs et contributeurs<br>
    <strong>Temps estimé :</strong> 15 minutes</p>

    <h2>📋 Prérequis</h2>
    
    <h3>Outils Requis</h3>
    <ul>
      <li><strong>Node.js :</strong> Version 18+ (recommandé : 20.x)</li>
      <li><strong>npm :</strong> Version 9+ ou yarn</li>
      <li><strong>Git :</strong> Version 2.30+</li>
      <li><strong>IDE :</strong> VS Code (recommandé)</li>
      <li><strong>Terminal :</strong> Bas, h, Zsh ou PowerShell</li>
    </ul>

    <h3>Extensions VS Code Recommandées</h3>
    <ul>
      <li><strong>TypeScript :</strong> Support natif</li>
      <li><strong>ESLint :</strong> Linting JavaScript/TypeScript</li>
      <li><strong>Prettier :</strong> Formatage de code</li>
      <li><strong>Tailwind CSS IntelliSense :</strong> Autocomplétion CSS</li>
      <li><strong>GitLens :</strong> Historique Git avancé</li>
    </ul>

    <h2>🔧 Installation et Configuration</h2>
    
    <h3>1. Cloner le Repository</h3>
    <pre><code># Cloner le projet
git clone https: //github.com/votre-org/FinancialTracker.git
cd FinancialTracker

# Vérifier la branche
git branch
# Assurez-vous d'être sur la branche main ou develop</code></pre>

    <h3>2. Configuration de l'Environnement</h3>
    <pre><code># Copier les fichiers de configuration
cp security-config.example.env .env.local

# Éditer le fichier .env.local avec vos variables
nano .env.local</code></pre>

    <h4>Variables d'Environnement Requises</h4>
    <pre><code># Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Server Configuration
PORT=5001
NODE_ENV=development

# Redis (optionnel pour le cache)
REDIS_URL=redis://localhost:6379</code></pre>

    <h3>3. Installation des Dépendances</h3>
    <pre><code># Installer les dépendances frontend
cd client
npm install

# Installer les dépendances backend
cd ../server
npm install

# Retourner à la racine
cd ..</code></pre>

    <h2>🚀 Démarrage Rapide</h2>
    
    <h3>Option 1 : Démarrage Automatique (Recommandé)</h3>
    <pre><code># À la racine du projet
chmod +x start_servers.sh
./start_servers.sh

# Ou pour le réseau local
chmod +x start-network.sh
./start-network.sh</code></pre>

    <h3>Option 2 : Démarrage Manuel</h3>
    <pre><code># Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev</code></pre>

    <h3>3. Vérification du Démarrage</h3>
    <ul>
      <li><strong>Frontend :</strong> <a href="http://localhost:3000">http://localhost:3000</a></li>
      <li><strong>Backend :</strong> <a href="http://localhost:5001/api/health">http://localhost:5001/api/health</a></li>
      <li><strong>Documentation API :</strong> <a href="http://localhost:5001/api/docs">http://localhost:5001/api/docs</a></li>
    </ul>

    <h2>🔐 Première Connexion</h2>
    
    <h3>Comptes de Test Disponibles</h3>
    <table>
      <tr><th>Rôle</th><th>Email</th><th>Mot de passe</th><th>Accès</th></tr>
      <tr><td>Admin</td><td>admin@financialtracker.fr</td><td>admin123</td><td>Complet</td></tr>
      <tr><td>Client</td><td>client@example.com</td><td>client123</td><td>Dashboard client</td></tr>
      <tr><td>Expert</td><td>expert@example.com</td><td>expert123</td><td>Dashboard expert</td></tr>
    </table>

    <h3>Connexion Admin (Recommandée)</h3>
    <ol>
      <li>Aller sur <a href="http://localhost:3000">http://localhost:3000</a></li>
      <li>Cliquer sur "Se connecter"</li>
      <li>Utiliser les identifiants admin</li>
      <li>Accéder au dashboard admin</li>
    </ol>

    <h2>📁 Structure du Projet</h2>
    
    <h3>Organisation des Dossiers</h3>
    <pre><code>FinancialTracker/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── pages/         # Pages de l'application
│   │   ├── hooks/         # Hooks personnalisés
│   │   ├── lib/           # Utilitaires et services
│   │   ├── types/         # Types TypeScript
│   │   └── data/          # Données statiques
│   ├── public/            # Assets publics
│   └── package.json
├── server/                # Backend Node.js
│   ├── src/
│   │   ├── routes/        # Routes API
│   │   ├── middleware/    # Middlewares
│   │   ├── services/      # Services métier
│   │   ├── types/         # Types TypeScript
│   │   └── utils/         # Utilitaires
│   ├── migrations/        # Migrations DB
│   └── package.json
├── shared/                # Code partagé
│   ├── types/             # Types communs
│   └── constants/         # Constantes partagées
└── docs/                  # Documentation</code></pre>

    <h2>🛠️ Commandes Utiles</h2>
    
    <h3>Développement Frontend</h3>
    <pre><code>cd client

# Démarrer en mode développement
npm run dev

# Build de production
npm run build

# Preview du build
npm run preview

# Tests
npm run test
npm run test:watch

# Linting
npm run lint
npm run lint:fix

# Formatage
npm run format</code></pre>

    <h3>Développement Backend</h3>
    <pre><code>cd server

# Démarrer en mode développement
npm run dev

# Build TypeScript
npm run build

# Démarrer en production
npm start

# Tests
npm run test
npm run test:watch

# Linting
npm run lint
npm run lint:fix

# Migrations DB
npm run migrate
npm run migrate:status</code></pre>

    <h3>Scripts Utilitaires</h3>
    <pre><code># À la racine du projet

# Démarrer tous les services
./start_servers.sh

# Démarrer en mode réseau
./start-network.sh

# Nettoyer et redémarrer
./restart_servers.sh

# Tests complets
npm run test:all

# Vérification de la base de données
node server/check-database.js</code></pre>

    <h2>🔍 Debug et Dépannage</h2>
    
    <h3>Logs et Monitoring</h3>
    <ul>
      <li><strong>Frontend :</strong> Console du navigateur (F12)</li>
      <li><strong>Backend :</strong> Terminal du serveur</li>
      <li><strong>Base de données :</strong> Supabase Dashboard</li>
      <li><strong>Réseau :</strong> Onglet Network (F12)</li>
    </ul>

    <h3>Problèmes Courants</h3>
    
    <h4>Erreur de Port Déjà Utilisé</h4>
    <pre><code># Vérifier les processus
lsof -i :3000
lsof -i :5001

# Tuer les processus
kill -9 &lt;PID&gt;

# Ou redémarrer proprement
./restart_servers.sh</code></pre>

    <h4>Erreur de Connexion à la Base</h4>
    <pre><code># Vérifier les variables d'environnement
echo $VITE_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Tester la connexion
node server/check-database.js</code></pre>

    <h4>Erreur de Build</h4>
    <pre><code># Nettoyer les caches
rm -rf node_modules
rm -rf dist
npm install

# Vérifier les versions
node --version
npm --version</code></pre>

    <h2>🧪 Tests et Qualité</h2>
    
    <h3>Tests Automatisés</h3>
    <pre><code># Tests unitaires
npm run test: unit

# Tests d'intégration
npm run test:integration

# Tests E2E
npm run test:e2e

# Couverture de code
npm run test:coverage

# Tests de performance
npm run test:performance</code></pre>

    <h3>Qualité du Code</h3>
    <pre><code># Linting
npm run lint

# Formatage
npm run format

# Vérification TypeScript
npm run type-check

# Audit de sécurité
npm audit
npm audit fix</code></pre>

    <h2>📚 Ressources d'Apprentissage</h2>
    
    <h3>Documentation Technique</h3>
    <ul>
      <li><strong>Architecture :</strong> <a href="/admin/documentation/architecture-documentation">Vue d'ensemble système</a></li>
      <li><strong>API :</strong> <a href="/admin/documentation/api-documentation">Documentation complète API</a></li>
      <li><strong>Base de données :</strong> <a href="/admin/documentation/database-documentation">Schémas et relations</a></li>
      <li><strong>Guides métier :</strong> <a href="/admin/documentation">Interface admin</a></li>
    </ul>

    <h3>Technologies Utilisées</h3>
    <ul>
      <li><strong>React :</strong> <a href="https://react.dev/">Documentation officielle</a></li>
      <li><strong>TypeScript :</strong> <a href="https://www.typescriptlang.org/docs/">Handbook</a></li>
      <li><strong>Express :</strong> <a href="https://expressjs.com/">Guide de référence</a></li>
      <li><strong>Supabase :</strong> <a href="https://supabase.com/docs">Documentation</a></li>
      <li><strong>Tailwind CSS :</strong> <a href="https://tailwindcss.com/docs">Documentation</a></li>
    </ul>

    <h2>🤝 Contribution</h2>
    
    <h3>Workflow Git</h3>
    <pre><code># Créer une nouvelle branche
git checkout -b feature/nouvelle-fonctionnalite

# Développer et tester
# ... votre code ...

# Commiter les changements
git add .
git commit -m "feat: ajouter nouvelle fonctionnalité"

# Pousser la branche
git push origin feature/nouvelle-fonctionnalite

# Créer une Pull Request sur GitHub</code></pre>

    <h3>Standards de Code</h3>
    <ul>
      <li><strong>Conventions :</strong> Suivre les conventions existantes</li>
      <li><strong>Tests :</strong> Ajouter des tests pour les nouvelles fonctionnalités</li>
      <li><strong>Documentation :</strong> Mettre à jour la documentation si nécessaire</li>
      <li><strong>Linting :</strong> S'assurer que le code passe les vérifications</li>
    </ul>

    <h2>📞 Support et Contact</h2>
    
    <p><strong>Équipe technique :</strong> tech@financialtracker.fr<br>
    <strong>Issues :</strong> <a href="https://github.com/votre-org/FinancialTracker/issues">GitHub Issues</a><br>
    <strong>Discussions :</strong> <a href="https://github.com/votre-org/FinancialTracker/discussions">GitHub Discussions</a><br>
    <strong>Documentation :</strong> <a href="/admin/documentation">Interface admin</a></p>

    <h2>🎯 Prochaines Étapes</h2>
    
    <ol>
      <li><strong>Explorer l'interface :</strong> Naviguer dans les différentes sections</li>
      <li><strong>Lire la documentation :</strong> Consulter les guides techniques</li>
      <li><strong>Tester les fonctionnalités :</strong> Essayer la messageri, e, marketplace, etc.</li>
      <li><strong>Comprendre l'architecture :</strong> Étudier le code source</li>
      <li><strong>Contribuer :</strong> Commencer par des issues "good first issue"</li>
    </ol>

    <h2>🔗 Liens Rapides</h2>
    <ul>
      <li><strong>Application :</strong> <a href="http: //localhost:3000">http://localhost:3000</a></li>
      <li><strong>API :</strong> <a href="http://localhost:5001/api">http://localhost:5001/api</a></li>
      <li><strong>Documentation API :</strong> <a href="http://localhost:5001/api/docs">http://localhost:5001/api/docs</a></li>
      <li><strong>Supabase Dashboard :</strong> <a href="https://supabase.com/dashboard">https://supabase.com/dashboard</a></li>
      <li><strong>GitHub Repository :</strong> <a href="https://github.com/votre-org/FinancialTracker">https://github.com/votre-org/FinancialTracker</a></li>
    </ul>

    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>🎉 Félicitations !</h3>
      <p>Vous êtes maintenant prêt à développer sur FinancialTracker. N'hésitez pas à explorer le cod, e, tester les fonctionnalités et contribuer au projet !</p>
    </div>
  `, filePath: 'DEVELOPER_QUICKSTART.md, ', lastModified: new Date('2025-01-03'), tags: ['développeur, ', 'démarrage', 'installation', 'configuration', 'guide'], readTime: 10 }; 