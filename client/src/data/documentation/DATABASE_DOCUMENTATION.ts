export const DATABASE_DOCUMENTATION_DOC = { id: 'database-documentation, ', title: 'Documentation Technique Base de Données, ', category: 'technical, ', description: 'Documentation complète de l\'architecture et des tables de la base de données Supabase, ', content: `
    <h1>🗄️ Documentation Technique Base de Données - FinancialTracker</h1>
    
    <p><strong>Date de mise à jour :</strong> 3 Janvier 2025<br>
    <strong>Version :</strong> 1.0<br>
    <strong>Statut :</strong> Documentation officielle<br>
    <strong>Base de données :</strong> PostgreSQL via Supabase</p>

    <h2>📊 Architecture Générale</h2>
    
    <h3>Technologies Utilisées</h3>
    <ul>
      <li><strong>Base de données :</strong> PostgreSQL 15+</li>
      <li><strong>Hébergement :</strong> Supabase Cloud</li>
      <li><strong>Sécurité :</strong> Row Level Security (RLS)</li>
      <li><strong>Authentification :</strong> Supabase Auth</li>
      <li><strong>Réplication :</strong> Temps réel automatique</li>
    </ul>

    <h3>Caractéristiques Techniques</h3>
    <ul>
      <li><strong>Performance :</strong> Temps de réponse moyen 78ms</li>
      <li><strong>Disponibilité :</strong> 99.9%</li>
      <li><strong>Sauvegarde :</strong> Automatique toutes les heures</li>
      <li><strong>Chiffrement :</strong> AES-256 au repos et en transit</li>
      <li><strong>Conformité :</strong> ISO 2700, 1, RGPD</li>
    </ul>

    <h2>🎯 Tables Principales (Core Tables)</h2>
    
    <h3>1. Expert</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Table des experts avec authentification Supabase</td></tr>
      <tr><td><strong>Lignes</strong></td><td>10</td></tr>
      <tr><td><strong>Taille</strong></td><td>216 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>25</td></tr>
      <tr><td><strong>Usage</strong></td><td>Stockage des profils experts pour la marketplace</td></tr>
    </table>
    
    <h4>Colonnes Principales</h4>
    <ul>
      <li><code>id</code> : UUID (clé primaire)</li>
      <li><code>email</code> : Email unique de l'expert</li>
      <li><code>nom</code> : Nom complet</li>
      <li><code>specialisation</code> : Domaine d'expertise</li>
      <li><code>tarif_horaire</code> : Tarification</li>
      <li><code>statut</code> : Statut de validation</li>
      <li><code>created_at</code> : Date de création</li>
    </ul>

    <h3>2. Client</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Table des clients de la plateforme Profitum</td></tr>
      <tr><td><strong>Lignes</strong></td><td>4</td></tr>
      <tr><td><strong>Taille</strong></td><td>224 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>31</td></tr>
      <tr><td><strong>Usage</strong></td><td>Stockage des profils clients</td></tr>
    </table>
    
    <h4>Colonnes Principales</h4>
    <ul>
      <li><code>id</code> : UUID (clé primaire)</li>
      <li><code>email</code> : Email unique du client</li>
      <li><code>nom_entreprise</code> : Nom de l'entreprise</li>
      <li><code>secteur_activite</code> : Secteur d'activité</li>
      <li><code>taille_entreprise</code> : Nombre d'employés</li>
      <li><code>statut</code> : Statut du compte</li>
      <li><code>created_at</code> : Date de création</li>
    </ul>

    <h3>3. ProduitEligible</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Produits éligibles pour les optimisations</td></tr>
      <tr><td><strong>Lignes</strong></td><td>10</td></tr>
      <tr><td><strong>Taille</strong></td><td>64 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>13</td></tr>
      <tr><td><strong>Usage</strong></td><td>Catalogue des produits disponibles</td></tr>
    </table>
    
    <h4>Colonnes Principales</h4>
    <ul>
      <li><code>id</code> : UUID (clé primaire)</li>
      <li><code>nom</code> : Nom du produit</li>
      <li><code>description</code> : Description détaillée</li>
      <li><code>categorie</code> : Catégorie du produit</li>
      <li><code>eligibilite_criteres</code> : Critères d'éligibilité</li>
      <li><code>actif</code> : Statut d'activation</li>
    </ul>

    <h2>🔗 Tables de Relations</h2>
    
    <h3>4. expertassignment</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Assignations d'experts aux clients pour la marketplace</td></tr>
      <tr><td><strong>Lignes</strong></td><td>4</td></tr>
      <tr><td><strong>Taille</strong></td><td>176 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>22</td></tr>
      <tr><td><strong>Usage</strong></td><td>Gestion des missions expert-client</td></tr>
    </table>
    
    <h4>Relations</h4>
    <ul>
      <li><code>expert_id</code> → Expert.id</li>
      <li><code>client_id</code> → Client.id</li>
      <li><code>produit_id</code> → ProduitEligible.id</li>
    </ul>

    <h3>5. ClientProduitEligible</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Liaison client-produit éligible</td></tr>
      <tr><td><strong>Lignes</strong></td><td>9</td></tr>
      <tr><td><strong>Taille</strong></td><td>176 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>17</td></tr>
      <tr><td><strong>Usage</strong></td><td>Produits éligibles par client</td></tr>
    </table>

    <h3>6. message</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Messages asynchrones entre clients, experts et admins</td></tr>
      <tr><td><strong>Lignes</strong></td><td>3</td></tr>
      <tr><td><strong>Taille</strong></td><td>208 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>19</td></tr>
      <tr><td><strong>Usage</strong></td><td>Système de messagerie temps réel</td></tr>
    </table>
    
    <h4>Fonctionnalités Messagerie</h4>
    <ul>
      <li><strong>WebSocket :</strong> Communication temps réel</li>
      <li><strong>Notifications :</strong> Push et email</li>
      <li><strong>Historique :</strong> Conservation des conversations</li>
      <li><strong>Pièces jointes :</strong> Support des fichiers</li>
    </ul>

    <h3>7. notification</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Système de notifications pour clients, experts et admins</td></tr>
      <tr><td><strong>Lignes</strong></td><td>1</td></tr>
      <tr><td><strong>Taille</strong></td><td>160 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>16</td></tr>
      <tr><td><strong>Usage</strong></td><td>Notifications système</td></tr>
    </table>

    <h2>🏢 Tables Administratives</h2>
    
    <h3>8. Admin</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Table des administrateurs</td></tr>
      <tr><td><strong>Lignes</strong></td><td>1</td></tr>
      <tr><td><strong>Taille</strong></td><td>80 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>8</td></tr>
      <tr><td><strong>Usage</strong></td><td>Gestion des administrateurs</td></tr>
    </table>

    <h3>9. AdminAuditLog</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Logs d'audit des administrateurs</td></tr>
      <tr><td><strong>Lignes</strong></td><td>13</td></tr>
      <tr><td><strong>Taille</strong></td><td>32 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>10</td></tr>
      <tr><td><strong>Usage</strong></td><td>Traçabilité des actions admin</td></tr>
    </table>

    <h2>📋 Tables de Gestion de Contenu</h2>
    
    <h3>10. documentation</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Table de liaison pour les interactions utilisateurs avec la documentation</td></tr>
      <tr><td><strong>Lignes</strong></td><td>1</td></tr>
      <tr><td><strong>Taille</strong></td><td>112 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>11</td></tr>
      <tr><td><strong>Usage</strong></td><td>Gestion de la documentation</td></tr>
    </table>

    <h3>11. documentation_categories</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Catégories pour organiser la documentation</td></tr>
      <tr><td><strong>Lignes</strong></td><td>5</td></tr>
      <tr><td><strong>Taille</strong></td><td>96 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>9</td></tr>
      <tr><td><strong>Usage</strong></td><td>Organisation de la documentation</td></tr>
    </table>

    <h3>12. documentation_items</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Articles et éléments de documentation</td></tr>
      <tr><td><strong>Lignes</strong></td><td>1</td></tr>
      <tr><td><strong>Taille</strong></td><td>168 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>16</td></tr>
      <tr><td><strong>Usage</strong></td><td>Contenu de la documentation</td></tr>
    </table>

    <h2>🔍 Tables de Simulation et Audit</h2>
    
    <h3>13. Simulation</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Table des simulations d'optimisation fiscale</td></tr>
      <tr><td><strong>Lignes</strong></td><td>6</td></tr>
      <tr><td><strong>Taille</strong></td><td>128 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>14</td></tr>
      <tr><td><strong>Usage</strong></td><td>Simulations client</td></tr>
    </table>

    <h3>14. Audit</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Audits système</td></tr>
      <tr><td><strong>Lignes</strong></td><td>0</td></tr>
      <tr><td><strong>Taille</strong></td><td>72 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>20</td></tr>
      <tr><td><strong>Usage</strong></td><td>Audits de sécurité</td></tr>
    </table>

    <h3>15. chatbotsimulation</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Simulations chatbot</td></tr>
      <tr><td><strong>Lignes</strong></td><td>0</td></tr>
      <tr><td><strong>Taille</strong></td><td>32 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>12</td></tr>
      <tr><td><strong>Usage</strong></td><td>IA conversationnelle</td></tr>
    </table>

    <h2>📊 Tables de Logs et Monitoring</h2>
    
    <h3>16. access_logs</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Logs d'accès et d'actions des utilisateurs pour audit et sécurité</td></tr>
      <tr><td><strong>Lignes</strong></td><td>0</td></tr>
      <tr><td><strong>Taille</strong></td><td>40 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>10</td></tr>
      <tr><td><strong>Usage</strong></td><td>Sécurité et audit</td></tr>
    </table>

    <h3>17. audit_logs</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Logs d'audit système</td></tr>
      <tr><td><strong>Lignes</strong></td><td>5</td></tr>
      <tr><td><strong>Taille</strong></td><td>96 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>13</td></tr>
      <tr><td><strong>Usage</strong></td><td>Traçabilité système</td></tr>
    </table>

    <h3>18. expertaccesslog</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Logs d'accès et d'activité des experts pour audit et sécurité</td></tr>
      <tr><td><strong>Lignes</strong></td><td>0</td></tr>
      <tr><td><strong>Taille</strong></td><td>88 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>16</td></tr>
      <tr><td><strong>Usage</strong></td><td>Audit experts</td></tr>
    </table>

    <h3>19. ChatbotLog</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Logs du chatbot</td></tr>
      <tr><td><strong>Lignes</strong></td><td>12</td></tr>
      <tr><td><strong>Taille</strong></td><td>144 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>8</td></tr>
      <tr><td><strong>Usage</strong></td><td>Historique chatbot</td></tr>
    </table>

    <h2>🏷️ Tables de Catégorisation</h2>
    
    <h3>20. ExpertCategory</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Catégories d'experts</td></tr>
      <tr><td><strong>Lignes</strong></td><td>5</td></tr>
      <tr><td><strong>Taille</strong></td><td>48 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>5</td></tr>
      <tr><td><strong>Usage</strong></td><td>Classification experts</td></tr>
    </table>

    <h3>21. ExpertSpecialization</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Spécialisations d'experts</td></tr>
      <tr><td><strong>Lignes</strong></td><td>0</td></tr>
      <tr><td><strong>Taille</strong></td><td>8 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>2</td></tr>
      <tr><td><strong>Usage</strong></td><td>Spécialisations</td></tr>
    </table>

    <h3>22. Specialization</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Spécialisations générales</td></tr>
      <tr><td><strong>Lignes</strong></td><td>7</td></tr>
      <tr><td><strong>Taille</strong></td><td>48 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>8</td></tr>
      <tr><td><strong>Usage</strong></td><td>Référentiel spécialisations</td></tr>
    </table>

    <h2>📁 Tables GED (Gestion Électronique des Documents)</h2>
    
    <h3>23. GEDDocument</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Documents GED</td></tr>
      <tr><td><strong>Lignes</strong></td><td>0</td></tr>
      <tr><td><strong>Taille</strong></td><td>88 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>12</td></tr>
      <tr><td><strong>Usage</strong></td><td>Gestion documentaire</td></tr>
    </table>

    <h3>24. GEDDocumentLabel</h3>
    <table>
      <tr><td><strong>Description</strong></td><td>Labels pour les documents GED</td></tr>
      <tr><td><strong>Lignes</strong></td><td>0</td></tr>
      <tr><td><strong>Taille</strong></td><td>8 kB</td></tr>
      <tr><td><strong>Colonnes</strong></td><td>4</td></tr>
      <tr><td><strong>Usage</strong></td><td>Catégorisation documents</td></tr>
    </table>

    <h2>🔐 Sécurité et Conformité</h2>
    
    <h3>Row Level Security (RLS)</h3>
    <p>Toutes les tables sensibles sont protégées par des politiques RLS :</p>
    <ul>
      <li><strong>Expert :</strong> Accès limité aux données publiques</li>
      <li><strong>Client :</strong> Accès uniquement à ses propres données</li>
      <li><strong>Message :</strong> Accès aux conversations autorisées</li>
      <li><strong>Admin :</strong> Accès complet pour les administrateurs</li>
    </ul>

    <h3>Chiffrement</h3>
    <ul>
      <li><strong>Au repos :</strong> AES-256</li>
      <li><strong>En transit :</strong> TLS 1.3</li>
      <li><strong>Mots de passe :</strong> Hachage bcrypt</li>
      <li><strong>Tokens :</strong> JWT signés</li>
    </ul>

    <h3>Audit et Traçabilité</h3>
    <ul>
      <li><strong>Logs d'accès :</strong> Toutes les connexions</li>
      <li><strong>Logs d'audit :</strong> Actions sensibles</li>
      <li><strong>Rétention :</strong> 7 ans minimum</li>
      <li><strong>Conformité :</strong> ISO 27001, RGPD</li>
    </ul>

    <h2>⚡ Performance et Optimisation</h2>
    
    <h3>Index Optimisés</h3>
    <ul>
      <li><strong>Clés primaires :</strong> UUID avec index B-tree</li>
      <li><strong>Clés étrangères :</strong> Index automatiques</li>
      <li><strong>Recherche :</strong> Index sur email, nom</li>
      <li><strong>Temps :</strong> Index sur created_at, updated_at</li>
    </ul>

    <h3>Métriques de Performance</h3>
    <ul>
      <li><strong>Temps de réponse moyen :</strong> 78ms</li>
      <li><strong>Requêtes simultanées :</strong> 100+</li>
      <li><strong>Disponibilité :</strong> 99.9%</li>
      <li><strong>Réplication :</strong> Temps réel</li>
    </ul>

    <h2>🔄 Maintenance et Sauvegarde</h2>
    
    <h3>Sauvegarde Automatique</h3>
    <ul>
      <li><strong>Fréquence :</strong> Toutes les heures</li>
      <li><strong>Rétention :</strong> 30 jours</li>
      <li><strong>Type :</strong> Incrémentale + complète</li>
      <li><strong>Test :</strong> Restauration mensuelle</li>
    </ul>

    <h3>Maintenance Préventive</h3>
    <ul>
      <li><strong>VACUUM :</strong> Quotidien automatique</li>
      <li><strong>ANALYZE :</strong> Mise à jour des statistiques</li>
      <li><strong>Monitoring :</strong> Alertes en temps réel</li>
      <li><strong>Optimisation :</strong> Requêtes lentes identifiées</li>
    </ul>

    <h2>📈 Évolutions Futures</h2>
    
    <h3>Fonctionnalités Prévues</h3>
    <ul>
      <li><strong>Partitioning :</strong> Tables de logs par date</li>
      <li><strong>Archivage :</strong> Données anciennes compressées</li>
      <li><strong>Cache Redis :</strong> Optimisation des requêtes fréquentes</li>
      <li><strong>Full-text search :</strong> Recherche avancée</li>
    </ul>

    <h2>🔧 Outils de Gestion</h2>
    
    <h3>Scripts de Maintenance</h3>
    <ul>
      <li><code>check-database.js</code> : Vérification intégrité</li>
      <li><code>optimize-indexes.sql</code> : Optimisation index</li>
      <li><code>backup-automated.sh</code> : Sauvegarde automatique</li>
      <li><code>monitor-performance.js</code> : Monitoring performance</li>
    </ul>

    <h3>Monitoring</h3>
    <ul>
      <li><strong>Supabase Dashboard :</strong> Métriques en temps réel</li>
      <li><strong>Logs centralisés :</strong> ELK Stack</li>
      <li><strong>Alertes :</strong> Slack, email, SMS</li>
      <li><strong>Rapports :</strong> Quotidiens et mensuels</li>
    </ul>

    <h2>📋 Checklist de Validation</h2>
    
    <h3>Tests Réguliers</h3>
    <ul>
      <li>☐ Vérification intégrité des données</li>
      <li>☐ Test de performance des requêtes</li>
      <li>☐ Validation des politiques RLS</li>
      <li>☐ Test de restauration</li>
      <li>☐ Audit de sécurité</li>
      <li>☐ Vérification des sauvegardes</li>
    </ul>

    <h3>Maintenance Mensuelle</h3>
    <ul>
      <li>☐ Analyse des requêtes lentes</li>
      <li>☐ Optimisation des index</li>
      <li>☐ Nettoyage des logs anciens</li>
      <li>☐ Mise à jour des statistiques</li>
      <li>☐ Révision des permissions</li>
      <li>☐ Test de charge</li>
    </ul>

    <h2>📞 Support et Contact</h2>
    
    <p><strong>Équipe technique :</strong> tech@financialtracker.fr<br>
    <strong>Urgences :</strong> +33 1 XX XX XX XX<br>
    <strong>Documentation :</strong> <a href="/admin/documentation">Interface admin</a></p>

    <h2>🔗 Ressources</h2>
    <ul>
      <li><strong>Supabase Docs :</strong> <a href="https: //supabase.com/docs">Documentation officielle</a></li>
      <li><strong>PostgreSQL :</strong> <a href="https://www.postgresql.org/docs/">Guide de référence</a></li>
      <li><strong>RLS :</strong> <a href="https://supabase.com/docs/guides/auth/row-level-security">Sécurité</a></li>
      <li><strong>Performance :</strong> <a href="https://supabase.com/docs/guides/database/performance">Optimisation</a></li>
    </ul>, `, filePath: 'DOCUMENTATION-TABLES-SUPABASE.md, ', lastModified: new Date('2025-01-03'), tags: ['base-de-données, ', 'supabase', 'postgresql', 'architecture', 'sécurité', 'performance'], readTime: 20 }; 