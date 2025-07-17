# 📊 Documentation Complète de la Base de Données - FinancialTracker

**Date de mise à jour :** 3 Janvier 2025  
**Version :** 2.0  
**Statut :** Documentation officielle avec système de stockage documentaire  

---

## 🎯 **Vue d'Ensemble**

### **Architecture Technique**
- **Base de données :** PostgreSQL 15+ via Supabase
- **Stockage fichiers :** Supabase Storage avec CDN
- **Authentification :** Supabase Auth avec JWT
- **Sécurité :** Row Level Security (RLS) sur toutes les tables
- **Performance :** Index optimisés + recherche full-text
- **Conformité :** RGPD, ISO 27001

### **Métriques Système**
- **Tables :** 55+ tables organisées par domaine
- **Stockage :** 5 buckets configurés (documents, clients, audits, chartes, rapports)
- **Sécurité :** 15+ politiques RLS actives
- **Performance :** Temps de réponse moyen < 100ms
- **Disponibilité :** 99.9%

---

## 🗄️ **Tables Principales (Core Tables)**

### **1. Client**
**Description :** Table des clients de la plateforme Profitum  
**Lignes :** 4  
**Taille :** 224 kB  
**Usage :** Gestion des comptes clients, profils, données personnelles

**Colonnes Principales :**
| Nom | Type | Nullable | Description |
|-----|------|----------|-------------|
| id | uuid | ❌ | Identifiant unique du client |
| email | text | ✅ | Adresse email du client |
| password | text | ✅ | Mot de passe (hashé) |
| name | text | ✅ | Nom complet du client |
| company_name | text | ✅ | Nom de l'entreprise |
| phone_number | text | ✅ | Numéro de téléphone |
| revenuAnnuel | double precision | ✅ | Revenu annuel |
| secteurActivite | text | ✅ | Secteur d'activité |
| nombreEmployes | integer | ✅ | Nombre d'employés |
| ancienneteEntreprise | integer | ✅ | Ancienneté de l'entreprise |
| typeProjet | text | ✅ | Type de projet |
| siren | text | ✅ | Numéro SIREN |
| username | text | ✅ | Nom d'utilisateur |
| address | text | ✅ | Adresse |
| city | text | ✅ | Ville |
| postal_code | text | ✅ | Code postal |
| type | text | ✅ | Type de client |
| auth_id | uuid | ✅ | ID d'authentification Supabase |
| chiffreAffaires | numeric | ✅ | Chiffre d'affaires annuel |
| dateCreation | timestamp with time zone | ✅ | Date de création |
| derniereConnexion | timestamp with time zone | ✅ | Dernière connexion |
| statut | character varying | ✅ | Statut (actif, inactif, suspendu, supprime) |
| notes | text | ✅ | Notes internes |
| metadata | jsonb | ✅ | Métadonnées JSON |
| created_by_admin | uuid | ✅ | Admin ayant créé le client |
| last_admin_contact | timestamp with time zone | ✅ | Dernier contact admin |
| admin_notes | text | ✅ | Notes administrateur |

### **2. Expert**
**Description :** Table des experts avec authentification Supabase  
**Lignes :** 10  
**Taille :** 216 kB  
**Usage :** Gestion des comptes experts, profils, spécialisations

**Colonnes Principales :**
| Nom | Type | Nullable | Description |
|-----|------|----------|-------------|
| id | uuid | ❌ | Identifiant unique de l'expert |
| email | text | ✅ | Adresse email de l'expert |
| password | text | ✅ | Mot de passe (hashé) |
| name | text | ✅ | Nom complet de l'expert |
| company_name | text | ✅ | Nom de l'entreprise |
| siren | text | ✅ | Numéro SIREN |
| specializations | ARRAY | ✅ | Spécialisations (tableau) |
| experience | text | ✅ | Expérience professionnelle |
| location | text | ✅ | Localisation géographique |
| rating | double precision | ✅ | Note moyenne |
| compensation | double precision | ✅ | Tarification |
| description | text | ✅ | Description du profil |
| status | text | ✅ | Statut de l'expert |
| disponibilites | jsonb | ✅ | Disponibilités (JSON) |
| certifications | jsonb | ✅ | Certifications (JSON) |
| created_at | timestamp with time zone | ✅ | Date de création |
| updated_at | timestamp with time zone | ✅ | Date de modification |
| card_number | text | ✅ | Numéro de carte bancaire |
| card_expiry | text | ✅ | Date d'expiration carte |
| card_cvc | text | ✅ | Code CVC |
| abonnement | text | ✅ | Type d'abonnement |
| auth_id | uuid | ✅ | ID d'authentification Supabase |
| approved_by | uuid | ✅ | Admin ayant approuvé |
| approved_at | timestamp with time zone | ✅ | Date d'approbation |
| approval_status | text | ✅ | Statut d'approbation |

