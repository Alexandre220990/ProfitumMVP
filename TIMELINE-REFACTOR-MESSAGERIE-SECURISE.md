# ⏱️ TIMELINE REFACTOR MESSAGERIE SÉCURISÉE - PAS À PAS

**Date** : 24 octobre 2025  
**Durée totale estimée** : 3-4 heures  
**Objectif** : Architecture 100% sécurisée (API + RLS)

---

## 📋 VUE D'ENSEMBLE

### Fichiers à Modifier
- ✏️ `client/src/services/messaging-service.ts` (7 fonctions)
- ✏️ `server/src/routes/unified-messaging.ts` (ajouter 3 routes)
- 📝 SQL Supabase (créer policies RLS universelles)

### Fichiers à NE PAS Toucher
- ✅ `client/src/hooks/use-messaging.ts` (utilise déjà messaging-service)
- ✅ `client/src/components/messaging/*` (utilisent hooks)
- ✅ Autres routes backend

---

## 🎯 ÉTAPE 1 : AUDIT CODE FRONTEND (15 min)

### Objectif
Identifier **EXACTEMENT** quelles fonctions accèdent direct Supabase

### Actions
1. Analyser `messaging-service.ts` ligne par ligne
2. Lister les 7 fonctions problématiques
3. Identifier les routes API manquantes backend
4. Créer matrice de mapping

### Livrables
- 📄 `AUDIT-MESSAGING-SERVICE.md` (liste complète)
- 📊 Tableau : Fonction → Route API nécessaire

### Résultat Attendu
```markdown
| Fonction Frontend                | Route API Backend Nécessaire         | Existe? |
|----------------------------------|--------------------------------------|---------|
| getExistingConversation()        | GET /api/unified-messaging/check     | ❌      |
| ensureAdminSupportConversation() | POST /api/unified-messaging/admin-support | ❌ |
| createConversation()             | POST /api/unified-messaging/conversations | ✅ |
...
```

**Temps** : 15 min  
**Validation** : Vous montrer le tableau avant de continuer

---

## 🎯 ÉTAPE 2 : CRÉER ROUTES API MANQUANTES (45 min)

### Objectif
Créer les routes backend pour remplacer les accès directs Supabase

### Routes à Créer

#### Route 1 : Vérifier Conversation Existante
```typescript
// GET /api/unified-messaging/conversations/check
// Query params: ?participant1=xxx&participant2=yyy&type=expert_client
router.get('/conversations/check', async (req, res) => {
  const authUser = req.user as AuthUser;
  const { participant1, participant2, type } = req.query;
  
  const { data } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .contains('participant_ids', [participant1, participant2])
    .eq('type', type)
    .maybeSingle();
  
  return res.json({ success: true, data });
});
```

#### Route 2 : Créer/Récupérer Conversation Admin Support
```typescript
// POST /api/unified-messaging/conversations/admin-support
router.post('/conversations/admin-support', async (req, res) => {
  const authUser = req.user as AuthUser;
  
  // Vérifier si existe
  const { data: existing } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .contains('participant_ids', [authUser.database_id])
    .eq('type', 'admin_support')
    .maybeSingle();
  
  if (existing) {
    return res.json({ success: true, data: existing });
  }
  
  // Créer nouvelle
  const { data: newConv } = await supabaseAdmin
    .from('conversations')
    .insert({
      type: 'admin_support',
      participant_ids: [authUser.database_id, ADMIN_ID],
      title: `Support Administratif - ${authUser.email}`
    })
    .select()
    .single();
  
  return res.json({ success: true, data: newConv });
});
```

#### Route 3 : Marquer Conversation Comme Lue
```typescript
// PUT /api/unified-messaging/conversations/:id/read
router.put('/conversations/:id/read', async (req, res) => {
  const authUser = req.user as AuthUser;
  const { id } = req.params;
  
  // Vérifier que l'utilisateur est participant
  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('participant_ids')
    .eq('id', id)
    .single();
  
  if (!conv.participant_ids.includes(authUser.database_id)) {
    return res.status(403).json({ success: false, message: 'Non autorisé' });
  }
  
  // Marquer messages comme lus
  await supabaseAdmin
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('conversation_id', id)
    .neq('sender_id', authUser.database_id);
  
  return res.json({ success: true });
});
```

