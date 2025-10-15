# ✅ IMPLÉMENTATION PHASE 1 : NOTIFICATIONS PRÉ-ÉLIGIBILITÉ

## 📋 Récapitulatif des modifications

### 🎯 Objectif
Implémenter les 3 notifications critiques du flux de pré-éligibilité :
1. **Notif #1** : Admin reçoit alerte → Documents pré-éligibilité uploadés
2. **Notif #4** : Client reçoit → Pré-éligibilité validée ✅
3. **Notif #5** : Client reçoit → Pré-éligibilité rejetée ❌

---

## 📁 Fichiers créés

### 1. **`server/src/services/admin-notification-service.ts`** ✅
**Service pour notifications admin**

Méthodes :
- `getAdminIds()` → Récupère tous les admins actifs
- `notifyDocumentsPreEligibilityUploaded()` → Notif documents pré-éligibilité
- `notifyDocumentsComplementaryUploaded()` → Notif documents complémentaires (Phase 2)
- `notifyExpertRefusedDossier()` → Notif refus expert (Phase 2)

**Table utilisée** : `notification` (unifiée)
**Colonnes** : `user_id`, `user_type='admin'`, `notification_type`, `action_url`, `action_data`

---

### 2. **`server/src/services/client-notification-service.ts`** ✅
**Service pour notifications client**

Méthodes :
- `notifyEligibilityValidated()` → Client : pré-éligibilité validée
- `notifyEligibilityRejected()` → Client : pré-éligibilité rejetée
- `notifyDossierSentToExpert()` → Client : dossier transmis à l'expert (Phase 2)

**Particularité** : Récupère `auth_user_id` depuis table `Client` pour notifier le bon user

---

### 3. **`server/src/routes/admin-notifications-new.ts`** ✅
**Route API pour recevoir les événements du client**

**Endpoint** :
```typescript
POST /api/notifications/admin/documents-eligibility
Headers: Authorization: Bearer {token}
Body: {
  client_produit_id: string,
  product_type: string,
  documents: Array<{id, type, filename}>
}
```

**Logique** :
1. Authentification client requise
2. Récupère infos client + produit depuis BDD
3. Appelle `AdminNotificationService.notifyDocumentsPreEligibilityUploaded()`
4. Crée 1 notification par admin

---

## 📝 Fichiers modifiés

### 4. **`client/src/components/documents/core/ProductDocumentUpload.tsx`** ✅
**Ligne 400-428 ajoutées**

Après upload des documents, appelle :
```typescript
POST /api/notifications/admin/documents-eligibility
```

**Comportement** :
- ✅ Non bloquant : Si échec notif, upload continue
- ✅ Logs console pour debug
- ✅ Toast reste inchangé pour UX

---

### 5. **`server/src/routes/admin.ts`** ✅
**Ligne 3451-3479 modifiées**

Route existante :
```typescript
POST /api/admin/dossiers/:id/validate-eligibility
```

**Ajout** :
1. Import dynamique `ClientNotificationService`
2. Si `action === 'approve'` → `notifyEligibilityValidated()`
3. Si `action === 'reject'` → `notifyEligibilityRejected()`
4. Non bloquant : Si échec notif, validation continue

---

### 6. **`server/src/index.ts`** ✅
**Lignes 78 et 295 ajoutées**

Enregistrement de la route :
```typescript
import adminNotificationsNewRoutes from './routes/admin-notifications-new';
app.use('/api/notifications', enhancedAuthMiddleware, adminNotificationsNewRoutes);
```

---

## 🔄 Flux complet implémenté

### Scénario 1 : Upload documents pré-éligibilité

```
1. Client upload docs KBIS + immatriculation
   → ProductDocumentUpload.tsx
   
2. Validation réussie
   → PUT /api/client/produits-eligibles/:id (statut: documents_uploaded)
   
3. Notification admin
   → POST /api/notifications/admin/documents-eligibility
   → AdminNotificationService.notifyDocumentsPreEligibilityUploaded()
   → INSERT INTO notification (user_type='admin', ...)
   
4. Admin voit notification dans son dashboard
   → action_url: /admin/dossiers/:id/validate-eligibility
```

---

### Scénario 2 : Admin valide la pré-éligibilité

