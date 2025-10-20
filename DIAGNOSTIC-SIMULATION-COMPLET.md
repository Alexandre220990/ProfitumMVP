# 🔍 DIAGNOSTIC COMPLET - SYSTÈME DE SIMULATION

## 📊 ÉTAT ACTUEL DE LA BASE DE DONNÉES

### ✅ Tables fonctionnelles
- **ProduitEligible** : 10 produits actifs
- **EligibilityRules** : 10 règles d'éligibilité
- **simulations** : 3 simulations récentes
- **ClientProduitEligible** : 3 résultats créés manuellement

### ❌ Problèmes identifiés

#### 1. **Simulations bloquées**
```
Status: en_cours/in_progress
Produits éligibles: 0
```
→ Le calcul d'éligibilité ne se déclenche pas

#### 2. **Données incohérentes**
- Produits avec `montant_min/max = null`
- Taux avec valeurs `null`
- Règles qui référencent des `question_id` inexistants

#### 3. **Flux de calcul cassé**
- API `/calculate-eligibility` ne fonctionne pas
- Aucun `ClientProduitEligible` créé automatiquement
- Frontend n'affiche pas les résultats

## 🎯 STRUCTURE EXACTE DES TABLES

### ProduitEligible
```sql
CREATE TABLE "ProduitEligible" (
  id UUID PRIMARY KEY,
  nom VARCHAR,
  description TEXT,
  categorie VARCHAR,
  montant_min DECIMAL,
  montant_max DECIMAL,
  taux_min DECIMAL,
  taux_max DECIMAL,
  duree_min INTEGER,
  duree_max INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### EligibilityRules
```sql
CREATE TABLE "EligibilityRules" (
  id UUID PRIMARY KEY,
  produit_id UUID REFERENCES "ProduitEligible"(id),
  produit_nom VARCHAR,
  rule_type VARCHAR, -- 'simple' | 'combined'
  conditions JSONB,
  priority INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Simulations
```sql
CREATE TABLE "simulations" (
  id UUID PRIMARY KEY,
  client_id UUID,
  session_token VARCHAR,
  status VARCHAR, -- 'in_progress' | 'completed' | 'failed'
  type VARCHAR,
  answers JSONB,
  results JSONB,
  metadata JSONB,
  expires_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### ClientProduitEligible
```sql
CREATE TABLE "ClientProduitEligible" (
  id UUID PRIMARY KEY,
  clientId UUID,
  produitId UUID REFERENCES "ProduitEligible"(id),
  statut VARCHAR, -- 'eligible' | 'non_eligible' | 'to_confirm'
  tauxFinal DECIMAL,
  montantFinal DECIMAL,
  dureeFinale INTEGER,
  simulationId INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 🔧 CORRECTIONS NÉCESSAIRES

### 1. **Corriger les données ProduitEligible**
```sql
-- Mettre à jour les montants et taux manquants
UPDATE "ProduitEligible" 
SET 
  montant_min = CASE 
    WHEN nom = 'TICPE' THEN 1000
    WHEN nom = 'DFS' THEN 500
    WHEN nom = 'URSSAF' THEN 2000
    ELSE 1000
  END,
  montant_max = CASE 
    WHEN nom = 'TICPE' THEN 50000
    WHEN nom = 'DFS' THEN 20000
    WHEN nom = 'URSSAF' THEN 100000
    ELSE 100000
  END,
  taux_min = CASE 
    WHEN nom = 'TICPE' THEN 0.1
    WHEN nom = 'DFS' THEN 0.05
    WHEN nom = 'URSSAF' THEN 0.2
    ELSE 0.1
  END,
  taux_max = CASE 
    WHEN nom = 'TICPE' THEN 0.5
    WHEN nom = 'DFS' THEN 0.4
    WHEN nom = 'URSSAF' THEN 0.8
    ELSE 0.5
  END
WHERE montant_min IS NULL OR taux_min IS NULL;
```

### 2. **Vérifier les question_id dans les règles**
```sql
-- Lister toutes les questions disponibles
SELECT id, texte, type 
FROM "Question" 
ORDER BY id;
```

### 3. **Corriger l'API calculate-eligibility**
- Vérifier que l'endpoint fonctionne
- S'assurer que les réponses sont bien formatées
- Implémenter la logique de calcul correcte

### 4. **Corriger l'affichage frontend**
- Vérifier que `showResults` se déclenche
- S'assurer que les données sont bien formatées
- Implémenter la gestion d'erreurs

## 🚀 PLAN D'ACTION

1. **Corriger les données de base** (ProduitEligible)
2. **Vérifier les règles d'éligibilité** (question_id)
3. **Tester l'API calculate-eligibility**
4. **Corriger l'affichage frontend**
5. **Tester le flux complet**

## 📋 PROCHAINES ÉTAPES

1. Exécuter les corrections SQL
2. Tester l'API avec une simulation réelle
3. Vérifier l'affichage des résultats
4. Valider le flux complet