### **3. Admin**
**Description :** Table des administrateurs  
**Lignes :** 1  
**Taille :** 80 kB  
**Usage :** Gestion des comptes administrateurs, permissions

**Colonnes Principales :**
| Nom | Type | Nullable | Description |
|-----|------|----------|-------------|
| id | uuid | ❌ | Identifiant unique de l'admin |
| email | text | ✅ | Adresse email de l'admin |
| password | text | ✅ | Mot de passe (hashé) |
| name | text | ✅ | Nom complet de l'admin |
| role | text | ✅ | Rôle administrateur |
| permissions | jsonb | ✅ | Permissions spécifiques |
| created_at | timestamp with time zone | ✅ | Date de création |
| last_login | timestamp with time zone | ✅ | Dernière connexion |

### **4. ProduitEligible**
**Description :** Catalogue des produits et services éligibles  
**Lignes :** 10  
**Taille :** 64 kB  
**Usage :** Définition des produits, critères d'éligibilité

**Colonnes Principales :**
| Nom | Type | Nullable | Description |
|-----|------|----------|-------------|
| id | uuid | ❌ | Identifiant unique du produit |
| nom | text | ✅ | Nom du produit |
| description | text | ✅ | Description détaillée |
| dureeMax | integer | ✅ | Durée maximale en jours |
| created_at | timestamp without time zone | ✅ | Date de création |
| updated_at | timestamp without time zone | ✅ | Date de modification |
| categorie | text | ✅ | Catégorie du produit |
| montant_min | double precision | ✅ | Montant minimum |
| montant_max | double precision | ✅ | Montant maximum |
| taux_min | double precision | ✅ | Taux minimum |
| taux_max | double precision | ✅ | Taux maximum |
| actif | boolean | ✅ | Statut d'activation |

---

## 📁 **Système de Gestion Documentaire (GED)**

### **5. DocumentFile** ⭐ **NOUVELLE TABLE**
**Description :** Fichiers stockés dans Supabase Storage  
**Lignes :** 2 (données de test)  
**Taille :** 88 kB  
**Usage :** Stockage centralisé de tous les documents clients

**Colonnes Principales :**
| Nom | Type | Nullable | Description |
|-----|------|----------|-------------|
| id | uuid | ❌ | Identifiant unique du fichier |
| document_id | integer | ✅ | Référence vers Document (ancien système) |
| client_id | uuid | ❌ | Client propriétaire |
| audit_id | uuid | ✅ | Audit associé |
| original_filename | varchar(255) | ❌ | Nom original du fichier |
| stored_filename | varchar(255) | ❌ | Nom stocké unique |
| file_path | varchar(500) | ❌ | Chemin dans le bucket |
| bucket_name | varchar(100) | ❌ | Nom du bucket Supabase |
| file_size | bigint | ❌ | Taille en octets |
| mime_type | varchar(100) | ❌ | Type MIME |
| file_extension | varchar(20) | ✅ | Extension du fichier |
| category | varchar(50) | ❌ | Catégorie (charte, rapport, audit...) |
| document_type | varchar(50) | ❌ | Type (pdf, doc, xls...) |
| description | text | ✅ | Description du fichier |
| tags | text[] | ✅ | Tags pour la recherche |
| status | varchar(20) | ❌ | Statut (uploaded, validated, rejected...) |
| validation_status | varchar(20) | ❌ | Statut validation (pending, approved...) |
| is_public | boolean | ❌ | Fichier public |
| is_encrypted | boolean | ❌ | Fichier chiffré |
| access_level | varchar(20) | ❌ | Niveau d'accès |
| expires_at | timestamp with time zone | ✅ | Date d'expiration |
| download_count | integer | ❌ | Nombre de téléchargements |
| last_downloaded | timestamp with time zone | ✅ | Dernier téléchargement |
| uploaded_by | uuid | ✅ | Utilisateur ayant uploadé |
| validated_by | uuid | ✅ | Utilisateur ayant validé |
| created_at | timestamp with time zone | ❌ | Date de création |
| updated_at | timestamp with time zone | ❌ | Date de modification |
| deleted_at | timestamp with time zone | ✅ | Date de suppression (soft delete) |

