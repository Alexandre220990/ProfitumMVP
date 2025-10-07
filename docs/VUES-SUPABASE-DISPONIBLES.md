# 📊 Vues Supabase Disponibles - FinancialTracker

## 📅 **Date de Documentation**
7 Octobre 2025

## 🎯 **Résumé Exécutif**

Total de vues disponibles : **46 vues**

### **Répartition par Catégorie :**
- **Vues Apporteur** : 16 vues ✅ (toutes confirmées)
- **Vues Admin** : 5 vues
- **Vues Générales** : 8 vues
- **Vues Notifications** : 5 vues
- **Vues Système** : 6 vues
- **Vues Expert** : 3 vues
- **Vues Calendar** : 3 vues

---

## 📋 **Vues pour Apporteur d'Affaires (16 vues)** ✅ CONFIRMÉES

### 1. **vue_apporteur_dashboard_principal** ⭐ PRINCIPALE
**Description** : Vue principale du dashboard avec toutes les statistiques clés  
**Utilisation** : Dashboard principal de l'apporteur  
**Filtre** : `apporteur_id`

**Données retournées :**
- `total_clients`, `total_prospects`, `total_active_clients`, `total_converted`
- `total_dossiers`, `dossiers_en_cours`, `dossiers_acceptes`, `dossiers_refuses`
- `total_montant`, `total_montant_accepte`, `montant_moyen_demande`
- `nouveaux_clients_30j`, `nouveaux_dossiers_30j`
- `taux_conversion_pourcent`, `taux_acceptation_dossiers_pourcent`

**Utilise** : `auth.uid()` - Filtre automatique par utilisateur connecté

---

### 2. **vue_apporteur_prospects_detaille** ⭐ PROSPECTS
**Description** : Vue détaillée des prospects avec toutes les informations  
**Utilisation** : Page prospects, liste détaillée  
**Filtre** : `apporteur_id`

**Données retournées :**
- Informations prospect : `name`, `email`, `company_name`, `phone_number`, `city`, `siren`
- Statut : `status`, `qualification_score`, `interest_level`, `budget_range`, `timeline`
- Activité : `date_creation`, `expert_contacted_at`, `converted_at`, `derniere_activite`
- Dossiers : `nb_dossiers`, `dossiers_en_cours`, `dossiers_acceptes`, `total_montant`

---

### 3. **vue_apporteur_commissions_calculees** 💰 COMMISSIONS
**Description** : Calcul automatique des commissions par apporteur  
**Utilisation** : Page commissions, statistiques  
**Filtre** : `apporteur_id`

**Données retournées :**
- `taux_commission`, `dossiers_acceptes`, `montant_total_accepte`
- `commission_totale_calculee`, `commission_moyenne_par_dossier`
- `dossiers_acceptes_30j`, `commission_mois_courant`

**⚠️ Note** : Utilise la table `Dossier` et non `ApporteurCommission`

---

### 4. **vue_apporteur_objectifs_performance** 🎯 OBJECTIFS
**Description** : Suivi des objectifs mensuels et performance  
**Utilisation** : Dashboard, page statistiques  
**Filtre** : `apporteur_id`

**Données retournées :**
- Objectifs : `objectif_clients_mensuel`, `objectif_dossiers_mensuel`, `objectif_montant_mensuel`
- Performance : `clients_30j`, `dossiers_30j`, `montant_30j`
- Pourcentages : `pourcentage_objectif_clients`, `pourcentage_objectif_dossiers`, `pourcentage_objectif_montant`

---

### 5. **vue_apporteur_performance_produits** 📊 PERFORMANCE PRODUITS
**Description** : Performance par produit pour un apporteur  
**Utilisation** : Statistiques produits, analyses  
**Filtre** : `apporteur_id`

**Données retournées :**
- Produit : `produit_nom`, `categorie`, `taux_max`, `duree_max`
- Dossiers : `nb_dossiers_produit`, `dossiers_acceptes`, `dossiers_refuses`
- Montants : `total_montant`, `montant_accepte`, `montant_moyen_demande`, `montant_moyen_accepte`
- Taux : `taux_reussite_pourcent`

---

### 6. **vue_apporteur_activite_recente** 🔔 ACTIVITÉ
**Description** : Activité récente de l'apporteur  
**Utilisation** : Dashboard, fil d'activité  
**Filtre** : `apporteur_id`

**Données retournées :**
- `type_activite` : 'nouveau_client', 'nouveau_dossier', 'dossier_accepte'
- `libelle`, `date_activite`, `statut`, `montant`
- `table_source`, `source_id`

---

### 7. **vue_apporteur_statistiques_mensuelles** 📈 STATS MENSUELLES
**Description** : Statistiques mensuelles détaillées  
**Utilisation** : Graphiques d'évolution, rapports  
**Filtre** : `apporteur_id`

