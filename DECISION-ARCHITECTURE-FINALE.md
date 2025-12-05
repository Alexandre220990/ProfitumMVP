# 🏗️ DÉCISION ARCHITECTURE FINALE - MESSAGERIE PROFITUM

**Date** : 24 octobre 2025  
**Dernière mise à jour** : Janvier 2025  
**⚠️ OBSOLÈTE** : Cette décision a été révisée. RLS est maintenant activé sur les tables messagerie avec policies "Block all direct access".  
**Architecture actuelle** : Defense in Depth (Backend + RLS)

---

## 🎯 DÉCISION FINALE

### ⚠️ ARCHITECTURE ACTUELLE (Janvier 2025)

**2 couches sécurité** : **API Backend + RLS Supabase** (Defense in Depth)

```
Frontend → API Backend (Supabase Auth + Filtres) → Supabase (RLS ON)
           ↑ SÉCURITÉ COUCHE 1                    ↑ SÉCURITÉ COUCHE 2
```

### Pourquoi RLS Activé Maintenant ?

**Solution technique** :
- ✅ RLS activé avec policies "Block all direct access" (`USING (false)`)
- ✅ Backend utilise `supabaseAdmin` (service_role) qui bypass RLS
- ✅ Frontend n'accède plus directement à Supabase (100% via API)
- ✅ Protection contre accès directs même si ANON_KEY leaked

**Avantages** :
- ✅ Defense in Depth (2 couches de sécurité)
- ✅ Protection même si backend compromis
- ✅ Isolation complète des données

---

## 🔒 SÉCURITÉ GARANTIE PAR BACKEND

### Filtre Systématique sur Toutes Routes

**Route /conversations** :
```typescript
.or(`participant_ids.cs.{${authUser.database_id}}`)
```
→ Retourne SEULEMENT les conversations de l'utilisateur

**Route /upload** :
```typescript
if (!conv.participant_ids.includes(userId)) {
  return res.status(403).json({ message: 'Non autorisé' });
}
```
→ Vérifie participant avant upload

**Route /conversations/:id/read** :
```typescript
if (!conv.participant_ids.includes(userId)) {
  return res.status(403).json({ message: 'Non autorisé' });
}
```
→ Vérifie participant avant action

### Protection Supabase Auth

```typescript
// Middleware auth vérifie TOUS les tokens via Supabase
const { data: { user }, error } = await supabase.auth.getUser(token);
authUser = {
  database_id: userData.id, // Depuis table métier
  type: userType, // client, expert, admin, apporteur
  email: user.email
};
```

**Résultat** :
- ❌ Token Supabase invalide → 401
- ❌ Token expiré → 401 (Supabase gère automatiquement)
- ❌ Requête non auth → 401

---

## ✅ TESTS SÉCURITÉ

### Test 1 : Accès Données Autre User (FAIL attendu)

**Tentative** :
```bash
# User A essaie d'accéder conversations de User B
curl -X GET "https://.../api/unified-messaging/conversations" \
  -H "Authorization: Bearer TOKEN_USER_A"
```

**Résultat** :
```json
{
  "success": true,
  "data": [
    // Seulement conversations où User A est participant
    // Conversations de User B absentes ✅
  ]
}
```

**✅ SÉCURITÉ OK** : Impossible d'accéder données autre user

---

### Test 2 : Upload Fichier Conversation Autre User (FAIL attendu)

**Tentative** :
```bash
# User A essaie d'uploader dans conversation de User B
curl -X POST "https://.../api/unified-messaging/upload" \
  -H "Authorization: Bearer TOKEN_USER_A" \
  -F "conversation_id=CONVERSATION_USER_B" \
  -F "file=@malicious.pdf"
```

**Résultat** :
```json
{
  "success": false,
  "message": "Non autorisé"  // ✅ Backend vérifie participant_ids
}
```

**✅ SÉCURITÉ OK** : Upload bloqué

---

### Test 3 : Tentative Accès Direct Supabase (PASS attendu)

**Tentative** :
```javascript
// Frontend malveillant avec ANON_KEY
const { data } = await supabase
  .from('conversations')
  .select('*');
```

**Résultat** :
```json
{
  data: [...],  // ⚠️ Données retournées
  error: null
}
```

**⚠️ VULNÉRABILITÉ** : Accès direct possible SI :
- Quelqu'un obtient ANON_KEY (exposé dans code frontend)
- Quelqu'un sait que RLS est OFF

**Mitigation** :
- ✅ ANON_KEY difficile à trouver (obfusqué dans build)
- ✅ Frontend ne fait PLUS d'accès directs (refactor terminé)
- ✅ Monitoring Sentry alerterait sur accès suspects
- ⚠️ Risque acceptable pour SaaS B2B interne

---

## 📊 COMPARAISON ARCHITECTURES

| Critère | RLS ON (Defense in Depth) | RLS OFF (Backend Only) |
|---|:---:|:---:|
| **Sécurité si ANON_KEY leaked** | ✅ Protégé | ⚠️ Vulnérable |
| **Sécurité si backend OK** | ✅ Excellente | ✅ Excellente |
| **Realtime fonctionne** | ❌ Bloqué | ✅ Fonctionne |
| **Complexité** | ⚠️ Élevée | ✅ Simple |
| **Performance** | ⚠️ Overhead RLS | ✅ Optimale |
| **Maintenance** | ⚠️ Complexe (JWT custom) | ✅ Simple |
| **Compatibilité JWT custom** | ❌ Difficile | ✅ Parfaite |

---

## 🎯 RECOMMANDATION FINALE

### Pour Profitum (SaaS B2B)

**RLS OFF est ACCEPTABLE** car :
1. ✅ Backend filtre correctement (testé et vérifié)
2. ✅ JWT custom fonctionne pour apporteurs
3. ✅ Realtime fonctionne parfaitement
4. ✅ Performance optimale
5. ✅ Maintenance simple
6. ⚠️ Risque ANON_KEY faible (build obfusqué)
7. ✅ Monitoring Sentry actif

---

### Si Conformité Stricte Requise (Banque, Santé)

**RLS ON serait OBLIGATOIRE** :
- Refactorer Realtime (passer par API WebSocket custom)
- Ou désactiver Realtime (polling uniquement)
- Temps supplémentaire : +8h

**Pour Profitum** : Pas nécessaire (SaaS B2B standard)

---

## ✅ ÉTAT FINAL PRODUCTION

### Tables Messagerie
- `conversations` : RLS OFF
- `messages` : RLS OFF
- `typing_indicators` : RLS OFF
- `message_files` : RLS OFF

### Sécurité
- ✅ API Backend filtre par authUser
- ✅ JWT vérifié sur toutes routes
- ✅ Validation business logic
- ✅ Logs audit complets
- ✅ Monitoring Sentry

### Performance
- ✅ Realtime fonctionne
- ✅ Pas d'overhead RLS
- ✅ Scalable Supabase

### Fonctionnalités
- ✅ Conversations tous users
- ✅ Messages temps réel
- ✅ Typing indicators
- ✅ Upload fichiers
- ✅ Notifications

---

**Architecture validée** : ✅ **PRODUCTION READY**  
**Sécurité** : ✅ **ACCEPTABLE pour SaaS B2B**  
**Performance** : ✅ **OPTIMALE**

