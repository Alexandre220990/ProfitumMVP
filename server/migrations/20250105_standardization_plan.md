# 📋 PLAN DE STANDARDISATION DES CONVENTIONS

## 🎯 OBJECTIF
Standardiser toutes les conventions de nommage pour une cohérence parfaite frontend-backend.

## 📊 ÉTAT ACTUEL

### ✅ Tables déjà standardisées :
- **CalendarEvent** : 100% snake_case
- **simulations** : 100% snake_case  
- **GEDDocument** : 100% snake_case
- **admin_documents** : 100% lowercase
- **SimulationProcessed** : 100% lowercase

### ⚠️ Tables à standardiser :

#### **Client** (33 colonnes)
- **8 colonnes camelCase** : `ancienneteEntreprise`, `chiffreAffaires`, `dateCreation`, `dateSimulation`, `derniereConnexion`, `nombreEmployes`, `revenuAnnuel`, `secteurActivite`, `simulationId`, `typeProjet`
- **25 colonnes snake_case** : ✅ OK

#### **Expert** (36 colonnes)
- **20 colonnes snake_case** : ✅ OK
- **16 colonnes lowercase** : ✅ OK

#### **Audit** (20 colonnes)
- **4 colonnes camelCase** : `clientId`, `dateDebut`, `dateFin`, `expertId`
- **16 colonnes snake_case** : ✅ OK

#### **ClientProduitEligible** (20 colonnes)
- **8 colonnes camelCase** : `clientId`, `dateEligibilite`, `dureeFinale`, `montantFinal`, `produitId`, `sessionId`, `simulationId`, `tauxFinal`
- **12 colonnes snake_case** : ✅ OK

#### **Dossier** (9 colonnes)
- **2 colonnes camelCase** : `clientId`, `expertId`
- **7 colonnes lowercase** : ✅ OK

## 🚀 PLAN D'ACTION

### **PHASE 1 : Corrections critiques (URGENT)**
1. ✅ Corriger l'alignement Document
2. ✅ Corriger la clé étrangère CalendarEvent.created_by

### **PHASE 2 : Standardisation progressive (MOYEN TERME)**

#### **Option A : Migration complète vers snake_case**
- Avantages : Cohérence avec les nouvelles tables
- Inconvénients : Breaking changes majeurs

#### **Option B : Maintenir les conventions existantes**
- Avantages : Pas de breaking changes
- Inconvénients : Incohérence permanente

#### **Option C : Standardisation hybride**
- Nouvelles tables : snake_case
- Tables existantes : Maintenir camelCase
- Avantages : Équilibre entre cohérence et stabilité

## 📋 RECOMMANDATION

**Option C (Hybride)** pour l'instant :
1. Maintenir les conventions existantes pour éviter les breaking changes
2. Standardiser toutes les nouvelles tables en snake_case
3. Documenter clairement les conventions par table
4. Planifier une migration complète dans une version majeure future

## 🎯 PROCHAINES ÉTAPES

1. **Exécuter les corrections critiques**
2. **Créer une documentation des conventions**
3. **Mettre en place des règles de validation**
4. **Planifier la migration complète** 