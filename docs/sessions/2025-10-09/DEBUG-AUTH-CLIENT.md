# 🐛 DEBUG - Problème authentification client

## 🔍 Symptôme
- Client reçoit "unauthorized access" lors de la connexion
- Admin et apporteur fonctionnent correctement

## 📊 État actuel du système

### Routes définies (server/src/routes/auth.ts)
- ✅ `/api/auth/client/login` - Route spécifique client
- ✅ `/api/auth/expert/login` - Route spécifique expert
- ✅ `/api/auth/apporteur/login` - Route spécifique apporteur  
- ✅ `/api/auth/login` - Route générique (fallback)

### Frontend (client/src)
- ✅ `lib/auth-distinct.ts` - `loginClient()` utilise `/api/auth/client/login`
- ✅ `hooks/use-auth.tsx` - Appelle `loginClient()` quand `type === 'client'`
- ✅ `pages/connexion-client.tsx` - Passe `type: 'client'` au login

### Token JWT
- ✅ Backend génère un token avec `{ id, email, type: 'client', database_id }`
- ✅ Frontend stocke le token dans `localStorage.setItem('token', token)`
- ⚠️ `lib/api.ts` cherche le token dans l'ordre : `token` puis `supabase_token`

## 🔍 Points à vérifier

### 1. Vérifier les logs serveur
Lors d'une connexion client, le serveur doit afficher :
```
🔑 Tentative de connexion CLIENT: { email: 'xxx' }
✅ Client authentifié avec succès: { email: 'xxx', status: 'xxx' }
```

### 2. Vérifier le token stocké
Dans la console browser après connexion :
```javascript
console.log(localStorage.getItem('token'));
// Devrait afficher un long JWT
```

### 3. Vérifier les headers API
Les requêtes doivent contenir :
```
Authorization: Bearer xxx.yyy.zzz
```

### 4. Vérifier le middleware d'auth
Le middleware `enhancedAuthMiddleware` ou `simpleAuthMiddleware` doit :
- Extraire le token JWT
- Le décoder
- Vérifier le type d'utilisateur

## 🔧 Actions de correction

### Action 1: S'assurer que le token JWT est bien utilisé
**Frontend** : `client/src/lib/api.ts` (✅ Corrigé)
```typescript
// Priorité au token JWT direct
let authToken = localStorage.getItem('token') || localStorage.getItem('supabase_token');
```

### Action 2: S'assurer que le type est bien persisté
**Frontend** : `client/src/hooks/use-auth.tsx`
```typescript
const userData: UserType = {
  ...user,
  type: user.type || credentials.type // S'assurer que le type est défini
};
```

### Action 3: Vérifier le middleware utilisé pour les routes client

**Backend** : `server/src/index.ts`
Vérifier quelles routes client utilisent quel middleware :
```typescript
// Routes client doivent utiliser enhancedAuthMiddleware
app.use('/api/client/*', enhancedAuthMiddleware, ...);
```

## 🧪 Tests à effectuer

### Test 1: Connexion client
```bash
# Dans un terminal
curl -X POST http://localhost:5001/api/auth/client/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client@test.com","password":"password123"}'
  
# Réponse attendue :
# { "success": true, "data": { "token": "xxx", "user": {...} } }
```

### Test 2: Appel API protégé avec token
```bash
# Récupérer le token depuis Test 1
TOKEN="xxx.yyy.zzz"

curl -X GET http://localhost:5001/api/client/me \
  -H "Authorization: Bearer $TOKEN"
  
# Réponse attendue :
# { "success": true, "user": {...} }
```

### Test 3: Vérifier le décodage JWT
**Frontend console** :
```javascript
const token = localStorage.getItem('token');
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('Payload JWT:', payload);
// Doit contenir : { id, email, type: 'client', database_id }
```

## 🐛 Problèmes potentiels

### Problème 1: Route client/login mal définie
**Symptôme** : 404 Not Found  
**Solution** : Vérifier que la route existe et est exportée

### Problème 2: Middleware refuse le token
**Symptôme** : 401 Unauthorized  
**Solution** : Vérifier que le JWT_SECRET est identique entre génération et vérification

### Problème 3: Type d'utilisateur incorrect
**Symptôme** : 403 Forbidden  
**Solution** : Vérifier que `user.type === 'client'` dans le token

### Problème 4: Client non trouvé en BDD
**Symptôme** : "NOT_CLIENT" error  
**Solution** : Vérifier que l'email existe dans la table `Client`

## 📝 Checklist de vérification

- [ ] Route `/api/auth/client/login` existe et fonctionne
- [ ] Token JWT est généré avec le bon format
- [ ] Token est stocké dans `localStorage` sous la clé `token`
- [ ] `lib/api.ts` utilise le bon token
- [ ] Middleware d'auth accepte le token JWT
- [ ] Routes client utilisent le bon middleware
- [ ] Client existe dans la table `Client`
- [ ] Type 'client' est bien dans le token JWT

## 🚀 Prochaines étapes

1. Lancer le serveur en mode debug
2. Tenter une connexion client
3. Observer les logs serveur
4. Observer les logs browser
5. Identifier à quelle étape ça échoue
6. Appliquer la correction

---

**Date** : 9 octobre 2025  
**Status** : En cours de debug

