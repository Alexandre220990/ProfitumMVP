# ✅ Correction : Notifications Temps Réel (SSE)

**Date :** 5 novembre 2025  
**Problème :** Erreur 401 sur `/api/notifications/stream`  
**Statut :** ✅ CORRIGÉ

---

## ❌ Problèmes Identifiés

### 1. Incohérence Clés localStorage ❌
**Fichier :** `dashboard-optimized.tsx` (4 occurrences)

```typescript
// ❌ AVANT (ligne 603, 664, 728, 763)
'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`

// ✅ APRÈS
'Authorization': `Bearer ${localStorage.getItem('token')}`
```

**Impact :** Le token n'était jamais trouvé car la clé était incorrecte.

### 2. Pas de Refresh Automatique du Token ❌
**Fichier :** `use-notification-sse.ts`

Quand le token expirait (après 1h), la connexion SSE échouait avec 401 sans tentative de refresh.

---

## ✅ Corrections Appliquées

### 1. Clés localStorage Unifiées

**dashboard-optimized.tsx :**
- ✅ 4 occurrences corrigées
- ✅ Utilise maintenant `'token'` (cohérent partout)

### 2. Hook SSE Amélioré

**use-notification-sse.ts :**

#### A. Récupération Token au Démarrage
```typescript
// Récupérer un token frais depuis Supabase si absent
const { data: { session } } = await supabase.auth.getSession();
if (session?.access_token) {
  token = session.access_token;
  localStorage.setItem('token', session.access_token);
}
```

#### B. Refresh Automatique sur Erreur 401
```typescript
eventSource.onerror = async (error) => {
  // 1ère erreur → Tenter refresh du token
  if (reconnectAttempts === 0) {
    const { data: { session } } = await supabase.auth.refreshSession();
    
    if (session?.access_token) {
      // Reconnexion avec nouveau token
      localStorage.setItem('token', session.access_token);
      connect(); // Retry immédiat
      return;
    }
  }
  
  // Sinon, backoff exponentiel
  // ...
};
```

---

## 🔄 Flux SSE Corrigé

```
1. Page se charge
   ↓
2. Hook useNotificationSSE s'initialise
   ↓
3. Cherche token dans localStorage
   │  ├─ Si absent → Récupère session Supabase
   │  └─ Si trouvé → Continue
   ↓
4. Crée EventSource avec token en query param
   ↓
5. Connexion au serveur /api/notifications/stream?token=...
   ↓
6. Serveur valide token avec supabase.auth.getUser()
   │  ├─ Si valide → Connexion SSE établie ✅
   │  └─ Si invalide → Erreur 401 ❌
   ↓
7. Si erreur 401 détectée (onerror):
   ↓
8. Tente refresh du token Supabase
   │  ├─ Si succès → Reconnexion avec nouveau token ✅
   │  └─ Si échec → Backoff exponentiel (5 tentatives max)
   ↓
9. Connexion maintenue avec heartbeat (30s)
```

---

## 📊 Avant / Après

### Avant ❌

```
Connexion → Token expiré → 401 → Erreur
                                 ↓
                           Reconnexion avec même token
                                 ↓
                           401 (boucle infinie)
```

### Après ✅

```
Connexion → Token expiré → 401 → Détection
                                 ↓
                           Refresh token Supabase
                                 ↓
                           Nouveau token → Reconnexion
                                 ↓
                           ✅ Connexion établie
```

---

## 🔐 Gestion du Token

### Clés localStorage Standardisées

| Clé | Valeur | Usage |
|-----|--------|-------|
| `'token'` | Access token Supabase | ✅ Clé principale partout |
| `'supabase_token'` | Access token Supabase | ✅ Backup |
| `'supabase_refresh_token'` | Refresh token | ✅ Pour refresh auto |

**Clé supprimée :**
- `'supabase.auth.token'` ❌ (clé incorrecte, confusion)

### Stockage après Connexion

```typescript
// Dans supabase-auth.ts (ligne 60-64)
localStorage.setItem('supabase_token', data.session.access_token);
localStorage.setItem('supabase_refresh_token', data.session.refresh_token);
localStorage.setItem('token', data.session.access_token);
```

---

## 🛠️ Configuration Serveur

### Variables d'Environnement Requises

```env
SUPABASE_URL=https://gvvlsgtubqfxdztldunj.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Route SSE

**Fichier :** `server/src/routes/notifications-sse.ts`

```typescript
// Validation du token (ligne 34-52)
const supabaseWithToken = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  }
);

const { data, error } = await supabaseWithToken.auth.getUser();
```

---

## ✅ Améliorations Apportées

### 1. Robustesse
- ✅ Récupération automatique session Supabase
- ✅ Refresh automatique du token sur erreur
- ✅ Logs détaillés pour debugging

### 2. UX
- ✅ Reconnexion transparente pour l'utilisateur
- ✅ Toast uniquement si échec final
- ✅ Heartbeat toutes les 30s pour maintenir connexion

### 3. Performance
- ✅ Cache token en localStorage
- ✅ Pas de requête inutile si token déjà valide
- ✅ Backoff exponentiel (évite spam serveur)

---

## 🧪 Tests Recommandés

### Test 1 : Connexion Normale
```
1. Se connecter en tant qu'admin
2. Ouvrir console navigateur
3. Chercher "✅ Connexion SSE établie"
4. Vérifier aucun 401
```

### Test 2 : Token Expiré
```
1. Ouvrir localStorage dans dev tools
2. Modifier 'token' avec une valeur invalide
3. Rafraîchir la page
4. Vérifier "🔄 Tentative de refresh du token"
5. Vérifier "✅ Token refreshé, reconnexion SSE"
```

### Test 3 : Notification Temps Réel
```
1. Ouvrir 2 onglets : admin + expert
2. Expert créer une action → notification
3. Admin devrait recevoir toast notification
4. Vérifier compteur notifications mis à jour
```

---

## 🐛 Debugging

### Vérifier Token dans Console
```javascript
// Dans console navigateur
console.log('Token:', localStorage.getItem('token'));
console.log('Token Supabase:', localStorage.getItem('supabase_token'));
```

### Activer Logs Détaillés
```typescript
// Dans use-notification-sse.ts (ligne 75)
console.log('📡 Connexion au flux SSE notifications... (token:', token.substring(0, 20) + '...)');
```

### Vérifier Serveur
```bash
# Dans logs serveur
📡 SSE: Nouvelle tentative de connexion
🔍 SSE: Token reçu, longueur: 1234
🔍 SSE: Client Supabase créé, tentative getUser()
✅ SSE: Utilisateur validé: 61797a61-edde-4816-b818-00015b627fe1
```

---

## ✅ Checklist de Vérification

- [x] Clés localStorage unifiées (`'token'`)
- [x] Hook SSE récupère session Supabase
- [x] Refresh automatique du token sur 401
- [x] Logs détaillés ajoutés
- [x] Toast erreur si échec final
- [x] Aucune erreur de linter
- [ ] Testé en production (après deploy)

---

## 🚀 Prochaines Étapes

1. **Committer** les modifications
2. **Pusher** vers production
3. **Tester** sur https://www.profitum.app
4. **Vérifier** dans console : "✅ Connexion SSE établie"

---

**Les notifications temps réel devraient maintenant fonctionner correctement ! 🔔**

