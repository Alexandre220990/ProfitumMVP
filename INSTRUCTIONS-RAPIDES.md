# 🔧 ACTION REQUISE : Mise à jour de la fonction SQL

## ✅ Ce qui a été corrigé automatiquement

- **Frontend** : Chaînage optionnel corrigé dans `documents-ged-unifie.tsx`
  - `stats?.bucket_stats.client_bucket` → `stats?.bucket_stats?.client_bucket`

## ⚠️ Action manuelle nécessaire

La fonction SQL `get_documents_stats()` doit être mise à jour dans Supabase.

### 📋 ÉTAPES (2 minutes) :

1. **Ouvrir Supabase Dashboard**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet
   - Cliquez sur "SQL Editor" dans le menu de gauche

2. **Copier le SQL**
   - Ouvrez le fichier : `update-documents-stats-function.sql`
   - Copiez tout le contenu

3. **Exécuter dans Supabase**
   - Collez le SQL dans l'éditeur
   - Cliquez sur "Run" (▶️)

4. **Vérifier**
   ```bash
   node deploy-updated-stats-function.cjs
   ```

### ✅ Résultat attendu

Vous devriez voir :
```
✅ La structure correspond au format attendu par le frontend
✅ bucket_stats présent
```

### 🧪 Test final

Rechargez la page : https://www.profitum.app/admin/documents-ged

L'erreur "Cannot read properties of undefined (reading 'client_bucket')" devrait avoir disparu ! 🎉

---

**Fichier de référence complet** : `RESOLUTION-ERREUR-BUCKET-STATS.md`
