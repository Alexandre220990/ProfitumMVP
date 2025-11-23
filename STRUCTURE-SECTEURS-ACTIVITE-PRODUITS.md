# Structure des Secteurs d'Activité par Produit - Profitum

## Objectif

Associer les secteurs d'activité aux produits pour permettre :
1. **Filtrage intelligent** : Afficher uniquement les produits pertinents selon le secteur du client
2. **Matching amélioré** : Améliorer la correspondance entre experts et clients/apporteurs
3. **Expérience utilisateur optimisée** : Réduire le bruit et afficher les produits les plus pertinents

---

## 🎯 SECTEURS D'ACTIVITÉ DISPONIBLES

Les secteurs d'activité sont alignés sur la question **GENERAL_001** du simulateur :

1. Transport et Logistique
2. Commerce et Distribution
3. Industrie et Fabrication
4. Services aux Entreprises
5. BTP et Construction
6. Restauration et Hôtellerie
7. Santé et Services Sociaux
8. Agriculture et Agroalimentaire
9. Services à la Personne
10. Autre secteur

---

## 📊 MAPPING PRODUITS → SECTEURS

### Produits SPÉCIFIQUES (1 ou plusieurs secteurs)

| Produit | Secteurs d'activité | Justification |
|---------|---------------------|---------------|
| **DFS** | Transport et Logistique | Déduction Forfaitaire Spéciale - Concerne les fiches de paie des employés, réservée aux entreprises de transport routier |
| **TICPE** | Transport et Logistique, Agriculture et Agroalimentaire, BTP et Construction | Remboursement partiel TICPE pour : transport routier, véhicules agricoles/engins, engins de chantier et véhicules de travaux publics |
| **Chronotachygraphes digitaux** | Transport et Logistique, Agriculture et Agroalimentaire, BTP et Construction | Équipement obligatoire pour les véhicules +7,5T - Mêmes critères que Logiciel Solid (poids lourds, tracteurs, engins de chantier) |
| **Logiciel Solid** | Transport et Logistique, Agriculture et Agroalimentaire, BTP et Construction | Gestion des temps d'activités des conducteurs - Critère : véhicules Oui, type +7,5T (poids lourds, tracteurs, engins de chantier) |
| **MSA** | Agriculture et Agroalimentaire | Mutuelle Sociale Agricole - Régime de protection sociale spécifique et exclusif au secteur agricole |

### Produits UNIVERSELS (tous secteurs)

Ces produits sont applicables à **tous les secteurs d'activité** :

- **CEE** (Certificats d'économies d'énergie) - Tous secteurs
- **FONCIER** (Optimisation Fiscalité Foncière) - Tous secteurs (propriétaires immobiliers)
- **Optimisation fournisseur électricité** - Tous secteurs (remplace "Optimisation Énergie")
- **Optimisation fournisseur gaz** - Tous secteurs (remplace "Optimisation Énergie")
- **Recouvrement** - Tous secteurs
- **TVA** - Tous secteurs
- **URSSAF** - Tous secteurs

---

## 🔍 LOGIQUE DE FILTRAGE

### Règle de filtrage

Un produit est affiché pour un secteur donné si :
1. Le produit a `secteurs_activite = []` (tableau vide) → **Produit universel**
2. OU le produit contient le secteur dans son tableau `secteurs_activite`

### Exemple SQL

```sql
-- Trouver tous les produits applicables au secteur "Transport et Logistique"
SELECT * FROM "ProduitEligible"
WHERE "secteurs_activite" = '[]'::jsonb  -- Produits universels
   OR "secteurs_activite" @> '["Transport et Logistique"]'::jsonb;  -- Produits spécifiques
```

### Exemple JavaScript/TypeScript

```typescript
function getProduitsForSecteur(secteurActivite: string, produits: ProduitEligible[]) {
  return produits.filter(produit => {
    const secteurs = produit.secteurs_activite || [];
    // Produit universel (tableau vide) OU contient le secteur
    return secteurs.length === 0 || secteurs.includes(secteurActivite);
  });
}
```

---

## 🎯 CAS D'USAGE

### 1. Filtrage dans le Simulateur

**Scénario** : Un client répond "Transport et Logistique" à la question GENERAL_001

**Résultat** : 
- Afficher tous les produits universels (CEE, FONCIER, URSSAF, etc.)
- Afficher les produits spécifiques : DFS, TICPE, Chronotachygraphes digitaux, Logiciel Solid
- **Ne pas afficher** : MSA (spécifique Agriculture)

### 2. Matching Expert-Client

**Scénario** : Un client du secteur "Transport et Logistique" a besoin d'un expert pour DFS

**Algorithme de matching amélioré** :
1. Filtrer les experts qui ont "DFS" dans leurs spécialisations
2. **Bonus** : Augmenter le score si l'expert a aussi "Transport et Logistique" dans ses secteurs d'activité
3. **Bonus** : Augmenter le score si l'expert a déjà traité des dossiers DFS pour ce secteur

### 3. Marketplace Experts

**Scénario** : Un apporteur d'affaires cherche un expert pour un client "Transport et Logistique"

**Filtrage** :
- Afficher les experts spécialisés en produits pertinents (DFS, TICPE, etc.)
- Prioriser les experts ayant "Transport et Logistique" dans leurs secteurs

---

## 📝 STRUCTURE DE DONNÉES

### Colonne `secteurs_activite` (JSONB)

```json
// Produit universel (tous secteurs)
[]

// Produit spécifique à un secteur
["Transport et Logistique"]

// Produit spécifique à plusieurs secteurs
["Transport et Logistique", "Agriculture et Agroalimentaire"]
```

### Index GIN

Un index GIN a été créé pour optimiser les recherches :
```sql
CREATE INDEX idx_produit_eligible_secteurs_activite 
ON "ProduitEligible" USING GIN ("secteurs_activite");
```

---

## 🔄 ÉVOLUTION FUTURE

### Ajout de nouveaux secteurs

Si de nouveaux secteurs sont ajoutés à GENERAL_001 :
1. Mettre à jour la liste dans le simulateur
2. Réévaluer les produits existants pour voir s'ils doivent être associés aux nouveaux secteurs
3. Ajouter les nouveaux secteurs aux produits concernés

### Ajout de nouveaux produits

Lors de l'ajout d'un nouveau produit :
1. Déterminer s'il est **universel** (tous secteurs) ou **spécifique**
2. Si spécifique, identifier les secteurs pertinents
3. Remplir la colonne `secteurs_activite` en conséquence

---

## ✅ AVANTAGES

1. **Réduction du bruit** : Les clients ne voient que les produits pertinents
2. **Matching amélioré** : Meilleure correspondance expert-client
3. **Expérience utilisateur** : Interface plus claire et ciblée
4. **Performance** : Filtrage efficace grâce à l'index GIN
5. **Flexibilité** : Facile d'ajouter/modifier les associations

---

## 🚀 PROCHAINES ÉTAPES

1. ✅ Exécuter la migration SQL
2. ⏳ Modifier le simulateur pour filtrer les produits selon le secteur
3. ⏳ Modifier l'algorithme de matching expert-client
4. ⏳ Mettre à jour la marketplace experts pour utiliser les secteurs
5. ⏳ Ajouter un filtre par secteur dans l'interface admin

