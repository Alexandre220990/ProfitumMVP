# 📦 MAPPING DES 10 PRODUITS - Configuration complète

## 🎯 LISTE OFFICIELLE (depuis BDD)

| # | Nom | ID | Fichier | Icône | Couleur | Statut |
|---|-----|----|---------| ------|---------|--------|
| 1 | **CEE** | `b7f3c891-28d9-4982-b0eb-821c9e7cbcf0` | `cee-product.tsx` | 🏭 Zap | Vert | ✅ À refaire |
| 2 | **Chronotachygraphes digitaux** | `21b6f7b7-40d2-4937-903b-2ea53acdac6b` | `chrono-product.tsx` | 🚛 Truck | Orange | 🆕 À créer |
| 3 | **DFS** | `e2f9a830-8d3b-4c7c-b590-1d7631c0d4b5` | `dfs-product.tsx` | 📊 Calculator | Vert | ✅ Existe (OK) |
| 4 | **Foncier** | `c5d2e980-4f63-44c0-b8a9-9d6e8e21c0f7` | `foncier-product.tsx` | 🏠 Home | Indigo | ✅ Existe (OK) |
| 5 | **MSA** | `f3a7b920-9e4c-4d8d-a680-2e89d2c0d5c6` | `msa-product.tsx` | 🌾 Sprout | Vert | ✅ À refaire |
| 6 | **Optimisation Énergie** | `bc2b94ec-659b-4cf5-a693-d61178b03caf` | `energie-product.tsx` | ⚡ Zap | Jaune | ✅ À refaire |
| 7 | **Recouvrement** | `37da1c4e-3fcc-49f8-9acb-9b75e231edfd` | `recouvrement-product.tsx` | ⚖️ Scale | Rouge | 🆕 À créer |
| 8 | **TICPE** | `32dd9cf8-15e2-4375-86ab-a95158d3ada1` | `ticpe-product.tsx` | 🚚 Truck | Rouge | ✅ Existe (OK) |
| 9 | **TVA** | `4acfe03a-b0f1-4029-a6e4-90d259198321` | `tva-product.tsx` | 💶 Euro | Bleu | 🆕 À créer |
| 10 | **URSSAF** | `d1e8f740-7c2a-4b5e-9a91-0e15c0e7d3a2` | `urssaf-product.tsx` | 🏢 Building2 | Bleu | ✅ Template ref |

---

## 📊 CATÉGORISATION

### **Produits existants et corrects (3)**
- ✅ URSSAF (template de référence)
- ✅ TICPE (complet)
- ✅ DFS (complet)
- ✅ Foncier (complet)

### **Produits à refaire (3)**
- 🔄 CEE (actuellement minimal)
- 🔄 MSA (actuellement simple)
- 🔄 Optimisation Énergie (actuellement minimal)

### **Produits à créer (3)**
- 🆕 Chronotachygraphes digitaux
- 🆕 Recouvrement
- 🆕 TVA

---

## 🎨 CONFIGURATION PAR PRODUIT

### **1. CEE (Certificats Économies Énergie)**
```typescript
{
  nom: "CEE",
  titre: "Certificats d'Économies d'Énergie",
  description: "Obtenez des aides pour vos travaux d'efficacité énergétique",
  icone: Zap,
  couleur: "green",
  gradient: "from-green-50 via-white to-green-100",
  id: "b7f3c891-28d9-4982-b0eb-821c9e7cbcf0"
}
```

### **2. Chronotachygraphes digitaux**
```typescript
{
  nom: "Chronotachygraphes digitaux",
  titre: "Chronotachygraphes Digitaux",
  description: "Pilotage temps réel et démarches simplifiées TICPE",
  icone: Truck,
  couleur: "orange",
  gradient: "from-orange-50 via-white to-orange-100",
  id: "21b6f7b7-40d2-4937-903b-2ea53acdac6b",
  categorie: "Services additionnels TICPE"
}
```

### **3. DFS (Déduction Forfaitaire Spécifique)**
```typescript
{
  nom: "DFS",
  titre: "Déduction Forfaitaire Spécifique",
  description: "Réduction assiette cotisations sociales métiers techniques",
  icone: Calculator,
  couleur: "green",
  gradient: "from-green-50 via-white to-green-100",
  id: "e2f9a830-8d3b-4c7c-b590-1d7631c0d4b5"
}
```

### **4. Foncier**
```typescript
{
  nom: "Foncier",
  titre: "Optimisation Taxe Foncière",
  description: "Optimisez votre taxe foncière propriétés bâties",
  icone: Home,
  couleur: "indigo",
  gradient: "from-indigo-50 via-white to-indigo-100",
  id: "c5d2e980-4f63-44c0-b8a9-9d6e8e21c0f7"
}
```

