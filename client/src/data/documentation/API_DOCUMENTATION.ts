export const API_DOCUMENTATION_DOC = { id: 'api-documentation, ', title: 'Documentation Technique API, ', category: 'technical, ', description: 'Documentation complète de l\'API REST avec tous les endpoint, s, authentification et exemples', content: `
    <h1>🔌 Documentation Technique API - FinancialTracker</h1>
    
    <p><strong>Date de mise à jour :</strong> 3 Janvier 2025<br>
    <strong>Version :</strong> 1.0<br>
    <strong>Base URL :</strong> http://localhost:5001/api<br>
    <strong>Authentification :</strong> JWT via Supabase</p>

    <h2>📋 Informations Générales</h2>
    
    <h3>Technologies Utilisées</h3>
    <ul>
      <li><strong>Framework :</strong> Node.js + Express</li>
      <li><strong>Langage :</strong> TypeScript</li>
      <li><strong>Base de données :</strong> Supabase (PostgreSQL)</li>
      <li><strong>Authentification :</strong> Supabase Auth + JWT</li>
      <li><strong>Validation :</strong> Joi + Zod</li>
      <li><strong>Documentation :</strong> Swagger/OpenAPI</li>
    </ul>

    <h3>Standards API</h3>
    <ul>
      <li><strong>Méthodes HTTP :</strong> GE, T, POST, PUT, DELETE, PATCH</li>
      <li><strong>Format de données :</strong> JSON</li>
      <li><strong>Encodage :</strong> UTF-8</li>
      <li><strong>Versioning :</strong> Via URL (/api/v1/)</li>
      <li><strong>Rate Limiting :</strong> 100 req/15min par IP</li>
    </ul>

    <h2>🔐 Authentification</h2>
    
    <h3>Mécanisme d'Authentification</h3>
    <p>L'API utilise l'authentification JWT via Supabase. Chaque requête doit inclure un token Bearer dans le header Authorization.</p>

    <h4>Header d'Authentification</h4>
    <pre><code>Authorization: Bearer &lt;jwt_token&gt;</code></pre>

    <h4>Obtention du Token</h4>
    <pre><code>POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com, ", "password": "password123" }

Response: { "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..., ", "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "expires_in": 3600, "user": {
    "id": "uuid", "email": "user@example.com", "user_type": "client|expert|admin" }
}</code></pre>

    <h3>Gestion des Erreurs d'Authentification</h3>
    <table>
      <tr><th>Code</th><th>Message</th><th>Description</th></tr>
      <tr><td>401</td><td>Unauthorized</td><td>Token manquant ou invalide</td></tr>
      <tr><td>403</td><td>Forbidden</td><td>Permissions insuffisantes</td></tr>
      <tr><td>419</td><td>Token Expired</td><td>Token expiré</td></tr>
    </table>

    <h2>👥 Gestion des Utilisateurs</h2>
    
    <h3>Authentification</h3>
    
    <h4>Connexion</h4>
    <pre><code>POST /auth/login
Content-Type: application/json

{ "email": "user@example.com, ", "password": "password123" }</code></pre>

    <h4>Inscription</h4>
    <pre><code>POST /auth/register
Content-Type: application/json

{ "email": "newuser@example.com, ", "password": "password123", "user_type": "client", "nom": "Jean Dupont", "nom_entreprise": "Ma Société" }</code></pre>

    <h4>Rafraîchissement du Token</h4>
    <pre><code>POST /auth/refresh
Content-Type: application/json

{ "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }</code></pre>

    <h4>Déconnexion</h4>
    <pre><code>POST /auth/logout
Authorization: Bearer &lt;token&gt;</code></pre>

    <h3>Profils Utilisateurs</h3>
    
    <h4>Récupérer le Profil</h4>
    <pre><code>GET /users/profile
Authorization: Bearer &lt;token&gt;

Response:
{ "id": "uuid, ", "email": "user@example.com", "nom": "Jean Dupont", "user_type": "client", "nom_entreprise": "Ma Société", "created_at": "2024-01-01T00: 00:00Z" }</code></pre>

    <h4>Mettre à Jour le Profil</h4>
    <pre><code>PUT /users/profile
Authorization: Bearer &lt;token&gt;
Content-Type: application/json

{ "nom": "Jean Dupont Modifié, ", "telephone": "+33123456789" }</code></pre>

    <h2>🏢 Gestion des Clients</h2>
    
    <h3>Liste des Clients (Admin)</h3>
    <pre><code>GET /admin/clients
Authorization: Bearer &lt;admin_token&gt;
Query Parameters:
- page: 1 (default)
- limit: 20 (default)
- search: "terme de recherche"
- status: "active|inactive"

Response:
{ "clients": [
    {
      "id": "uuid, ", "email": "client@example.com", "nom_entreprise": "Entreprise A", "secteur_activite": "Technologie", "statut": "active", "created_at": "2024-01-01T00: 00:00Z" }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 100, "pages": 5 }
}</code></pre>

    <h3>Détails d'un Client</h3>
    <pre><code>GET /admin/clients/:id
Authorization: Bearer &lt;admin_token&gt;

Response:
{ "id": "uuid, ", "email": "client@example.com", "nom_entreprise": "Entreprise A", "secteur_activite": "Technologie", "taille_entreprise": "10-50", "statut": "active", "dossiers": [
    {
      "id": "uuid", "produit": "Audit énergétique", "statut": "en_cours", "expert_assigne": "Expert Name" }
  ],
  "created_at": "2024-01-01T00: 00:00Z"
}</code></pre>

    <h2>👨‍💼 Gestion des Experts</h2>
    
    <h3>Marketplace des Experts</h3>
    <pre><code>GET /experts/marketplace
Query Parameters: - specialisation: "audit_energetique"
- tarif_min: 50
- tarif_max: 200
- disponibilite: "immediate"
- rating: 4.5

Response:
{ "experts": [
    {
      "id": "uuid, ", "nom": "Expert Name", "specialisation": "Audit énergétique", "tarif_horaire": 100, "rating": 4.8, "missions_completees": 25, "disponibilite": "immediate", "description": "Expert en audit énergétique..." }
  ],
  "filters": { "specialisations": ["audit_energetique", "optimisation_fiscale"], "tarifs": {"min": 50, "max": 300 },
    "disponibilites": ["immediate", "semaine_prochaine"]
  }
}</code></pre>

    <h3>Détails d'un Expert</h3>
    <pre><code>GET /experts/:id
Authorization: Bearer &lt;token&gt;

Response:
{ "id": "uuid, ", "nom": "Expert Name", "email": "expert@example.com", "specialisation": "Audit énergétique", "tarif_horaire": 100, "rating": 4.8, "missions_completees": 25, "disponibilite": "immediate", "description": "Expert en audit énergétique...", "certifications": ["ISO 50001", "Certification X"], "experiences": [
    {
      "entreprise": "Entreprise A", "poste": "Auditeur Senior", "duree": "5 ans" }
  ],
  "reviews": [
    { "client": "Client A", "rating": 5, "commentaire": "Excellent expert...", "date": "2024-01-01T00: 00:00Z" }
  ]
}</code></pre>

    <h3>Demande d'Expert (Client)</h3>
    <pre><code>POST /experts/:id/request
Authorization: Bearer &lt;client_token&gt;
Content-Type: application/json

{ "produit_id": "uuid, ", "description": "Besoin d'un audit énergétique...", "urgence": "normale", "budget_estime": 5000 }</code></pre>

    <h2>💬 Messagerie</h2>
    
    <h3>Liste des Conversations</h3>
    <pre><code>GET /messages/conversations
Authorization: Bearer &lt;token&gt;

Response:
{ "conversations": [
    {
      "id": "uuid, ", "participants": [
        {"id": "uuid", "nom": "Client A", "type": "client" },
        { "id": "uuid", "nom": "Expert B", "type": "expert" }
      ],
      "last_message": { "content": "Dernier message...", "timestamp": "2024-01-01T12: 00:00Z, ", "sender": "expert" },
      "unread_count": 2
    }
  ]
}</code></pre>

    <h3>Messages d'une Conversation</h3>
    <pre><code>GET /messages/conversations/:id
Authorization: Bearer &lt;token&gt;
Query Parameters:
- page: 1
- limit: 50

Response:
{ "conversation_id": "uuid, ", "messages": [
    {
      "id": "uuid", "content": "Bonjour, je suis disponible...", "sender_id": "uuid", "sender_type": "expert", "timestamp": "2024-01-01T12: 00:00Z, ", "attachments": [] }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 150, "pages": 3 }
}</code></pre>

    <h3>Envoyer un Message</h3>
    <pre><code>POST /messages/conversations/:id
Authorization: Bearer &lt;token&gt;
Content-Type: application/json

{ "content": "Nouveau message..., ", "attachments": [
    {
      "filename": "document.pdf", "url": "https: //storage.example.com/file.pdf" }
  ]
}</code></pre>

    <h3>WebSocket pour Messages Temps Réel</h3>
    <pre><code>// Connexion WebSocket
const ws = new WebSocket('ws: //localhost:5001/ws');

// Authentification
ws.send(JSON.stringify({ type: 'auth, ', token: 'jwt_token' }));

// Écouter les nouveaux messages
ws.onmessage = (event) => { const data = JSON.parse(event.data);
  if (data.type === 'new_message') {
    console.log('Nouveau message: ', data.message); }
};

// Envoyer un message via WebSocket
ws.send(JSON.stringify({ type: 'send_message, ', conversation_id: 'uuid, ', content: 'Message temps réel' }));</code></pre>

    <h2>📁 Gestion des Dossiers</h2>
    
    <h3>Liste des Dossiers (Client)</h3>
    <pre><code>GET /dossiers
Authorization: Bearer &lt;client_token&gt;
Query Parameters:
- status: "en_cours|termine|en_attente"
- produit: "audit_energetique"

Response:
{ "dossiers": [
    {
      "id": "uuid, ", "produit": "Audit énergétique", "statut": "en_cours", "expert_assigne": "Expert Name", "date_creation": "2024-01-01T00: 00:00Z, ", "date_limite": "2024-02-01T00: 00:00Z, ", "progression": 75 }
  ]
}</code></pre>

    <h3>Détails d'un Dossier</h3>
    <pre><code>GET /dossiers/:id
Authorization: Bearer &lt;token&gt;

Response:
{ "id": "uuid, ", "produit": "Audit énergétique", "statut": "en_cours", "expert_assigne": {
    "id": "uuid", "nom": "Expert Name", "email": "expert@example.com" },
  "etapes": [
    { "id": "uuid", "nom": "Collecte des données", "statut": "termine", "date_debut": "2024-01-01T00: 00:00Z, ", "date_fin": "2024-01-05T00: 00:00Z" },
    { "id": "uuid", "nom": "Analyse", "statut": "en_cours", "date_debut": "2024-01-06T00: 00:00Z, ", "date_fin": null }
  ],
  "documents": [
    { "id": "uuid", "nom": "Rapport intermédiaire.pdf", "type": "rapport", "date_upload": "2024-01-10T00: 00:00Z" }
  ],
  "messages": [
    { "id": "uuid", "content": "Rapport intermédiaire disponible", "sender": "expert", "timestamp": "2024-01-10T00: 00:00Z" }
  ]
}</code></pre>

    <h2>📊 Simulations et Rapports</h2>
    
    <h3>Lancer une Simulation</h3>
    <pre><code>POST /simulations
Authorization: Bearer &lt;token&gt;
Content-Type: application/json

{ "produit_id": "uuid, ", "donnees": {
    "chiffre_affaires": 1000000, "nombre_employes": 50, "secteur": "technologie", "localisation": "Paris" }
}

Response: { "id": "uuid, ", "statut": "en_cours", "resultats": {
    "economies_estimees": 50000, "delai_realisation": "3 mois", "roi": 15.5 },
  "created_at": "2024-01-01T00: 00:00Z"
}</code></pre>

    <h3>Récupérer les Résultats</h3>
    <pre><code>GET /simulations/:id
Authorization: Bearer &lt;token&gt;

Response:
{ "id": "uuid, ", "statut": "termine", "resultats": {
    "economies_estimees": 50000, "delai_realisation": "3 mois", "roi": 15.5, "details": {
      "optimisations": [
        {
          "nom": "Optimisation fiscale", "economie": 30000, "delai": "1 mois" }
      ]
    }
  },
  "rapport_pdf": "https: //storage.example.com/rapport.pdf,",
  "created_at": "2024-01-01T00: 00:00Z"
}</code></pre>

    <h2>🔧 Administration</h2>
    
    <h3>Dashboard Admin</h3>
    <pre><code>GET /admin/dashboard
Authorization: Bearer &lt;admin_token&gt;

Response:
{ "statistiques": {
    "total_clients": 15, 0, "total_experts": 25, "dossiers_en_cours": 45, "dossiers_termines": 120, "revenus_mois": 50000 },
  "alertes": [
    { "type": "expert_validation", "message": "3 experts en attente de validation", "urgence": "moyenne" }
  ],
  "activite_recente": [
    { "action": "nouveau_dossier", "utilisateur": "Client A", "timestamp": "2024-01-01T12: 00:00Z" }
  ]
}</code></pre>

    <h3>Gestion des Experts (Admin)</h3>
    <pre><code>GET /admin/experts
Authorization: Bearer &lt;admin_token&gt;
Query Parameters:
- status: "en_attente|valide|rejete"
- specialisation: "audit_energetique"

POST /admin/experts/:id/validate
Authorization: Bearer &lt;admin_token&gt;
Content-Type: application/json

{ "decision": "valide, ", "commentaire": "Expert validé après vérification" }</code></pre>

    <h2>📈 Monitoring et Analytics</h2>
    
    <h3>Métriques de Performance</h3>
    <pre><code>GET /admin/metrics
Authorization: Bearer &lt;admin_token&gt;
Query Parameters:
- periode: "jour|semaine|mois"
- type: "performance|utilisateurs|erreurs"

Response:
{ "performance": {
    "temps_reponse_moyen": 7, 8, "requetes_par_seconde": 150, "taux_erreur": 0.1 },
  "utilisateurs": { "connexions_jour": 250, "nouveaux_inscrits": 15, "utilisateurs_actifs": 180 },
  "erreurs": { "erreurs_500": 2, "erreurs_404": 5, "timeouts": 0 }
}</code></pre>

    <h3>Logs d'Audit</h3>
    <pre><code>GET /admin/audit-logs
Authorization: Bearer &lt;admin_token&gt;
Query Parameters:
- user_id: "uuid"
- action: "login|create|update|delete"
- date_debut: "2024-01-01"
- date_fin: "2024-01-31"

Response:
{ "logs": [
    {
      "id": "uuid, ", "user_id": "uuid", "action": "login", "ip_address": "192.168.1.1", "user_agent": "Mozilla/5.0...", "timestamp": "2024-01-01T12: 00:00Z, ", "details": {
        "success": true, "location": "Paris, France" }
    }
  ],
  "pagination": { "page": 1, "limit": 100, "total": 1500, "pages": 15 }
}</code></pre>

    <h2>🚨 Gestion des Erreurs</h2>
    
    <h3>Codes d'Erreur Standard</h3>
    <table>
      <tr><th>Code</th><th>Message</th><th>Description</th></tr>
      <tr><td>400</td><td>Bad Request</td><td>Données invalides</td></tr>
      <tr><td>401</td><td>Unauthorized</td><td>Authentification requise</td></tr>
      <tr><td>403</td><td>Forbidden</td><td>Permissions insuffisantes</td></tr>
      <tr><td>404</td><td>Not Found</td><td>Ressource introuvable</td></tr>
      <tr><td>409</td><td>Conflict</td><td>Conflit de données</td></tr>
      <tr><td>422</td><td>Unprocessable Entity</td><td>Validation échouée</td></tr>
      <tr><td>429</td><td>Too Many Requests</td><td>Rate limit dépassé</td></tr>
      <tr><td>500</td><td>Internal Server Error</td><td>Erreur serveur</td></tr>
      <tr><td>503</td><td>Service Unavailable</td><td>Service indisponible</td></tr>
    </table>

    <h3>Format des Erreurs</h3>
    <pre><code>{ "error": {
    "code": "VALIDATION_ERROR", "message": "Données de validation invalides", "details": {
      "email": ["Format d'email invalide"], "password": ["Le mot de passe doit contenir au moins 8 caractères"] },
    "timestamp": "2024-01-01T12: 00:00Z,",
    "request_id": "req_123456"
  }
}</code></pre>

    <h2>🔒 Sécurité</h2>
    
    <h3>Mesures de Sécurité</h3>
    <ul>
      <li><strong>CORS :</strong> Configuration stricte des origines autorisées</li>
      <li><strong>Rate Limiting :</strong> 100 requêtes/15min par IP</li>
      <li><strong>Validation :</strong> Validation stricte de toutes les entrées</li>
      <li><strong>Sanitisation :</strong> Nettoyage des données utilisateur</li>
      <li><strong>Logs :</strong> Traçabilité complète des actions</li>
      <li><strong>HTTPS :</strong> Chiffrement en transit obligatoire</li>
    </ul>

    <h3>Headers de Sécurité</h3>
    <pre><code>X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'</code></pre>

    <h2>📚 Exemples d'Intégration</h2>
    
    <h3>JavaScript/Node.js</h3>
    <pre><code>const axios = require('axios');

class FinancialTrackerAPI { constructor(baseUR, L, token) {
    this.client = axios.create({
      baseURL, headers: {
        'Authorization': \`Bearer \${toke, n }\`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getProfile() { try {
      const response = await this.client.get('/users/profile');
      return response.data; } catch (error) { console.error('Erreur API: ', error.response.data);
      throw error; }
  }

  async sendMessage(conversationId, content) { try {
      const response = await this.client.post(\`/messages/conversations/\${conversationId }\`, { content });
      return response.data;
    } catch (error) { console.error('Erreur envoi message: ', error.response.data);
      throw error; }
  }
}

// Utilisation
const api = new FinancialTrackerAPI('http: //localhost:5001/api,', 'jwt_token');
const profile = await api.getProfile();</code></pre>

    <h3>Python</h3>
    <pre><code>import requests
import json

class FinancialTrackerAPI: def __init__(sel,f, base_url, token):
        self.base_url = base_url
        self.headers = { 'Authorization': f'Bearer {token }',
            'Content-Type': 'application/json'
        }
    
    def get_profile(self):
        try: response = requests.get(
                f'{ self.base_ur, l }/users/profile',
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e: print(f'Erreur API: { e }')
            raise
    
    def send_message(self, conversation_id, content):
        try: response = requests.post(
                f'{ self.base_ur, l }/messages/conversations/{ conversation_id }',
                headers=self.headers,
                json={ 'content': content }
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e: print(f'Erreur envoi message: { e }')
            raise

# Utilisation
api = FinancialTrackerAPI('http: //localhost:5001/api,', 'jwt_token')
profile = api.get_profile()</code></pre>

    <h2>📋 Checklist de Test</h2>
    
    <h3>Tests Fonctionnels</h3>
    <ul>
      <li>☐ Authentification et autorisation</li>
      <li>☐ CRUD des utilisateurs</li>
      <li>☐ Gestion des experts et clients</li>
      <li>☐ Système de messagerie</li>
      <li>☐ Gestion des dossiers</li>
      <li>☐ Simulations et rapports</li>
      <li>☐ Administration</li>
    </ul>

    <h3>Tests de Performance</h3>
    <ul>
      <li>☐ Temps de réponse < 200ms</li>
      <li>☐ Gestion de la charge (100+ req/s)</li>
      <li>☐ Rate limiting fonctionnel</li>
      <li>☐ WebSocket temps réel</li>
    </ul>

    <h3>Tests de Sécurité</h3>
    <ul>
      <li>☐ Validation des entrées</li>
      <li>☐ Protection CSRF</li>
      <li>☐ Headers de sécurité</li>
      <li>☐ Logs d'audit</li>
    </ul>

    <h2>📞 Support et Contact</h2>
    
    <p><strong>Équipe technique :</strong> api@financialtracker.fr<br>
    <strong>Documentation Swagger :</strong> <a href="/api/docs">/api/docs</a><br>
    <strong>Status API :</strong> <a href="/api/status">/api/status</a></p>

    <h2>🔗 Ressources</h2>
    <ul>
      <li><strong>Express.js :</strong> <a href="https: //expressjs.com/">Documentation officielle</a></li>
      <li><strong>Supabase :</strong> <a href="https://supabase.com/docs">API Reference</a></li>
      <li><strong>JWT :</strong> <a href="https://jwt.io/">Debugger et documentation</a></li>
      <li><strong>OpenAPI :</strong> <a href="https://swagger.io/specification/">Spécification</a></li>
    </ul>
  ,`,
  filePath: 'API_DOCUMENTATION.md,',
  lastModified: new Date('2025-01-03'),
  tags: ['api,', 'rest', 'documentation', 'endpoints', 'authentification', 'exemples'],
  readTime: 25
}; 