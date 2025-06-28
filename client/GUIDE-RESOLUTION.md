# Guide de Résolution - Signature de Charte

## Problème identifié
Le frontend utilise encore l'ancien token JWT local au lieu du token Supabase, ce qui provoque des erreurs 401 "invalid claim: missing sub claim".

## Solution étape par étape

### 1. Vérifier l'utilisateur dans Supabase Auth
```bash
# Ouvrir la console du navigateur et exécuter :
# Copier-coller le contenu de check-supabase-user.js
```

### 2. Nettoyer les tokens existants
```bash
# Dans la console du navigateur, exécuter :
# Copier-coller le contenu de clean-and-reconnect.js
```

### 3. Se reconnecter via l'interface
- Aller sur `/connexion-client`
- Se connecter avec les identifiants Supabase
- Vérifier que le token Supabase est stocké

### 4. Tester l'API
```bash
# Dans la console du navigateur, exécuter :
# Copier-coller le contenu de test-after-reconnect.js
```

## Modifications apportées

### Frontend
1. ✅ **api.ts** : Intercepteur corrigé pour utiliser uniquement le token Supabase
2. ✅ **connexion-client.tsx** : Page de connexion modifiée pour utiliser Supabase Auth
3. ✅ **use-auth.tsx** : Hook d'authentification utilise déjà Supabase Auth

### Backend
1. ✅ **auth.ts** : Middleware d'authentification accepte les tokens Supabase
2. ✅ **charte-signature.ts** : Routes API fonctionnent avec Supabase

## Vérification
- [ ] L'utilisateur existe dans Supabase Auth
- [ ] Le token Supabase est stocké dans localStorage
- [ ] L'API accepte le token Supabase
- [ ] La signature de charte fonctionne

## Scripts de test disponibles
- `check-supabase-user.js` : Vérifier l'utilisateur Supabase
- `clean-and-reconnect.js` : Nettoyer et reconnecter
- `test-after-reconnect.js` : Tester l'API après reconnexion
- `test-supabase-token.js` : Vérifier le token Supabase 