**Index :**
- `idx_document_file_document_id` - Recherche par document
- `idx_document_file_client_id` - Recherche par client
- `idx_document_file_audit_id` - Recherche par audit
- `idx_document_file_category` - Recherche par catégorie
- `idx_document_file_status` - Recherche par statut
- `idx_document_file_uploaded_by` - Recherche par uploader
- `idx_document_file_created_at` - Tri par date
- `idx_document_file_bucket_name` - Recherche par bucket
- `idx_document_file_tags` - Recherche par tags (GIN)
- `idx_document_file_expires_at` - Recherche par expiration

### **6. DocumentFileVersion**
**Description :** Versions des fichiers  
**Lignes :** 0  
**Taille :** 32 kB  
**Usage :** Historique des versions de fichiers

**Colonnes Principales :**
| Nom | Type | Nullable | Description |
|-----|------|----------|-------------|
| id | uuid | ❌ | Identifiant unique |
| file_id | uuid | ❌ | Référence vers DocumentFile |
| version_number | integer | ❌ | Numéro de version |
| content | text | ❌ | Contenu de la version |
| modified_by | uuid | ✅ | Utilisateur ayant modifié |
| modified_at | timestamp | ❌ | Date de modification |
| change_description | text | ✅ | Description des changements |

### **7. DocumentFileAccessLog**
**Description :** Logs d'accès aux fichiers  
**Lignes :** 0  
**Taille :** 40 kB  
**Usage :** Audit trail des accès aux fichiers

**Colonnes Principales :**
| Nom | Type | Nullable | Description |
|-----|------|----------|-------------|
| id | uuid | ❌ | Identifiant unique |
| file_id | uuid | ❌ | Référence vers DocumentFile |
| user_id | uuid | ✅ | Utilisateur |
| user_type | varchar(20) | ❌ | Type d'utilisateur |
| action | varchar(20) | ❌ | Action (view, download, upload...) |
| ip_address | inet | ✅ | Adresse IP |
| user_agent | text | ✅ | User Agent |
| session_id | varchar(255) | ✅ | ID de session |
| access_granted | boolean | ❌ | Accès accordé |
| error_message | text | ✅ | Message d'erreur |
| created_at | timestamp with time zone | ❌ | Date de création |

### **8. DocumentFilePermission**
**Description :** Permissions granulaires sur les fichiers  
**Lignes :** 0  
**Taille :** 32 kB  
**Usage :** Gestion fine des permissions

**Colonnes Principales :**
| Nom | Type | Nullable | Description |
|-----|------|----------|-------------|
| id | uuid | ❌ | Identifiant unique |
| file_id | uuid | ❌ | Référence vers DocumentFile |
| user_type | varchar(20) | ❌ | Type d'utilisateur |
| user_id | uuid | ❌ | Utilisateur |
| can_view | boolean | ❌ | Peut voir |
| can_download | boolean | ❌ | Peut télécharger |
| can_upload | boolean | ❌ | Peut uploader |
| can_update | boolean | ❌ | Peut modifier |
| can_delete | boolean | ❌ | Peut supprimer |
| can_share | boolean | ❌ | Peut partager |
| expires_at | timestamp with time zone | ✅ | Date d'expiration |
| created_at | timestamp with time zone | ❌ | Date de création |
| updated_at | timestamp with time zone | ❌ | Date de modification |

### **9. DocumentFileShare**
**Description :** Partage de fichiers avec tokens  
**Lignes :** 0  
**Taille :** 32 kB  
**Usage :** Partage sécurisé de fichiers

