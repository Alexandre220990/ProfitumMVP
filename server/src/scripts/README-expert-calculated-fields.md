# 📊 Champs Calculés pour la Table Expert

## 🎯 Objectif

Ajouter des champs calculés automatiquement à la table Expert pour suivre les performances et les statistiques des experts.

## 📋 Champs Ajoutés

- `total_assignments` : Nombre total d'assignations
- `completed_assignments` : Nombre d'assignations complétées
- `total_earnings` : Gains totaux (10% de commission sur les audits)
- `monthly_earnings` : Gains du mois (derniers 30 jours)

## 🚀 Installation

### 1. Exécuter le script principal

```sql
-- Exécuter dans votre base de données Supabase
\i server/src/scripts/add-calculated-fields-to-expert.sql
```

### 2. Vérifier l'installation

```sql
-- Exécuter pour vérifier que tout fonctionne
\i server/src/scripts/test-expert-calculated-fields.sql
```

## 🔧 Fonctionnalités

### Fonctions Disponibles

- `calculate_expert_stats(expert_id)` : Calcule les stats d'un expert
- `update_all_expert_stats()` : Met à jour tous les experts
- `get_top_experts(limit)` : Retourne les meilleurs experts
- `get_expert_global_stats()` : Statistiques globales

### Triggers Automatiques

- **expertassignment** : Met à jour les stats lors des assignations
- **Audit** : Met à jour les gains lors des audits

### Vue de Statistiques

- `expert_stats_view` : Vue complète avec tous les calculs

## 📊 Utilisation

### Obtenir les statistiques d'un expert

```sql
SELECT * FROM expert_stats_view WHERE id = 'expert-uuid';
```

### Top 10 des experts

```sql
SELECT * FROM get_top_experts(10);
```

### Statistiques globales

```sql
SELECT * FROM get_expert_global_stats();
```

### Calculer les stats d'un expert spécifique

```sql
SELECT calculate_expert_stats('expert-uuid');
```

## 🔄 Mise à Jour Automatique

Les champs sont mis à jour automatiquement via des triggers :

1. **Nouvelle assignation** → `total_assignments` +1
2. **Assignation complétée** → `completed_assignments` +1
3. **Audit complété** → `total_earnings` et `monthly_earnings` mis à jour

## 📈 Calculs Effectués

### Assignations
- `total_assignments` = COUNT(*) FROM expertassignment WHERE expert_id = X
- `completed_assignments` = COUNT(*) FROM expertassignment WHERE expert_id = X AND status = 'completed'

### Gains
- `total_earnings` = SUM(montant * 0.1) FROM Audit WHERE expertId = X AND status = 'completed'
- `monthly_earnings` = SUM(montant * 0.1) FROM Audit WHERE expertId = X AND status = 'completed' AND dateFin >= NOW() - INTERVAL '30 days'

### Taux de Réussite
- `success_rate` = (completed_assignments / total_assignments) * 100

## 🛠️ Maintenance

### Mise à jour manuelle de tous les experts

```sql
SELECT update_all_expert_stats();
```

### Vérification de l'intégrité

```sql
-- Vérifier la cohérence des données
SELECT 
    name,
    total_assignments,
    completed_assignments,
    CASE 
        WHEN total_assignments >= completed_assignments THEN '✅'
        ELSE '❌'
    END as consistency
FROM "Expert";
```

## 🔍 Monitoring

### Index de Performance

Les index suivants sont créés automatiquement :

- `idx_expert_total_earnings` : Tri par gains totaux
- `idx_expert_monthly_earnings` : Tri par gains mensuels
- `idx_expert_success_rate` : Tri par taux de réussite

### Requêtes de Monitoring

```sql
-- Experts avec le plus de gains
SELECT name, total_earnings FROM "Expert" ORDER BY total_earnings DESC LIMIT 10;

-- Experts les plus actifs
SELECT name, total_assignments FROM "Expert" ORDER BY total_assignments DESC LIMIT 10;

-- Taux de réussite moyen
SELECT AVG(
    CASE 
        WHEN total_assignments > 0 
        THEN (completed_assignments::DECIMAL / total_assignments) * 100
        ELSE 0 
    END
) as avg_success_rate
FROM "Expert";
```

## ⚠️ Points d'Attention

1. **Commission** : Les gains sont calculés avec 10% de commission sur les audits
2. **Performance** : Les triggers peuvent impacter les performances sur de gros volumes
3. **Cohérence** : Vérifiez régulièrement la cohérence des données
4. **Backup** : Faites un backup avant d'exécuter les scripts

## 🐛 Dépannage

### Problème : Les stats ne se mettent pas à jour

```sql
-- Vérifier que les triggers existent
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'expertassignment';

-- Forcer la mise à jour
SELECT update_all_expert_stats();
```

### Problème : Données incohérentes

```sql
-- Recalculer tous les experts
SELECT update_all_expert_stats();

-- Vérifier la cohérence
SELECT * FROM "Expert" 
WHERE total_assignments < completed_assignments;
```

## 📝 Notes de Version

- **v1.0** : Ajout des champs calculés de base
- **v1.1** : Ajout des triggers automatiques
- **v1.2** : Ajout des fonctions utilitaires
- **v1.3** : Ajout des index de performance

## 🔗 Liens Utiles

- [Documentation Supabase](https://supabase.com/docs)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/triggers.html)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/functions.html) 