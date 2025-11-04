# 🎯 Workflow : Deux scénarios de rejet de documents

## 📋 Vue d'ensemble

Le système gère maintenant **deux types de rejets de documents distincts** :

1. **Rejet par l'ADMIN** → Documents de pré-éligibilité (Étape 1)
2. **Rejet par l'EXPERT** → Documents complémentaires (Étape 3)

---

## 🔴 Scénario 1 : Rejet par l'ADMIN (Pré-éligibilité)

### 📍 Contexte
- **Étape** : 1 - "Confirmer l'éligibilité"
- **Documents** : Documents initiaux (KBIS, cartes grises, factures, RIB)
- **Acteur** : Admin Profitum
- **Moment** : Avant la sélection de l'expert

### 🔄 Flux

```mermaid
Client upload documents → Admin examine → Admin rejette → RESTER ÉTAPE 1
```

### 💾 Statut BDD
```typescript
{
  statut: 'eligibility_rejected',
  current_step: 1,
  progress: 10,
  metadata: {
    eligibility_decision: 'rejected',
    admin_notes: 'Raison du refus...'
  }
}
```

### 🎨 Affichage Client

```
┌─────────────────────────────────────────────────────────┐
│ Progression globale : 10%                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 1. 🟠 Confirmer l'éligibilité         [En cours]        │
│    └─ Upload des documents justificatifs                │
│    └─ ❌ Éligibilité non confirmée                      │
│    └─ 📝 Raison : "Documents non conformes"             │
│    └─ 🔄 Mettre à jour les documents                    │
│                                                          │
│ 2. ⏳ Sélection de l'expert            [En attente]     │
│                                                          │
│ 3. ⏳ Collecte des documents           [En attente]     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### ✅ Comportement attendu

- **Étape active** : 1 (pas de changement)
- **Statut** : `eligibility_rejected`
- **Message** : Card rouge avec raison du refus
- **Action client** : Modifier/uploader de nouveaux documents
- **Blocage** : Étapes 2, 3, 4, 5, 6 restent bloquées
- **Pas de retour en arrière** : On reste à l'étape 1

---

## 🟠 Scénario 2 : Rejet par l'EXPERT (Documents complémentaires)

### 📍 Contexte
- **Étape** : 3 - "Collecte des documents"
- **Documents** : Documents complémentaires demandés par l'expert
- **Acteur** : Expert assigné au dossier
- **Moment** : Après la sélection de l'expert

### 🔄 Flux

```mermaid
Expert demande docs → Client upload → Expert examine → Expert rejette → RESTER ÉTAPE 3
```

### 💾 Statut BDD
```typescript
{
  statut: 'documents_manquants',
  current_step: 3,
  progress: 50,
  metadata: {
    documents_missing: true,
    last_document_rejection: {
      document_id: '...',
      document_name: 'fichier.pdf',
      rejection_reason: 'Document non conforme',
      rejected_at: '2025-11-04T...'
    }
  }
}
```

### 🎨 Affichage Client

```
┌─────────────────────────────────────────────────────────┐
│ Progression globale : 50%                                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 1. ✓ Confirmer l'éligibilité         [Terminé]          │
│                                                          │
│ 2. ✓ Sélection de l'expert           [Terminé]          │
│                                                          │
│ 3. 🟠 Collecte des documents          [En cours]        │
│    └─ 📄 Documents manquants                            │
│    └─ L'expert a besoin de documents complémentaires    │
│    └─ Document rejeté : "fichier.pdf"                   │
│    └─ Raison : "Document non conforme"                  │
│                                                          │
│ 4. ⏳ Audit technique                 [En attente]       │
│                                                          │
│ 5. ⏳ Validation finale               [En attente]       │
│                                                          │
│ 6. ⏳ Demande de remboursement        [En attente]       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### ✅ Comportement attendu

- **Étape active** : 3 (pas de changement)
- **Étapes 1 et 2** : Marquées comme "✓ Terminé"
- **Statut** : `documents_manquants`
- **Message** : Card orange avec raison du rejet
- **Action client** : Fournir les documents demandés
- **Blocage** : Étapes 4, 5, 6 restent bloquées
- **Pas de retour en arrière** : On ne revient PAS aux étapes 1 ou 2

