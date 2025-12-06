# 📊 Script d'Analyse des Tables de Notifications

Ce script analyse en détail toutes les tables de notifications de la base de données pour perfectionner le système existant.

## 🚀 Utilisation

### Option 1 : Via npm (recommandé)

Depuis le dossier `server/` :

```bash
npm run analyse:notifications
```

### Option 2 : Directement avec ts-node

Depuis la racine du projet :

```bash
cd server
npx ts-node scripts/analyse-tables-notifications.ts
```

## 📋 Prérequis

1. **Variables d'environnement** : Le script nécessite `DATABASE_URL` dans votre fichier `.env`
   - Le script cherche automatiquement le fichier `.env` dans plusieurs emplacements :
     - `/.env` (racine du projet)
     - `/server/.env`
     - `./.env` (répertoire courant)

2. **Connexion à la base de données** : Assurez-vous que votre `DATABASE_URL` est correctement configuré

## 📊 Ce que fait le script

1. **Connexion à la base de données** : Se connecte à PostgreSQL via `DATABASE_URL`
2. **Découverte des tables** : Liste toutes les tables du schéma `public`
3. **Identification intelligente** : Identifie les tables de notifications en utilisant :
   - Analyse du nom de la table (mots-clés : notification, notif, alert, reminder, etc.)
   - Analyse des colonnes (colonnes typiques : user_id, read, status, priority, etc.)
   - Score de confiance (0-100)
4. **Analyse détaillée** : Pour chaque table identifiée, analyse :
   - Structure des colonnes (types, contraintes, valeurs par défaut)
   - Index (types, unicité, colonnes indexées)
   - Contraintes (clés primaires, clés étrangères, etc.)
   - Politiques RLS (Row Level Security)
   - Triggers
   - Relations avec d'autres tables
5. **Génération du rapport** : Crée un rapport Markdown complet dans `ANALYSE-TABLES-NOTIFICATIONS.md`

## 📄 Format du rapport

Le rapport généré contient :

- **Résumé exécutif** : Nombre total de tables analysées et identifiées
- **Détails par table** : Pour chaque table de notification :
  - Score de confiance et raisons d'identification
  - Statistiques (lignes, colonnes, index, etc.)
  - Structure complète des colonnes
  - Liste des index avec leurs colonnes
  - Clés étrangères et relations
  - Politiques RLS
  - Triggers
- **Statistiques globales** : Vue d'ensemble du système de notifications

## 🎯 Critères d'identification

Une table est identifiée comme table de notifications si elle obtient un score ≥ 30/100 basé sur :

- **Nom de la table** (50 points max) : Contient des mots-clés de notification
- **Colonnes typiques** (5 points par colonne) : user_id, read, status, priority, etc.
- **Colonnes spécifiques** :
  - `notification_type` ou `type` : +20 points
  - Colonne de statut de lecture : +15 points
  - Colonne de priorité : +10 points
  - Colonne de type d'utilisateur : +10 points

## 📝 Exemple de sortie

```
🚀 Démarrage de l'analyse des tables de notifications...

✅ Connexion à la base de données réussie

📋 Récupération de la liste des tables...
✅ 150 tables trouvées

🔍 Analyse des tables en cours...
📊 Analyse de la table: notification...
📊 Analyse de la table: AdminNotification...
...

📝 Génération du rapport...
✅ Rapport sauvegardé dans: /path/to/ANALYSE-TABLES-NOTIFICATIONS.md

📊 RÉSUMÉ:
   - Tables analysées: 150
   - Tables de notifications identifiées: 8
   - Score moyen de confiance: 85/100

🎯 TABLES DE NOTIFICATIONS IDENTIFIÉES:
   1. notification (1250 lignes, score: 95)
   2. AdminNotification (342 lignes, score: 90)
   3. ExpertNotification (156 lignes, score: 85)
   ...
```

## 🔧 Dépannage

### Erreur de connexion

Si vous obtenez une erreur de connexion :
1. Vérifiez que `DATABASE_URL` est défini dans votre `.env`
2. Vérifiez que la base de données est accessible
3. Vérifiez les permissions de connexion

### Erreur de permissions

Si certaines tables ne peuvent pas être analysées :
- Le script continue avec les autres tables
- Les erreurs sont affichées dans la console
- Le rapport contiendra les tables analysées avec succès

## 📚 Fichiers générés

- `ANALYSE-TABLES-NOTIFICATIONS.md` : Rapport complet d'analyse (à la racine du projet)

## 🔄 Prochaines étapes

Après l'analyse, vous pouvez :
1. Examiner le rapport généré
2. Identifier les tables obsolètes ou redondantes
3. Proposer des améliorations au système de notifications
4. Optimiser les index et contraintes
5. Harmoniser les structures de tables similaires
