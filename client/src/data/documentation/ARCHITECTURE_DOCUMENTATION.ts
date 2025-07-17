export const ARCHITECTURE_DOCUMENTATION_DOC = { id: 'architecture-documentation, ', title: 'Documentation Technique Architecture, ', category: 'technical, ', description: 'Documentation complète de l\'architecture systèm, e, déploiement et infrastructure', content: `
    <h1>🏗️ Documentation Technique Architecture - FinancialTracker</h1>
    
    <p><strong>Date de mise à jour :</strong> 3 Janvier 2025<br>
    <strong>Version :</strong> 1.0<br>
    <strong>Architecture :</strong> Microservices + Monolithique hybride<br>
    <strong>Environnement :</strong> Développement local + Production cloud</p>

    <h2>📊 Vue d'Ensemble de l'Architecture</h2>
    
    <h3>Architecture Générale</h3>
    <p>FinancialTracker utilise une architecture hybride combinant des éléments monolithiques pour la simplicité et des microservices pour la scalabilité.</p>

    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h4>🖥️ Frontend (Client)</h4>
      <ul>
        <li><strong>Framework :</strong> React 18 + TypeScript</li>
        <li><strong>Build Tool :</strong> Vite</li>
        <li><strong>Styling :</strong> Tailwind CSS</li>
        <li><strong>State Management :</strong> React Context + Hooks</li>
        <li><strong>Port :</strong> 3000</li>
      </ul>
    </div>

    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h4>🔧 Backend (Serveur)</h4>
      <ul>
        <li><strong>Runtime :</strong> Node.js 18+</li>
        <li><strong>Framework :</strong> Express.js</li>
        <li><strong>Language :</strong> TypeScript</li>
        <li><strong>Port :</strong> 5001</li>
      </ul>
    </div>

    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h4>🗄️ Base de Données</h4>
      <ul>
        <li><strong>DBMS :</strong> PostgreSQL 15+</li>
        <li><strong>Hébergement :</strong> Supabase Cloud</li>
        <li><strong>Sécurité :</strong> Row Level Security (RLS)</li>
        <li><strong>Réplication :</strong> Temps réel</li>
      </ul>
    </div>

    <h2>🔌 Communication Inter-Services</h2>
    
    <h3>Frontend ↔ Backend</h3>
    <ul>
      <li><strong>Protocole :</strong> HTTP/HTTPS</li>
      <li><strong>Format :</strong> JSON</li>
      <li><strong>Authentification :</strong> JWT Bearer Token</li>
      <li><strong>CORS :</strong> Configuré pour le développement local</li>
    </ul>

    <h3>Backend ↔ Base de Données</h3>
    <ul>
      <li><strong>Client :</strong> Supabase JavaScript Client</li>
      <li><strong>Connection Pool :</strong> Géré par Supabase</li>
      <li><strong>Requêtes :</strong> SQL + Query Builder</li>
      <li><strong>Cache :</strong> Redis (optionnel)</li>
    </ul>

    <h3>WebSocket pour Temps Réel</h3>
    <ul>
      <li><strong>Protocole :</strong> WebSocket</li>
      <li><strong>Port :</strong> 5001 (même serveur)</li>
      <li><strong>Authentification :</strong> JWT via handshake</li>
      <li><strong>Events :</strong> Message, s, notifications, statuts</li>
    </ul>

    <h2>🏢 Structure des Services</h2>
    
    <h3>Service d'Authentification</h3>
    <pre><code>📁 auth/
├── middleware/
│   ├── auth.ts          # Middleware d'authentification
│   ├── auth-debug.ts    # Debug des tokens
│   └── auth-enhanced.ts # Authentification avancée
├── routes/
│   └── auth.ts          # Routes d'authentification
└── lib/
    └── auth.ts          # Utilitaires d'auth</code></pre>

    <h3>Service de Messagerie</h3>
    <pre><code>📁 messaging/
├── routes/
│   └── messages.ts      # API REST messages
├── websocket/
│   └── ws-server.ts     # Serveur WebSocket
└── services/
    └── messageService.ts # Logique métier</code></pre>

    <h3>Service de Marketplace</h3>
    <pre><code>📁 marketplace/
├── routes/
│   ├── experts.ts       # API experts
│   └── assignments.ts   # API assignations
├── services/
│   └── expertService.ts # Logique experts
└── cache/
    └── redis.ts         # Cache Redis</code></pre>

    <h3>Service d'Administration</h3>
    <pre><code>📁 admin/
├── routes/
│   ├── dashboard.ts     # Dashboard admin
│   ├── clients.ts       # Gestion clients
│   └── experts.ts       # Gestion experts
├── services/
│   └── adminService.ts  # Logique admin
└── monitoring/
    └── metrics.ts       # Métriques système</code></pre>

    <h2>🗄️ Architecture de Base de Données</h2>
    
    <h3>Schéma Relationnel</h3>
    <pre><code>📊 Tables Principales
├── Expert (25 colonnes)
├── Client (31 colonnes)
├── ProduitEligible (13 colonnes)
└── expertassignment (22 colonnes)

📊 Tables de Communication
├── message (19 colonnes)
├── notification (16 colonnes)
└── ChatbotLog (8 colonnes)

📊 Tables Administratives
├── Admin (8 colonnes)
├── AdminAuditLog (10 colonnes)
└── access_logs (10 colonnes)

📊 Tables de Contenu
├── documentation (11 colonnes)
├── documentation_categories (9 colonnes)
└── documentation_items (16 colonnes)</code></pre>

    <h3>Relations Clés</h3>
    <ul>
      <li><strong>Expert ↔ Client :</strong> Via expertassignment (many-to-many)</li>
      <li><strong>Client ↔ Produit :</strong> Via ClientProduitEligible (many-to-many)</li>
      <li><strong>Message :</strong> Lié aux conversations (polymorphique)</li>
      <li><strong>Audit :</strong> Traçabilité complète des actions</li>
    </ul>

    <h3>Index et Performance</h3>
    <ul>
      <li><strong>Clés primaires :</strong> UUID avec index B-tree</li>
      <li><strong>Clés étrangères :</strong> Index automatiques</li>
      <li><strong>Recherche :</strong> Index sur email, nom, statut</li>
      <li><strong>Temps :</strong> Index sur created_at, updated_at</li>
      <li><strong>Performance :</strong> Temps de réponse moyen 78ms</li>
    </ul>

    <h2>🔐 Sécurité et Conformité</h2>
    
    <h3>Authentification et Autorisation</h3>
    <ul>
      <li><strong>Provider :</strong> Supabase Auth</li>
      <li><strong>Tokens :</strong> JWT avec expiration</li>
      <li><strong>Refresh :</strong> Tokens de rafraîchissement</li>
      <li><strong>RLS :</strong> Row Level Security sur toutes les tables</li>
      <li><strong>Permissions :</strong> Basées sur les rôles (client, expert, admin)</li>
    </ul>

    <h3>Chiffrement et Protection</h3>
    <ul>
      <li><strong>Transit :</strong> TLS 1.3 obligatoire</li>
      <li><strong>Repos :</strong> AES-256 sur Supabase</li>
      <li><strong>Mots de passe :</strong> Hachage bcrypt</li>
      <li><strong>Sensibles :</strong> Chiffrement au niveau application</li>
      <li><strong>Headers :</strong> Sécurité renforcée (CSP, HSTS, etc.)</li>
    </ul>

    <h3>Audit et Traçabilité</h3>
    <ul>
      <li><strong>Logs d'accès :</strong> Toutes les connexions</li>
      <li><strong>Logs d'audit :</strong> Actions sensibles</li>
      <li><strong>Rétention :</strong> 7 ans minimum</li>
      <li><strong>Conformité :</strong> ISO 27001, RGPD</li>
      <li><strong>Monitoring :</strong> Alertes en temps réel</li>
    </ul>

    <h2>⚡ Performance et Scalabilité</h2>
    
    <h3>Optimisations Frontend</h3>
    <ul>
      <li><strong>Build :</strong> Vite pour compilation rapide</li>
      <li><strong>Code Splitting :</strong> Chargement à la demande</li>
      <li><strong>Cache :</strong> Service Workers pour les assets</li>
      <li><strong>Lazy Loading :</strong> Composants et routes</li>
      <li><strong>Bundle Size :</strong> < 2MB gzippé</li>
    </ul>

    <h3>Optimisations Backend</h3>
    <ul>
      <li><strong>Compression :</strong> Gzip pour toutes les réponses</li>
      <li><strong>Cache :</strong> Redis pour les données fréquentes</li>
      <li><strong>Connection Pool :</strong> Géré par Supabase</li>
      <li><strong>Rate Limiting :</strong> 100 req/15min par IP</li>
      <li><strong>Async/Await :</strong> Gestion non-bloquante</li>
    </ul>

    <h3>Optimisations Base de Données</h3>
    <ul>
      <li><strong>Index :</strong> Optimisés pour les requêtes fréquentes</li>
      <li><strong>Requêtes :</strong> Optimisées et monitorées</li>
      <li><strong>Partitioning :</strong> Tables de logs par date</li>
      <li><strong>Archivage :</strong> Données anciennes compressées</li>
      <li><strong>Monitoring :</strong> Requêtes lentes identifiées</li>
    </ul>

    <h2>🚀 Déploiement et Infrastructure</h2>
    
    <h3>Environnement de Développement</h3>
    <pre><code>🌐 Local Development
├── Frontend: http://localhost:3000
├── Backend:  http://localhost:5001
├── Database: Supabase Cloud
└── Cache:    Redis local (optionnel)

📦 Scripts de Démarrage
├── start-network.sh    # Démarrage complet
├── start_servers.sh    # Serveurs uniquement
└── restart_servers.sh  # Redémarrage</code></pre>

    <h3>Environnement de Production</h3>
    <pre><code>☁️ Production Infrastructure
├── Frontend: Vercel/Netlify
├── Backend:  Railway/Render
├── Database: Supabase Pro
├── Cache:    Redis Cloud
└── CDN:      Cloudflare</code></pre>

    <h3>Configuration par Environnement</h3>
    <ul>
      <li><strong>Development :</strong> Variables locales (.env)</li>
      <li><strong>Staging :</strong> Variables d'environnement</li>
      <li><strong>Production :</strong> Variables sécurisées</li>
      <li><strong>Secrets :</strong> Gérés par la plateforme</li>
    </ul>

    <h2>📊 Monitoring et Observabilité</h2>
    
    <h3>Métriques Système</h3>
    <ul>
      <li><strong>CPU :</strong> Utilisation < 80%</li>
      <li><strong>Mémoire :</strong> Utilisation < 85%</li>
      <li><strong>Disque :</strong> Utilisation < 90%</li>
      <li><strong>Réseau :</strong> Latence < 100ms</li>
    </ul>

    <h3>Métriques Application</h3>
    <ul>
      <li><strong>Temps de réponse :</strong> < 200ms (moyenne)</li>
      <li><strong>Taux d'erreur :</strong> < 1%</li>
      <li><strong>Disponibilité :</strong> 99.9%</li>
      <li><strong>Concurrents :</strong> 100+ utilisateurs</li>
    </ul>

    <h3>Outils de Monitoring</h3>
    <ul>
      <li><strong>Logs :</strong> Winston + ELK Stack</li>
      <li><strong>Métriques :</strong> Prometheus + Grafana</li>
      <li><strong>Alertes :</strong> Slac, k, email, SMS</li>
      <li><strong>APM :</strong> New Relic / DataDog</li>
    </ul>

    <h2>🔄 CI/CD et DevOps</h2>
    
    <h3>Pipeline de Déploiement</h3>
    <pre><code>🔄 CI/CD Pipeline
├── 1. Code Review (GitHub)
├── 2. Tests Automatisés
│   ├── Tests unitaires
│   ├── Tests d'intégration
│   └── Tests de sécurité
├── 3. Build et Package
├── 4. Déploiement Staging
├── 5. Tests de Validation
└── 6. Déploiement Production</code></pre>

    <h3>Tests Automatisés</h3>
    <ul>
      <li><strong>Unitaires :</strong> Jest (Frontend + Backend)</li>
      <li><strong>Intégration :</strong> Supertest (API)</li>
      <li><strong>E2E :</strong> Cypress (Workflows)</li>
      <li><strong>Sécurité :</strong> OWASP ZAP</li>
      <li><strong>Performance :</strong> Lighthouse CI</li>
    </ul>

    <h3>Gestion des Versions</h3>
    <ul>
      <li><strong>Versioning :</strong> Semantic Versioning (SemVer)</li>
      <li><strong>Branches :</strong> Git Flow</li>
      <li><strong>Releases :</strong> GitHub Releases</li>
      <li><strong>Changelog :</strong> Automatique</li>
    </ul>

    <h2>🛡️ Sécurité et Conformité</h2>
    
    <h3>Standards de Sécurité</h3>
    <ul>
      <li><strong>ISO 27001 :</strong> Management de la sécurité</li>
      <li><strong>OWASP Top 10 :</strong> Vulnérabilités web</li>
      <li><strong>RGPD :</strong> Protection des données</li>
      <li><strong>PCI DSS :</strong> Données de paiement</li>
    </ul>

    <h3>Tests de Sécurité</h3>
    <ul>
      <li><strong>Vulnérabilités :</strong> Scan automatique</li>
      <li><strong>Penetration Testing :</strong> Tests manuels</li>
      <li><strong>Code Review :</strong> Sécurité du code</li>
      <li><strong>Dépendances :</strong> Scan des vulnérabilités</li>
    </ul>

    <h3>Incident Response</h3>
    <ul>
      <li><strong>Détection :</strong> Monitoring 24/7</li>
      <li><strong>Réponse :</strong> Équipe dédiée</li>
      <li><strong>Communication :</strong> Plan de crise</li>
      <li><strong>Récupération :</strong> Procédures définies</li>
    </ul>

    <h2>📈 Évolutions Futures</h2>
    
    <h3>Architecture Cible</h3>
    <ul>
      <li><strong>Microservices :</strong> Décomposition progressive</li>
      <li><strong>Event-Driven :</strong> Architecture événementielle</li>
      <li><strong>API Gateway :</strong> Centralisation des APIs</li>
      <li><strong>Service Mesh :</strong> Communication inter-services</li>
    </ul>

    <h3>Technologies Émergentes</h3>
    <ul>
      <li><strong>GraphQL :</strong> API plus flexible</li>
      <li><strong>gRPC :</strong> Communication inter-services</li>
      <li><strong>Kubernetes :</strong> Orchestration containers</li>
      <li><strong>Serverless :</strong> Fonctions sans serveur</li>
    </ul>

    <h3>Scalabilité</h3>
    <ul>
      <li><strong>Horizontal :</strong> Réplication des services</li>
      <li><strong>Vertical :</strong> Ressources augmentées</li>
      <li><strong>Auto-scaling :</strong> Adaptation automatique</li>
      <li><strong>Multi-region :</strong> Déploiement géographique</li>
    </ul>

    <h2>📋 Documentation et Formation</h2>
    
    <h3>Documentation Technique</h3>
    <ul>
      <li><strong>Architecture :</strong> Ce document</li>
      <li><strong>API :</strong> Swagger/OpenAPI</li>
      <li><strong>Base de données :</strong> Schémas et relations</li>
      <li><strong>Déploiement :</strong> Guides étape par étape</li>
    </ul>

    <h3>Formation Équipe</h3>
    <ul>
      <li><strong>Onboarding :</strong> Guide de démarrage</li>
      <li><strong>Bonnes pratiques :</strong> Standards de code</li>
      <li><strong>Sécurité :</strong> Formation obligatoire</li>
      <li><strong>Maintenance :</strong> Procédures opérationnelles</li>
    </ul>

    <h2>🔧 Outils et Technologies</h2>
    
    <h3>Stack Technique</h3>
    <table>
      <tr><th>Couche</th><th>Technologies</th><th>Versions</th></tr>
      <tr><td>Frontend</td><td>React, TypeScript, Tailwind</td><td>18.x, 5.x, 3.x</td></tr>
      <tr><td>Backend</td><td>Node.js, Express, TypeScript</td><td>18.x, 4.x, 5.x</td></tr>
      <tr><td>Base de données</td><td>PostgreSQL, Supabase</td><td>15.x, Latest</td></tr>
      <tr><td>Cache</td><td>Redis</td><td>7.x</td></tr>
      <tr><td>Build</td><td>Vite, Webpack</td><td>5.x, 5.x</td></tr>
    </table>

    <h3>Outils de Développement</h3>
    <ul>
      <li><strong>IDE :</strong> VS Code avec extensions</li>
      <li><strong>Git :</strong> GitHub avec workflows</li>
      <li><strong>Testing :</strong> Jest, Cypress, Supertest</li>
      <li><strong>Linting :</strong> ESLint, Prettier</li>
      <li><strong>Monitoring :</strong> Winston, Prometheus</li>
    </ul>

    <h2>📞 Support et Maintenance</h2>
    
    <p><strong>Équipe technique :</strong> tech@financialtracker.fr<br>
    <strong>Documentation :</strong> <a href="/admin/documentation">Interface admin</a><br>
    <strong>Status :</strong> <a href="/status">Page de statut</a><br>
    <strong>Urgences :</strong> +33 1 XX XX XX XX</p>

    <h2>🔗 Ressources</h2>
    <ul>
      <li><strong>React :</strong> <a href="https: //react.dev/">Documentation officielle</a></li>
      <li><strong>Express :</strong> <a href="https://expressjs.com/">Guide de référence</a></li>
      <li><strong>Supabase :</strong> <a href="https://supabase.com/docs">Documentation</a></li>
      <li><strong>TypeScript :</strong> <a href="https://www.typescriptlang.org/docs/">Handbook</a></li>
    </ul>

    <h2>🔄 Workflows Métiers</h2>
    
    <h3>Workflow Produit (ProductProcessWorkflow)</h3>
    <p>Processus détaillé pour les pages produits individuelles avec présélection d'experts optimisée pour la conversion.</p>
    
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h4>📋 Étapes du Workflow</h4>
      <ol>
        <li><strong>Simulation validée</strong> - Produit éligible confirmé</li>
        <li><strong>Signature de la charte</strong> - Conditions d'engagement acceptées</li>
        <li><strong>Sélection d'expert</strong> - Présélection Top 3 + assignation</li>
        <li><strong>Complétion du dossier</strong> - Informations nécessaires remplies</li>
        <li><strong>Validation administrative</strong> - Vérification et approbation</li>
        <li><strong>Dossier finalisé</strong> - Mission accomplie</li>
      </ol>
    </div>

    <h3>Workflow Marketplace (MarketplaceSimplified)</h3>
    <p>Marketplace épurée avec sections par produit et gestion contextuelle de la signature charte.</p>
    
    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h4>🎯 Optimisations de Conversion</h4>
      <ul>
        <li><strong>Présélection immédiate</strong> - Top 3 experts après signature charte</li>
        <li><strong>Signature contextuelle</strong> - Modal au moment du besoin</li>
        <li><strong>Processus simplifié</strong> - Étapes claires et actions directes</li>
        <li><strong>Personnalisation produit</strong> - Libellés adaptés à chaque produit</li>
      </ul>
    </div>

    <h3>Flux Utilisateur Optimisé</h3>
    <pre><code>Page produit → Signature charte → Présélection expert (Top 3) → Assignation directe
                    ↓
                Marketplace (si "Voir plus")</code></pre>

    <h3>Composants Techniques</h3>
    <pre><code>📁 components/
├── ProductProcessWorkflow.tsx    # Workflow détaillé pages produits
├── MarketplaceSimplified.tsx    # Marketplace épurée
└── ProcessWorkflow.tsx          # Workflow générique (legacy)</code></pre>, `, filePath: 'ARCHITECTURE_DOCUMENTATION.md, ', lastModified: new Date('2025-01-03'), tags: ['architecture, ', 'système', 'déploiement', 'infrastructure', 'performance', 'sécurité'], readTime: 30 }; 