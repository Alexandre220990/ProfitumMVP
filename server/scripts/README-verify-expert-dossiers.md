# Scripts de vérification et correction des dossiers experts

## Problème identifié

Les dossiers avec le statut `refund_completed` (Remboursement effectué) ou avec `date_remboursement` remplie ne s'affichent pas toujours dans le KPI "Mes dossiers" du dashboard expert.

## Cause probable

Les dossiers terminés peuvent avoir perdu leur `expert_id` ou `expert_pending_id` lors d'une mise à jour, ce qui les exclut des requêtes qui filtrent par expert.

## Scripts disponibles

### 1. `verify-expert-dossiers.sql` - Script de diagnostic

Ce script permet de :
- Identifier tous les dossiers avec `refund_completed`
- Identifier tous les dossiers avec `date_remboursement` remplie
- Vérifier si ces dossiers ont un `expert_id` ou `expert_pending_id`
- Lister les dossiers problématiques (sans expert assigné)
- Vérifier pour un expert spécifique
- Vérifier le dossier spécifique mentionné (ID: `57f606c7-00a6-40f0-bb72-ae1831345d99`)

**Utilisation :**
1. Ouvrir Supabase SQL Editor
2. Copier-coller le contenu du script
3. Modifier l'UUID de l'expert dans les requêtes 5, 6 et 7 si nécessaire
4. Exécuter le script
5. Analyser les résultats

### 2. `fix-expert-dossiers.sql` - Script de correction

Ce script permet de :
- Identifier les dossiers à corriger
- Corriger les dossiers en récupérant `expert_id` depuis les métadonnées ou l'historique
- Vérifier après correction

**⚠️ ATTENTION :** 
- Exécuter d'abord le script de vérification
- Les requêtes de correction sont commentées par défaut
- Adapter les requêtes selon votre structure de données
- Faire une sauvegarde avant d'exécuter les corrections

**Utilisation :**
1. Exécuter d'abord `verify-expert-dossiers.sql`
2. Analyser les résultats pour comprendre la structure des données
3. Adapter les requêtes de correction selon votre structure
4. Décommenter et exécuter les requêtes de correction une par une
5. Vérifier les résultats après chaque correction

## Structure des requêtes

### Requête 1 : Statistiques globales refund_completed
Compte tous les dossiers avec `refund_completed` et leur association avec un expert.

### Requête 2 : Statistiques date_remboursement
Compte tous les dossiers avec `date_remboursement` remplie.

### Requête 3 : Détail des dossiers refund_completed
Liste tous les dossiers avec `refund_completed` et leur statut d'expert.

### Requête 4 : Dossiers problématiques
Identifie les dossiers avec `date_remboursement` mais sans expert assigné.

### Requête 5-6 : Pour un expert spécifique
Statistiques et détails pour un expert donné (modifier l'UUID).

### Requête 7 : Dossier spécifique
Vérifie le dossier mentionné (ID: `57f606c7-00a6-40f0-bb72-ae1831345d99`).

### Requête 8 : Statistiques par statut
Vue d'ensemble de tous les statuts et leur association avec les experts.

### Requête 9 : Dossiers terminés sans expert
Liste tous les dossiers terminés qui n'ont pas d'expert assigné.

## Solutions possibles

1. **Si les dossiers ont perdu leur `expert_id` :**
   - Utiliser le script de correction pour récupérer depuis les métadonnées
   - Ou depuis la table `DossierTimeline` si disponible

2. **Si les dossiers n'ont jamais eu d'`expert_id` :**
   - Vérifier l'historique du dossier
   - Assigner manuellement l'expert si nécessaire

3. **Si le problème persiste :**
   - Vérifier les politiques RLS (Row Level Security) sur Supabase
   - Vérifier que les requêtes backend n'excluent pas ces dossiers

## Notes importantes

- Le statut `refund_completed` correspond à "Remboursement effectué" dans l'interface
- Un dossier avec `date_remboursement` remplie devrait normalement avoir `statut = 'refund_completed'`
- Les requêtes backend utilisent : `.or('expert_id.eq.${expertId},expert_pending_id.eq.${expertId}')`
- Aucun filtre sur `statut` ou `date_remboursement` dans les requêtes du dashboard

## Contact

En cas de problème, vérifier :
1. Les logs du serveur backend
2. Les politiques RLS sur Supabase
3. L'historique des modifications dans `DossierTimeline`