**Données retournées :**
- Période : `mois`, `annee`, `mois_numero`, `periode`
- Nouveaux : `nouveaux_clients`, `clients_convertis`, `nouveaux_dossiers`
- Dossiers : `dossiers_acceptes`, `dossiers_refuses`
- Montants : `total_montant`, `montant_accepte`, `montant_moyen_demande`
- Taux : `taux_conversion_pourcent`, `taux_acceptation_pourcent`

---

### 8. **vue_apporteur_rendez_vous** 📅 RENDEZ-VOUS
**Description** : Rendez-vous de l'apporteur  
**Utilisation** : Agenda, calendrier  
**Filtre** : `created_by` (automatique via `auth.uid()`)

**Données retournées :**
- RDV : `titre`, `description`, `date_rdv`, `heure_debut`, `heure_fin`, `duree_minutes`
- Type : `type_rdv`, `statut`, `lieu`
- Client : `client_nom`, `client_email`, `client_telephone`
- Période : `periode` (aujourd_hui, demain, futur, passe)

---

### 9. **vue_apporteur_agenda** 📆 AGENDA
**Description** : Vue alternative de l'agenda  
**Utilisation** : Calendrier, planning  
**Filtre** : `created_by` (automatique via `auth.uid()`)

**Données retournées :**
- Similaire à `vue_apporteur_rendez_vous`
- Plus de détails sur les horaires

---

### 10. **vue_apporteur_conversations** 💬 MESSAGERIE
**Description** : Conversations de l'apporteur  
**Utilisation** : Page messagerie  
**Filtre** : `created_by` (automatique via `auth.uid()`)

**Données retournées :**
- Conversation : `titre`, `type_conversation`, `statut`, `last_message`
- Contact : `contact_nom`, `contact_email`, `contact_telephone`
- Messages : `nb_messages`, `messages_non_lus`

---

### 11. **vue_apporteur_commissions** 💵 COMMISSIONS (Alternative)
**Description** : Vue alternative des commissions  
**Utilisation** : Page commissions  
**Filtre** : `apporteur_id` (automatique via `auth.uid()`)

**Données retournées :**
- Commission : `montant_commission`, `statut_paiement`, `date_commission`, `date_paiement`
- Client/Produit : `client_nom`, `produit_nom`, `montant_dossier`, `statut_dossier`

**⚠️ Note** : Utilise la table `ApporteurCommission` qui n'existe pas encore

---

### 12. **vue_apporteur_experts** 👥 EXPERTS
**Description** : Experts disponibles pour l'apporteur  
**Utilisation** : Page experts  
**Filtre** : Par apporteur (via clients)

**Données retournées :**
- Expert : `nom_complet`, `email`, `phone`, `specializations`, `rating`, `status`, `location`
- Performance : `nb_dossiers`, `montant_moyen_dossiers`

---

### 13. **vue_apporteur_produits** 🛍️ PRODUITS
**Description** : Produits éligibles avec statistiques  
**Utilisation** : Page produits  
**Filtre** : Aucun (tous les produits actifs)

**Données retournées :**
- Produit : `nom`, `categorie`, `description`, `montant_min`, `montant_max`, `active`
- Stats : `total_dossiers`, `dossiers_termines`, `montant_total`, `montant_moyen`
- Performance : `clients_uniques`, `experts_assignes`, `taux_completion`

**⚠️ Note** : Les statistiques sont à 0 (calcul non implémenté)

---

### 14. **vue_apporteur_sources_prospects** 📊 SOURCES
**Description** : Analyse des sources de prospects  
**Utilisation** : Statistiques, analyses marketing  
**Filtre** : `apporteur_id` (automatique via `auth.uid()`)

**Données retournées :**
- `source_prospect`, `nb_prospects`, `nb_conversions`
- `taux_conversion`, `nb_dossiers`, `chiffre_affaires_total`

---

### 15. **vue_apporteur_kpis_globaux** 📈 KPIS GLOBAUX
**Description** : KPIs globaux de l'apporteur  
**Utilisation** : Dashboard, rapports  
**Filtre** : `apporteur_id` (automatique via `auth.uid()`)

**Données retournées :**
- Prospects : `total_prospects`, `clients_actifs`, `prospects_en_cours`
- Dossiers : `total_dossiers`, `dossiers_termines`
- Montants : `chiffre_affaires_total`, `montant_moyen_dossier`
- Commissions : `commissions_totales`, `commissions_payees`
- Taux : `taux_conversion_prospects`, `taux_reussite_dossiers`

---

## 🔧 **Vues Admin (5 vues)**