### Livrables
- ✏️ `server/src/routes/unified-messaging.ts` (3 nouvelles routes)
- 📝 Tests unitaires pour chaque route

**Temps** : 45 min  
**Validation** : Tester routes avec Postman/curl

---

## 🎯 ÉTAPE 3 : REFACTOR FRONTEND (1h30)

### Objectif
Remplacer les 7 accès directs Supabase par appels API

### Modifications `messaging-service.ts`

#### Modification 1 : `getExistingConversation()` (ligne 388)

**AVANT** :
```typescript
private async getExistingConversation(clientId: string, expertId: string) {
  const { data } = await supabase
    .from('conversations')  // ❌ DIRECT
    .select('*')
    .contains('participant_ids', [clientId, expertId])
    .eq('type', 'expert_client')
    .single();
  return data;
}
```

**APRÈS** :
```typescript
private async getExistingConversation(clientId: string, expertId: string) {
  const token = localStorage.getItem('token');
  const response = await fetch(
    `${this.apiUrl}/api/unified-messaging/conversations/check?` +
    `participant1=${clientId}&participant2=${expertId}&type=expert_client`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const result = await response.json();
  return result.data;  // ✅ Via API
}
```

#### Modification 2 : `ensureAdminSupportConversation()` (ligne 405)

**AVANT** :
```typescript
const { data } = await supabase
  .from('conversations')  // ❌ DIRECT
  .select('*')
  .contains('participant_ids', [this.currentUserId])
  .eq('type', 'admin_support')
  .maybeSingle();
```

**APRÈS** :
```typescript
const response = await fetch(
  `${this.apiUrl}/api/unified-messaging/conversations/admin-support`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
const result = await response.json();
const data = result.data;  // ✅ Via API
```

#### Modifications 3-7 : Autres fonctions (similaire)

**Pattern de remplacement** :
```typescript
// ❌ AVANT
const { data } = await supabase.from('table').operation();

// ✅ APRÈS
const response = await fetch(`${apiUrl}/api/route`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await response.json();
```

### Livrables
- ✏️ `client/src/services/messaging-service.ts` (7 fonctions refactorées)
- 📝 Tests frontend pour chaque fonction

**Temps** : 1h30  
**Validation** : Tests automatisés passent

---

## 🎯 ÉTAPE 4 : POLICIES RLS UNIVERSELLES (30 min)

### Objectif
Créer policies qui fonctionnent pour **TOUS** les types d'utilisateurs

### Approche
Puisque maintenant **TOUT passe par l'API backend** qui utilise `supabaseAdmin`, les policies RLS servent de **défense en profondeur**.

### Policies à Créer

```sql
-- DROP anciennes policies
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;

-- CREATE nouvelles policies (défense en profondeur)
-- Ces policies s'activent SEULEMENT si quelqu'un accède direct Supabase
-- (pas via API backend qui utilise supabaseAdmin)

CREATE POLICY "Authenticated users via backend can access conversations"
ON conversations
FOR ALL
TO authenticated
USING (
  -- Vérifier que la requête vient du backend (service_role)
  (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
  OR
  -- OU vérifier auth.uid() standard pour clients/experts
  (auth.uid()::text = ANY (participant_ids))
);

-- Pareil pour messages
CREATE POLICY "Authenticated users via backend can access messages"
ON messages
FOR ALL
TO authenticated
USING (
  (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
  OR
  EXISTS (
    SELECT 1 FROM conversations
    WHERE id = messages.conversation_id
    AND auth.uid()::text = ANY (participant_ids)
  )
);
```

### Livrables
- 📝 `policies-rls-finales-messagerie.sql`
- ✅ RLS réactivé

**Temps** : 30 min  
**Validation** : Tests tous types d'utilisateurs

---

## 🎯 ÉTAPE 5 : TESTS COMPLETS (30 min)

### Tests Automatisés

#### Test 1 : Client
- ✅ Charge ses conversations
- ✅ Crée conversation avec expert
- ✅ Envoie message
- ❌ NE PEUT PAS voir conversations d'un autre client

#### Test 2 : Expert
- ✅ Charge ses conversations
- ✅ Crée conversation avec client
- ✅ Envoie message
- ❌ NE PEUT PAS voir conversations d'un autre expert

