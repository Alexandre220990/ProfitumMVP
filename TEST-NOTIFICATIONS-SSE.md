# 🧪 Guide de Test - Notifications SSE

## Objectif
Tester le correctif du problème 401 sur les notifications temps réel (SSE).

## Prérequis
- Serveur backend démarré (`npm run dev` dans `/server`)
- Client frontend démarré (`npm run dev` dans `/client`)
- Compte utilisateur valide

## Tests Manuels

### ✅ Test 1: Connexion SSE Normale

**Étapes:**
1. Se connecter à l'application
2. Ouvrir la console du navigateur (F12)
3. Observer les logs

**Résultat attendu:**
```
🔄 Récupération token Supabase frais pour SSE...
✅ Token Supabase frais obtenu pour SSE
📡 Connexion au flux SSE notifications...
✅ Connexion SSE établie
```

**Statut:** ⏳ À tester

---

### ✅ Test 2: Token Proche de l'Expiration

**Étapes:**
1. Se connecter à l'application
2. Attendre 55-58 minutes (ou simuler en modifiant `expires_at`)
3. Déclencher une action qui utilise SSE
4. Observer les logs

**Résultat attendu:**
```
🔄 Token Supabase expire bientôt, refresh en cours... (expire dans 240s)
✅ Token Supabase refreshé avec succès
✅ Token Supabase frais obtenu pour SSE
```

**Statut:** ⏳ À tester

---

### ✅ Test 3: Session Expirée (Scénario d'échec gracieux)

**Étapes:**
1. Se connecter à l'application
2. Ouvrir DevTools > Application > Local Storage
3. Supprimer `sb-*-auth-token` (token Supabase)
4. Recharger la page
5. Observer le comportement

**Résultat attendu:**
```
⚠️ Pas de token disponible, connexion SSE désactivée
```
- Aucune boucle de reconnexion
- Message utilisateur: "Non authentifié - veuillez vous reconnecter"
- Pas d'erreur 401 visible dans la console réseau

**Statut:** ⏳ À tester

---

### ✅ Test 4: Reconnexion Automatique

**Étapes:**
1. Se connecter et établir connexion SSE
2. Simuler une perte de connexion réseau (DevTools > Network > Offline)
3. Attendre quelques secondes
4. Réactiver le réseau (Online)
5. Observer les logs

**Résultat attendu:**
```
❌ Erreur SSE: [error]
🔄 Reconnexion SSE dans 1000ms (tentative 1/3)
✅ Token Supabase frais obtenu pour SSE
✅ Connexion SSE établie
```

**Statut:** ⏳ À tester

---

### ✅ Test 5: Vérification Serveur

**Endpoint de test:**
```bash
# Récupérer un token valide depuis localStorage
curl "http://localhost:3001/api/notifications/stream?token=YOUR_TOKEN_HERE"
```

**Résultat attendu (si token valide):**
```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"type":"connected","message":"Connexion SSE établie","timestamp":"..."}

data: {"type":"initial_notifications","count":0,"data":[],"timestamp":"..."}
```

**Résultat attendu (si token expiré):**
```json
{
  "success": false,
  "message": "Token expiré. Veuillez rafraîchir votre session.",
  "code": "TOKEN_EXPIRED",
  "tokenExpired": true,
  "rateLimited": false
}
```

**Statut:** ⏳ À tester

---

## Tests Automatisés (Optionnel)

### Test avec Jest/Vitest

```typescript
describe('getSupabaseTokenFresh', () => {
  it('devrait retourner le token actuel si non expiré', async () => {
    // Mock session avec token valide pour 30 minutes
    const token = await getSupabaseTokenFresh();
    expect(token).toBeTruthy();
  });

  it('devrait refresh le token si expire dans < 5 min', async () => {
    // Mock session avec token expirant dans 2 minutes
    const token = await getSupabaseTokenFresh();
    expect(token).toBeTruthy();
    // Vérifier que refreshSession a été appelé
  });

  it('devrait retourner null si pas de session', async () => {
    // Mock pas de session
    const token = await getSupabaseTokenFresh();
    expect(token).toBeNull();
  });
});
```

---

## Checklist de Validation

- [ ] Test 1: Connexion SSE normale réussie
- [ ] Test 2: Refresh automatique du token
- [ ] Test 3: Gestion gracieuse de session expirée
- [ ] Test 4: Reconnexion automatique après perte réseau
- [ ] Test 5: Endpoint serveur retourne codes corrects
- [ ] Aucune erreur 401 dans les logs console
- [ ] Aucune boucle de reconnexion infinie
- [ ] Performance: pas de requêtes excessives
- [ ] UX: messages d'erreur clairs pour l'utilisateur

---

## Commandes Utiles

### Démarrer l'environnement de test
```bash
# Terminal 1: Serveur
cd /Users/alex/Desktop/FinancialTracker/server
npm run dev

# Terminal 2: Client
cd /Users/alex/Desktop/FinancialTracker/client
npm run dev
```

### Monitorer les logs serveur
```bash
cd /Users/alex/Desktop/FinancialTracker/server
npm run dev | grep -E "(SSE|notification|401|Token)"
```

### Vérifier les connexions SSE actives
```bash
# Dans la console du navigateur
// Inspecter l'objet EventSource
console.log(eventSourceRef.current);
```

---

## Résolution de Problèmes

### Problème: Toujours erreur 401
**Solution:**
1. Vérifier que `getSupabaseTokenFresh` est bien importé
2. Vérifier les logs: "Token Supabase expire bientôt"
3. Vérifier la configuration Supabase (URL, ANON_KEY)

### Problème: Boucle de reconnexion
**Solution:**
1. Vérifier que `refreshFailed` est bien géré
2. Vérifier `MAX_RECONNECT_ATTEMPTS = 3`
3. Vérifier les logs pour identifier la cause

### Problème: Rate limiting (429)
**Solution:**
1. Attendre quelques minutes
2. Vérifier que le code gère bien les 429
3. Si problème persiste, augmenter `MIN_REFRESH_INTERVAL`

---

**Date**: 4 décembre 2025
**Version**: 1.0.0

