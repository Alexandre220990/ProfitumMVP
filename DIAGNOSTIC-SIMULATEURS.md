# 🔍 Diagnostic - Systèmes de Simulateurs

## Problème Identifié

Vous avez **PLUSIEURS simulateurs** avec des logiques différentes :

### 1. `UnifiedSimulator.tsx` (Composant)
- Utilise `simulationId` (UUID)
- Sauvegarde dans `simulations.answers` (JSON)
- Appelle `/api/simulations/:id/terminer`
- **Pas de session_token**

### 2. `simulateur-client.tsx` (Page)
- Utilise `session_token` 
- Appelle `/api/simulator/*` endpoints
- Système de migration différent
- **Pour clients connectés**

### 3. `simulateur-eligibilite.tsx` (Page)
- Autre variante
- À vérifier

---

## Questions Critiques

1. **Quel simulateur utilisez-vous réellement ?**
   - URL: `/simulateur-client` → utilise `simulateur-client.tsx`
   - URL: `/simulateur` → utilise quoi ?
   - Composant `<UnifiedSimulator />` → utilisé où ?

2. **Quel endpoint backend est appelé ?**
   - `/api/simulations/*` (simulationRoutes.ts)
   - `/api/simulator/*` (simulator.ts)
   - Les deux sont différents !

3. **Format des réponses**
   - `Record<number, string[]>` (UnifiedSimulator)
   - `Record<string, any>` (simulateur-client)
   - Incompatibilité possible

---

## Solution Proposée

### Option A: Utiliser simulateur-client.tsx (RECOMMANDÉ)

C'est le plus complet et utilise:
- ✅ Session tokens
- ✅ Endpoints `/api/simulator/*`
- ✅ Fonction RPC `calculate_simulator_eligibility`
- ✅ Système de migration intelligent

**À faire:**
1. Vérifier que la fonction RPC existe dans Supabase
2. S'assurer que c'est ce simulateur qui est accessible aux clients
3. Tester le flux complet

### Option B: Corriger UnifiedSimulator (SI c'est celui utilisé)

**À faire:**
1. Débugger pourquoi `answers` arrive vide `{}`
2. Vérifier le format des données envoyées
3. Corriger l'endpoint `/analyser-reponses`

---

## Actions Immédiates


