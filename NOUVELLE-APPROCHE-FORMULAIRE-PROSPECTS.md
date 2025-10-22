# 🎯 NOUVELLE APPROCHE - Formulaire Prospects Apporteur

**Date :** 22 octobre 2025  
**Workflow Revu** : Sélection manuelle des experts par l'apporteur + Validation côté client

---

## 🔄 CHANGEMENT DE WORKFLOW

### ❌ Ancienne Approche (ANNULÉE)
- Assignation **automatique** des experts via `ExpertOptimizationService`
- L'expert était forcément assigné immédiatement
- Aucun choix pour l'apporteur

### ✅ Nouvelle Approche (IMPLÉMENTÉE)

#### **Étape 1 : Apporteur** 
- Reçoit des **suggestions d'experts** (IA) pour chaque CPE
- **Peut sélectionner** manuellement l'expert recommandé
- **OU choisir un autre** expert dans la liste disponible
- **OU laisser vide** → le client choisira lui-même

#### **Étape 2 : Client** (à implémenter)
- Sur son espace client, voit ses `ClientProduitEligible`
- Si expert assigné par l'apporteur → **peut valider ou changer**
- Si aucun expert → **choisit lui-même** dans la liste

#### **Étape 3 : RDV (optionnel)**
- L'apporteur peut planifier un RDV **ou non**
- Peut juste envoyer un email au prospect
- Pas de RDV forcé

---

## 📋 MODIFICATIONS APPLIQUÉES

### 1️⃣ Backend : `ProspectSimulationService.ts`

**Modification ligne 223-264 :**
```typescript
// ⚠️ NE PAS assigner automatiquement - L'apporteur choisira manuellement
const enrichedProducts: ClientProduitEligibleWithScore[] = (createdCPE || []).map(cpe => {
  // Trouver l'expert recommandé pour ce produit (pour SUGGESTION à l'apporteur)
  let recommendedExpert;
  for (const meeting of expertOptimization.recommended.meetings) {
    if (meeting.productIds.includes(cpe.produitId)) {
      recommendedExpert = { ... };
      break;
    }
  }
  
  // 💡 L'expert recommandé est seulement une SUGGESTION
  // L'apporteur pourra le sélectionner manuellement (ou laisser vide)
  console.log(`💡 Expert recommandé pour ${produit?.nom}: ${recommendedExpert?.name || 'aucun'}`);
  
  return {
    ...cpe,
    recommended_expert: recommendedExpert  // ✅ Seulement une suggestion
  };
});
```

**Impact :**
- ✅ Les experts ne sont PLUS assignés automatiquement
- ✅ Les recommandations IA sont disponibles comme suggestions
- ✅ Le choix final appartient à l'apporteur

---

### 2️⃣ Frontend : Nouveau Composant `ProductWithManualExpertSelector.tsx`

**Caractéristiques :**
- Affiche chaque produit éligible avec ses détails
- Montre l'expert **RECOMMANDÉ** par l'IA (avec score de match)
- Permet de **sélectionner** cet expert d'un clic
- Permet de **choisir un autre** expert dans la liste
- Permet de **laisser vide** (message : "Le client pourra choisir")
- Interface intuitive avec cartes cliquables

**Code clé :**
```typescript
interface Props {
  product: Product;
  onExpertSelected: (productId: string, expertId: string | null) => void;
  selectedExpertId?: string | null;
}

export function ProductWithManualExpertSelector({ 
  product, 
  onExpertSelected,
  selectedExpertId 
}: Props) {
  // Affiche :
  // 1. Expert recommandé (badge violet "Recommandé par IA")
  // 2. Expert sélectionné (badge vert avec bouton "Retirer")
  // 3. Liste déroulante d'autres experts disponibles
}
```

---

### 3️⃣ Frontend : Mise à Jour `ProspectForm.tsx`

**Ajouts :**

#### a) Nouvel état pour la sélection manuelle
```typescript
const [manualExpertSelections, setManualExpertSelections] = useState<Record<string, string | null>>({});
```

#### b) Handler de sélection
```typescript
const handleManualExpertSelection = (productId: string, expertId: string | null) => {
  setManualExpertSelections(prev => ({
    ...prev,
    [productId]: expertId
  }));
  console.log(`✅ Expert ${expertId || 'aucun'} sélectionné pour produit ${productId}`);
};
```

#### c) Remplacement du composant d'affichage
```typescript
{/* Avant : ProductEligibilityCardWithExpert */}
{/* Après : ProductWithManualExpertSelector */}
{identifiedProducts.map((product) => (
  <ProductWithManualExpertSelector
    key={product.id}
    product={product}
    selectedExpertId={manualExpertSelections[product.id]}
    onExpertSelected={handleManualExpertSelection}
  />
))}
```