### **5. MSA**
```typescript
{
  nom: "MSA",
  titre: "Optimisation Charges MSA",
  description: "Optimisation cotisations Mutualité Sociale Agricole",
  icone: Sprout,
  couleur: "green",
  gradient: "from-green-50 via-white to-green-100",
  id: "f3a7b920-9e4c-4d8d-a680-2e89d2c0d5c6"
}
```

### **6. Optimisation Énergie**
```typescript
{
  nom: "Optimisation Énergie",
  titre: "Optimisation Contrats Énergie",
  description: "Optimisez vos contrats électricité et gaz",
  icone: Zap,
  couleur: "yellow",
  gradient: "from-yellow-50 via-white to-yellow-100",
  id: "bc2b94ec-659b-4cf5-a693-d61178b03caf"
}
```

### **7. Recouvrement**
```typescript
{
  nom: "Recouvrement",
  titre: "Recouvrement d'Impayés",
  description: "Avocat spécialisé en recouvrement créances",
  icone: Scale,
  couleur: "red",
  gradient: "from-red-50 via-white to-red-100",
  id: "37da1c4e-3fcc-49f8-9acb-9b75e231edfd"
}
```

### **8. TICPE**
```typescript
{
  nom: "TICPE",
  titre: "Récupération TICPE",
  description: "Remboursement taxe carburants professionnels",
  icone: Truck,
  couleur: "red",
  gradient: "from-red-50 via-white to-red-100",
  id: "32dd9cf8-15e2-4375-86ab-a95158d3ada1"
}
```

### **9. TVA**
```typescript
{
  nom: "TVA",
  titre: "Gestion TVA Internationale",
  description: "Remboursement et gestion administrative TVA",
  icone: Euro,
  couleur: "blue",
  gradient: "from-blue-50 via-white to-blue-100",
  id: "4acfe03a-b0f1-4029-a6e4-90d259198321"
}
```

### **10. URSSAF**
```typescript
{
  nom: "URSSAF",
  titre: "Optimisation URSSAF",
  description: "Optimisation charges sociales",
  icone: Building2,
  couleur: "blue",
  gradient: "from-blue-50 via-white to-blue-100",
  id: "d1e8f740-7c2a-4b5e-9a91-0e15c0e7d3a2"
}
```

---

## 🔄 PROCESSUS UNIFIÉ (extrait du template URSSAF)

### **Étapes communes :**
1. **Audit** - Analyse documents et situation
2. **Optimisation** - Identification économies possibles
3. **Récupération** - Accompagnement remboursements

### **Éléments affichés :**
- ✅ Montant estimé
- ✅ Taux de réussite
- ✅ Durée estimée
- ✅ Statut (éligible, en_cours, validé)
- ✅ Progress bar
- ✅ Expert assigné (si existe)
- ✅ **Badge "Via Apporteur" si metadata.source = 'apporteur'**

---

## 🎨 BADGE "VIA APPORTEUR"

### **Détection :**
```typescript
const isFromApporteur = clientProduit.metadata?.source === 'apporteur';
const apporteurName = clientProduit.metadata?.created_by_apporteur_name;
const priority = clientProduit.priorite; // 1=high, 2=medium, 3=low
```

### **Affichage :**
```jsx
{isFromApporteur && (
  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
    <div className="flex items-center gap-2 mb-2">
      <Badge className="bg-blue-600 text-white flex items-center gap-1">
        <UserCheck className="h-3 w-3" />
        Recommandé par votre conseiller
      </Badge>
      {priority === 1 && (
        <Badge className="bg-amber-500 text-white">
          ⭐ Priorité haute
        </Badge>
      )}
    </div>
    {clientProduit.notes && (
      <p className="text-sm text-blue-800">
        💬 <strong>Note:</strong> {clientProduit.notes}
      </p>
    )}
  </div>
)}
```

---

## 📁 ACTIONS À EFFECTUER

### **Produits à créer (3)**
1. 🆕 `client/src/pages/produits/chrono-product.tsx`
2. 🆕 `client/src/pages/produits/recouvrement-product.tsx`
3. 🆕 `client/src/pages/produits/tva-product.tsx`

### **Produits à refaire (3)**
1. 🔄 `client/src/pages/produits/cee-product.tsx`
2. 🔄 `client/src/pages/produits/msa-product.tsx`
3. 🔄 `client/src/pages/produits/energie-product.tsx`

### **Produits déjà OK (4)**
1. ✅ `client/src/pages/produits/urssaf-product.tsx` (référence)
2. ✅ `client/src/pages/produits/ticpe-product.tsx`
3. ✅ `client/src/pages/produits/dfs-product.tsx`
4. ✅ `client/src/pages/produits/foncier-product.tsx`

---

**Prêt à générer les 10 pages ! Confirmation pour démarrer ?** 🚀