#### Test 3 : Apporteur
- ✅ Charge ses conversations
- ✅ Crée conversation avec client/expert
- ✅ Envoie message
- ❌ NE PEUT PAS voir conversations d'un autre apporteur

#### Test 4 : Admin
- ✅ Voit TOUTES les conversations
- ✅ Crée conversations avec tous
- ✅ Envoie messages à tous

#### Test 5 : Sécurité
```javascript
// Tenter accès direct Supabase avec ANON_KEY
const malicious = createClient(SUPABASE_URL, ANON_KEY);
const { data, error } = await malicious.from('conversations').select('*');

// ✅ Attendu : error (RLS bloque) ou data = [] vide
```

### Tests Manuels
1. Tester sur https://www.profitum.app
2. Vérifier logs Railway (aucune erreur)
3. Vérifier Network tab (status 200)

**Temps** : 30 min

---

## 📊 TIMELINE COMPLÈTE

| Étape | Description | Durée | Cumul | Validation |
|---|---|:---:|:---:|---|
| **1** | Audit code frontend | 15 min | 0h15 | Tableau audit complet |
| **2** | Créer routes API backend | 45 min | 1h00 | Routes testées Postman |
| **3** | Refactor frontend | 1h30 | 2h30 | Tests auto passent |
| **4** | Policies RLS universelles | 30 min | 3h00 | RLS activé |
| **5** | Tests complets | 30 min | 3h30 | Tous users OK |
| **6** | Documentation | 15 min | 3h45 | Guide créé |
| **7** | Commit & Deploy | 15 min | 4h00 | Production ✅ |

**TOTAL** : **4 heures** (avec pauses validations)

---

## 🔧 DÉTAIL PAR ÉTAPE

### ÉTAPE 1 : AUDIT (15 min)

**Je vais faire** :
1. Analyser `messaging-service.ts` (850 lignes)
2. Grep tous les `supabase.from('conversations')`
3. Grep tous les `supabase.from('messages')`
4. Lister les fonctions avec ligne + code
5. Créer tableau de mapping

**Vous allez recevoir** :
```markdown
## Fonctions problématiques (7)

1. getExistingConversation (ligne 388-396)
   - Accès : supabase.from('conversations')
   - Usage : Vérifier si conversation existe
   - Route API nécessaire : GET /conversations/check
   - Complexité : ⭐ Simple

2. ensureAdminSupportConversation (ligne 405-460)
   - Accès : supabase.from('conversations')
   - Usage : Créer/récupérer conv admin
   - Route API nécessaire : POST /conversations/admin-support
   - Complexité : ⭐⭐ Moyenne
...
```

**Validation** : Vous validez la liste avant que je continue

---

### ÉTAPE 2 : ROUTES API BACKEND (45 min)

**Je vais créer** :

#### 2.1 Route Check Conversation (10 min)
```typescript
// GET /api/unified-messaging/conversations/check
// Paramètres : participant1, participant2, type
```

#### 2.2 Route Admin Support (15 min)
```typescript
// POST /api/unified-messaging/conversations/admin-support
// Crée ou retourne conversation admin existante
```

#### 2.3 Route Mark As Read (10 min)
```typescript
// PUT /api/unified-messaging/conversations/:id/read
// Marque tous les messages comme lus
```

#### 2.4 Tests Postman (10 min)
- Tester chaque route
- Vérifier auth
- Vérifier filtrage user

**Validation** : Vous testez les routes avec curl/Postman

---

### ÉTAPE 3 : REFACTOR FRONTEND (1h30)

**Je vais modifier** :

#### 3.1 Fonction par Fonction (10 min chacune)