```
1. Admin clique sur notification
   → Ouvre /admin/dossiers/:id/validate-eligibility
   
2. Admin valide (approve)
   → POST /api/admin/dossiers/:id/validate-eligibility
   → UPDATE ClientProduitEligible (statut: eligibility_validated, step: 2)
   
3. Notification client
   → ClientNotificationService.notifyEligibilityValidated()
   → INSERT INTO notification (user_type='client', ...)
   
4. Client voit notification
   → "✅ Pré-éligibilité confirmée"
   → action_url: /client/produits/:id (étape 2 déverrouillée)
```

---

### Scénario 3 : Admin rejette la pré-éligibilité

```
1. Admin rejette (reject) avec notes
   → POST /api/admin/dossiers/:id/validate-eligibility
   → UPDATE ClientProduitEligible (statut: eligibility_rejected, step: 1)
   
2. Notification client
   → ClientNotificationService.notifyEligibilityRejected()
   → INSERT INTO notification (user_type='client', ...)
   
3. Client voit notification
   → "❌ Pré-éligibilité non confirmée"
   → Message avec raison du refus
   → action_url: /client/produits/:id (corriger documents)
```

---

## 🎨 Interface utilisateur (existante, non modifiée)

### Client
- ✅ `EligibilityValidationStatus.tsx` affiche déjà les 3 états
- ✅ `ProductDocumentUpload.tsx` gère blocage/déblocage selon statut
- ✅ Couleurs : Vert (validé), Rouge (rejeté), Gris (en attente)

### Admin
- ⚠️ **À créer** : Dashboard notifications admin
- ⚠️ **À créer** : Page validation dossiers avec actions
- 💡 **Suggestion** : Intégrer dans `/admin/dossiers`

---

## 🧪 Comment tester

### Test 1 : Notification admin (upload)

```bash
# 1. Se connecter comme client
# 2. Aller sur un produit éligible
# 3. Uploader KBIS + immatriculation
# 4. Valider l'étape

# Vérifier BDD :
SELECT * FROM notification 
WHERE user_type = 'admin' 
  AND notification_type = 'admin_action_required'
ORDER BY created_at DESC LIMIT 5;
```

### Test 2 : Notification client (validation)

```bash
# 1. Se connecter comme admin
# 2. Aller sur /admin/dossiers/:id/validate-eligibility
# 3. Approuver avec notes
# 4. Vérifier notification client

# Vérifier BDD :
SELECT * FROM notification 
WHERE user_type = 'client' 
  AND notification_type = 'eligibility_validated'
ORDER BY created_at DESC LIMIT 5;
```

### Test 3 : Notification client (rejet)

```bash
# Même process que Test 2 mais :
# 3. Rejeter avec raison

# Vérifier BDD :
SELECT * FROM notification 
WHERE user_type = 'client' 
  AND notification_type = 'eligibility_rejected'
ORDER BY created_at DESC LIMIT 5;
```

---

## ✅ Checklist de déploiement

- [x] Services créés (admin + client)
- [x] Route API créée et enregistrée
- [x] Frontend appelle la route
- [x] Backend envoie notifications client
- [x] Pas d'erreurs de linting
- [ ] Tests manuels effectués
- [ ] Dashboard admin pour voir notifications
- [ ] Notifications en temps réel (WebSocket/SSE - Phase 3)

---

## 🚀 Prochaines étapes (Phase 2)

1. **Documents complémentaires** (Étape 3)
   - Route validation admin
   - Notifications admin + client
   
2. **Flux expert**
   - Notification expert (sélection)
   - Notification refus expert
   - Accès documents pour expert

3. **Dashboard admin**
   - Interface notifications
   - Actions rapides (valider/rejeter)
   - Filtres et recherche

---

## 📊 Résumé technique

| Composant | Statut | Fichier |
|-----------|--------|---------|
| Service Admin | ✅ | `admin-notification-service.ts` |
| Service Client | ✅ | `client-notification-service.ts` |
| Route API | ✅ | `admin-notifications-new.ts` |
| Appel Frontend | ✅ | `ProductDocumentUpload.tsx` |
| Notif depuis Admin | ✅ | `admin.ts` |
| Enregistrement route | ✅ | `index.ts` |
| Tests | ⏳ | À faire |

**Total lignes ajoutées** : ~350 lignes
**Temps implémentation** : ~40 min
**Bugs connus** : Aucun détecté