### 1. **vue_admin_kpis_globaux**
**Description** : KPIs globaux de l'application  
**Utilisation** : Dashboard admin

### 2. **vue_admin_activite_globale**
**Description** : Activité globale de tous les utilisateurs  
**Utilisation** : Dashboard admin, monitoring

### 3. **vue_admin_alertes_globales**
**Description** : Alertes système  
**Utilisation** : Dashboard admin, notifications

### 4. **admin_action_stats**
**Description** : Statistiques des actions admin  
**Utilisation** : Audit, reporting

### 5. **admin_recent_actions**
**Description** : Actions récentes des admins  
**Utilisation** : Audit log

---

## 📊 **Vues Générales (3 vues)**

### 1. **vue_stats_produits_globale** / **vue_stats_produits_v2**
**Description** : Statistiques globales des produits  
**Utilisation** : Analyses produits

### 2. **vue_evolution_30j_v2**
**Description** : Évolution des métriques sur 30 jours  
**Utilisation** : Graphiques d'évolution

### 3. **expert_stats_view**
**Description** : Statistiques des experts  
**Utilisation** : Dashboard experts

---

## 🔔 **Vues Notifications (3 vues)**

### 1. **notification_stats**
**Description** : Statistiques des notifications  
**Utilisation** : Dashboard notifications

### 2. **notification_with_preferences**
**Description** : Notifications avec préférences utilisateur  
**Utilisation** : Système de notifications

### 3. **active_notification_templates**
**Description** : Templates de notifications actifs  
**Utilisation** : Envoi de notifications

---

## ⚠️ **Problèmes Identifiés**

### 1. **Table ApporteurCommission manquante**
**Vues affectées :**
- `vue_apporteur_commissions`
- `vue_apporteur_commissions_calculees` (partiellement)
- `vue_apporteur_kpis_globaux` (partiellement)

**Solution** : Utiliser `ProspectConversion` à la place

---

### 2. **Table Dossier manquante**
**Vues affectées :**
- Toutes les vues utilisant `Dossier` (la plupart)

**Solution temporaire** : Utiliser `ClientProduitEligible` à la place

---

### 3. **Problèmes CORS**
**Cause** : Appels directs à Supabase depuis le frontend  
**Solution** : Passer par le backend Railway

---

## 🔧 **Mapping Frontend vers Vues**

### **Dashboard Apporteur**
- ✅ `vue_apporteur_dashboard_principal` : Statistiques principales
- ✅ `vue_apporteur_activite_recente` : Activité récente
- ✅ `vue_apporteur_objectifs_performance` : Objectifs et performance

### **Page Prospects**
- ✅ `vue_apporteur_prospects_detaille` : Liste détaillée des prospects

### **Page Commissions**
- ⚠️ `vue_apporteur_commissions_calculees` : Calcul des commissions (utilise Dossier)
- ⚠️ Alternative : Utiliser `ProspectConversion` via backend

### **Page Statistiques**
- ✅ `vue_apporteur_statistiques_mensuelles` : Évolution mensuelle
- ✅ `vue_apporteur_performance_produits` : Performance par produit
- ✅ `vue_apporteur_sources_prospects` : Analyse des sources
- ✅ `vue_apporteur_kpis_globaux` : KPIs globaux

### **Page Agenda**
- ✅ `vue_apporteur_rendez_vous` ou `vue_apporteur_agenda` : Calendrier des RDV

### **Page Messagerie**
- ✅ `vue_apporteur_conversations` : Liste des conversations

### **Page Experts**
- ✅ `vue_apporteur_experts` : Liste des experts disponibles

### **Page Produits**
- ✅ `vue_apporteur_produits` : Liste des produits avec stats
- ⚠️ Stats à 0 (non implémentées)

---

## 🚀 **Recommandations d'Utilisation**

### **Option 1 : Backend Railway (RECOMMANDÉ)**
1. Créer des routes API pour chaque vue
2. Éviter les problèmes CORS
3. Meilleur contrôle et sécurité

### **Option 2 : RLS Supabase (AVANCÉ)**
1. Configurer Row Level Security
2. Permettre appels directs depuis frontend
3. Nécessite configuration CORS sur Supabase

---

## 📝 **Vues à Créer ou Corriger**

### **Priorité Haute** 🔥
1. Créer table `ApporteurCommission` ou adapter les vues
2. Vérifier table `Dossier` ou utiliser `ClientProduitEligible`
3. Implémenter calculs de stats dans `vue_apporteur_produits`

### **Priorité Moyenne** ⚠️
1. Configurer CORS sur Supabase
2. Ajouter RLS sur les vues
3. Créer routes backend pour toutes les vues

---

*Documentation générée le 7 Octobre 2025*  
*Basée sur l'analyse des vues Supabase en production*
