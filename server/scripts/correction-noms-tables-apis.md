# 🔧 CORRECTION DES NOMS DE TABLES DANS LES APIs

## 📋 **Problème identifié :**
Les APIs utilisent `'Simulation'` (majuscule) mais la table s'appelle `simulations` (minuscule).

## 🎯 **Fichiers à corriger :**

### **1. server/src/routes/simulations.ts**
```typescript
// ❌ AVANT (ligne 241)
.from('Simulation')

// ✅ APRÈS
.from('simulations')
```

### **2. server/src/routes/simulation.ts**
```typescript
// ❌ AVANT (ligne 24)
.from('Simulation')

// ✅ APRÈS
.from('simulations')
```

### **3. server/src/routes/simulationRoutes.ts**
```typescript
// ❌ AVANT (lignes 112, 169, 219)
.from('Simulation')

// ✅ APRÈS
.from('simulations')
```

### **4. server/src/services/simulationProcessor.ts**
```typescript
// ❌ AVANT (lignes 153, 203, 239, 299)
.from('Simulation')

// ✅ APRÈS
.from('simulations')
```

### **5. server/src/services/sessionMigrationService.ts**
```typescript
// ❌ AVANT (lignes 465, 697)
.from('Simulation')

// ✅ APRÈS
.from('simulations')
```

## 🔍 **Autres tables à vérifier :**

### **Tables supprimées lors du dédoublonnage :**
- ❌ `chatbotsimulation` → Supprimée
- ❌ `SimulationProcessed` → Supprimée
- ❌ `TICPESimulationResults` → Supprimée

### **Tables conservées :**
- ✅ `simulations` → Table principale
- ✅ `Client` → Table des clients
- ✅ `notification` → Table des notifications
- ✅ `conversations` → Table des conversations

## 🚀 **Actions à effectuer :**

### **Étape 1 : Corriger les noms de tables**
```bash
# Rechercher toutes les occurrences
grep -r "from('Simulation')" server/src/
grep -r "from('chatbotsimulation')" server/src/
grep -r "from('SimulationProcessed')" server/src/
```

### **Étape 2 : Mettre à jour les types TypeScript**
```typescript
// Dans les fichiers de types
interface Simulation {
  id: string;
  client_id: string; // ✅ Utiliser les noms de colonnes corrects
  session_token: string;
  status: string;
  // ...
}
```

### **Étape 3 : Tester les APIs**
```bash
# Tester la création de simulation
curl -X POST /api/simulations \
  -H "Content-Type: application/json" \
  -d '{"clientId": "...", "type": "eligibility_check"}'

# Tester la récupération de simulations
curl -X GET /api/simulations
```

## ✅ **Vérifications post-correction :**

1. **APIs fonctionnelles** - Toutes les routes répondent correctement
2. **Types cohérents** - Les interfaces TypeScript correspondent aux tables
3. **Données correctes** - Les insertions/récupérations fonctionnent
4. **Performance** - Les index sont utilisés correctement

## 🎯 **Résultat attendu :**
- ✅ APIs alignées avec la structure de base de données
- ✅ Plus d'erreurs de tables inexistantes
- ✅ Workflow simulateur + inscription fonctionnel
- ✅ Performance optimisée 