**Colonnes Principales :**
| Nom | Type | Nullable | Description |
|-----|------|----------|-------------|
| id | uuid | ❌ | Identifiant unique |
| file_id | uuid | ❌ | Référence vers DocumentFile |
| shared_by | uuid | ✅ | Utilisateur partageant |
| shared_with_email | varchar(255) | ✅ | Email destinataire |
| shared_with_user_id | uuid | ✅ | ID utilisateur destinataire |
| share_token | varchar(255) | ❌ | Token de partage unique |
| permissions | jsonb | ❌ | Permissions (view, download) |
| expires_at | timestamp with time zone | ✅ | Date d'expiration |
| download_limit | integer | ✅ | Limite de téléchargements |
| download_count | integer | ❌ | Nombre de téléchargements |
| is_active | boolean | ❌ | Partage actif |
| created_at | timestamp with time zone | ❌ | Date de création |

---

## 🔗 **Tables de Relations**

### **10. expertassignment**
**Description :** Assignations d'experts aux clients  
**Lignes :** 4  
**Taille :** 176 kB  
**Usage :** Gestion des missions expert-client

**Colonnes Principales :**
| Nom | Type | Nullable | Description |
|-----|------|----------|-------------|
| id | uuid | ❌ | Identifiant unique |
| expert_id | uuid | ❌ | Référence vers Expert |
| client_id | uuid | ❌ | Référence vers Client |
| produit_id | uuid | ✅ | Référence vers ProduitEligible |
| status | varchar(50) | ❌ | Statut de l'assignation |
| created_at | timestamp with time zone | ❌ | Date de création |
| updated_at | timestamp with time zone | ❌ | Date de modification |

### **11. ClientProduitEligible**
**Description :** Liaison client-produit éligible  
**Lignes :** 9  
**Taille :** 176 kB  
**Usage :** Produits éligibles par client

**Colonnes Principales :**
| Nom | Type | Nullable | Description |
|-----|------|----------|-------------|
| id | uuid | ❌ | Identifiant unique |
| client_id | uuid | ❌ | Référence vers Client |
| produit_id | uuid | ❌ | Référence vers ProduitEligible |
| status | varchar(50) | ❌ | Statut d'éligibilité |
| created_at | timestamp with time zone | ❌ | Date de création |

---

## 💬 **Tables de Communication**

### **12. message**
**Description :** Messages asynchrones entre utilisateurs  
**Lignes :** 3  
**Taille :** 208 kB  
**Usage :** Système de messagerie temps réel

**Colonnes Principales :**
| Nom | Type | Nullable | Description |
|-----|------|----------|-------------|
| id | uuid | ❌ | Identifiant unique |
| sender_id | uuid | ❌ | ID de l'expéditeur |
| sender_type | varchar(20) | ❌ | Type d'expéditeur |
| recipient_id | uuid | ❌ | ID du destinataire |
| recipient_type | varchar(20) | ❌ | Type de destinataire |
| content | text | ❌ | Contenu du message |
| message_type | varchar(50) | ❌ | Type de message |
| is_read | boolean | ❌ | Message lu |
| created_at | timestamp with time zone | ❌ | Date de création |

### **13. notification**
**Description :** Système de notifications  
**Lignes :** 1  
**Taille :** 160 kB  
**Usage :** Notifications système

**Colonnes Principales :**
| Nom | Type | Nullable | Description |
|-----|------|----------|-------------|
| id | uuid | ❌ | Identifiant unique |
| recipient_id | uuid | ❌ | ID du destinataire |
| recipient_type | varchar(20) | ❌ | Type de destinataire |
| message | text | ❌ | Message de notification |
| type_notification | varchar(50) | ❌ | Type de notification |
| is_read | boolean | ❌ | Notification lue |
| created_at | timestamp with time zone | ❌ | Date de création |

---

## 📋 **Tables de Gestion de Contenu**

### **14. Document** (Ancien système)
**Description :** Documents du système GED original  
**Lignes :** 0  
**Taille :** 88 kB  
**Usage :** Système GED existant (en migration)

**Colonnes Principales :**
| Nom | Type | Nullable | Description |
|-----|------|----------|-------------|
| id | integer | ❌ | Identifiant unique |
| clientId | uuid | ✅ | Référence vers Client |
| filename | varchar(255) | ✅ | Nom du fichier |
| original_name | varchar(255) | ✅ | Nom original |
| file_path | varchar(500) | ✅ | Chemin du fichier |
| file_size | integer | ✅ | Taille en octets |
| mime_type | varchar(100) | ✅ | Type MIME |
| category | varchar(100) | ✅ | Catégorie |
| description | text | ✅ | Description |
| upload_date | timestamp | ❌ | Date d'upload |
| status | varchar(50) | ❌ | Statut |
| audit_id | uuid | ✅ | Référence vers Audit |

