# Guide de Résolution - Problème de Redirection

## Problème identifié
La connexion Supabase fonctionne, mais la redirection échoue car l'utilisateur a un ID Supabase différent de l'ID dans la base de données.

## Solution étape par étape

### 1. Vérifier l'ID de l'utilisateur Supabase
```bash
# Dans la console du navigateur, exécuter :
# Copier-coller le contenu de debug-user-id.js
```

### 2. Vérifier si l'utilisateur existe dans la base de données
```bash
# Dans la console du navigateur, exécuter :
# Copier-coller le contenu de check-user-in-database.js
```

### 3. Solution temporaire - Utiliser l'ancien ID
```bash
# Si l'utilisateur n'existe pas avec l'ID Supabase, utiliser l'ancien ID :
# Copier-coller le contenu de use-old-user-id.js
```

### 4. Solution permanente - Corriger la redirection
Le problème est que l'utilisateur Supabase a l'ID `e991b465-2e37-45ae-9475-6d7b1e35e391` 
mais l'utilisateur dans la base de données a l'ID `0538de29-4287-4c28-b76a-b65ef993f393`.

**Options :**
1. **Créer l'utilisateur dans la base de données** avec l'ID Supabase
2. **Migrer les données** de l'ancien ID vers le nouveau
3. **Modifier le service Supabase** pour utiliser l'ancien ID

## Modifications apportées

### Frontend
1. ✅ **use-auth.tsx** : Redirection corrigée pour utiliser l'ID de l'utilisateur
2. ✅ **connexion-client.tsx** : Utilise maintenant Supabase Auth
3. ✅ **api.ts** : Intercepteur utilise le token Supabase

### Backend
1. ✅ **auth.ts** : Middleware accepte les tokens Supabase
2. ✅ **charte-signature.ts** : Routes API fonctionnent avec Supabase

## Vérification
- [ ] L'utilisateur existe dans Supabase Auth
- [ ] L'utilisateur existe dans la base de données
- [ ] La redirection fonctionne avec le bon ID
- [ ] Le dashboard s'affiche correctement

## Scripts de test disponibles
- `debug-user-id.js` : Déboguer l'ID utilisateur Supabase
- `check-user-in-database.js` : Vérifier l'utilisateur dans la base de données
- `use-old-user-id.js` : Utiliser l'ancien ID comme solution temporaire
- `fix-user-redirection.js` : Corriger la redirection automatiquement 