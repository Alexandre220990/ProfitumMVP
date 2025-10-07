# 📊 Mapping des Vues Apporteur - FinancialTracker

## 📅 **Date de Documentation**
7 Octobre 2025

## ✅ **Vérification Préalable**

- ✅ **Table Dossier** : EXISTE
- ✅ **16 vues apporteur** : Disponibles
- ✅ **Backend Railway** : Opérationnel

---

## 🎯 **Vues Utilisables - Classées par Utilisation**

### **Catégorie A : Vues Utilisant Dossier (9 vues)** ✅ UTILISABLES

| # | Vue | Table Principale | Utilise Dossier | Status |
|---|-----|------------------|-----------------|--------|
| 1 | `vue_apporteur_dashboard_principal` | Client + Dossier | ✅ | ✅ ACTIVE |
| 2 | `vue_apporteur_prospects_detaille` | Client + Dossier | ✅ | ✅ ACTIVE |
| 3 | `vue_apporteur_commissions_calculees` | Client + Dossier + ApporteurCommission | ✅ | ⚠️ ApporteurCommission manquante |
| 4 | `vue_apporteur_kpis_globaux` | Client + Dossier + ApporteurCommission | ✅ | ⚠️ ApporteurCommission manquante |
| 5 | `vue_apporteur_objectifs_performance` | Client + Dossier | ✅ | ✅ ACTIVE |
| 6 | `vue_apporteur_statistiques_mensuelles` | Client + Dossier | ✅ | ✅ ACTIVE |
| 7 | `vue_apporteur_sources_prospects` | Client + Dossier | ✅ | ✅ ACTIVE |
| 8 | `vue_apporteur_experts` | Expert + Dossier + Client | ✅ | ✅ ACTIVE |
| 9 | `vue_apporteur_activite_recente` | Client + ClientProduitEligible | ✅ | ✅ ACTIVE |

### **Catégorie B : Vues Sans Dossier (7 vues)** ✅ UTILISABLES

| # | Vue | Table Principale | Utilise Dossier | Status |
|---|-----|------------------|-----------------|--------|
| 1 | `vue_apporteur_agenda` | CalendarEvent | ❌ | ✅ ACTIVE |
| 2 | `vue_apporteur_rendez_vous` | CalendarEvent | ❌ | ✅ ACTIVE |
| 3 | `vue_apporteur_commissions` | ApporteurCommission | ❌ | ⚠️ Table manquante |
| 4 | `vue_apporteur_conversations` | conversations | ❌ | ✅ ACTIVE |
| 5 | `vue_apporteur_notifications` | notification | ❌ | ✅ ACTIVE |
| 6 | `vue_apporteur_produits` | ProduitEligible | ❌ | ✅ ACTIVE |
| 7 | `vue_apporteur_performance_produits` | ClientProduitEligible | ❌ | ✅ ACTIVE |

---

## 🔧 **Mapping Frontend vers Backend**

### **Dashboard Principal** (`/apporteur/dashboard`)
**Vues utilisées :**
- ✅ `vue_apporteur_dashboard_principal` → Route: `GET /api/apporteur/views/dashboard-principal`
- ✅ `vue_apporteur_objectifs_performance` → Route: `GET /api/apporteur/views/objectifs-performance`
- ✅ `vue_apporteur_activite_recente` → Route: `GET /api/apporteur/views/activite-recente`

**Tables impliquées :** Client, Dossier, ApporteurAffaires

---

### **Page Prospects** (`/apporteur/prospects`)
**Vues utilisées :**
- ✅ `vue_apporteur_prospects_detaille` → Route: `GET /api/apporteur/views/prospects-detaille`

**Tables impliquées :** Client, Dossier

---

### **Page Commissions** (`/apporteur/commissions`)
**Vues utilisées :**
- ⚠️ `vue_apporteur_commissions` → Utilise table `ApporteurCommission` (manquante)
- ⚠️ `vue_apporteur_commissions_calculees` → Utilise table `ApporteurCommission` (manquante)
- ✅ **Alternative** : `ProspectConversion` → Route: `GET /api/apporteur/commissions`

**Tables impliquées :** ProspectConversion, Client

---

### **Page Statistiques** (`/apporteur/statistics`)
**Vues utilisées :**
- ✅ `vue_apporteur_statistiques_mensuelles` → Route: `GET /api/apporteur/views/statistiques-mensuelles`
- ✅ `vue_apporteur_kpis_globaux` → Route: `GET /api/apporteur/views/kpis-globaux`
- ✅ `vue_apporteur_sources_prospects` → Route: `GET /api/apporteur/views/sources-prospects`
- ✅ `vue_apporteur_performance_produits` → Route: `GET /api/apporteur/views/performance-produits`

