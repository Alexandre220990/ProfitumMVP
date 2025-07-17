export const GED_IMPLEMENTATION_DOC = { id: 'ged-implementation, ', title: 'Implémentation Gestion Électronique Documentaire, ', category: 'technical, ', description: 'Plan complet d\'implémentation du système de Gestion Électronique Documentaire (GED) pour FinancialTracker, ', content: `
    <h1>Implémentation Gestion Électronique Documentaire - FinancialTracker</h1>
    <p>Ce document détaille le plan complet d'implémentation d'un système de Gestion Électronique Documentaire (GED) intégré à la plateforme FinancialTracke, r, avec gestion des droits d'accès granulaires et interface complète de gestion.</p>

    <h2>📊 Architecture de base de données</h2>
    
    <h3>Tables à créer</h3>
    
    <h4>Table des documents</h4>
    <pre><code>CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title VARCHAR(255) NOT NULL, description TEXT, content TEXT NOT NULL, category VARCHAR(50) NOT NULL, -- 'business' ou 'technical'
  file_path VARCHAR(500), last_modified TIMESTAMP DEFAULT NOW(), created_at TIMESTAMP DEFAULT NOW(), created_by UUID REFERENCES auth.users(id), is_active BOOLEAN DEFAULT true, read_time INTEGER DEFAULT 5, version INTEGER DEFAULT 1
);</code></pre>

    <h4>Table des labels/tags</h4>
    <pre><code>CREATE TABLE document_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(100) UNIQUE NOT NULL, color VARCHAR(7) DEFAULT '#3B82F6', description TEXT, created_at TIMESTAMP DEFAULT NOW()
);</code></pre>

    <h4>Table de liaison documents-labels</h4>
    <pre><code>CREATE TABLE document_label_relations (
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE, label_id UUID REFERENCES document_labels(id) ON DELETE CASCADE, PRIMARY KEY (document_id, label_id)
);</code></pre>

    <h4>Table des droits d'accès par profil</h4>
    <pre><code>CREATE TABLE document_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), document_id UUID REFERENCES documents(id) ON DELETE CASCADE, user_type VARCHAR(20) NOT NULL, -- 'admin', 'client', 'expert'
  can_read BOOLEAN DEFAULT false, can_write BOOLEAN DEFAULT false, can_delete BOOLEAN DEFAULT false, can_share BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW()
);</code></pre>

    <h4>Table des versions de documents</h4>
    <pre><code>CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), document_id UUID REFERENCES documents(id) ON DELETE CASCADE, version_number INTEGER NOT NULL, content TEXT NOT NULL, modified_by UUID REFERENCES auth.users(id), modified_at TIMESTAMP DEFAULT NOW(), change_description TEXT
);</code></pre>

    <h4>Table des favoris utilisateurs</h4>
    <pre><code>CREATE TABLE user_document_favorites (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, document_id UUID REFERENCES documents(id) ON DELETE CASCADE, created_at TIMESTAMP DEFAULT NOW(), PRIMARY KEY (user_id, document_id)
);</code></pre>

    <h2>🔐 Système de droits d'accès</h2>
    
    <h3>Matrice des permissions</h3>
    
    <table>
      <thead>
        <tr>
          <th>Profil</th>
          <th>Lecture</th>
          <th>Écriture</th>
          <th>Suppression</th>
          <th>Partage</th>
          <th>Documents accessibles</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Admin</strong></td>
          <td>✅ Tous</td>
          <td>✅ Tous</td>
          <td>✅ Tous</td>
          <td>✅ Tous</td>
          <td>Tous les documents</td>
        </tr>
        <tr>
          <td><strong>Client</strong></td>
          <td>✅ Métier + Tech limitée</td>
          <td>❌</td>
          <td>❌</td>
          <td>✅ Métier</td>
          <td>Guides métier + Docs techniques limitées</td>
        </tr>
        <tr>
          <td><strong>Expert</strong></td>
          <td>✅ Métier + Tech étendue</td>
          <td>✅ Métier</td>
          <td>❌</td>
          <td>✅ Métier</td>
          <td>Guides métier + Docs techniques étendues</td>
        </tr>
      </tbody>
    </table>

    <h2>🎨 Interface utilisateur</h2>
    
    <h3>Page de gestion documentaire (Admin)</h3>
    <ul>
      <li><strong>Création/Édition</strong> : Éditeur WYSIWYG avec prévisualisation</li>
      <li><strong>Gestion des labels</strong> : CRUD complet des labels avec couleurs</li>
      <li><strong>Tri et filtres</strong> : Par label, catégorie, date, auteur, temps de lecture</li>
      <li><strong>Permissions</strong> : Interface de gestion des droits d'accès</li>
      <li><strong>Versions</strong> : Historique des modifications</li>
      <li><strong>Export</strong> : PDF, Markdown, HTML</li>
    </ul>

    <h3>Page de consultation (Tous profils)</h3>
    <ul>
      <li><strong>Recherche avancée</strong> : Par contenu, labels, catégorie</li>
      <li><strong>Filtres dynamiques</strong> : Combinaison de critères</li>
      <li><strong>Favoris</strong> : Système de marquage</li>
      <li><strong>Partage</strong> : Liens directs vers documents</li>
      <li><strong>Export</strong> : Selon les permissions</li>
    </ul>

    <h2>🔧 Fonctionnalités techniques</h2>
    
    <h3>Backend (Node.js/Express)</h3>
    
    <h4>Routes API</h4>
    <pre><code>// Gestion des documents
POST   /api/documents                    // Créer un document
GET    /api/documents                    // Lister les documents (avec filtres)
GET    /api/documents/:id                // Récupérer un document
PUT    /api/documents/:id                // Modifier un document
DELETE /api/documents/:id                // Supprimer un document
POST   /api/documents/:id/versions       // Créer une nouvelle version
GET    /api/documents/:id/versions       // Historique des versions

// Gestion des labels
POST   /api/labels                       // Créer un label
GET    /api/labels                       // Lister les labels
PUT    /api/labels/:id                   // Modifier un label
DELETE /api/labels/:id                   // Supprimer un label

// Gestion des permissions
POST   /api/documents/:id/permissions    // Gérer les permissions
GET    /api/documents/:id/permissions    // Récupérer les permissions

// Gestion des favoris
POST   /api/documents/:id/favorite       // Ajouter aux favoris
DELETE /api/documents/:id/favorite       // Retirer des favoris</code></pre>

    <h3>Frontend (React/TypeScript)</h3>
    <ul>
      <li><strong>Éditeur de documents</strong> : Composant WYSIWYG avec Markdown</li>
      <li><strong>Gestionnaire de labels</strong> : Interface drag & drop</li>
      <li><strong>Système de permissions</strong> : Interface intuitive</li>
      <li><strong>Recherche avancée</strong> : Filtres combinés</li>
      <li><strong>Export PDF</strong> : Génération côté client</li>
    </ul>

    <h2>📱 Intégration dans les dashboards</h2>
    
    <h3>Dashboard Admin</h3>
    <ul>
      <li><strong>Section "Gestion documentaire"</strong> : Accès complet</li>
      <li><strong>Statistiques</strong> : Documents créés, consultations, etc.</li>
      <li><strong>Alertes</strong> : Documents en attente de validation</li>
    </ul>

    <h3>Dashboard Client</h3>
    <ul>
      <li><strong>Section "Documentation"</strong> : Accès aux guides métier</li>
      <li><strong>Favoris</strong> : Documents marqués</li>
      <li><strong>Recherche</strong> : Dans les documents autorisés</li>
    </ul>

    <h3>Dashboard Expert</h3>
    <ul>
      <li><strong>Section "Documentation"</strong> : Accès étendu</li>
      <li><strong>Création</strong> : Possibilité de créer des guides</li>
      <li><strong>Collaboration</strong> : Partage de documents</li>
    </ul>

    <h2>🔄 Workflow de développement</h2>
    
    <h3>Phase 1 : Base de données et API (1-2 jours)</h3>
    <ol>
      <li>Créer les tables en base</li>
      <li>Implémenter les routes API</li>
      <li>Tests unitaires des endpoints</li>
    </ol>

    <h3>Phase 2 : Interface de gestion (2-3 jours)</h3>
    <ol>
      <li>Page de création/édition de documents</li>
      <li>Gestionnaire de labels</li>
      <li>Système de permissions</li>
      <li>Interface de tri et filtres</li>
    </ol>

    <h3>Phase 3 : Intégration et optimisation (1-2 jours)</h3>
    <ol>
      <li>Intégration dans les dashboards</li>
      <li>Système de recherche avancée</li>
      <li>Export PDF</li>
      <li>Tests d'intégration</li>
    </ol>

    <h3>Phase 4 : Sécurité et conformité (1 jour)</h3>
    <ol>
      <li>RLS (Row Level Security) sur Supabase</li>
      <li>Audit trail des modifications</li>
      <li>Conformité ISO 27001</li>
      <li>Tests de sécurité</li>
    </ol>

    <h2>🛡️ Sécurité et conformité</h2>
    
    <h3>RLS Policies</h3>
    
    <h4>Politique de lecture selon les permissions</h4>
    <pre><code>CREATE POLICY "documents_read_policy" ON documents
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM document_permissions dp
    WHERE dp.document_id = documents.id
    AND dp.user_type = current_setting('app.user_type')::text
    AND dp.can_read = true
  )
);</code></pre>

    <h4>Politique d'écriture pour les admins et auteurs</h4>
    <pre><code>CREATE POLICY "documents_write_policy" ON documents
FOR UPDATE USING (
  current_setting('app.user_type')::text = 'admin'
  OR created_by = auth.uid()
);</code></pre>

    <h3>Audit trail</h3>
    <ul>
      <li>Logs de toutes les modifications</li>
      <li>Historique des versions</li>
      <li>Traçabilité des accès</li>
    </ul>

    <h2>📈 Métriques et analytics</h2>
    
    <h3>KPI à suivre</h3>
    <ul>
      <li>Nombre de documents créés/modifiés</li>
      <li>Documents les plus consultés</li>
      <li>Temps de lecture moyen</li>
      <li>Utilisation des labels</li>
      <li>Performance des recherches</li>
    </ul>

    <h2>🚀 Évolutions futures</h2>
    
    <h3>Fonctionnalités avancées</h3>
    <ul>
      <li><strong>Collaboration en temps réel</strong> : Édition simultanée</li>
      <li><strong>Workflow d'approbation</strong> : Validation des documents</li>
      <li><strong>Intégration IA</strong> : Suggestions de labels, résumé automatique</li>
      <li><strong>Synchronisation</strong> : Export/import depuis d'autres systèmes</li>
      <li><strong>API publique</strong> : Accès externe sécurisé</li>
    </ul>

    <h2>🎯 Plan d'action immédiat</h2>
    <ol>
      <li><strong>Créer les tables</strong> en base de données</li>
      <li><strong>Implémenter les routes API</strong> de base</li>
      <li><strong>Développer l'interface</strong> de gestion des documents</li>
      <li><strong>Intégrer dans les dashboards</strong> existants</li>
      <li><strong>Tester et optimiser</strong></li>
    </ol>

    <h2>📋 Checklist d'implémentation</h2>
    
    <h3>Base de données</h3>
    <ul>
      <li>☐ Création des tables documents</li>
      <li>☐ Création des tables labels</li>
      <li>☐ Création des tables permissions</li>
      <li>☐ Création des tables versions</li>
      <li>☐ Création des tables favoris</li>
      <li>☐ Configuration des RLS policies</li>
    </ul>

    <h3>Backend</h3>
    <ul>
      <li>☐ Routes CRUD documents</li>
      <li>☐ Routes CRUD labels</li>
      <li>☐ Routes permissions</li>
      <li>☐ Routes favoris</li>
      <li>☐ Middleware d'authentification</li>
      <li>☐ Validation des données</li>
    </ul>

    <h3>Frontend</h3>
    <ul>
      <li>☐ Interface de création/édition</li>
      <li>☐ Gestionnaire de labels</li>
      <li>☐ Système de permissions</li>
      <li>☐ Recherche avancée</li>
      <li>☐ Export PDF</li>
      <li>☐ Intégration dashboards</li>
    </ul>

    <h3>Tests et déploiement</h3>
    <ul>
      <li>☐ Tests unitaires</li>
      <li>☐ Tests d'intégration</li>
      <li>☐ Tests de sécurité</li>
      <li>☐ Tests de performance</li>
      <li>☐ Documentation utilisateur</li>
      <li>☐ Déploiement en production</li>
    </ul>

    <h2>🔗 Ressources et références</h2>
    <ul>
      <li><strong>Supabase RLS</strong> : <a href="https: //supabase.com/docs/guides/auth/row-level-security">Documentation officielle</a></li>
      <li><strong>React WYSIWYG</strong> : <a href="https://github.com/outline/rich-markdown-editor">Rich Markdown Editor</a></li>
      <li><strong>PDF Generation</strong> : <a href="https://react-pdf.org/">React PDF</a></li>
      <li><strong>ISO 27001</strong> : <a href="https://www.iso.org/isoiec-27001-information-security.html">Standard de sécurité</a></li>
    </ul>, `, filePath: 'docs/ged-implementation.md, ', lastModified: new Date('2024-01-15'), tags: ['ged, ', 'documentation', 'implémentation', 'base-de-données', 'api', 'sécurité', 'iso'], readTime: 20 }; 