# 📋 GUIDE D'UTILISATION - SIMULATEUR TICPE OPTIMISÉ

## 🎯 **Vue d'ensemble**

Le simulateur TICPE de Profitum a été entièrement optimisé avec des données réelles de récupération et des règles de calcul précises basées sur les taux 2024.

---

## 🚀 **Nouvelles Fonctionnalités**

### **1. Calculs Précis**
- **Taux 2024** : Gazole professionnel (0,177€/L), GNR (0,150€/L), Taxi/VTC (0,213€/L)
- **Coefficients véhicules** : Camions >7,5t (100%), 3,5-7,5t (80%), VUL (60%)
- **Usage professionnel** : 100% (1.0), 80-99% (0.9), 60-79% (0.7)

### **2. Benchmarks Réels**
- **Transport marchandises** : 9 000€ (5 camions)
- **Taxi/VTC** : 1 300€ (1 véhicule)
- **BTP** : 12 000€ (15 engins)
- **Agriculture** : 7 500€ (10 tracteurs)

### **3. Évaluation de Maturité Administrative**
- **Cartes carburant** : 20 points
- **Factures nominatives** : 20 points
- **Immatriculation société** : 15 points
- **Déclarations TICPE** : 25 points

---

## 📊 **Questionnaire Optimisé (17 Questions)**

### **Phase 1 : Informations Générales**
1. **Secteur d'activité** (obligatoire)
2. **Chiffre d'affaires annuel** (obligatoire)

### **Phase 2 : Véhicules Professionnels**
3. **Véhicules professionnels** (obligatoire)
4. **Nombre de véhicules** (si oui)
5. **Types de véhicules** (multiple)
6. **Chronotachygraphe** (si véhicules)

### **Phase 3 : Consommation Carburant**
7. **Consommation annuelle** (si véhicules)
8. **Types de carburant** (multiple)
9. **Factures carburant** (si véhicules)

### **Phase 4 : Usage Professionnel**
10. **Pourcentage usage professionnel** (si véhicules)
11. **Kilométrage annuel** (si véhicules)

### **Phase 5 : Maturité Administrative**
12. **Cartes carburant professionnelles** (si véhicules)
13. **Factures nominatives** (si véhicules)
14. **Immatriculation société** (si véhicules)
15. **Déclarations TICPE** (si véhicules)

### **Phase 6 : Informations Complémentaires**
16. **Projets d'optimisation fiscale** (multiple)
17. **Objectifs prioritaires** (multiple)

---

## 🧮 **Formule de Calcul Détaillée**

### **Étape 1 : Vérification d'éligibilité**
```javascript
isEligible = secteur.includes('Transport') || 
             secteur.includes('BTP') || 
             secteur.includes('Agricole') &&
             vehiculesProfessionnels === true &&
             consommationCarburant >= 1000
```

### **Étape 2 : Calcul du montant de base**
```javascript
baseAmount = consommationCarburant × tauxCarburant
```

### **Étape 3 : Application des coefficients**
```javascript
finalAmount = baseAmount × coefficientVehicule × coefficientUsage × correctionTaille
```

### **Étape 4 : Plafonnement**
```javascript
finalAmount = Math.min(finalAmount, 100000) // Plafond 100k€
finalAmount = Math.max(finalAmount, 500)    // Minimum 500€
```

---

## 📈 **Scores et Évaluations**

### **Score d'Éligibilité (0-100)**
- **Secteur d'activité** : 30 points
- **Véhicules professionnels** : 25 points
- **Types de véhicules** : 20 points
- **Consommation carburant** : 15 points
- **Documents disponibles** : 10 points

### **Score de Maturité Administrative (0-100)**
- **Cartes carburant** : 20 points
- **Factures nominatives** : 20 points
- **Immatriculation société** : 15 points
- **Déclarations TICPE** : 25 points

### **Niveau de Confiance**
- **Élevé** (70-100 points) : Données fiables, calcul précis
- **Moyen** (40-69 points) : Données partielles, estimation réaliste
- **Faible** (0-39 points) : Données insuffisantes, estimation approximative

---

## 🎯 **Recommandations Personnalisées**