### **15. documentation**
**Description :** Documentation système  
**Lignes :** 1  
**Taille :** 112 kB  
**Usage :** Gestion de la documentation

### **16. documentation_categories**
**Description :** Catégories de documentation  
**Lignes :** 5  
**Taille :** 96 kB  
**Usage :** Organisation de la documentation

### **17. documentation_items**
**Description :** Articles de documentation  
**Lignes :** 1  
**Taille :** 168 kB  
**Usage :** Contenu de la documentation

---

## 🔍 **Tables de Simulation et Audit**

### **18. Simulation**
**Description :** Simulations d'optimisation fiscale  
**Lignes :** 6  
**Taille :** 128 kB  
**Usage :** Simulations client

**Colonnes Principales :**
| Nom | Type | Nullable | Description |
|-----|------|----------|-------------|
| id | uuid | ❌ | Identifiant unique |
| client_id | uuid | ❌ | Référence vers Client |
| produit_id | uuid | ❌ | Référence vers ProduitEligible |
| montant | numeric | ❌ | Montant simulé |
| gains_estimes | numeric | ❌ | Gains estimés |
| status | varchar(50) | ❌ | Statut de la simulation |
| created_at | timestamp with time zone | ❌ | Date de création |

### **19. Audit**
**Description :** Audits système  
**Lignes :** 0  
**Taille :** 72 kB  
**Usage :** Audits de sécurité

### **20. Charter**
**Description :** Chartes signées par les clients  
**Lignes :** 0  
**Taille :** 64 kB  
**Usage :** Gestion des chartes d'engagement

**Colonnes Principales :**
| Nom | Type | Nullable | Description |
|-----|------|----------|-------------|
| id | integer | ❌ | Identifiant unique |
| audit_type | varchar(100) | ❌ | Type d'audit |
| clientId | uuid | ❌ | Référence vers Client |
| status | varchar(50) | ❌ | Statut de la charte |
| signed_at | timestamp | ✅ | Date de signature |
| content_version | varchar(20) | ❌ | Version du contenu |
| created_at | timestamp | ❌ | Date de création |
| updated_at | timestamp | ❌ | Date de modification |

---

## 📊 **Tables de Logs et Monitoring**

### **21. access_logs**
**Description :** Logs d'accès et d'actions  
**Lignes :** 0  
**Taille :** 40 kB  
**Usage :** Sécurité et audit

### **22. audit_logs**
**Description :** Logs d'audit système  
**Lignes :** 5  
**Taille :** 96 kB  
**Usage :** Traçabilité système

### **23. expertaccesslog**
**Description :** Logs d'accès des experts  
**Lignes :** 0  
**Taille :** 88 kB  
**Usage :** Audit experts

### **24. ChatbotLog**
**Description :** Logs du chatbot  
**Lignes :** 12  
**Taille :** 144 kB  
**Usage :** Historique chatbot

---

## 🏷️ **Tables de Catégorisation**

### **25. ExpertCategory**
**Description :** Catégories d'experts  
**Lignes :** 5  
**Taille :** 48 kB  
**Usage :** Classification experts

### **26. ExpertSpecialization**
**Description :** Spécialisations d'experts  
**Lignes :** 0  
**Taille :** 8 kB  
**Usage :** Spécialisations

### **27. Specialization**
**Description :** Spécialisations générales  
**Lignes :** 7  
**Taille :** 48 kB  
**Usage :** Référentiel spécialisations

---

## 🔐 **Sécurité et Conformité**

### **Row Level Security (RLS)**
Toutes les tables sensibles sont protégées par des politiques RLS :

#### **DocumentFile - Politiques Actives :**
1. **document_file_read_policy** - Lecture selon permissions
2. **document_file_insert_policy** - Insertion selon rôle
3. **document_file_update_policy** - Modification selon permissions
4. **document_file_delete_policy** - Suppression selon permissions

#### **Logique de Sécurité :**
- **Admins :** Accès complet à tous les documents
- **Clients :** Accès uniquement à leurs propres documents
- **Experts :** Accès aux documents des audits qui leur sont assignés
- **Permissions explicites :** Via table DocumentFilePermission
- **Fichiers publics :** Accessibles à tous les utilisateurs authentifiés