**Tables impliquées :** Client, Dossier, ClientProduitEligible, ProduitEligible

---

### **Page Agenda** (`/apporteur/agenda`)
**Vues utilisées :**
- ✅ `vue_apporteur_agenda` → Route: `GET /api/apporteur/views/agenda`
- ✅ `vue_apporteur_rendez_vous` → Route: `GET /api/apporteur/views/rendez-vous`

**Tables impliquées :** CalendarEvent, Client

---

### **Page Experts** (`/apporteur/experts`)
**Vues utilisées :**
- ✅ `vue_apporteur_experts` → Route: `GET /api/apporteur/views/experts`

**Tables impliquées :** Expert, Dossier, Client

---

### **Page Produits** (`/apporteur/products`)
**Vues utilisées :**
- ✅ `vue_apporteur_produits` → Route: `GET /api/apporteur/produits`
- ✅ Alternative: Table `ProduitEligible` directe

**Tables impliquées :** ProduitEligible

---

### **Page Messagerie** (`/apporteur/messaging`)
**Vues utilisées :**
- ✅ `vue_apporteur_conversations` → Route: `GET /api/apporteur/views/conversations`

**Tables impliquées :** conversations, messages, Client

---

### **Page Notifications**
**Vues utilisées :**
- ✅ `vue_apporteur_notifications` → Route: `GET /api/apporteur/views/notifications`

**Tables impliquées :** notification

---

## ⚠️ **Tables Manquantes**

### **ApporteurCommission** ❌
**Impact :**
- `vue_apporteur_commissions` : Non fonctionnelle
- `vue_apporteur_commissions_calculees` : Partiellement fonctionnelle
- `vue_apporteur_kpis_globaux` : Partiellement fonctionnelle

**Solution temporaire :** Utiliser `ProspectConversion` à la place

**Solution définitive :** Créer la table `ApporteurCommission` ou utiliser `ProspectConversion` partout

---

## 🚀 **Routes Backend à Créer**

### **Routes Prioritaires** 🔥
- ✅ `GET /api/apporteur/views/dashboard-principal`
- ✅ `GET /api/apporteur/views/prospects-detaille`
- ✅ `GET /api/apporteur/views/objectifs-performance`
- ✅ `GET /api/apporteur/views/activite-recente`
- ✅ `GET /api/apporteur/produits`

### **Routes Secondaires** ⚠️
- ⏳ `GET /api/apporteur/views/statistiques-mensuelles`
- ⏳ `GET /api/apporteur/views/performance-produits`
- ⏳ `GET /api/apporteur/views/sources-prospects`
- ⏳ `GET /api/apporteur/views/kpis-globaux`

### **Routes Messagerie** 💬
- ⏳ `GET /api/apporteur/views/conversations`
- ⏳ `GET /api/apporteur/views/notifications`

### **Routes Agenda** 📅
- ⏳ `GET /api/apporteur/views/agenda`
- ⏳ `GET /api/apporteur/views/rendez-vous`

### **Routes Experts** 👥
- ⏳ `GET /api/apporteur/views/experts`

---

## 📊 **Statut d'Implémentation**

| Fonctionnalité | Vues Disponibles | Routes Backend | Status Frontend |
|----------------|------------------|----------------|-----------------|
| Dashboard | 3/3 | ✅ 3/3 | ✅ Actif |
| Prospects | 1/1 | ✅ 1/1 | ✅ Actif |
| Commissions | 0/2 | ⚠️ Fallback | ⚠️ Utilise ProspectConversion |
| Statistiques | 4/4 | ⏳ 0/4 | ⏳ À implémenter |
| Agenda | 2/2 | ⏳ 0/2 | ⏳ À implémenter |
| Experts | 1/1 | ⏳ 0/1 | ✅ Actif (API distincte) |
| Produits | 1/1 | ✅ 1/1 | ✅ Actif |
| Messagerie | 1/1 | ⏳ 0/1 | ⏳ À implémenter |
| Notifications | 1/1 | ⏳ 0/1 | ⏳ À implémenter |

---

## ✅ **Recommandations**

### **Immédiat** 🔥
1. ✅ Activer toutes les vues utilisant la table Dossier
2. ✅ Créer les routes backend manquantes
3. ⚠️ Créer la table `ApporteurCommission` ou continuer avec `ProspectConversion`

### **Court terme** ⚠️
1. Implémenter les routes pour Statistiques
2. Implémenter les routes pour Agenda
3. Implémenter les routes pour Messagerie

### **Moyen terme** 📝
1. Optimiser les requêtes sur les vues
2. Ajouter du caching côté backend
3. Monitoring des performances

---

*Documentation générée le 7 Octobre 2025*  
*Basée sur l'analyse des vues Supabase en production*

