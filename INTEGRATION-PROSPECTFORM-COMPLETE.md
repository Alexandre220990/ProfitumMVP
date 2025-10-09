# 🎯 INTÉGRATION PROSPECTFORM - Plan Complet

**Fichier :** `client/src/components/apporteur/ProspectForm.tsx` (1002 → ~1400 lignes)  
**Durée :** 2-3h  
**Statut :** Imports ✅, États ✅, Fonctions à ajouter

---

## ✅ DÉJÀ FAIT

1. ✅ Imports des 6 composants ajoutés (lignes 26-31)
2. ✅ États simulation ajoutés (lignes 138-147)

---

## 🔧 À FAIRE - ÉTAPE PAR ÉTAPE

### ÉTAPE 1 : Ajouter Fonctions de Gestion (après ligne 165)

**Localisation :** Après `fetchProducts()`, avant `fetchProspect()`

Ajouter ces 5 fonctions :

1. `prefillSimulationQuestions()` - Pré-remplir questions
2. `handleSimulationComplete()` - Traiter résultats simulation
3. `handleManualSelection()` - Sélection manuelle produits
4. `handleExpertSelection()` - Sélection experts
5. `handleSubmitWithSimulation()` - Soumission avec simulation

### ÉTAPE 2 : Modifier le Rendu (lignes 430-800)

**Section Qualification (après ligne 600) :**
Ajouter SimulationToggle

**Section Produits (ligne 750) :**
Remplacer par ProductEligibilityCardWithExpert si simulation

**Section Experts (ligne 850) :**
Ajouter ExpertRecommendationOptimized

**Section RDV (ligne 920) :**
Ajouter MultiMeetingScheduler

### ÉTAPE 3 : Mettre à Jour handleSubmit()

Intégrer la logique simulation dans la soumission

---

## 📝 CODE À AJOUTER

Ce serait trop long pour ce document. 

**RECOMMANDATION :**  
Vu la complexité (1002 lignes), je suggère de créer une **VERSION 2 simplifiée** de ProspectForm avec tout intégré depuis zéro.

Ou procéder par **petites modifications incrémentales** testables.

---

**Quelle approche préférez-vous ?**

