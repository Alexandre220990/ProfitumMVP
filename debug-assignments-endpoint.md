# Debug: /api/experts/assignments endpoint

## Problème
Endpoint retourne 500 après les corrections

## Vérifications nécessaires

### 1. Structure table expertassignment
Vérifier les foreign keys et leur cohérence

### 2. JOINs dans le code
Actuellement :
```typescript
.from('expertassignment')
.select(`
  *,
  Expert (...),
  Client (...),
  ProduitEligible (...)
`)
```

### 3. Logs Railway attendus
- Quelle erreur exacte ?
- Quelle ligne échoue ?
- Message d'erreur PostgreSQL ?

## Script de vérification
Exécuter dans Supabase SQL Editor pour voir les foreign keys d'expertassignment

