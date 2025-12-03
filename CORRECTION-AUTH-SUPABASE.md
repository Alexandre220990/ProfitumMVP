# 🔧 Correction Authentification Supabase - Problème Alternant

## 📋 Problème Identifié

**Symptôme** : Les tentatives de connexion échouent une fois sur deux avec l'erreur :
```
AuthApiError: Invalid login credentials
```

**Pattern observé dans les logs** :
- 21:44:36 → ✅ Succès
- 21:45:10 → ❌ Échec "Invalid login credentials"
- 21:45:30 → ✅ Succès
- 21:47:11 → ❌ Échec "Invalid login credentials"
- 21:47:40 → ✅ Succès

## 🔍 Cause Racine

L'utilisation de `supabaseAdmin.auth.signInWithPassword()` (client avec `SERVICE_ROLE_KEY`) pour valider les credentials utilisateur était incorrecte :

- ❌ **SERVICE_ROLE_KEY** : Destinée aux opérations admin sur les tables (bypass RLS)
- ✅ **ANON_KEY** : Destinée à l'authentification utilisateur

Le client admin peut conserver un état interne entre les appels, causant des comportements imprévisibles lors de l'authentification.

## ✅ Solution Implémentée

### 1. Séparation des clients Supabase

**Fichier** : `/server/src/routes/auth.ts`

```typescript
// ✅ Client ADMIN - Pour les requêtes sur les tables uniquement
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// ✅ Client AUTH - Pour l'authentification utilisateur
const supabaseAuth = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);
```

### 2. Modification des routes d'authentification

Tous les appels `supabaseAdmin.auth.signInWithPassword()` ont été remplacés par `supabaseAuth.auth.signInWithPassword()` dans :

- ✅ `/api/auth/client/login`
- ✅ `/api/auth/expert/login`
- ✅ `/api/auth/apporteur/login`
- ✅ `/api/auth/admin/login`
- ✅ `/api/auth/login` (route générique)

### 3. Variables d'environnement Railway

Variables de production configurées sur Railway :

```bash
SUPABASE_URL=https://gvvlsgtubqfxdztldunj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Njk4NDksImV4cCI6MjA1NzM0NTg0OX0.2hahkZasfMfdFhQvP7rvPHzO1DBCl0FfsRVkxVZfdgk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTc2OTg0OSwiZXhwIjoyMDU3MzQ1ODQ5fQ.pN73GQUJHmd099PUcxAVGm-TFTe3KHeBemBk9IlGAcg
```

## 📦 Déploiement

### Étape 1 : Vérifier les variables Railway

Assurez-vous que `SUPABASE_ANON_KEY` est bien définie sur Railway :

```bash
railway variables
```

Si elle manque, l'ajouter :

```bash
railway variables set SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dmxzZ3R1YnFmeGR6dGxkdW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Njk4NDksImV4cCI6MjA1NzM0NTg0OX0.2hahkZasfMfdFhQvP7rvPHzO1DBCl0FfsRVkxVZfdgk"
```

### Étape 2 : Commiter et pousser

```bash
git add server/src/routes/auth.ts
git commit -m "fix: Correction authentification Supabase - Utilisation ANON_KEY pour signInWithPassword"
git push
```

### Étape 3 : Vérifier le déploiement

Railway déploiera automatiquement. Surveillez les logs :

```bash
railway logs
```

## 🧪 Test Post-Déploiement

### Test 1 : Connexion Admin
1. Aller sur https://profitum.up.railway.app/connect-admin
2. Se connecter avec : `grandjean.alexandre5@gmail.com`
3. **Vérifier** : Connexion réussie
4. Se déconnecter
5. **Réessayer** : Connexion doit ENCORE réussir (pas d'alternance)

### Test 2 : Connexions multiples
- Tester 5 connexions consécutives
- **Attendu** : 100% de succès (plus d'alternance d'échec)

## 🎯 Résultat Attendu

Après cette correction :
- ✅ Authentification stable et prévisible
- ✅ Pas d'alternance succès/échec
- ✅ Séparation claire : ANON_KEY pour auth, SERVICE_ROLE_KEY pour tables
- ✅ Conformité aux bonnes pratiques Supabase

## 📚 Références

- [Supabase Auth - Server-Side](https://supabase.com/docs/guides/auth/server-side)
- [Supabase Service Role vs Anon Key](https://supabase.com/docs/guides/api/api-keys)

---

**Date** : 3 décembre 2025  
**Statut** : ✅ Correction implémentée - En attente de déploiement

