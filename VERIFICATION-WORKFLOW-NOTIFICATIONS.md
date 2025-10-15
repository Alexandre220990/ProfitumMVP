# ✅ VÉRIFICATION : WORKFLOW vs NOTIFICATIONS

## 📊 WORKFLOW ACTUEL CODÉ

### Étapes du workflow (TICPEWorkflow, URSSAFWorkflow, FONCIERWorkflow)

| Étape | Nom | Description | Statut BDD associé | current_step |
|-------|-----|-------------|-------------------|--------------|
| **1** | Confirmer l'éligibilité | Upload documents KBIS/immatriculation | `documents_uploaded` | 1 |
| **2** | Sélection de l'expert | Choisir l'expert | `eligibility_validated` → `en_cours` | 2 |
| **3** | Collecte des documents | Upload documents complémentaires | ? (à définir) | 3 |
| **4** | Audit technique | Analyse par l'expert | ? | 4 |
| **5** | Validation finale | Validation administrative | ? | 5 |
| **6** | Demande de remboursement | Soumission dossier | ? | 6 |

### Statuts utilisés dans le code

```typescript
// ProductDocumentUpload.tsx
- 'documents_uploaded'      // Documents uploadés, en attente validation
- 'eligibility_validated'   // Pré-éligibilité OK par admin
- 'eligibility_rejected'    // Pré-éligibilité KO par admin
- 'eligible_confirmed'      // Aussi traité comme "waiting"
- 'en_cours'               // Dossier en cours (expert assigné)
- 'pending'                // En attente
```

### Route admin existante

```typescript
POST /api/admin/dossiers/:id/validate-eligibility
{
  action: 'approve' | 'reject',
  notes: string
}

// Met à jour :
- statut: 'eligibility_validated' | 'eligibility_rejected'
- current_step: 2 | 1
- progress: 25 | 10
- metadata.eligibility_validation

// ⚠️ TODO ligne 3451 : Envoyer notification au client
```

---

## ✅ ALIGNEMENT AVEC LA MATRICE DE NOTIFICATIONS

### 🟢 CE QUI COLLE PARFAITEMENT

| Notif # | Événement | État workflow | Statut BDD | ✅ |
|---------|-----------|---------------|------------|-----|
| **#1** | Documents pré-éligibilité uploadés | Étape 1 complétée | `documents_uploaded` | ✅ PARFAIT |
| **#4** | Pré-éligibilité validée | Admin approve | `eligibility_validated` + step=2 | ✅ PARFAIT |
| **#5** | Pré-éligibilité rejetée | Admin rejette | `eligibility_rejected` + step=1 | ✅ PARFAIT |
| **#7** | Expert sélectionné | Étape 2 | `en_cours` + expert_id | ✅ PARFAIT |

### 🟡 CE QUI NÉCESSITE CLARIFICATION

| Notif # | Événement | Problème | Solution |
|---------|-----------|----------|----------|
| **#2** | Documents complémentaires uploadés | ⚠️ Pas de statut dédié pour étape 3 | Créer statut `documents_complete` ou `ready_for_expert` |
| **#6** | Dossier complet validé | ⚠️ Workflow pas encore codé | Ajouter route admin `/validate-complete-dossier` |
| **#10** | Expert termine audit | ⚠️ Pas de statut "audit_completed" | Ajouter gestion étape 4 |

### 🔴 CE QUI MANQUE DANS LE CODE

1. **Notifications client après validation admin** (ligne 3451 - TODO)
   - ✅ Route admin existe
   - ❌ Envoi notification manquant
   - 🎯 À implémenter : Notif #4 et #5

2. **Workflow étape 3** (Documents complémentaires)
   - ✅ Interface existe (Collecte des documents)
   - ❌ Pas de statut/route de validation
   - 🎯 À implémenter : Notif #2 et #6

3. **Workflow expert** (Étapes 4-5-6)
   - ✅ Structure visuelle existe
   - ❌ Actions backend manquantes
   - 🎯 À implémenter : Notif #10 et suivantes

---

## 🎯 PLAN D'ACTION CORRIGÉ

### ✅ PHASE 1 : Compléter flux pré-éligibilité (PRIORITÉ 1)

**Ce qui existe déjà** :
- ✅ Frontend : Upload documents (ProductDocumentUpload.tsx)
- ✅ Backend : Route validation admin (`/validate-eligibility`)
- ✅ Statuts : `documents_uploaded`, `eligibility_validated`, `eligibility_rejected`

**Ce qui manque** :
1. **Notif #1** : Admin reçoit notif quand documents uploadés
   - Appel API depuis `ProductDocumentUpload.tsx`
   
2. **Notif #4 & #5** : Client reçoit notif après décision admin
   - Compléter le TODO ligne 3451 dans `admin.ts`

### ✅ PHASE 2 : Créer flux documents complémentaires (PRIORITÉ 2)

**À créer** :
1. Statut : `documents_complete` (étape 3 terminée)
2. Route : `POST /api/admin/dossiers/:id/validate-complete-dossier`
3. Notif #2 : Admin reçoit notif documents complémentaires
4. Notif #6 : Client reçoit confirmation transmission à expert

### ✅ PHASE 3 : Flux expert (PRIORITÉ 3)

**À créer** :
1. Statuts : `audit_in_progress`, `audit_completed`
2. Routes expert pour màj étapes
3. Notif #10 : Audit terminé → Client + Admin + Apporteur

---

## ✅ DÉCISION FINALE

**LA MATRICE COLLE BIEN** avec quelques ajustements :

### Ajustements nécessaires :

1. **Ajouter statuts manquants** :
   ```sql
   -- Nouveaux statuts à supporter dans ClientProduitEligible
   - 'documents_complete'     -- Étape 3 terminée
   - 'expert_assigned'        -- Expert a accepté
   - 'audit_in_progress'      -- Étape 4 en cours
   - 'audit_completed'        -- Étape 4 terminée
   - 'validation_pending'     -- Étape 5 en attente
   - 'completed'              -- Étape 6 terminée
   ```

2. **Ordre d'implémentation révisé** :

   **MAINTENANT (Phase 1)** :
   - ✅ Notif #1 : Documents pré-éligibilité → Admin
   - ✅ Notif #4 : Validation → Client  
   - ✅ Notif #5 : Rejet → Client

   **ENSUITE (Phase 2)** :
   - Documents complémentaires + notifications
   
   **PUIS (Phase 3)** :
   - Workflow expert complet

---

## 🚀 ON DÉMARRE LA PHASE 1 ?

Je vais implémenter maintenant :
1. Notification admin (#1) quand client upload docs
2. Notifications client (#4, #5) depuis la route admin existante

**C'est OK pour toi ?** ✅