**Fonction 1** : `getExistingConversation()`
```typescript
// AVANT (388-396) - 9 lignes
private async getExistingConversation(...) {
  const { data } = await supabase.from('conversations')...
}

// APRÈS - 12 lignes
private async getExistingConversation(...) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${apiUrl}/api/...`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const result = await response.json();
  return result.data;
}
```

**× 7 fonctions** = 1h10

#### 3.2 Vérification et Tests (20 min)
- Vérifier aucun `supabase.from('conversations')` restant
- Vérifier aucun `supabase.from('messages')` restant
- Tests unitaires

**Validation** : Build sans erreurs TypeScript

---

### ÉTAPE 4 : POLICIES RLS (30 min)

**Je vais créer** :

#### 4.1 Analyser Authentification (10 min)
- Comprendre comment backend passe JWT à Supabase
- Identifier si `service_role` est dans claims

#### 4.2 Créer Script SQL Final (15 min)
```sql
-- Policies universelles qui permettent :
-- 1. Backend (service_role) → Accès complet
-- 2. Clients/Experts (auth.uid()) → Leurs convs
-- 3. Bloque tout accès direct malveillant
```

#### 4.3 Exécution et Validation (5 min)
- Vous exécutez le script SQL
- Vérifier policies créées
- Vérifier RLS activé

**Validation** : RLS activé + Frontend fonctionne

---

### ÉTAPE 5 : TESTS (30 min)

#### 5.1 Tests par Type Utilisateur (5 min chacun)

**Client** :
1. Se connecter en tant que client
2. Ouvrir messagerie
3. Créer conversation avec expert
4. Envoyer message
5. ✅ Vérifier : Pas d'erreur 401
6. ✅ Vérifier : Voit seulement ses conversations

**Expert** : (idem)

**Apporteur** : (idem)

**Admin** : (idem)

#### 5.2 Tests Sécurité (10 min)

**Test intrusion** :
```bash
# Essayer d'accéder direct Supabase avec ANON_KEY
curl -X GET "https://xxx.supabase.co/rest/v1/conversations?select=*" \
  -H "apikey: ANON_KEY" \
  -H "Authorization: Bearer FAKE_TOKEN"

# ✅ Attendu : error ou [] vide (RLS bloque)
```

**Validation** : Tous tests passent

---

### ÉTAPE 6 : DOCUMENTATION (15 min)

**Je vais créer** :
- 📄 `ARCHITECTURE-MESSAGERIE-SECURISEE.md`
- 📄 `GUIDE-AJOUT-NOUVELLE-ROUTE-MESSAGING.md`
- 📝 Commentaires dans le code

**Validation** : Documentation claire

---

### ÉTAPE 7 : COMMIT & DEPLOY (15 min)

**Je vais faire** :
1. Commit frontend (messaging-service refactoré)
2. Commit backend (3 nouvelles routes)
3. Commit doc (guides créés)
4. Push vers GitHub
5. Vérifier auto-deploy Railway
6. Smoke tests production

**Validation** : Production fonctionne

---

## 🎯 POINTS DE VALIDATION

À chaque étape, **vous validez** avant que je continue :

✅ **Étape 1** → Vous validez le tableau audit  
✅ **Étape 2** → Vous testez les routes API  
✅ **Étape 3** → Vous vérifiez build frontend  
✅ **Étape 4** → Vous exécutez SQL + validez RLS  
✅ **Étape 5** → Vous testez tous users  

**Pas de surprise, total contrôle** ! 🎯

---

## 📊 RÉSULTAT FINAL

**Après 4h** :
- ✅ Zéro accès direct Supabase depuis frontend
- ✅ Toutes requêtes passent par API backend
- ✅ Backend filtre par authUser (sécurité couche 1)
- ✅ RLS activé sur Supabase (sécurité couche 2)
- ✅ Defense in depth (2 couches)
- ✅ Scalable (Supabase auto-scale)
- ✅ Performant (moins de hops)
- ✅ Conforme RGPD
- ✅ Audit trail complet

**Architecture** :
```
Frontend (React)
  ↓ HTTP + JWT
Backend API (Auth + Filtres)
  ↓ Service Role
Supabase (RLS activé)
  → Double vérification
  → Defense in depth
```

---

## ❓ VOTRE VALIDATION

**Êtes-vous d'accord avec cette timeline** ?

**Questions avant de commencer** :
1. Préférez-vous que je fasse **tout d'un coup** ou **étape par étape avec validations** ?
2. Voulez-vous tester les routes API vous-même ou je crée les tests automatisés ?
3. Quelle priorité : vitesse ou sécurité maximale ?

**Dites-moi "GO" et je commence l'Étape 1 : Audit Code Frontend** ! 🚀