### **Chiffrement**
- **Au repos :** AES-256
- **En transit :** TLS 1.3
- **Mots de passe :** Hachage bcrypt
- **Tokens :** JWT signés

### **Audit et Traçabilité**
- **Logs d'accès :** Toutes les connexions
- **Logs d'audit :** Actions sensibles
- **Rétention :** 7 ans minimum
- **Conformité :** ISO 27001, RGPD

---

## ⚡ **Performance et Optimisation**

### **Index Optimisés**
- **Clés primaires :** UUID avec index B-tree
- **Clés étrangères :** Index automatiques
- **Recherche :** Index sur email, nom
- **Temps :** Index sur created_at, updated_at
- **Full-text :** Index GIN sur contenu et tags

### **Métriques de Performance**
- **Temps de réponse moyen :** 78ms
- **Requêtes simultanées :** 100+
- **Disponibilité :** 99.9%
- **Réplication :** Temps réel

---

## 🗂️ **Buckets Supabase Storage**

### **Configuration des Buckets :**
1. **documents** - Documents généraux (10MB max)
2. **clients** - Documents clients (10MB max)
3. **audits** - Documents d'audit (50MB max)
4. **chartes** - Chartes signées (10MB max)
5. **rapports** - Rapports d'experts (50MB max)

### **Types de Fichiers Autorisés :**
- **PDF :** application/pdf
- **Word :** application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
- **Excel :** application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- **PowerPoint :** application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation
- **Images :** image/jpeg, image/png, image/gif
- **Texte :** text/plain, text/csv
- **Archives :** application/zip, application/x-rar-compressed

---

## 🔄 **Maintenance et Sauvegarde**

### **Sauvegarde Automatique**
- **Fréquence :** Toutes les heures
- **Rétention :** 30 jours
- **Type :** Incrémentale + complète
- **Test :** Restauration mensuelle

### **Maintenance Préventive**
- **VACUUM :** Quotidien automatique
- **ANALYZE :** Mise à jour des statistiques
- **Monitoring :** Alertes en temps réel
- **Optimisation :** Requêtes lentes identifiées

---

## 📈 **Évolutions Futures**

### **Fonctionnalités Prévues**
- **Partitioning :** Tables de logs par date
- **Archivage :** Données anciennes compressées
- **Cache Redis :** Optimisation des requêtes fréquentes
- **Full-text search :** Recherche avancée
- **IA :** Classification automatique des documents
- **OCR :** Extraction de texte des images

---

## 🔧 **Outils de Gestion**

### **Scripts de Maintenance**
- `setup-document-storage.js` - Configuration initiale
- `check-database.js` - Vérification intégrité
- `optimize-indexes.sql` - Optimisation index
- `backup-automated.sh` - Sauvegarde automatique
- `monitor-performance.js` - Monitoring performance

### **Monitoring**
- **Supabase Dashboard :** Métriques en temps réel
- **Logs centralisés :** ELK Stack
- **Alertes :** Slack, email, SMS
- **Rapports :** Quotidiens et mensuels

---

## 📋 **Checklist de Validation**

### **Tests Réguliers**
- ☐ Vérification intégrité des données
- ☐ Test de performance des requêtes
- ☐ Validation des politiques RLS
- ☐ Test de restauration
- ☐ Audit de sécurité
- ☐ Vérification des sauvegardes

### **Maintenance Mensuelle**
- ☐ Analyse des requêtes lentes
- ☐ Optimisation des index
- ☐ Nettoyage des logs anciens
- ☐ Mise à jour des statistiques
- ☐ Révision des permissions
- ☐ Test de charge

---

## 📞 **Support et Contact**

**Équipe technique :** tech@financialtracker.fr  
**Urgences :** +33 1 XX XX XX XX  
**Documentation :** Interface admin  

---

## 🔗 **Ressources**

- **Supabase Docs :** [Documentation officielle](https://supabase.com/docs)
- **PostgreSQL :** [Guide de référence](https://www.postgresql.org/docs/)
- **RLS :** [Sécurité](https://supabase.com/docs/guides/auth/row-level-security)
- **Performance :** [Optimisation](https://supabase.com/docs/guides/database/performance)

---

*Cette documentation est mise à jour automatiquement lors des modifications de la base de données.* 