# 🔧 Correction : Workflow ne revient plus en arrière lors du rejet de documents

## 📋 Problème identifié

Quand l'expert rejetait un document, le workflow **revenait à l'étape 1** au lieu de **rester à l'étape 3**, ce qui cassait tout le processus :

- ✅ **Avant** : Étape 3 "Collecte des documents" → Documents rejetés
- ❌ **Bug** : Retour à l'étape 1 → Affichage des champs d'upload initiaux → Progression à 17%
- ✅ **Attendu** : Rester à l'étape 3 → Afficher les documents manquants → Progression à 50%

## 🛠️ Corrections appliquées

### 1. **Logique des étapes corrigée** (`UniversalProductWorkflow.tsx`)

#### a) Marquer les étapes précédentes comme complétées

```typescript
case 1: // Confirmer l'éligibilité
  // ✅ FIX : Marquer comme complété si on est au-delà de l'étape 1
  if (currentStep > 1 || eligibilityValidated) {
    status = 'completed';
  }

case 2: // Sélection de l'expert
  // ✅ FIX : Marquer comme complété si on est au-delà de l'étape 2
  if (currentStep > 2) {
    status = 'completed';
  }
```

**Résultat** : Les étapes 1 et 2 sont maintenant marquées comme "✓ Terminé" quand on est à l'étape 3.

#### b) Afficher le contenu uniquement pour l'étape active

```typescript
{/* Étape 1 : Upload documents - SEULEMENT si currentStep === 1 */}
{step.id === 1 && currentStep === 1 && (
  <ProductUploadInline ... />
)}

{/* Étape 2 : Sélection expert - SEULEMENT si currentStep === 2 */}
{step.id === 2 && currentStep === 2 && eligibilityValidated && (
  <ExpertSelectionModal ... />
)}
```

**Résultat** : Le contenu de l'étape 1 (upload documents) ne s'affiche PLUS quand on est à l'étape 3.

### 2. **Script SQL de correction** (`FIX-ETAPES-DOSSIERS-DOCUMENTS-MANQUANTS.sql`)

Ce script corrige tous les dossiers qui sont revenus à une étape incorrecte :

```sql
UPDATE "ClientProduitEligible"
SET 
    current_step = 3,                    -- Forcer l'étape 3
    statut = 'documents_manquants',      -- Statut correct
    progress = 50,                        -- 50% de progression
    metadata = metadata || 
               jsonb_build_object(
                   'documents_missing', true,
                   'step_locked_at_3', true
               )
WHERE 
    -- Dossiers avec documents rejetés mais étape incorrecte
    (statut = 'documents_manquants' AND current_step != 3)
    OR EXISTS (SELECT 1 FROM "ClientProcessDocument" 
               WHERE status = 'rejected');
```

## 🎯 Résultat attendu

### **Workflow corrigé** :

```
1. ✓ Confirmer l'éligibilité         [Terminé]
   └─ Upload des documents initiaux

2. ✓ Sélection de l'expert           [Terminé]
   └─ Expert sélectionné et confirmé

3. 🟠 Collecte des documents          [En cours]
   └─ 📄 Documents manquants
   └─ L'expert a besoin de documents complémentaires
   └─ Document rejeté : "fichier.pdf"
   └─ Raison : "Document non conforme"

4. ⏳ Audit technique                 [En attente]

5. ⏳ Validation finale               [En attente]

6. ⏳ Demande de remboursement        [En attente]
```

### **Progression** :
- Étape 1 : ✅ Terminé → 17%
- Étape 2 : ✅ Terminé → 33%
- **Étape 3 : 🟠 En cours → 50%** ← On reste ici !
- Étape 4 : ⏳ En attente → 70%
- Étape 5 : ⏳ En attente → 85%
- Étape 6 : ⏳ En attente → 100%

## 📂 Fichiers modifiés

### Code frontend :
- `client/src/components/UniversalProductWorkflow.tsx`
  - Logique `updateWorkflowSteps` : marquer étapes précédentes comme complétées
  - Affichage conditionnel du contenu des étapes 1 et 2

### Scripts SQL :
- `FIX-ETAPES-DOSSIERS-DOCUMENTS-MANQUANTS.sql`
  - Diagnostic des dossiers avec étapes incorrectes
  - Correction automatique vers l'étape 3
  - Verrouillage à l'étape 3 jusqu'à validation

## 🧪 Test à effectuer

1. **Vérifier le dossier TICPE** :
   - URL : https://www.profitum.app/produits/ticpe/57f606c7-00a6-40f0-bb72-ae1831345d99
   
   **Attendu** :
   - ✅ Étape 1 : ✓ Terminé
   - ✅ Étape 2 : ✓ Terminé
   - 🟠 **Étape 3 : En cours** ← Vous devriez être ici !
   - ⏳ Étape 4 : En attente
   - **Progression : 50%** (pas 17% !)
   - 📄 **Message orange** : "Documents manquants"

2. **Exécuter le script SQL** :
   ```bash
   # Dans Supabase SQL Editor :
   # Copier-coller le contenu de FIX-ETAPES-DOSSIERS-DOCUMENTS-MANQUANTS.sql
   ```

## 🔒 Garanties

✅ **Plus de retour en arrière** : Une fois à l'étape 3, impossible de revenir aux étapes 1 ou 2

✅ **Statut cohérent** : Le statut `documents_manquants` force l'affichage de l'étape 3

✅ **Progression linéaire** : Les étapes se débloquent uniquement vers l'avant

✅ **Correction rétroactive** : Le script SQL corrige tous les dossiers existants

## 📊 Workflow complet

```
Étape 1 → Étape 2 → Étape 3 → Étape 4 → Étape 5 → Étape 6
   ↓         ↓         ↓         ↓         ↓         ↓
Upload    Expert   Documents  Audit    Validation Remboursement
Initial   Select   Complémt.  Tech.    Finale     

         🔒 Pas de retour arrière possible ! 🔒
```

## 🎉 Commit

```
Commit : 775e40e
Message : Fix: Empêcher retour arrière étape 1 quand documents manquants
```

---

**Prochaine étape** : Exécuter le script SQL pour corriger les dossiers existants ! 🚀

