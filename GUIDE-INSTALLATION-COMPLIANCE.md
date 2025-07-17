# 🛡️ Guide d'Installation - Système de Conformité et Intégrations

## 📋 Prérequis

- Node.js 18+ installé
- Compte Supabase configuré
- Variables d'environnement configurées

## 🔧 Configuration des Variables d'Environnement

Créez un fichier `.env` à la racine du projet :

```bash
# Supabase
SUPABASE_URL=votre_url_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role

# Providers de signature (optionnels)
DOCUSIGN_API_KEY=votre_clé_docusign
DOCUSIGN_ACCOUNT_ID=votre_account_id
DOCUSIGN_USER_ID=votre_user_id
DOCUSIGN_PASSWORD=votre_mot_de_passe

HELLOSIGN_API_KEY=votre_clé_hellosign

# Providers de paiement (optionnels)
STRIPE_SECRET_KEY=votre_clé_stripe
STRIPE_PUBLISHABLE_KEY=votre_clé_publique_stripe

PAYPAL_CLIENT_ID=votre_client_id_paypal
PAYPAL_CLIENT_SECRET=votre_client_secret_paypal

# Providers de notifications push (optionnels)
FIREBASE_PROJECT_ID=votre_project_id
FIREBASE_PRIVATE_KEY=votre_clé_privée
FIREBASE_CLIENT_EMAIL=votre_client_email

ONESIGNAL_APP_ID=votre_app_id
ONESIGNAL_REST_API_KEY=votre_rest_api_key
```

## 🚀 Installation

### Étape 1: Exécuter les migrations

```bash
# Rendre le script exécutable
chmod +x server/scripts/setup-compliance-system.sh

# Exécuter le script d'installation
./server/scripts/setup-compliance-system.sh
```

### Étape 2: Vérifier l'installation

```bash
# Test basique
node server/scripts/test-basic-compliance.js

# Test complet (si les providers sont configurés)
node server/scripts/test-compliance-integrations.js
```

### Étape 3: Démarrer l'application

```bash
# Démarrer le serveur backend
cd server && npm run dev

# Démarrer le client frontend
cd client && npm run dev
```

## 📊 Vérification de l'Installation

### Tables Créées

Le script crée automatiquement les tables suivantes :

**Gestion Documentaire :**
- `DocumentFile` - Fichiers documentaires
- `DocumentFileVersion` - Versions des fichiers
- `DocumentFileAccessLog` - Journal d'accès
- `DocumentFilePermission` - Permissions
- `DocumentFileShare` - Partages
- `Client` - Clients
- `Expert` - Experts
- `Invoice` - Factures

**Conformité :**
- `WorkflowTemplate` - Templates de workflow
- `WorkflowStep` - Étapes de workflow
- `WorkflowInstance` - Instances de workflow
- `ComplianceControl` - Contrôles de conformité
- `SecurityIncident` - Incidents de sécurité
- `DataSubjectRequest` - Demandes RGPD
- `AuditLog` - Journal d'audit
- `ComplianceReport` - Rapports de conformité

**Intégrations :**
- `SignatureRequest` - Demandes de signature
- `PaymentRequest` - Demandes de paiement
- `PushNotification` - Notifications push

### Buckets Storage

Les buckets suivants sont créés automatiquement :
- `documents` - Documents généraux
- `signatures` - Documents de signature
- `reports` - Rapports et exports

## 🧪 Tests

### Test Basique

```bash
node server/scripts/test-basic-compliance.js
```

Ce test vérifie :
- ✅ Connexion à la base de données
- ✅ Existence des tables
- ✅ Lecture des données
- ✅ Insertion de données
- ✅ Politiques RLS
- ✅ Fonctions utilitaires
- ✅ Performance

### Test Complet

```bash
node server/scripts/test-compliance-integrations.js
```

Ce test vérifie également :
- ✅ Workflows personnalisables
- ✅ Intégrations externes
- ✅ Conformité ISO 27001/SOC 2/RGPD
- ✅ Sécurité et autorisation

## 🎯 Utilisation

### Accès au Tableau de Bord

1. Connectez-vous en tant qu'administrateur
2. Accédez à `/admin/compliance` dans l'interface
3. Utilisez le tableau de bord pour :
   - Visualiser les KPIs de conformité
   - Gérer les workflows
   - Monitorer les incidents
   - Consulter les rapports

### Configuration des Workflows

1. Allez dans l'onglet "Workflows"
2. Cliquez sur "Configurer" pour un workflow
3. Modifiez les étapes selon vos besoins
4. Sauvegardez la configuration

### Gestion de la Conformité

1. Allez dans l'onglet "Conformité"
2. Consultez les contrôles par standard
3. Mettez à jour les statuts
4. Générez des rapports

## 🔧 Dépannage

### Erreur de Connexion Supabase

```bash
# Vérifiez vos variables d'environnement
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

### Erreur de Migration

```bash
# Vérifiez les logs
tail -f server/logs/migration.log

# Relancez les migrations
./server/scripts/setup-compliance-system.sh
```

### Erreur de Test

```bash
# Testez la connexion manuellement
psql $SUPABASE_URL -c "SELECT version();"

# Vérifiez les tables
psql $SUPABASE_URL -c "\dt"
```

## 📈 Monitoring

### Métriques à Surveiller

- **Performance** : Temps de réponse des API
- **Conformité** : Scores par standard
- **Sécurité** : Nombre d'incidents
- **Utilisation** : Nombre de documents traités

### Alertes Configurées

- Contrôles en retard de révision
- Incidents de sécurité critiques
- Workflows en échec
- Documents expirés

## 🔒 Sécurité

### Politiques RLS Activées

Toutes les tables ont des politiques RLS configurées :
- Les utilisateurs ne voient que leurs données
- Les admins ont accès complet
- Les experts voient les données de leurs clients

### Chiffrement

- Documents sensibles chiffrés automatiquement
- Niveaux de chiffrement configurables
- Clés de chiffrement sécurisées

### Audit Trail

- Toutes les actions sont loggées
- Traçabilité complète
- Conformité RGPD

## 📞 Support

En cas de problème :

1. Consultez les logs dans `server/logs/`
2. Vérifiez la configuration des variables d'environnement
3. Relancez les tests basiques
4. Contactez l'équipe technique

## 🎉 Félicitations !

Votre système de conformité et d'intégrations est maintenant opérationnel !

**Prochaines étapes recommandées :**
1. Configurer les providers externes selon vos besoins
2. Former les équipes aux nouveaux outils
3. Mettre en place le monitoring
4. Planifier les audits de conformité

---

*Documentation générée automatiquement - Système de Conformité v1.0* 