### **Selon le Score de Maturité**
- **80-100 points** : "Maturité élevée → Récupération optimale"
- **60-79 points** : "Maturité moyenne → Récupération partielle"
- **40-59 points** : "Maturité faible → Accompagnement nécessaire"
- **0-39 points** : "Maturité insuffisante → Formation requise"

### **Selon la Comparaison Benchmark**
- **Au-dessus de la moyenne** : "Votre estimation est supérieure à la moyenne du secteur"
- **En dessous de la moyenne** : "Un audit approfondi pourrait révéler des opportunités"

### **Recommandations Spécifiques**
- **Cartes carburant** : "Misez sur les cartes carburant professionnelles"
- **Factures** : "Améliorez la conservation des factures nominatives"
- **Déclarations** : "Mettez en place des déclarations TICPE régulières"

---

## ⚠️ **Facteurs de Risque**

### **Risques Identifiés**
- **Maturité administrative insuffisante** (< 40 points)
- **Usage professionnel limité** (< 80%)
- **Absence de factures carburant**
- **Secteur à faible performance** (BTP, Agriculture)

### **Actions Correctives**
- Formation administrative
- Mise en place de processus
- Accompagnement expert
- Audit approfondi

---

## 🔧 **Utilisation Technique**

### **Installation**
```bash
# 1. Créer les tables
psql $DATABASE_URL -f server/migrations/20250107_create_ticpe_tables.sql

# 2. Insérer les données
node server/scripts/insert-ticpe-data.js

# 3. Mettre à jour le questionnaire
node server/scripts/insert-ticpe-questionnaire.js

# 4. Tester le simulateur
node server/scripts/test-ticpe-simulator.js
```

### **Script de Mise à Jour Complète**
```bash
chmod +x server/scripts/update-ticpe-simulator.sh
./server/scripts/update-ticpe-simulator.sh
```

### **Intégration dans le Code**
```javascript
import { TICPECalculationEngine } from './services/TICPECalculationEngine';

const engine = new TICPECalculationEngine();
const result = await engine.calculateTICPERecovery(responses);
```

---

## 📊 **Tables de Données**

### **TICPESectors**
- Secteurs d'activité avec performances
- Scores d'éligibilité, documentation, récupération

### **TICPERates**
- Taux de remboursement par carburant
- Historique 2022-2024

### **TICPEVehicleTypes**
- Types de véhicules avec coefficients
- Conditions d'usage et documentation

### **TICPEBenchmarks**
- Benchmarks par secteur et taille
- Données statistiques réelles

### **TICPEAdminMaturity**
- Indicateurs de maturité administrative
- Questions et scoring

---

## 🧪 **Tests et Validation**

### **Cas de Test Inclus**
1. **Transport marchandises** (5 camions) → 9 000€
2. **Taxi/VTC** (1 véhicule) → 1 300€
3. **BTP** (15 engins) → 12 000€
4. **Agriculture** (10 tracteurs) → 7 500€
5. **Non éligible** (Commerce sans véhicules) → 0€

### **Validation des Résultats**
- **Précision** : Tolérance de 30% par rapport aux benchmarks
- **Cohérence** : Vérification des coefficients et formules
- **Robustesse** : Tests avec données manquantes

---

## 🚀 **Optimisations Futures**

### **Intégration de Données Réelles**
- Historique des récupérations clients
- Ajustement des benchmarks
- Affinement des coefficients

### **Améliorations Algorithmiques**
- Machine learning pour les estimations
- Prédiction de la maturité administrative
- Optimisation des recommandations

### **Fonctionnalités Avancées**
- Comparaison sectorielle
- Analyse de tendances
- Alertes d'opportunités

---

## 📞 **Support et Maintenance**

### **Documentation**
- **Documentation complète** : `server/docs/DOCUMENTATION_TICPE_COMPLETE.md`
- **Guide technique** : Ce document
- **Scripts de maintenance** : `server/scripts/`

### **Maintenance**
- **Mise à jour des taux** : Annuelle (janvier)
- **Révision des benchmarks** : Semestrielle
- **Optimisation des algorithmes** : Continue

### **Support**
- **Questions techniques** : Équipe développement
- **Données métier** : Équipe expertise TICPE
- **Optimisations** : Collaboration continue

---

*Guide mis à jour le 7 janvier 2025 - Profitum* 