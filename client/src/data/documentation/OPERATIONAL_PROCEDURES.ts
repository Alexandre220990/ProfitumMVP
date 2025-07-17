export const OPERATIONAL_PROCEDURES_DOC = { id: 'operational-procedures, ', title: 'OPERATIONAL_PROCEDURES.md, ', category: 'guides, ', description: 'Procédures opérationnelles standardisées pour la sécurité et la conformité, ', content: `
    <h1>⚙️ Procédures Opérationnelles - Profitum</h1>
    <h2>📋 Informations Générales</h2>
    <p><strong>Document</strong> : Procédures Opérationnelles<br>
    <strong>Version</strong> : 1.0<br>
    <strong>Date de création</strong> : 1er juillet 2025<br>
    <strong>Responsable</strong> : Équipe technique Profitum<br>
    <strong>Conformité</strong> : ISO 27001 - A.12.1</p>
    <h2>🎯 Objectif</h2>
    <p>Ce document définit les procédures opérationnelles standardisées pour assurer la sécurit, é, la fiabilité et la conformité des systèmes Profitum.</p>
    <h2>📋 Table des Matières</h2>
    <ol>
      <li><a href="#déploiement">Procédures de Déploiement</a></li>
      <li><a href="#maintenance">Procédures de Maintenance</a></li>
      <li><a href="#monitoring">Procédures de Monitoring</a></li>
      <li><a href="#sauvegarde">Procédures de Sauvegarde</a></li>
      <li><a href="#incident">Procédures d'Incident</a></li>
      <li><a href="#changement">Procédures de Changement</a></li>
    </ol>
    <h2 id="déploiement">🚀 Procédures de Déploiement</h2>
    <h3>1.1 Déploiement en Développement</h3>
    <h4>Prérequis</h4>
    <ul>
      <li>[ ] Code review approuvé</li>
      <li>[ ] Tests unitaires passés</li>
      <li>[ ] Tests d'intégration passés</li>
      <li>[ ] Documentation mise à jour</li>
    </ul>
    <h4>Étapes</h4>
    <h5>1. Préparation</h5>
    <pre><code># Vérification de l'environnement
npm run test
npm run build
npm run lint</code></pre>
    <h5>2. Déploiement</h5>
    <pre><code># Déploiement automatique via CI/CD
git push origin develop</code></pre>
    <h5>3. Validation</h5>
    <ul>
      <li>[ ] Tests de régression</li>
      <li>[ ] Vérification des logs</li>
      <li>[ ] Validation des performances</li>
    </ul>
    <h3>1.2 Déploiement en Production</h3>
    <h4>Prérequis</h4>
    <ul>
      <li>[ ] Tests en staging réussis</li>
      <li>[ ] Approbation du comité de sécurité</li>
      <li>[ ] Plan de rollback préparé</li>
      <li>[ ] Équipe de support notifiée</li>
    </ul>
    <h4>Étapes</h4>
    <h5>1. Pré-déploiement</h5>
    <pre><code># Sauvegarde de l'environnement actuel
npm run backup: prod

# Vérification de l'espace disque
df -h

# Vérification de la mémoire
free -h</code></pre>
    <h5>2. Déploiement</h5>
    <pre><code># Déploiement avec blue-green
npm run deploy:prod</code></pre>
    <h5>3. Post-déploiement</h5>
    <ul>
      <li>[ ] Vérification de la santé des services</li>
      <li>[ ] Tests de smoke</li>
      <li>[ ] Monitoring des métriques</li>
      <li>[ ] Notification de l'équipe</li>
    </ul>
    <h4>Rollback</h4>
    <pre><code># En cas de problème
npm run rollback:prod</code></pre>
    <h2 id="maintenance">🔧 Procédures de Maintenance</h2>
    <h3>2.1 Maintenance Préventive</h3>
    <h4>Maintenance Quotidienne</h4>
    <ul>
      <li>[ ] Vérification des logs d'erreur</li>
      <li>[ ] Contrôle de l'espace disque</li>
      <li>[ ] Vérification des sauvegardes</li>
      <li>[ ] Monitoring des performances</li>
    </ul>
    <h4>Maintenance Hebdomadaire</h4>
    <ul>
      <li>[ ] Analyse des métriques de performance</li>
      <li>[ ] Vérification des certificats SSL</li>
      <li>[ ] Mise à jour des dépendances de sécurité</li>
      <li>[ ] Nettoyage des logs anciens</li>
    </ul>
    <h4>Maintenance Mensuelle</h4>
    <ul>
      <li>[ ] Audit de sécurité</li>
      <li>[ ] Mise à jour des systèmes</li>
      <li>[ ] Révision des permissions</li>
      <li>[ ] Test de restauration</li>
    </ul>
    <h3>2.2 Maintenance Corrective</h3>
    <h4>Détection de Problème</h4>
    <ol>
      <li><strong>Identification</strong> : Détection automatique ou manuelle</li>
      <li><strong>Classification</strong> : Urgenc, e, Haute, Moyenne, Basse</li>
      <li><strong>Assignation</strong> : Attribution à un technicien</li>
      <li><strong>Résolution</strong> : Application du correctif</li>
      <li><strong>Validation</strong> : Test de la correction</li>
    </ol>
    <h4>Procédure de Correction</h4>
    <pre><code># 1. Diagnostic
npm run diagnose

# 2. Application du correctif
npm run apply: fix

# 3. Test de la correction
npm run test:fix

# 4. Déploiement
npm run deploy:fix</code></pre>
    <h2 id="monitoring">📊 Procédures de Monitoring</h2>
    <h3>3.1 Monitoring Continu</h3>
    <h4>Métriques Système</h4>
    <ul>
      <li><strong>CPU</strong> : Seuil d'alerte à 80%</li>
      <li><strong>Mémoire</strong> : Seuil d'alerte à 85%</li>
      <li><strong>Disque</strong> : Seuil d'alerte à 90%</li>
      <li><strong>Réseau</strong> : Surveillance du trafic</li>
    </ul>
    <h4>Métriques Application</h4>
    <ul>
      <li><strong>Temps de réponse</strong> : Seuil à 2 secondes</li>
      <li><strong>Taux d'erreur</strong> : Seuil à 1%</li>
      <li><strong>Disponibilité</strong> : Objectif 99.9%</li>
      <li><strong>Concurrents</strong> : Surveillance des sessions</li>
    </ul>
    <h3>3.2 Alertes et Notifications</h3>
    <h4>Niveaux d'Alerte</h4>
    <ul>
      <li><strong>Critical</strong> : Notification immédiate + SMS</li>
      <li><strong>Warning</strong> : Notification email + Slack</li>
      <li><strong>Info</strong> : Log uniquement</li>
    </ul>
    <h4>Procédure d'Alerte</h4>
    <ol>
      <li><strong>Réception</strong> : Système de monitoring</li>
      <li><strong>Classification</strong> : Automatique selon les seuils</li>
      <li><strong>Notification</strong> : Envoi selon le niveau</li>
      <li><strong>Escalade</strong> : Si pas de réponse dans les délais</li>
    </ol>
    <h3>3.3 Tableaux de Bord</h3>
    <h4>Dashboard Opérationnel</h4>
    <ul>
      <li>État des services en temps réel</li>
      <li>Métriques de performance</li>
      <li>Alertes actives</li>
      <li>Historique des incidents</li>
    </ul>
    <h4>Dashboard Sécurité</h4>
    <ul>
      <li>Tentatives d'accès suspectes</li>
      <li>Violations de sécurité</li>
      <li>État des certificats</li>
      <li>Logs d'audit</li>
    </ul>
    <h2 id="sauvegarde">💾 Procédures de Sauvegarde</h2>
    <h3>4.1 Sauvegarde Automatique</h3>
    <h4>Fréquence</h4>
    <ul>
      <li><strong>Base de données</strong> : Toutes les heures</li>
      <li><strong>Fichiers de configuration</strong> : Quotidien</li>
      <li><strong>Logs</strong> : Quotidien</li>
      <li><strong>Sauvegarde complète</strong> : Hebdomadaire</li>
    </ul>
    <h4>Procédure</h4>
    <pre><code># Sauvegarde automatique
npm run backup:auto

# Vérification de l'intégrité
npm run backup:verify

# Test de restauration
npm run backup:test-restore</code></pre>
    <h3>4.2 Sauvegarde Manuelle</h3>
    <h4>Avant un Déploiement</h4>
    <pre><code># Sauvegarde complète
npm run backup:manual

# Sauvegarde de la configuration
npm run backup:config

# Sauvegarde des données utilisateur
npm run backup:users</code></pre>
    <h2 id="incident">🚨 Procédures d'Incident</h2>
    <h3>5.1 Classification des Incidents</h3>
    <h4>Niveaux de Gravité</h4>
    <ul>
      <li><strong>P0 - Critique</strong> : Service complètement indisponible</li>
      <li><strong>P1 - Haute</strong> : Fonctionnalité majeure impactée</li>
      <li><strong>P2 - Moyenne</strong> : Fonctionnalité mineure impactée</li>
      <li><strong>P3 - Basse</strong> : Amélioration ou bug mineur</li>
    </ul>
    <h3>5.2 Procédure de Gestion d'Incident</h3>
    <h4>Étapes</h4>
    <ol>
      <li><strong>Détection</strong> : Identification automatique ou manuelle</li>
      <li><strong>Évaluation</strong> : Classification et impact</li>
      <li><strong>Communication</strong> : Notification des parties prenantes</li>
      <li><strong>Résolution</strong> : Application du correctif</li>
      <li><strong>Validation</strong> : Test de la résolution</li>
      <li><strong>Post-mortem</strong> : Analyse et amélioration</li>
    </ol>
    <h2 id="changement">🔄 Procédures de Changement</h2>
    <h3>6.1 Gestion des Changements</h3>
    <h4>Types de Changements</h4>
    <ul>
      <li><strong>Standard</strong> : Changements routiniers et approuvés</li>
      <li><strong>Normal</strong> : Changements planifiés avec approbation</li>
      <li><strong>Urgent</strong> : Changements critiques nécessitant une approbation rapide</li>
    </ul>
    <h4>Processus d'Approvision</h4>
    <ol>
      <li><strong>Demande</strong> : Soumission du formulaire de changement</li>
      <li><strong>Évaluation</strong> : Analyse de l'impact et des risques</li>
      <li><strong>Approbation</strong> : Validation par le comité de changement</li>
      <li><strong>Planification</strong> : Planification de l'exécution</li>
      <li><strong>Exécution</strong> : Mise en œuvre du changement</li>
      <li><strong>Validation</strong> : Vérification du succès</li>
    </ol>
    <h3>6.2 Contrôle des Changements</h3>
    <h4>Documentation Requise</h4>
    <ul>
      <li>Description détaillée du changement</li>
      <li>Justification et objectifs</li>
      <li>Analyse d'impact</li>
      <li>Plan de rollback</li>
      <li>Tests de validation</li>
    </ul>
    <h4>Suivi</h4>
    <ul>
      <li>Registre des changements</li>
      <li>Métriques de succès</li>
      <li>Leçons apprises</li>
      <li>Améliorations continues</li>
    </ul>, `, filePath: 'server/docs/OPERATIONAL_PROCEDURES.md, ', lastModified: new Date('2024-02-01'), tags: ['procédures, ', 'opérationnel', 'maintenance', 'monitoring'], readTime: 12 }; 