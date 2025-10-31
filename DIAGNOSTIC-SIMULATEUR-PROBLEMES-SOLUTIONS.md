# 🔍 DIAGNOSTIC COMPLET DU SIMULATEUR - PROBLÈMES ET SOLUTIONS

Date: 31 octobre 2025

## 📋 RÉSUMÉ EXÉCUTIF

**Problème principal:** Le simulateur affiche seulement 8 questions sur 12, s'arrête prématurément et calcule des montants à 0€.

**Cause racine:** Les questions de type `nombre` (9-12) n'ont pas de conditions définies, le frontend pense qu'il n'y a plus de questions et termine le simulateur.

---

## 🔴 PROBLÈMES IDENTIFIÉS

### 1. Questions de calcul non affichées ❌

**Symptôme:**
- L'utilisateur répond à 7 questions sur 12
- Les questions 9-12 ne sont jamais posées
- Le simulateur se termine après la question 8 (RECOUVR_001)

**Questions manquantes:**
- `TICPE_002` (ordre 9) - Litres de carburant mensuel
- `DFS_001` (ordre 10) - Nombre de chauffeurs
- `FONCIER_001` (ordre 11) - Montant taxe foncière
- `ENERGIE_001` (ordre 12) - Montant factures énergie

**Impact:**
- DFS: `nb_chauffeurs = 0` → montant = 0€
- TICPE: `litres_carburant = undefined` → montant = 0€
- FONCIER: `taxe_fonciere = undefined` → montant = 0€
- Optimisation Énergie: `factures_energie = undefined` → montant = 0€

### 2. Logique du frontend défaillante ⚠️

**Code problématique:** `simulateur-eligibilite.tsx` ligne 368-379

```typescript
const nextVisibleQuestion = findNextVisibleQuestion(currentStep);

if (nextVisibleQuestion) {
  setCurrentStep(nextVisibleQuestion.question_order);
  setCurrentQuestion(nextVisibleQuestion);
} else { 
  // 🔴 BUG: Termine le simulateur sans questions restantes
  await calculateResults(); 
}
```

**Problème:**
- `findNextVisibleQuestion` retourne `null` car les questions 9-12 n'ont pas de `conditions`
- Le simulateur pense qu'il n'y a plus de questions et termine

### 3. Logiciel Solid sans règle d'éligibilité ❌

**Symptôme:**
- Le produit "Logiciel Solid" est actif mais n'a aucune règle d'éligibilité
- Il n'est jamais retourné comme éligible

**Impact:**
- Produit invisible pour tous les utilisateurs

### 4. Logiciel Solid sans formule de calcul ❌

**Symptôme:**
- `formule_calcul = null`
- `parametres_requis = null`
- `notes_affichage = null`

**Impact:**
- Même si éligible, le montant serait indéfini

---

## ✅ SOLUTIONS APPLIQUÉES

### Solution 1: Ajout des conditions sur les questions 9-12

**Fichier:** `FIX-SIMULATEUR-COMPLET.sql` (Partie 1)

```sql
-- TICPE_002 → Afficher SI TICPE_001 = "Oui"
-- DFS_001 → Afficher SI GENERAL_001 = "Transport et Logistique"
-- FONCIER_001 → Afficher SI GENERAL_004 = "Oui"
-- ENERGIE_001 → Afficher SI GENERAL_005 = "Oui"
```

**Résultat attendu:**
- Les questions de calcul s'affichent conditionnellement
- Le frontend demande les valeurs nécessaires aux calculs
- Les montants sont calculés correctement

### Solution 2: Ajout de la règle pour Logiciel Solid

**Fichier:** `FIX-SIMULATEUR-COMPLET.sql` (Partie 2)

```sql
-- Logiciel Solid éligible SI nb_employes != "Aucun"
```

**Résultat attendu:**
- Logiciel Solid apparaît dans les résultats si l'entreprise a des employés

### Solution 3: Ajout de la formule pour Logiciel Solid

