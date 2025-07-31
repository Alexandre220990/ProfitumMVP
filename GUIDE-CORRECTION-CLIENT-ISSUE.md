# Guide de Correction - Problème Client wamuchacha@gmail.com

## Problème identifié

1. **Redirection vers connect-admin** : L'utilisateur est redirigé vers `/connect-admin` au lieu du dashboard client
2. **Absence de produits éligibles** : Aucun `ClientProduitEligible` n'est affiché sur le dashboard

## Causes probables

### 1. Conflit de type d'utilisateur
L'utilisateur `wamuchacha@gmail.com` pourrait être enregistré comme `admin` ET `client`, causant un conflit dans la logique de redirection.

### 2. Échec de migration des simulations
Les résultats de simulation ne sont pas correctement migrés vers la table `ClientProduitEligible`.

## Solutions

### Étape 1 : Diagnostic
Exécuter le script de diagnostic pour identifier les problèmes :

```bash
# Exécuter le diagnostic simplifié
psql $DATABASE_URL -f server/scripts/diagnose-client-simple.sql
```

### Étape 2 : Correction du type d'utilisateur
Exécuter le script de correction pour résoudre les conflits :

```bash
# Corriger les problèmes d'utilisateur
psql $DATABASE_URL -f server/scripts/fix-client-issue.sql
```

### Étape 3 : Migration des simulations
Si des sessions de simulation existent, les migrer manuellement :

```bash
# Migrer les sessions de simulation
psql $DATABASE_URL -f server/scripts/fix-simulation-migration.sql
```

## Vérification

Après exécution des scripts, vérifier que :

1. ✅ L'utilisateur existe dans `auth.users`
2. ✅ L'utilisateur existe dans `Client` (pas dans `Admin`)
3. ✅ Des produits éligibles existent dans `ClientProduitEligible`
4. ✅ La redirection fonctionne vers le dashboard client

## Test de la correction

1. Se connecter avec `wamuchacha@gmail.com` / `mdp profitum`
2. Vérifier que la redirection se fait vers `/dashboard/client` et non `/connect-admin`
3. Vérifier que les produits éligibles s'affichent sur le dashboard

## Scripts créés

- `server/scripts/diagnose-client-simple.sql` : Diagnostic simplifié
- `server/scripts/fix-client-issue.sql` : Correction des problèmes d'utilisateur
- `server/scripts/fix-simulation-migration.sql` : Migration des simulations

## Notes importantes

- Les scripts créent des produits éligibles de test si aucun n'existe
- Les conflits admin/client sont automatiquement résolus
- Les sessions de simulation récentes sont migrées automatiquement
- Toutes les opérations sont sécurisées et réversibles 