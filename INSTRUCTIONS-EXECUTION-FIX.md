# 🚀 INSTRUCTIONS D'EXÉCUTION DU FIX SIMULATEUR

Date: 31 octobre 2025

## 📋 RÉSUMÉ

Le simulateur avait 2 problèmes majeurs :
1. ❌ Questions 9-12 n'avaient pas de conditions → Ne s'affichaient jamais
2. ❌ Logiciel Solid sans règle ni formule → Jamais éligible

**Résultat:** Montants calculés à 0€, simulateur incomplet

---

## ⭐ SCRIPT À EXÉCUTER

### 🎯 FIX-SIMULATEUR-ALL-IN-ONE.sql

**C'est le script principal qui fait TOUT automatiquement.**

---

## 🔧 ÉTAPES D'EXÉCUTION

### 1️⃣ Exécuter le script SQL

**Dans Supabase SQL Editor:**

```sql
-- Copier-coller le contenu de FIX-SIMULATEUR-ALL-IN-ONE.sql
-- Puis cliquer sur "Run"
```

**OU dans psql:**

```bash
psql -h db.xxx.supabase.co -U postgres -d postgres -f FIX-SIMULATEUR-ALL-IN-ONE.sql
```

**✅ Ce script fait automatiquement:**
- Nettoie les conditions incorrectes
- Ajoute les nouvelles conditions avec UUID
- Ajoute la règle d'éligibilité pour Logiciel Solid
- Ajoute la formule de calcul pour Logiciel Solid
- Vérifie que tout est correct

### 2️⃣ Redémarrer le serveur backend

**IMPORTANT:** Le cache des questions dure 1 heure !

```bash
cd /Users/alex/Desktop/FinancialTracker/server
npm run dev
```

### 3️⃣ Tester le simulateur

#### A. Ouvrir en mode navigation privée

Chrome/Safari: `Cmd + Shift + N`

#### B. Aller sur le simulateur

```
https://votre-domaine.com/simulateur-eligibilite
```

#### C. Répondre aux questions suivantes

Pour déclencher **TOUTES** les questions de calcul:

| Question | Réponse à donner |
|----------|------------------|
| **GENERAL_001** - Secteur | "Transport et Logistique" |
| **GENERAL_002** - CA | "500 000€ - 1 000 000€" |
| **GENERAL_003** - Employés | "21 à 50" |
| **GENERAL_004** - Propriétaire | "Oui" |
| **GENERAL_005** - Contrats énergie | "Oui" |
| **TICPE_001** - Véhicules | "Oui" |
| **TICPE_003** - Types véhicules | ["Camions de plus de 7,5 tonnes"] |
| **RECOUVR_001** - Impayés | "Non" |

#### D. Vérifier que les questions 9-12 s'affichent

✅ **TICPE_002** - Litres de carburant mensuel (car TICPE_001 = "Oui")

✅ **DFS_001** - Nombre de chauffeurs (car secteur = "Transport et Logistique")

✅ **FONCIER_001** - Montant taxe foncière (car propriétaire = "Oui")

✅ **ENERGIE_001** - Montant factures énergie (car contrats = "Oui")

#### E. Vérifier les résultats finaux

Après avoir répondu à toutes les questions, vous devriez voir:

| Produit | Montant attendu | Formule |
|---------|-----------------|---------|
| **DFS** | > 0€ | nb_chauffeurs × 150€ × 12 |
| **TICPE** | > 0€ | litres × 12 × 0,20€ |
| **FONCIER** | > 0€ | taxe_foncière × 20% |
| **Optimisation Énergie** | > 0€ | factures_mois × 12 × 30% |
| **URSSAF** | > 0€ | (car employés ≠ Aucun) |
| **Logiciel Solid** | 1500€ | 1500€ fixe |
| **TICPE** | > 0€ | (car camions +7,5T) |
| **Recouvrement** | 0€ | (car pas d'impayés) |
| **Chronotachygraphes** | Qualitatif | (car camions +7,5T) |

---

## 🔍 VÉRIFICATIONS

### Après exécution du script

Le script affiche automatiquement 3 vérifications:

#### ✅ Vérification 1: Conditions des questions 9-12
Toutes doivent avoir `statut = '✅ OK'`

#### ✅ Vérification 2: Produits avec règles
Tous les produits actifs doivent avoir au moins 1 règle

#### ✅ Vérification 3: Logiciel Solid
Doit avoir `statut = '✅ Complet'`

---

## 📊 CE QUI A ÉTÉ CORRIGÉ

### Problème 1: Questions conditionnelles

**Avant:**
```json
// conditions = NULL ou {}
```

**Après:**
```json
{
  "depends_on": "3dc89ae6-d395-45a5-a662-0ca397918f98",  // UUID (correct)
  "value": "Oui",
  "operator": "equals"
}
```

### Problème 2: Logiciel Solid

**Avant:**
- ❌ Règle: Aucune
- ❌ Formule: NULL

**Après:**
- ✅ Règle: Éligible si nb_employés ≠ "Aucun"
- ✅ Formule: 1500€ fixe par an

---

## ⚠️ ATTENTION

### Format des conditions

Le frontend cherche par **UUID**, pas par `question_id`:

```typescript
// Frontend: simulateur-eligibilite.tsx ligne 269
const dependencyQuestion = questions.find(
  dq => dq.id === dependsOn  // ← dq.id est l'UUID !
);
```

**Donc `depends_on` DOIT être un UUID string**, pas un `question_id` !

### Cache backend

Les questions sont cachées pendant 1 heure. Pour invalider le cache:
- Option 1: Redémarrer le serveur ✅ Recommandé
- Option 2: Attendre 1 heure ⏳ Pas pratique

---

## 🆘 EN CAS DE PROBLÈME

### Les questions 9-12 ne s'affichent toujours pas

1. Vérifier que le serveur a bien été redémarré
2. Vérifier dans la console navigateur:
   ```javascript
   // Devrait afficher 12 questions
   console.log(questions.length);
   ```
3. Vérifier que les conditions ont bien des UUID:
   ```sql
   SELECT question_id, conditions->>'depends_on' 
   FROM "QuestionnaireQuestion" 
   WHERE question_id IN ('TICPE_002', 'DFS_001', 'FONCIER_001', 'ENERGIE_001');
   ```

### Les montants sont toujours à 0€

1. Vérifier que les questions 9-12 ont bien été posées
2. Vérifier dans les logs backend que les réponses sont sauvegardées:
   ```
   📝 Contenu answers: {
     'TICPE_002': '1000',  ← Doit être présent
     'DFS_001': '10',      ← Doit être présent
     ...
   }
   ```

### Logiciel Solid n'apparaît pas

1. Vérifier qu'il y a au moins 1 employé (GENERAL_003 ≠ "Aucun")
2. Vérifier la règle existe:
   ```sql
   SELECT * FROM "EligibilityRules" WHERE produit_nom = 'Logiciel Solid';
   ```

---

## 📁 FICHIERS CRÉÉS

| Fichier | Usage |
|---------|-------|
| **FIX-SIMULATEUR-ALL-IN-ONE.sql** | ⭐ Script principal |
| FIX-SIMULATEUR-COMPLET.sql | Script original (corrigé) |
| NETTOYER-CONDITIONS-AVANT-FIX.sql | Nettoyage préalable |
| ROLLBACK-ET-REFAIRE-CONDITIONS.sql | Réinitialisation |
| LISTE-COMPLETE-QUESTIONS-REGLES-PRODUITS.sql | Diagnostic complet |
| diagnostic-questions-regles.sql | Diagnostic détaillé |
| DIAGNOSTIC-SIMULATEUR-PROBLEMES-SOLUTIONS.md | Documentation |

---

## ✅ CHECKLIST FINALE

- [ ] Script FIX-SIMULATEUR-ALL-IN-ONE.sql exécuté avec succès
- [ ] Vérifications du script passées (3/3 ✅)
- [ ] Serveur backend redémarré
- [ ] Test en navigation privée effectué
- [ ] Questions 9-12 s'affichent conditionnellement
- [ ] Montants calculés > 0€ pour les produits éligibles
- [ ] Logiciel Solid apparaît avec 1500€

---

**🎉 Une fois toutes les étapes validées, le simulateur est entièrement opérationnel !**