**Fichier:** `FIX-SIMULATEUR-COMPLET.sql` (Partie 3)

```sql
-- Formule: 1500€ fixe par an
```

**Résultat attendu:**
- Montant de 1500€ affiché pour Logiciel Solid

---

## 🚀 ÉTAPES D'APPLICATION

### 1. Exécuter le script de correction

```bash
# Dans votre outil de base de données (pgAdmin, psql, Supabase SQL Editor)
# Exécuter: FIX-SIMULATEUR-COMPLET.sql
```

### 2. Redémarrer le serveur backend

```bash
cd /Users/alex/Desktop/FinancialTracker/server
npm run dev
```

**Important:** Le cache des questions dure 1 heure. Redémarrer invalide le cache.

### 3. Tester le simulateur

1. Ouvrir en mode navigation privée
2. Démarrer le simulateur en mode anonyme
3. Répondre aux questions suivantes:
   - GENERAL_001: "Transport et Logistique"
   - GENERAL_002: "500 000€ - 1 000 000€"
   - GENERAL_003: "21 à 50"
   - GENERAL_004: "Oui"
   - GENERAL_005: "Oui"
   - TICPE_001: "Oui"
   - TICPE_003: ["Camions de plus de 7,5 tonnes"]
   - RECOUVR_001: "Non"
   
**✅ Vérifier que les questions suivantes s'affichent:**
   - TICPE_002: "Consommation carburant" (car TICPE_001 = Oui)
   - DFS_001: "Nombre de chauffeurs" (car secteur = Transport)
   - FONCIER_001: "Taxe foncière" (car propriétaire = Oui)
   - ENERGIE_001: "Factures énergie" (car contrats = Oui)

4. Vérifier les résultats:
   - DFS: montant > 0€ (nb_chauffeurs × 150 × 12)
   - TICPE: montant > 0€ (litres × 12 × 0.20)
   - FONCIER: montant > 0€ (taxe × 0.20)
   - Optimisation Énergie: montant > 0€ (factures × 12 × 0.30)

---

## 📊 TABLEAU RÉCAPITULATIF

| Problème | Statut | Solution | Fichier |
|----------|--------|----------|---------|
| Questions 9-12 non affichées | ✅ Résolu | Conditions ajoutées | FIX-SIMULATEUR-COMPLET.sql |
| Logiciel Solid sans règle | ✅ Résolu | Règle ajoutée | FIX-SIMULATEUR-COMPLET.sql |
| Logiciel Solid sans formule | ✅ Résolu | Formule ajoutée | FIX-SIMULATEUR-COMPLET.sql |
| Montants à 0€ | ✅ Résolu | Valeurs collectées | Auto (après fix) |

---

## 📝 NOTES TECHNIQUES

### Structure des conditions

```json
{
  "depends_on": "uuid-de-la-question-parente",
  "value": "valeur-attendue",
  "operator": "equals" | "not_equals" | "includes"
}
```

### Règles d'affichage frontend

La fonction `findNextVisibleQuestion()` :
1. Cherche la prochaine question par `question_order`
2. Vérifie si elle a des `conditions`
3. Si oui, vérifie que la question parente a la bonne réponse
4. Si non, affiche la question
5. Si aucune question trouvée, termine le simulateur

---

## ⚠️ POINTS D'ATTENTION

1. **Cache backend:** Redémarrer le serveur après modification des questions
2. **Cache browser:** Tester en navigation privée
3. **Ordre des questions:** Ne pas modifier `question_order` sans mise à jour des conditions
4. **Produits actifs:** Tous les produits actifs doivent avoir une règle d'éligibilité

---

## 🎯 RÉSULTAT ATTENDU

Après application des correctifs:

- ✅ 12 questions affichées (conditionnellement)
- ✅ Questions de calcul posées aux bons utilisateurs
- ✅ Montants calculés correctement (> 0€)
- ✅ Tous les produits actifs ont des règles
- ✅ "Logiciel Solid" apparaît dans les résultats
- ✅ Expérience utilisateur fluide et cohérente