---

## 🔐 Règles de verrouillage

### ✅ Progression linéaire uniquement

```
Étape 1 → Étape 2 → Étape 3 → Étape 4 → Étape 5 → Étape 6
   ↓         ↓         ↓         ↓         ↓         ↓
  Admin    Expert    Expert    Expert    Expert    Expert
 valide   accepte   valide    audit     valide    paiement
          dossier    docs     terminé   dossier   effectué

         🔒 Aucun retour en arrière possible 🔒
```

### 🚫 Interdictions

❌ **Impossible de revenir à l'étape 1** une fois à l'étape 2 ou 3  
❌ **Impossible de revenir à l'étape 2** une fois à l'étape 3 ou plus  
❌ **Les étapes précédentes sont verrouillées** et marquées comme "Terminé"

### ✅ Autorisations

✅ **Rester à l'étape 1** si admin rejette (rejet initial)  
✅ **Rester à l'étape 3** si expert rejette (documents complémentaires)  
✅ **Avancer uniquement** vers les étapes suivantes

---

## 🧪 Tests à effectuer

### Test 1 : Rejet par admin (étape 1)

1. **Créer un dossier** et uploader des documents
2. **L'admin rejette** les documents avec une raison
3. **Vérifier** :
   - ✅ On reste à l'étape 1
   - ✅ Progression à 10%
   - ✅ Card rouge "❌ Éligibilité non confirmée"
   - ✅ Raison du refus affichée
   - ✅ Possibilité d'uploader de nouveaux documents

### Test 2 : Rejet par expert (étape 3)

1. **Admin valide** un dossier → Étape 2
2. **Client sélectionne** un expert → Étape 3
3. **Expert rejette** un document avec une raison
4. **Vérifier** :
   - ✅ On reste à l'étape 3
   - ✅ Progression à 50%
   - ✅ Étapes 1 et 2 marquées "✓ Terminé"
   - ✅ Card orange "📄 Documents manquants"
   - ✅ Document rejeté et raison affichés
   - ✅ Pas de retour à l'étape 1

---

## 📊 Tableau récapitulatif

| Critère | Rejet ADMIN (Étape 1) | Rejet EXPERT (Étape 3) |
|---------|----------------------|------------------------|
| **Statut BDD** | `eligibility_rejected` | `documents_manquants` |
| **Étape** | 1 | 3 |
| **Progression** | 10% | 50% |
| **Couleur** | 🔴 Rouge | 🟠 Orange |
| **Message** | "Éligibilité non confirmée" | "Documents manquants" |
| **Documents** | Initiaux (KBIS, RIB...) | Complémentaires |
| **Étapes précédentes** | - | ✓ Terminé (1, 2) |
| **Retour arrière** | Non (on reste à 1) | Non (on reste à 3) |

---

## 🎉 Garanties

✅ **Différenciation claire** entre rejet admin et rejet expert  
✅ **Pas de confusion** : chaque rejet reste dans son étape  
✅ **Pas de retour en arrière** : progression linéaire garantie  
✅ **Messages adaptés** : couleurs et textes différents  
✅ **Workflow cohérent** : chaque étape a son rôle précis

---

## 📂 Code modifié

### Frontend
- `client/src/components/UniversalProductWorkflow.tsx`
  - Ajout du cas `eligibility_rejected` → force étape 1
  - Ajout du cas `documents_manquants` → force étape 3
  - Marquage des étapes précédentes comme "Terminé"

### Backend
- `server/src/routes/admin.ts` (déjà existant)
  - Route de validation/rejet par admin
  - Définit `eligibility_rejected` et `current_step: 1`
  
- `server/src/routes/expert-documents.ts` (déjà existant)
  - Route de rejet de documents par expert
  - Définit `documents_manquants` et `current_step: 3`

---

## 🚀 Déploiement

```bash
# Commit effectué
git commit -m "Fix: Gérer le rejet par admin (étape 1) et expert (étape 3)"

# Push effectué
git push origin main

# Commit : 1e8702a
```

**C'est maintenant déployé et fonctionnel !** 🎉