#### d) Sauvegarde des sélections
```typescript
// Dans handleSubmit, après création du prospect :
if (identificationMode === 'simulation' && simulationCompleted && Object.keys(manualExpertSelections).length > 0) {
  await saveManualExpertSelections(createdProspectId);
}
```

#### e) RDV rendu optionnel
```typescript
<select id="meeting_type">
  <option value="">-- Aucun RDV --</option>  {/* ✅ Nouvelle option */}
  <option value="physical">Physique</option>
  <option value="video">Visio</option>
  <option value="phone">Téléphone</option>
</select>
```

---

### 4️⃣ Backend : Nouveau Endpoint `POST /api/apporteur/prospects/:clientId/assign-experts`

**Fichier :** `server/src/routes/apporteur-api.ts` (ligne 442-539)

**Fonctionnalité :**
```typescript
router.post('/prospects/:clientId/assign-experts', async (req: Request, res: Response) => {
  const { expert_assignments } = req.body;
  // Format: [{ product_id: "uuid", expert_id: "uuid" | null }, ...]
  
  for (const assignment of expert_assignments) {
    // Mettre à jour ClientProduitEligible.expert_id
    await supabase
      .from('ClientProduitEligible')
      .update({ expert_id: assignment.expert_id })
      .eq('id', assignment.product_id);
  }
  
  return { success: true, data: { success: N, failed: M } };
});
```

**Logs attendus :**
```
✅ Assignation de 3 experts pour client abc-123
✅ Expert jean-dupont assigné au CPE def-456
✅ Expert marie-martin assignée au CPE ghi-789
✅ Expert aucun assigné au CPE jkl-012  // Laissé vide intentionnellement
```

---

## 🎨 UX/UI Améliorée

### Formulaire Apporteur

**Avant :**
- Produits affichés avec experts déjà assignés (aucun choix)
- RDV obligatoire
- Pas d'indication sur qui a choisi l'expert

**Après :**
- 💡 Message : "Pour chaque produit, vous pouvez sélectionner un expert ou laisser vide"
- Carte par produit avec 3 sections :
  1. **Expert recommandé IA** (badge violet + score)
  2. **Expert sélectionné** (badge vert + bouton Retirer)
  3. **Aucun expert** (message informatif)
- Bouton "Choisir un expert" → Liste déroulante d'experts disponibles
- RDV avec option "-- Aucun RDV --"

---

## 🔄 Workflow Complet Revu

```
1. Apporteur crée prospect
   ├─> Remplit infos entreprise + décisionnaire
   └─> Sélectionne "Simulation Intelligente"

2. Simulation s'exécute
   ├─> Identifie 3 produits éligibles
   ├─> ExpertOptimizationService génère SUGGESTIONS
   └─> Retourne CPE avec recommended_expert (pas assigné !)

3. Apporteur voit résultats
   ├─> Produit 1: MSA - Expert recommandé: Jean Dupont
   │   └─> Apporteur clique "Sélectionner" ✅
   ├─> Produit 2: URSSAF - Expert recommandé: Marie Martin
   │   └─> Apporteur clique "Changer" → Choisit Pierre Durand ✅
   └─> Produit 3: DFS - Expert recommandé: Sophie Bernard
       └─> Apporteur laisse VIDE ❌

4. Apporteur décide du RDV
   ├─> Sélectionne "-- Aucun RDV --"
   └─> Choisit "Email Présentation"

5. Sauvegarde
   ├─> POST /api/apporteur/prospects → Crée Client
   ├─> POST /api/apporteur/prospects/:id/assign-experts
   │   └─> Assigne Jean Dupont à MSA ✅
   │   └─> Assigne Pierre Durand à URSSAF ✅
   │   └─> Laisse DFS sans expert (NULL) ❌
   └─> POST /api/apporteur/prospects/:id/send-credentials

6. Prospect reçoit email
   └─> "Découvrez votre espace client Profitum"

7. Prospect se connecte
   ├─> Voit ses 3 CPE sur le dashboard
   ├─> MSA: Expert Jean Dupont → Bouton "Valider" ou "Changer"
   ├─> URSSAF: Expert Pierre Durand → Bouton "Valider" ou "Changer"
   └─> DFS: Aucun expert → Bouton "Choisir un expert" ✅
```

---

## 🗄️ Structure BDD

### Table `ClientProduitEligible`

**Colonnes clés :**
```sql
id UUID PRIMARY KEY
clientId UUID → Client
produitId UUID → ProduitEligible
expert_id UUID → Expert  -- ⚠️ NULLABLE !
statut VARCHAR ('eligible', 'to_confirm', 'non_eligible')
montantFinal NUMERIC
created_at TIMESTAMP
updated_at TIMESTAMP
```

