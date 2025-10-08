# 📦 PLAN ALIGNEMENT 10 PRODUITS ÉLIGIBLES

## 🎯 OBJECTIF
Créer 10 pages produits uniformes alignées sur la base de données `ProduitEligible` avec process de suivi complet pour chaque dossier.

---

## ❓ QUESTIONS STRATÉGIQUES POUR L'IMPLÉMENTATION

### **Q1: Liste complète des 10 produits** 🔴 URGENT

**Produits identifiés actuellement (7) :**
1. ✅ **TICPE** - Récupération taxe carburants
2. ✅ **DFS** - Déduction Forfaitaire Spécifique  
3. ✅ **URSSAF** - Optimisation cotisations
4. ✅ **Foncier** - Optimisation taxe foncière
5. ✅ **Énergie** - Optimisation contrats électricité/gaz
6. ✅ **Audit Énergétique** - Audit performance énergétique
7. ✅ **CEE** - Certificats Économies Énergie

**Produits à confirmer (3 manquants) :**
8. ❓ **CIR** (Crédit Impôt Recherche) ?
9. ❓ **MSA** (Mutualité Sociale Agricole) ?
10. ❓ **Autre** (Social / Juridique / Comptable / BPI France) ?

**ACTION REQUISE :**
```sql
-- Exécutez ce SQL pour me donner la liste exacte :
SELECT 
  id, 
  nom, 
  description, 
  categorie,
  tauxMin,
  tauxMax,
  montantMin,
  montantMax
FROM "ProduitEligible"
ORDER BY nom;
```

---

### **Q2: Page de référence (template)** 🟡 IMPORTANT

**Pages disponibles :**

| Fichier | Lignes | Type | Recommandation |
|---------|--------|------|----------------|
| `urssaf-product.tsx` | 384 | ✅ Complet | 🏆 **OPTIMAL** |
| `ticpe-product.tsx` | 380 | ✅ Complet | 🏆 **OPTIMAL** |
| `foncier-product.tsx` | 358 | ✅ Complet | ✅ Bon |
| `dfs-product.tsx` | 357 | ✅ Complet | ✅ Bon |
| `msa-product.tsx` | 93 | ⚠️ Simple | ❌ Trop simple |
| `audit_energetique.tsx` | 93 | ⚠️ Simple | ❌ Trop simple |
| `cee-product.tsx` | 24 | ❌ Minimal | ❌ Pas utilisable |

**Caractéristiques page complète (URSSAF/TICPE) :**
- ✅ Chargement dossier depuis `ClientProduitEligible`
- ✅ Affichage progression (barre de progrès)
- ✅ Statuts visuels (en_cours, validé, etc.)
- ✅ Étapes du dossier (DossierStep)
- ✅ Informations produit (montants, taux, durée)
- ✅ Actions utilisateur (télécharger, contacter expert)
- ✅ Gestion d'erreurs complète
- ✅ Design moderne avec gradients

**QUELLE PAGE UTILISER COMME TEMPLATE ?**
- Recommandation : **`urssaf-product.tsx`** (le plus complet)

---

### **Q3: Processus de suivi unifié** 🟡 IMPORTANT

**Options pour les étapes (DossierStep) :**

**Option A : Processus unifié (recommandé)**
```
1. Soumission dossier
2. Analyse documents
3. Validation expert
4. Dépôt administration
5. Suivi remboursement
6. Clôture
```

**Option B : Processus spécifiques par produit**
```
TICPE: Soumission → Factures → Calcul → Dépôt → Remboursement
Foncier: Soumission → Avis taxe → Analyse → Recours → Résultat
CIR: Soumission → Justificatifs R&D → Validation → Crédit
```

**Option C : Base commune + étapes spécifiques**
```
Base: Soumission → Analyse → Validation → Clôture
+ Étapes spécifiques selon produit
```

**QUEL PROCESSUS CHOISIR ?**

---

### **Q4: Simulation → Attribution produits** 🟢 DESIGN

Après simulation, comment les produits apparaissent-ils ?

**Option A : Automatique (tous éligibles)**
- Simulateur détecte éligibilité → Tous ajoutés automatiquement
- Avantage : Rapide, self-service
- Inconvénient : Peut créer des faux positifs

**Option B : Avec seuil (score > 50%)**
- Simulateur calcule score → Seuls ceux >50% sont ajoutés
- Avantage : Plus précis
- Inconvénient : Complexité calcul score

**Option C : Validation apporteur (contrôle qualité)**
- Simulateur propose → Apporteur valide/sélectionne
- Avantage : Qualité garantie
- Inconvénient : Nécessite apporteur

**Option D : Mix (auto + validation)**
- Client direct : Auto avec seuil
- Via apporteur : Validation manuelle
- Avantage : Flexible
- Inconvénient : Logique plus complexe

**QUELLE LOGIQUE D'ATTRIBUTION ?**
- Recommandation : **Option D** (mix)

---

### **Q5: Structure des données produits** 🟢 TECHNIQUE

**Mapping nom produit → fichier page :**

| Nom BDD | Fichier actuel | Nouveau fichier ? |
|---------|----------------|-------------------|
| `Récupération TICPE` | `ticpe-product.tsx` | ✅ Keep |
| `Déduction Forfaitaire Spécifique` | `dfs-product.tsx` | ✅ Keep |
| `Optimisation URSSAF` | `urssaf-product.tsx` | ✅ Keep |
| `Optimisation Taxe Foncière` | `foncier-product.tsx` | ✅ Keep |
| `Optimisation Énergie` | `energie-product.tsx` | ✅ Refaire |
| `Audit Énergétique` | `audit_energetique.tsx` | ✅ Refaire |
| `CEE` | `cee-product.tsx` | ✅ Refaire |
| `CIR` | `cir-product.tsx` | ✅ Refaire |
| `MSA` | `msa-product.tsx` | ✅ Refaire |
| `???` | À créer | 🆕 Créer |

**CONFIRMER MAPPING ?**

---

## 🚀 PLAN D'IMPLÉMENTATION (après vos réponses)

### **Phase 1 : Préparation**
1. ✅ Récupérer liste exacte 10 produits depuis BDD
2. ✅ Identifier template optimal (urssaf-product.tsx)
3. ✅ Définir processus unifié DossierStep
4. ✅ Définir logique attribution simulation → produits

### **Phase 2 : Création pages**
1. 🔄 Cloner template pour chaque produit
2. 🔄 Adapter: nom, description, icône, couleur
3. 🔄 Configurer étapes spécifiques si nécessaire
4. 🔄 Tester chargement données réelles

### **Phase 3 : Integration simulateur**
1. 🔄 Modifier simulateur pour créer ClientProduitEligible
2. 🔄 Lier simulation → attribution produits
3. 🔄 Affichage dashboard client avec produits

### **Phase 4 : Tests**
1. 🔄 Test simulation end-to-end
2. 🔄 Test affichage 10 produits
3. 🔄 Test process suivi dossier
4. 🔄 Test RLS (sécurité)

---

## 📊 ESTIMATION

**Temps total : 8-12 heures**
- Phase 1 : 1h (avec vos réponses)
- Phase 2 : 4-6h (création 10 pages)
- Phase 3 : 2-3h (intégration simulateur)
- Phase 4 : 1-2h (tests)

---

## ✅ PROCHAINES ÉTAPES

1. **VOUS** : Répondez aux 5 questions (Q1-Q5)
2. **MOI** : Je finis corrections erreurs layouts
3. **MOI** : Je crée les 10 pages produits optimales
4. **NOUS** : Tests complets

---

**Répondez aux 5 questions pendant que je termine les corrections !** 🚀

