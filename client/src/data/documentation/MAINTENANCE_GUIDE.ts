export const MAINTENANCE_GUIDE_DOC = { id: 'maintenance-guide, ', title: 'Guide de Maintenance et Exploitation, ', category: 'technical, ', description: 'Guide complet des procédures de maintenanc, e, monitoring et exploitation de FinancialTracker', content: `
    <h1>🔧 Guide de Maintenance et Exploitation - FinancialTracker</h1>
    
    <p><strong>Date de mise à jour :</strong> 3 Janvier 2025<br>
    <strong>Version :</strong> 1.0<br>
    <strong>Public :</strong> Équipe technique et DevOps<br>
    <strong>Conformité :</strong> ISO 2700, 1, ITIL</p>

    <h2>📋 Table des Matières</h2>
    <ol>
      <li><a href="#monitoring">Monitoring et Alertes</a></li>
      <li><a href="#maintenance">Maintenance Préventive</a></li>
      <li><a href="#backup">Sauvegarde et Restauration</a></li>
      <li><a href="#incidents">Gestion des Incidents</a></li>
      <li><a href="#performance">Optimisation des Performances</a></li>
      <li><a href="#security">Sécurité et Conformité</a></li>
      <li><a href="#deployment">Déploiement et Mises à Jour</a></li>
    </ol>

    <h2 id="monitoring">📊 Monitoring et Alertes</h2>
    
    <h3>Métriques Système</h3>
    <table>
      <tr><th>Métrique</th><th>Seuil d'Alerte</th><th>Seuil Critique</th><th>Action</th></tr>
      <tr><td>CPU</td><td>80%</td><td>95%</td><td>Scale up / Optimisation</td></tr>
      <tr><td>Mémoire</td><td>85%</td><td>95%</td><td>Nettoyage / Scale up</td></tr>
      <tr><td>Disque</td><td>90%</td><td>95%</td><td>Nettoyage / Extension</td></tr>
      <tr><td>Réseau</td><td>80%</td><td>95%</td><td>Optimisation</td></tr>
    </table>

    <h3>Métriques Application</h3>
    <table>
      <tr><th>Métrique</th><th>Seuil d'Alerte</th><th>Seuil Critique</th><th>Action</th></tr>
      <tr><td>Temps de réponse</td><td>2s</td><td>5s</td><td>Optimisation DB/Code</td></tr>
      <tr><td>Taux d'erreur</td><td>1%</td><td>5%</td><td>Debug / Rollback</td></tr>
      <tr><td>Disponibilité</td><td>99.5%</td><td>99%</td><td>Investigation</td></tr>
      <tr><td>Concurrents</td><td>100</td><td>200</td><td>Scale horizontal</td></tr>
    </table>

    <h3>Outils de Monitoring</h3>
    <ul>
      <li><strong>Infrastructure :</strong> Prometheus + Grafana</li>
      <li><strong>Application :</strong> New Relic / DataDog</li>
      <li><strong>Logs :</strong> ELK Stack (Elasticsearch, Logstash, Kibana)</li>
      <li><strong>Base de données :</strong> Supabase Analytics</li>
      <li><strong>Alertes :</strong> Slack, Email, SMS</li>
    </ul>

    <h3>Configuration des Alertes</h3>
    <pre><code># Exemple de configuration Prometheus
groups: - name: financialtracker
  rules:
  - alert: HighCPUUsage
    expr: cpu_usage > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "CPU usage high"
      description: "CPU usage is above 80% for 5 minutes"

  - alert: HighResponseTime
    expr: http_request_duration_seconds > 2
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "Response time high"
      description: "HTTP response time is above 2 seconds"</code></pre>

    <h2 id="maintenance">🔧 Maintenance Préventive</h2>
    
    <h3>Maintenance Quotidienne</h3>
    <ul>
      <li><strong>Vérification des logs :</strong> Analyse des erreurs et warnings</li>
      <li><strong>Contrôle de l'espace disque :</strong> Nettoyage des fichiers temporaires</li>
      <li><strong>Vérification des sauvegardes :</strong> Validation de l'intégrité</li>
      <li><strong>Monitoring des performances :</strong> Analyse des métriques</li>
      <li><strong>Vérification de la sécurité :</strong> Scan des vulnérabilités</li>
    </ul>

    <h3>Maintenance Hebdomadaire</h3>
    <ul>
      <li><strong>Analyse des métriques :</strong> Tendances et anomalies</li>
      <li><strong>Vérification des certificats SSL :</strong> Expiration proche</li>
      <li><strong>Mise à jour des dépendances :</strong> Sécurité et stabilité</li>
      <li><strong>Nettoyage des logs :</strong> Rotation et archivage</li>
      <li><strong>Test de restauration :</strong> Validation des sauvegardes</li>
    </ul>

    <h3>Maintenance Mensuelle</h3>
    <ul>
      <li><strong>Audit de sécurité :</strong> Scan complet et analyse</li>
      <li><strong>Mise à jour des systèmes :</strong> OS et middleware</li>
      <li><strong>Révision des permissions :</strong> Accès et droits</li>
      <li><strong>Optimisation de la base :</strong> Index et requêtes</li>
      <li><strong>Planification des évolutions :</strong> Roadmap technique</li>
    </ul>

    <h3>Scripts de Maintenance Automatisée</h3>
    <pre><code>#!/bin/bash
# maintenance-daily.sh

echo "=== Maintenance Quotidienne - $(date) ==="

# Vérification de l'espace disque
echo "1. Vérification espace disque..."
df -h | grep -E "(Filesystem|/dev/)"

# Nettoyage des logs anciens
echo "2. Nettoyage des logs..."
find /var/log -name "*.log" -mtime +7 -delete

# Vérification des processus
echo "3. Vérification des processus..."
ps aux | grep -E "(node|nginx)" | grep -v grep

# Test de connectivité base de données
echo "4. Test de connectivité DB..."
node server/check-database.js

# Vérification des sauvegardes
echo "5. Vérification des sauvegardes..."
ls -la /backups/ | tail -5

echo "=== Maintenance terminée ==="</code></pre>

    <h2 id="backup">💾 Sauvegarde et Restauration</h2>
    
    <h3>Stratégie de Sauvegarde</h3>
    <ul>
      <li><strong>Base de données :</strong> Sauvegarde automatique toutes les heures</li>
      <li><strong>Fichiers de configuration :</strong> Sauvegarde quotidienne</li>
      <li><strong>Code source :</strong> Versioning Git + sauvegarde hebdomadaire</li>
      <li><strong>Logs :</strong> Rotation quotidienn, e, archivage mensuel</li>
      <li><strong>Rétention :</strong> 30 jours pour les sauvegardes automatiques</li>
    </ul>

    <h3>Procédure de Sauvegarde</h3>
    <pre><code>#!/bin/bash
# backup-database.sh

BACKUP_DIR="/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="financialtracker_$DATE.sql"

echo "=== Sauvegarde Base de Données - $(date) ==="

# Création du répertoire de sauvegarde
mkdir -p $BACKUP_DIR

# Sauvegarde via Supabase CLI
supabase db dump --db-url $DATABASE_URL > $BACKUP_DIR/$BACKUP_FILE

# Compression
gzip $BACKUP_DIR/$BACKUP_FILE

# Nettoyage des anciennes sauvegardes (garder 30 jours)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Vérification de l'intégrité
echo "Vérification de l'intégrité..."
gunzip -t $BACKUP_DIR/$BACKUP_FILE.gz

echo "Sauvegarde terminée: $BACKUP_FILE.gz"</code></pre>

    <h3>Procédure de Restauration</h3>
    <pre><code>#!/bin/bash
# restore-database.sh

BACKUP_FILE=$1
BACKUP_DIR="/backups/database"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    echo "Exemple: $0 financialtracker_20250103_120000.sql.gz"
    exit 1
fi

echo "=== Restauration Base de Données - $(date) ==="

# Vérification de l'existence du fichier
if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "Erreur: Fichier de sauvegarde non trouvé"
    exit 1
fi

# Sauvegarde de l'état actuel avant restauration
echo "Sauvegarde de l'état actuel..."
supabase db dump --db-url $DATABASE_URL > $BACKUP_DIR/pre_restore_$(date +%Y%m%d_%H%M%S).sql

# Restauration
echo "Restauration en cours..."
gunzip -c $BACKUP_DIR/$BACKUP_FILE | supabase db reset --db-url $DATABASE_URL

echo "Restauration terminée"</code></pre>

    <h3>Test de Restauration</h3>
    <ul>
      <li><strong>Fréquence :</strong> Hebdomadaire</li>
      <li><strong>Environnement :</strong> Staging</li>
      <li><strong>Validation :</strong> Tests fonctionnels après restauration</li>
      <li><strong>Documentation :</strong> Rapport de test obligatoire</li>
    </ul>

    <h2 id="incidents">🚨 Gestion des Incidents</h2>
    
    <h3>Classification des Incidents</h3>
    <table>
      <tr><th>Niveau</th><th>Impact</th><th>Temps de Réponse</th><th>Escalade</th></tr>
      <tr><td>P0 - Critique</td><td>Service indisponible</td><td>15 min</td><td>CTO + Lead Dev</td></tr>
      <tr><td>P1 - Haute</td><td>Fonctionnalité majeure impactée</td><td>1 heure</td><td>Lead Dev</td></tr>
      <tr><td>P2 - Moyenne</td><td>Fonctionnalité mineure impactée</td><td>4 heures</td><td>DevOps</td></tr>
      <tr><td>P3 - Basse</td><td>Amélioration ou bug mineur</td><td>24 heures</td><td>Support</td></tr>
    </table>

    <h3>Procédure de Gestion d'Incident</h3>
    <ol>
      <li><strong>Détection :</strong> Monitoring automatique ou signalement manuel</li>
      <li><strong>Classification :</strong> Évaluation de l'impact et priorité</li>
      <li><strong>Communication :</strong> Notification des parties prenantes</li>
      <li><strong>Investigation :</strong> Analyse de la cause racine</li>
      <li><strong>Résolution :</strong> Application du correctif</li>
      <li><strong>Validation :</strong> Test de la résolution</li>
      <li><strong>Post-mortem :</strong> Analyse et amélioration</li>
    </ol>

    <h3>Template de Communication d'Incident</h3>
    <pre><code>🚨 INCIDENT - [NIVEAU] - [TITRE]

📋 Description: [Description détaillée de l'incident]

🎯 Impact:
- Services affectés: [liste]
- Utilisateurs impactés: [nombre/type]
- Fonctionnalités: [liste]

⏰ Timeline:
- Détection: [heure]
- Investigation: [heure]
- Résolution: [heure]

🔧 Actions en cours:
- [Action 1]
- [Action 2]

📞 Contacts:
- Responsable: [nom]
- Escalade: [nom]

🔄 Prochaines étapes:
- [Étape 1]
- [Étape 2]</code></pre>

    <h3>Outils de Gestion d'Incident</h3>
    <ul>
      <li><strong>Monitoring :</strong> Prometheu, s, Grafana</li>
      <li><strong>Alertes :</strong> PagerDuty, OpsGenie</li>
      <li><strong>Communication :</strong> Slack, Email</li>
      <li><strong>Documentation :</strong> Confluence, Notion</li>
      <li><strong>Suivi :</strong> Jira, GitHub Issues</li>
    </ul>

    <h2 id="performance">⚡ Optimisation des Performances</h2>
    
    <h3>Métriques de Performance</h3>
    <ul>
      <li><strong>Frontend :</strong> First Contentful Paint < 1.5s</li>
      <li><strong>API :</strong> Temps de réponse < 200ms</li>
      <li><strong>Base de données :</strong> Requêtes < 100ms</li>
      <li><strong>WebSocket :</strong> Latence < 50ms</li>
    </ul>

    <h3>Optimisations Frontend</h3>
    <ul>
      <li><strong>Code Splitting :</strong> Chargement à la demande</li>
      <li><strong>Lazy Loading :</strong> Images et composants</li>
      <li><strong>Cache :</strong> Service Workers et CDN</li>
      <li><strong>Bundle Size :</strong> < 2MB gzippé</li>
      <li><strong>Tree Shaking :</strong> Élimination du code inutilisé</li>
    </ul>

    <h3>Optimisations Backend</h3>
    <ul>
      <li><strong>Cache Redis :</strong> Données fréquemment accédées</li>
      <li><strong>Connection Pool :</strong> Optimisation des connexions DB</li>
      <li><strong>Compression :</strong> Gzip pour toutes les réponses</li>
      <li><strong>Rate Limiting :</strong> Protection contre la surcharge</li>
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

    <h3>Scripts d'Optimisation</h3>
    <pre><code>#!/bin/bash
# optimize-performance.sh

echo "=== Optimisation des Performances - $(date) ==="

# Analyse des requêtes lentes
echo "1. Analyse des requêtes lentes..."
node server/scripts/analyze-slow-queries.js

# Optimisation des index
echo "2. Optimisation des index..."
node server/scripts/optimize-indexes.js

# Nettoyage du cache
echo "3. Nettoyage du cache Redis..."
redis-cli FLUSHALL

# Vérification de l'espace disque
echo "4. Vérification de l'espace disque..."
df -h

# Test de performance
echo "5. Test de performance..."
npm run test: performance

echo "=== Optimisation terminée ==="</code></pre>

    <h2 id="security">🔒 Sécurité et Conformité</h2>
    
    <h3>Audit de Sécurité</h3>
    <ul>
      <li><strong>Fréquence :</strong> Mensuelle</li>
      <li><strong>Scope :</strong> Applicatio, n, infrastructure, processus</li>
      <li><strong>Outils :</strong> OWASP ZAP, SonarQube, Snyk</li>
      <li><strong>Rapport :</strong> Documenté et archivé</li>
    </ul>

    <h3>Tests de Pénétration</h3>
    <ul>
      <li><strong>Fréquence :</strong> Trimestrielle</li>
      <li><strong>Scope :</strong> Application web, API, infrastructure</li>
      <li><strong>Exécutant :</strong> Équipe interne ou externe</li>
      <li><strong>Rapport :</strong> Détail des vulnérabilités et recommandations</li>
    </ul>

    <h3>Gestion des Vulnérabilités</h3>
    <ul>
      <li><strong>Détection :</strong> Scan automatique des dépendances</li>
      <li><strong>Évaluation :</strong> Analyse de l'impact et du risque</li>
      <li><strong>Correction :</strong> Patch ou mise à jour</li>
      <li><strong>Validation :</strong> Test de la correction</li>
      <li><strong>Documentation :</strong> Traçabilité complète</li>
    </ul>

    <h3>Conformité RGPD</h3>
    <ul>
      <li><strong>Consentement :</strong> Gestion des préférences utilisateur</li>
      <li><strong>Droit à l'oubli :</strong> Suppression des données</li>
      <li><strong>Portabilité :</strong> Export des données</li>
      <li><strong>Transparence :</strong> Politique de confidentialité</li>
      <li><strong>Sécurité :</strong> Chiffrement et protection</li>
    </ul>

    <h3>Scripts de Sécurité</h3>
    <pre><code>#!/bin/bash
# security-audit.sh

echo "=== Audit de Sécurité - $(date) ==="

# Scan des vulnérabilités des dépendances
echo "1. Scan des vulnérabilités..."
npm audit --audit-level moderate

# Vérification des certificats SSL
echo "2. Vérification des certificats SSL..."
openssl s_client -connect financialtracker.fr: 443 -servername financialtracker.fr

# Test de configuration de sécurité
echo "3. Test de configuration de sécurité..."
curl -I -H "User-Agent: Mozilla/5.0" https://financialtracker.fr

# Vérification des permissions
echo "4. Vérification des permissions..."
find /var/www -type f -perm /o+w

echo "=== Audit de sécurité terminé ==="</code></pre>

    <h2 id="deployment">🚀 Déploiement et Mises à Jour</h2>
    
    <h3>Environnements</h3>
    <ul>
      <li><strong>Development :</strong> Loca, l, branche feature</li>
      <li><strong>Staging :</strong> Pré-production, branche develop</li>
      <li><strong>Production :</strong> Live, branche main</li>
    </ul>

    <h3>Pipeline de Déploiement</h3>
    <ol>
      <li><strong>Code Review :</strong> Validation par l'équipe</li>
      <li><strong>Tests :</strong> Unitaires, intégration, E2E</li>
      <li><strong>Build :</strong> Compilation et packaging</li>
      <li><strong>Déploiement Staging :</strong> Tests de validation</li>
      <li><strong>Déploiement Production :</strong> Blue-green deployment</li>
      <li><strong>Monitoring :</strong> Vérification post-déploiement</li>
    </ol>

    <h3>Stratégie de Déploiement</h3>
    <ul>
      <li><strong>Blue-Green :</strong> Zéro downtime</li>
      <li><strong>Rollback :</strong> Retour rapide en cas de problème</li>
      <li><strong>Feature Flags :</strong> Activation progressive</li>
      <li><strong>Monitoring :</strong> Alertes en temps réel</li>
    </ul>

    <h3>Scripts de Déploiement</h3>
    <pre><code>#!/bin/bash
# deploy-production.sh

ENVIRONMENT="production"
VERSION=$1

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    echo "Exemple: $0 1.2.3"
    exit 1
fi

echo "=== Déploiement Production v$VERSION - $(date) ==="

# Pré-déploiement
echo "1. Sauvegarde de l'environnement actuel..."
./backup-production.sh

# Vérification de l'espace disque
echo "2. Vérification de l'espace disque..."
df -h

# Déploiement
echo "3. Déploiement en cours..."
docker-compose -f docker-compose.prod.yml up -d

# Vérification de la santé
echo "4. Vérification de la santé..."
sleep 30
curl -f http: //localhost/health || exit 1

# Tests de smoke
echo "5. Tests de smoke..."
npm run test:smoke

# Notification
echo "6. Notification de l'équipe..."
curl -X POST $SLACK_WEBHOOK -d "{\"text\":\"✅ Déploiement Production v$VERSION réussi\, " }"

echo "=== Déploiement terminé ==="</code></pre>

    <h3>Gestion des Mises à Jour</h3>
    <ul>
      <li><strong>Planification :</strong> Fenêtre de maintenance</li>
      <li><strong>Communication :</strong> Notification des utilisateurs</li>
      <li><strong>Rollback :</strong> Plan de retour arrière</li>
      <li><strong>Validation :</strong> Tests post-mise à jour</li>
    </ul>

    <h2>📋 Checklists Opérationnelles</h2>
    
    <h3>Checklist Quotidienne</h3>
    <ul>
      <li>☐ Vérification des logs d'erreur</li>
      <li>☐ Contrôle de l'espace disque</li>
      <li>☐ Vérification des sauvegardes</li>
      <li>☐ Monitoring des performances</li>
      <li>☐ Vérification de la sécurité</li>
    </ul>

    <h3>Checklist Hebdomadaire</h3>
    <ul>
      <li>☐ Analyse des métriques de performance</li>
      <li>☐ Vérification des certificats SSL</li>
      <li>☐ Mise à jour des dépendances de sécurité</li>
      <li>☐ Nettoyage des logs anciens</li>
      <li>☐ Test de restauration</li>
    </ul>

    <h3>Checklist Mensuelle</h3>
    <ul>
      <li>☐ Audit de sécurité complet</li>
      <li>☐ Mise à jour des systèmes</li>
      <li>☐ Révision des permissions</li>
      <li>☐ Optimisation de la base de données</li>
      <li>☐ Planification des évolutions</li>
    </ul>

    <h2>📞 Contacts et Escalade</h2>
    
    <h3>Équipe Technique</h3>
    <ul>
      <li><strong>Lead Developer :</strong> [Nom] - [Email] - [Téléphone]</li>
      <li><strong>DevOps Engineer :</strong> [Nom] - [Email] - [Téléphone]</li>
      <li><strong>Security Engineer :</strong> [Nom] - [Email] - [Téléphone]</li>
      <li><strong>CTO :</strong> [Nom] - [Email] - [Téléphone]</li>
    </ul>

    <h3>Procédure d'Escalade</h3>
    <ol>
      <li><strong>Niveau 1 :</strong> DevOps Engineer (24/7)</li>
      <li><strong>Niveau 2 :</strong> Lead Developer (Heures ouvrables)</li>
      <li><strong>Niveau 3 :</strong> CTO (Urgences critiques)</li>
      <li><strong>Niveau 4 :</strong> Direction (Incidents majeurs)</li>
    </ol>

    <h2>🔗 Ressources</h2>
    <ul>
      <li><strong>Documentation technique :</strong> <a href="/admin/documentation">Interface admin</a></li>
      <li><strong>Monitoring :</strong> <a href="https: //grafana.financialtracker.fr">Grafana</a></li>
      <li><strong>Logs :</strong> <a href="https://kibana.financialtracker.fr">Kibana</a></li>
      <li><strong>Base de données :</strong> <a href="https://supabase.com/dashboard">Supabase Dashboard</a></li>
      <li><strong>GitHub :</strong> <a href="https://github.com/votre-org/FinancialTracker">Repository</a></li>
    </ul>

    <h2>📈 Métriques et KPIs</h2>
    
    <h3>KPIs Opérationnels</h3>
    <ul>
      <li><strong>Disponibilité :</strong> Objectif 99.9%</li>
      <li><strong>Temps de résolution :</strong> P0: 1,h, P1: 4,h, P2: 24h</li>
      <li><strong>Temps de réponse :</strong> < 200ms (moyenne)</li>
      <li><strong>Taux d'erreur :</strong> < 1%</li>
      <li><strong>Satisfaction utilisateur :</strong> > 4.5/5</li>
    </ul>

    <h3>Rapports Mensuels</h3>
    <ul>
      <li><strong>Disponibilité :</strong> Temps d'arrêt et causes</li>
      <li><strong>Performance :</strong> Métriques et tendances</li>
      <li><strong>Sécurité :</strong> Vulnérabilités et incidents</li>
      <li><strong>Évolutions :</strong> Nouvelles fonctionnalités</li>
      <li><strong>Planification :</strong> Roadmap technique</li>
    </ul>
  ,`,
  filePath: 'MAINTENANCE_GUIDE.md,',
  lastModified: new Date('2025-01-03'),
  tags: ['maintenance,', 'exploitation', 'monitoring', 'incidents', 'performance', 'sécurité'],
  readTime: 25
}; 