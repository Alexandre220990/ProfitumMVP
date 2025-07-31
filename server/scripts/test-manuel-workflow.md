# 🧪 TEST MANUEL WORKFLOW SIMULATEUR + INSCRIPTION

## 📋 **Objectif**
Vérifier que le dédoublonnage des tables n'a pas cassé le workflow complet d'un utilisateur qui :
1. Fait le simulateur d'éligibilité
2. S'inscrit sur la plateforme
3. Accède à son dashboard

## 🚀 **Étapes de test**

### **Étape 1 : Accès au simulateur**
```
URL: https://votre-domaine.com/simulateur-eligibilite
```

**Actions à effectuer :**
- [ ] Page se charge correctement
- [ ] Écran de bienvenue s'affiche
- [ ] Bouton "Commencer la simulation" fonctionne

### **Étape 2 : Réponses aux questions**
**Questions typiques à répondre :**
- [ ] Secteur d'activité : "Transport"
- [ ] Nombre de véhicules : "5"
- [ ] Type de carburant : "Diesel"
- [ ] Chiffre d'affaires : "500000"
- [ ] Nombre d'employés : "10"

### **Étape 3 : Résultats du simulateur**
**Vérifications :**
- [ ] Page de résultats s'affiche
- [ ] Produits éligibles listés (TICPE, URSSAF, DFS)
- [ ] Économies estimées calculées
- [ ] Bouton "S'inscrire" fonctionne

### **Étape 4 : Inscription**
```
URL: https://votre-domaine.com/register-client
```

**Données de test :**
```
Nom d'utilisateur: test-simulateur
Email: test-simulateur@profitum.fr
Mot de passe: TestPassword123!
Confirmation: TestPassword123!
Nom entreprise: Test Company
Téléphone: 0123456789
Adresse: 123 Test Street
Ville: Test City
Code postal: 75001
SIREN: 123456789
```

**Vérifications :**
- [ ] Formulaire se remplit avec les données du simulateur
- [ ] Validation des champs fonctionne
- [ ] Création du compte réussie
- [ ] Redirection vers le dashboard

### **Étape 5 : Dashboard client**
```
URL: https://votre-domaine.com/dashboard/client/{user_id}
```

**Vérifications :**
- [ ] Dashboard se charge
- [ ] Résultats de simulation affichés
- [ ] Notifications de bienvenue présentes
- [ ] Menu de navigation fonctionnel

## 🔍 **Points critiques à vérifier**

### **Base de données**
```sql
-- Vérifier que l'utilisateur a été créé
SELECT * FROM auth.users WHERE email = 'test-simulateur@profitum.fr';

-- Vérifier que le client a été créé
SELECT * FROM "Client" WHERE email = 'test-simulateur@profitum.fr';

-- Vérifier les notifications
SELECT * FROM notification WHERE user_type = 'client';

-- Vérifier les simulations
SELECT * FROM simulations WHERE session_id LIKE '%test%';
```

### **Logs d'erreur**
- [ ] Pas d'erreurs dans la console navigateur
- [ ] Pas d'erreurs dans les logs serveur
- [ ] Pas d'erreurs dans les logs Supabase

### **Fonctionnalités critiques**
- [ ] ✅ Notifications fonctionnent
- [ ] ✅ Conversations fonctionnent
- [ ] ✅ Simulations fonctionnent
- [ ] ✅ Authentification fonctionne
- [ ] ✅ Dashboard se charge

## 🐛 **Problèmes potentiels et solutions**

### **Si l'inscription échoue :**
1. Vérifier les logs d'erreur
2. Contrôler la table `auth.users`
3. Vérifier les contraintes de base de données

### **Si les notifications ne s'affichent pas :**
1. Vérifier la table `notification`
2. Contrôler les permissions Supabase
3. Vérifier les triggers de notification

### **Si le dashboard ne se charge pas :**
1. Vérifier l'authentification
2. Contrôler les données utilisateur
3. Vérifier les permissions de lecture

## ✅ **Critères de succès**

Le test est réussi si :
- [ ] L'utilisateur peut faire le simulateur complet
- [ ] L'inscription fonctionne sans erreur
- [ ] Le dashboard se charge correctement
- [ ] Les données de simulation sont préservées
- [ ] Les notifications s'affichent
- [ ] Aucune erreur dans les logs

## 📊 **Résultats attendus**

Après le test, vous devriez avoir :
- 1 utilisateur dans `auth.users`
- 1 client dans `"Client"`
- 1+ notifications dans `notification`
- 1+ simulations dans `simulations`
- 1 conversation dans `conversations`

## 🧹 **Nettoyage après test**

```sql
-- Supprimer les données de test
DELETE FROM notification WHERE user_type = 'client' AND email = 'test-simulateur@profitum.fr';
DELETE FROM conversations WHERE client_id IN (SELECT id FROM "Client" WHERE email = 'test-simulateur@profitum.fr');
DELETE FROM simulations WHERE session_id LIKE '%test%';
DELETE FROM "Client" WHERE email = 'test-simulateur@profitum.fr';
DELETE FROM auth.users WHERE email = 'test-simulateur@profitum.fr';
```

---

**Date du test :** 2025-01-05  
**Testeur :** Assistant IA  
**Version :** Post-dédoublonnage 