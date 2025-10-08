# 🎯 SPÉCIFICATION : Produits Client (Simulation + Apporteur)

## 📋 BESOIN VALIDÉ

### **Règles d'affichage des produits sur dashboard client**

#### **CAS 1 : Produit issu de SIMULATION**
```
Client fait simulation → Produits éligibles détectés → Ajoutés automatiquement
```
**Affichage :**
- ✅ Carte produit standard
- ✅ Badge "Éligible" (vert)
- ✅ Source : `metadata.source = 'simulation'`

#### **CAS 2 : Produit créé par APPORTEUR D'AFFAIRES**
```
Apporteur crée prospect → Sélectionne produits → Client se connecte → Voit produits
```
**Affichage :**
- ✅ Carte produit **DISTINCTE** visuellement
- ✅ Badge **"Recommandé par votre apporteur"** (bleu ou doré)
- ✅ Icône spéciale (👤 ou 🤝)
- ✅ Source : `metadata.source = 'apporteur'`
- ✅ **Même si AUCUNE simulation n'a été faite**

---

## 🎨 DESIGN DIFFÉRENCIATION

### **Produit Simulation (Standard)**
```jsx
<Card className="border-green-200 bg-green-50/30">
  <Badge className="bg-green-100 text-green-800">
    ✓ Éligible
  </Badge>
  <h3>{produit.nom}</h3>
  <p>Montant estimé: {montant}€</p>
</Card>
```

### **Produit Apporteur (Spécial)**
```jsx
<Card className="border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 ring-2 ring-blue-200">
  <div className="flex items-center gap-2">
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
  <h3>{produit.nom}</h3>
  <p>Montant estimé: {montant}€</p>
  <p className="text-sm text-blue-700">
    Présélectionné par {apporteur_name}
  </p>
</Card>
```

---

## 🗄️ STRUCTURE DONNÉES

### **Table ClientProduitEligible**
```sql
{
  id: uuid,
  clientId: uuid,
  produitId: uuid,
  statut: 'eligible' | 'en_cours' | 'valide' | 'termine',
  priorite: 1 | 2 | 3,  -- 1=high, 2=medium, 3=low
  montantFinal: number,
  notes: string,
  metadata: {
    source: 'simulation' | 'apporteur',  -- ⭐ CRUCIAL
    priority_label: 'high' | 'medium' | 'low',
    success_probability: number,
    created_by_apporteur: uuid,  -- Si source = 'apporteur'
    simulation_id: uuid,  -- Si source = 'simulation'
    apporteur_notes: string  -- Notes de l'apporteur
  }
}
```

---

## 🔄 LOGIQUE D'AFFICHAGE

### **Dashboard Client - Liste Produits**

```javascript
// Récupérer TOUS les produits du client
const produits = await getClientProduits(clientId);

// Grouper par source
const produitsSimulation = produits.filter(p => 
  p.metadata?.source === 'simulation'
);

const produitsApporteur = produits.filter(p => 
  p.metadata?.source === 'apporteur'
);

// AFFICHAGE:
// 1. D'abord les produits apporteur (prioritaires)
produitsApporteur
  .sort((a, b) => a.priorite - b.priorite)
  .map(produit => <ProduitCardApporteur {...produit} />)

// 2. Ensuite les produits simulation
produitsSimulation
  .map(produit => <ProduitCardStandard {...produit} />)
```

---

## 🎨 COMPOSANTS À CRÉER

### **1. ProduitCardApporteur.tsx**
```typescript
interface ProduitCardApporteurProps {
  produit: ClientProduitEligible;
  onView: () => void;
}

export function ProduitCardApporteur({ produit, onView }: Props) {
  const isHighPriority = produit.priorite === 1;
  
  return (
    <Card className={`
      border-2 
      ${isHighPriority ? 'border-amber-400 ring-2 ring-amber-200' : 'border-blue-400'}
      bg-gradient-to-br from-blue-50 to-indigo-50
      hover:shadow-xl transition-all
    `}>
      {/* Badge Apporteur */}
      <Badge className="bg-blue-600 text-white">
        <UserCheck className="h-3 w-3 mr-1" />
        Recommandé par votre conseiller
      </Badge>
      
      {/* Priorité si haute */}
      {isHighPriority && (
        <Badge className="bg-amber-500 text-white">
          ⭐ Priorité haute
        </Badge>
      )}
      
      {/* Contenu produit */}
      <CardContent>
        <h3 className="font-bold text-lg">{produit.ProduitEligible.nom}</h3>
        <p className="text-sm text-gray-600">{produit.ProduitEligible.description}</p>
        
        {produit.notes && (
          <div className="mt-2 p-2 bg-blue-100 rounded text-sm">
            <p className="text-blue-800">
              💬 <strong>Note de votre conseiller:</strong> {produit.notes}
            </p>
          </div>
        )}
        
        <Button onClick={onView} className="mt-4">
          Voir le dossier
        </Button>
      </CardContent>
    </Card>
  );
}
```

### **2. ProduitCardStandard.tsx**
```typescript
export function ProduitCardStandard({ produit, onView }: Props) {
  return (
    <Card className="border-green-200 bg-white hover:shadow-lg transition-all">
      <Badge className="bg-green-100 text-green-800">
        ✓ Éligible
      </Badge>
      
      <CardContent>
        <h3 className="font-bold text-lg">{produit.ProduitEligible.nom}</h3>
        <p className="text-sm text-gray-600">{produit.ProduitEligible.description}</p>
        
        <Button onClick={onView} variant="outline" className="mt-4">
          Voir le dossier
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## 📊 RÉCAPITULATIF COMPRÉHENSION

### ✅ **CE QUI EST CLAIR**

1. **Template de référence:** `urssaf-product.tsx`
2. **Processus:** Même base d'étapes pour tous (à vérifier dans le modèle)
3. **Attribution simulation:** Automatique pour tous produits éligibles
4. **Différenciation apporteur:** 
   - ✅ Badge visuel "Recommandé par conseiller"
   - ✅ Couleur/style différent (bleu vs vert)
   - ✅ Affichage notes apporteur
   - ✅ Priorité visuelle (⭐ si haute)
5. **Indépendance simulation:** Produits apporteur visibles **même sans simulation**

---

## 🚀 PROCHAINES ÉTAPES

1. ⏳ **VOUS:** Exécutez `docs/database/get-10-produits.sql` (corrigé)
2. ⏳ **VOUS:** Donnez-moi les résultats (liste 10 produits)
3. ✅ **MOI:** J'analyse urssaf-product.tsx pour extraire le processus
4. ✅ **MOI:** Je crée les 10 pages produits uniformes
5. ✅ **MOI:** J'ajoute les badges "Via Apporteur"
6. ✅ **MOI:** Je modifie le dashboard client pour différencier

---

**Exécutez le SQL et donnez-moi les résultats ! Je continue pendant ce temps...** 🚀