**États possibles de `expert_id` :**
1. `NULL` → Aucun expert assigné (le client choisira)
2. `uuid-123` → Expert assigné par l'apporteur (client peut valider/changer)
3. `uuid-456` → Expert choisi par le client (validation finale)

---

## 📊 Requêtes SQL de Vérification

```sql
-- 1. Voir les produits avec/sans expert assigné
SELECT 
    c.company_name,
    pe.nom as produit,
    cpe.expert_id,
    e.name as expert_nom,
    CASE 
        WHEN cpe.expert_id IS NULL THEN 'À choisir par le client'
        ELSE 'Assigné par l\'apporteur'
    END as statut_assignation
FROM "ClientProduitEligible" cpe
LEFT JOIN "Client" c ON c.id = cpe."clientId"
LEFT JOIN "ProduitEligible" pe ON pe.id = cpe."produitId"
LEFT JOIN "Expert" e ON e.id = cpe.expert_id
WHERE c.source = 'apporteur'
ORDER BY c.created_at DESC, pe.nom;

-- 2. Statistiques d'assignation
SELECT 
    COUNT(*) FILTER (WHERE expert_id IS NOT NULL) as avec_expert,
    COUNT(*) FILTER (WHERE expert_id IS NULL) as sans_expert,
    ROUND(100.0 * COUNT(*) FILTER (WHERE expert_id IS NOT NULL) / COUNT(*), 2) as taux_assignation
FROM "ClientProduitEligible"
WHERE "clientId" IN (
    SELECT id FROM "Client" WHERE source = 'apporteur' AND created_at > NOW() - INTERVAL '7 days'
);
```

---

## ✅ CHECKLIST DÉPLOIEMENT

- [x] ✅ Annuler sauvegarde automatique experts (`ProspectSimulationService.ts`)
- [x] ✅ Créer composant `ProductWithManualExpertSelector.tsx`
- [x] ✅ Mettre à jour `ProspectForm.tsx` avec sélection manuelle
- [x] ✅ Rendre RDV optionnel
- [x] ✅ Créer endpoint `/api/apporteur/prospects/:id/assign-experts`
- [ ] ⏳ Créer interface client pour valider/choisir experts
- [ ] ⏳ Tester le flux complet end-to-end
- [ ] ⏳ Corriger l'erreur `SimulatorSession does not exist` dans le cron

---

## 🎯 PROCHAINES ÉTAPES

### 1️⃣ Interface Client (à implémenter)

**Composant :** `client/src/pages/client-products/[id].tsx`

```typescript
// Page d'un CPE côté client
{cpe.expert_id ? (
  // Expert déjà assigné par l'apporteur
  <div>
    <h4>Expert proposé: {expert.name}</h4>
    <Button onClick={validateExpert}>✅ Valider cet expert</Button>
    <Button onClick={() => setShowExpertSelector(true)}>🔄 Choisir un autre expert</Button>
  </div>
) : (
  // Aucun expert assigné
  <div>
    <p>Aucun expert n'a encore été sélectionné pour ce produit.</p>
    <Button onClick={() => setShowExpertSelector(true)}>👤 Choisir un expert</Button>
  </div>
)}
```

### 2️⃣ Tests End-to-End

1. **Créer un prospect avec simulation** (mode apporteur)
2. **Sélectionner 2/3 experts** (1 laissé vide)
3. **Ne pas créer de RDV** (tester option "Aucun RDV")
4. **Vérifier BDD** : 2 CPE avec expert_id, 1 avec NULL
5. **Se connecter en tant que client**
6. **Voir les 3 CPE** sur le dashboard
7. **Valider l'expert** du produit 1
8. **Changer l'expert** du produit 2
9. **Choisir un expert** pour le produit 3
10. **Vérifier BDD** : Les 3 CPE ont maintenant un expert_id

---

## 📝 Notes Importantes

⚠️ **Comportement différent selon origine :**

| Scénario | expert_id | Interprétation | Action Client |
|----------|-----------|----------------|---------------|
| Apporteur sélectionne Jean | `abc-123` | Suggéré par apporteur | Valider OU Changer |
| Apporteur laisse vide | `NULL` | Aucune suggestion | Choisir |
| Client valide | `abc-123` | Validé par client | Confirmé |
| Client choisit Marie | `def-456` | Choisi par client | Confirmé |

✅ **Flexibilité maximale :**
- Apporteur peut tout faire (assigner ou laisser vide)
- Client garde le dernier mot
- RDV optionnel (email suffit parfois)
- Transparence sur qui a choisi quoi

---

**Auteur :** Assistant IA  
**Date :** 22 octobre 2025  
**Version :** 2.0 - Workflow manuel avec validation client

