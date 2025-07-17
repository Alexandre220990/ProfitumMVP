# 📊 Documentation Base de Données - Profitum

**Version :** 1.0  
**Date :** 2025-01-03  
**Auteur :** Équipe Technique Profitum  

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Tables Principales](#tables-principales)
3. [Tables de Communication](#tables-de-communication)
4. [Tables d'Audit & Suivi](#tables-daudit--suivi)
5. [Tables de Simulation](#tables-de-simulation)
6. [Tables de Gestion Documentaire](#tables-de-gestion-documentaire)
7. [Tables Système](#tables-système)
8. [Relations & Clés Étrangères](#relations--clés-étrangères)
9. [Index & Performance](#index--performance)
10. [Sécurité & RLS](#sécurité--rls)

---

## 🎯 Vue d'ensemble

### Base de Données : Supabase PostgreSQL
- **Environnement :** Production
- **Version PostgreSQL :** 15+
- **Extensions :** Supabase Auth, Storage, Realtime
- **Conformité :** RGPD, ISO 27001

### Architecture
- **Schéma :** `public`
- **Tables :** 50+ tables
- **Fonctions :** RPC, Triggers, Policies
- **Monitoring :** Logs d'accès, Métriques système

---

## 👥 Tables Principales

### 1. Client
**Description :** Table des clients de la plateforme Profitum  
**Lignes :** 4  
**Taille :** 224 kB  
**Usage :** Gestion des comptes clients, profils, données personnelles

**Colonnes :**
| Nom | Type | Nullable | Description |
|-----|------|----------|-------------|
| id | uuid | ❌ | Identifiant unique du client |
| email | text | ✅ | Adresse email du client |
| password | text | ✅ | Mot de passe (hashé) |
| name | text | ✅ | Nom complet du client |
| company_name | text | ✅ | Nom de l'entreprise |
| phone_number | text | ✅ | Numéro de téléphone |
| revenuAnnuel | double precision | ✅ | Revenu annuel |
| secteurActivite | text | ✅ | Secteur d'activité de l'entreprise |
| nombreEmployes | integer | ✅ | Nombre d'employés de l'entreprise |
| ancienneteEntreprise | integer | ✅ | Ancienneté de l'entreprise |
| typeProjet | text | ✅ | Type de projet |
| dateSimulation | timestamp without time zone | ✅ | Date de simulation |
| created_at | timestamp without time zone | ✅ | Date de création |
| updated_at | timestamp without time zone | ✅ | Date de modification |
| simulationId | integer | ✅ | ID de simulation |
| siren | text | ✅ | Numéro SIREN |
| username | text | ✅ | Nom d'utilisateur |
| address | text | ✅ | Adresse |
| city | text | ✅ | Ville |
| postal_code | text | ✅ | Code postal |
| type | text | ✅ | Type de client |
| auth_id | uuid | ✅ | ID d'authentification Supabase |
| chiffreAffaires | numeric | ✅ | Chiffre d'affaires annuel en euros |
| dateCreation | timestamp with time zone | ✅ | Date de création |
| derniereConnexion | timestamp with time zone | ✅ | Dernière connexion |
| statut | character varying | ✅ | Statut du client (actif, inactif, suspendu, supprime) |
| notes | text | ✅ | Notes internes |
| metadata | jsonb | ✅ | Métadonnées JSON |
| created_by_admin | uuid | ✅ | Admin ayant créé le client |
| last_admin_contact | timestamp with time zone | ✅ | Dernier contact admin |
| admin_notes | text | ✅ | Notes administrateur |

### 2. Expert
**Description :** Table des experts avec authentification Supabase  
**Lignes :** 10  
**Taille :** 216 kB  
**Usage :** Gestion des comptes experts, profils, spécialisations

**Colonnes :**
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

### 3. Admin
**Description :** Table des administrateurs  
**Lignes :** 1  
**Taille :** 80 kB  
**Usage :** Gestion des comptes administrateurs, permissions

**Colonnes :** [À compléter]

### 4. ProduitEligible
**Description :** Catalogue des produits et services éligibles  
**Lignes :** 10  
**Taille :** 64 kB  
**Usage :** Définition des produits, critères d'éligibilité

**Colonnes :**
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
| duree_min | integer | ✅ | Durée minimum en jours |
| duree_max | integer | ✅ | Durée maximum en jours |

### 5. ClientProduitEligible
**Description :** Association clients-produits éligibles  
**Lignes :** 9  
**Taille :** 208 kB  
**Usage :** Gestion des éligibilités clients, marketplace

**Colonnes :**
| Nom | Type | Nullable | Description |
|-----|------|----------|-------------|
| id | uuid | ❌ | Identifiant unique de l'association |
| clientId | uuid | ✅ | ID du client |
| produitId | uuid | ✅ | ID du produit éligible |
| statut | text | ✅ | Statut de l'éligibilité |
| tauxFinal | double precision | ✅ | Taux final calculé |
| montantFinal | double precision | ✅ | Montant final calculé |
| dureeFinale | integer | ✅ | Durée finale en jours |
| created_at | timestamp with time zone | ✅ | Date de création |
| updated_at | timestamp with time zone | ✅ | Date de modification |
| simulationId | bigint | ✅ | ID de la simulation associée |
| metadata | jsonb | ✅ | Métadonnées JSON |
| notes | text | ✅ | Notes internes |
| priorite | integer | ✅ | Priorité de traitement |
| dateEligibilite | timestamp with time zone | ✅ | Date d'éligibilité |
| current_step | integer | ✅ | Étape actuelle du processus (0-5) |
| progress | integer | ✅ | Pourcentage d'avancement (0-100) |
| expert_id | uuid | ✅ | ID de l'expert assigné |
| charte_signed | boolean | ✅ | Charte signée ou non |
| charte_signed_at | timestamp with time zone | ✅ | Date de signature de la charte |

### 6. expertassignment
**Description :** Assignations d'experts aux clients pour la marketplace  
**Lignes :** 4  
**Taille :** 176 kB  
**Usage :** Gestion des assignations, workflow client-expert

**Colonnes :**
| Nom | Type | Nullable | Description |
|-----|------|----------|-------------|
| id | uuid | ❌ | Identifiant unique de l'assignation |
| expert_id | uuid | ✅ | ID de l'expert assigné |
| client_id | uuid | ✅ | ID du client |
| produit_id | uuid | ✅ | ID du produit éligible |
| status | character varying | ✅ | Statut de l'assignation |
| assignment_date | timestamp with time zone | ✅ | Date d'assignation |
| accepted_date | timestamp with time zone | ✅ | Date d'acceptation |
| completed_date | timestamp with time zone | ✅ | Date de finalisation |
| client_rating | integer | ✅ | Note du client |
| client_feedback | text | ✅ | Retour client |
| expert_rating | integer | ✅ | Note de l'expert |
| expert_feedback | text | ✅ | Retour expert |
| compensation_amount | numeric | ✅ | Montant de compensation |
| compensation_status | character varying | ✅ | Statut du paiement |
| payment_date | timestamp with time zone | ✅ | Date de paiement |
| notes | text | ✅ | Notes internes |
| created_at | timestamp with time zone | ✅ | Date de création |
| updated_at | timestamp with time zone | ✅ | Date de modification |
| compensation_percentage | numeric | ✅ | Pourcentage de commission de l'expert (ex: 15.00 pour 15%) |
| estimated_duration_days | integer | ✅ | Durée estimée de la mission en jours |
| actual_duration_days | integer | ✅ | Durée réelle de la mission en jours |
| priority | character varying | ✅ | Priorité de la mission (low, normal, high, urgent) |

### 7. ChartesProduits
**Description :** Charte de produits et conditions  
**Lignes :** 0  
**Taille :** 32 kB  
**Usage :** Gestion des chartes, signature électronique

**Colonnes :** [À compléter]

### 8. client_charte_signature
**Description :** Signatures de charte par les clients  
**Lignes :** 2  
**Taille :** 112 kB  
**Usage :** Traçabilité des signatures, conformité

**Colonnes :** [À compléter]

---

## 💬 Tables de Communication

### 9. message
**Description :** Messages asynchrones entre clients, experts et admins  
**Lignes :** 3  
**Taille :** 208 kB  
**Usage :** Messagerie temps réel, conversations

**Colonnes :**
| Nom | Type | Nullable | Description |
|-----|------|----------|-------------|
| id | uuid | ❌ | Identifiant unique du message |
| assignment_id | uuid | ✅ | ID de l'assignation liée |
| sender_type | character varying | ✅ | Type d'expéditeur (client, expert, admin) |
| sender_id | uuid | ✅ | ID de l'expéditeur |
| recipient_type | character varying | ✅ | Type de destinataire (client, expert, admin) |
| recipient_id | uuid | ✅ | ID du destinataire |
| subject | character varying | ✅ | Sujet du message |
| content | text | ✅ | Contenu du message |
| message_type | character varying | ✅ | Type de message (text, file, system) |
| attachments | jsonb | ✅ | Pièces jointes (JSON) |
| is_read | boolean | ✅ | Message lu ou non |
| read_at | timestamp with time zone | ✅ | Date de lecture |
| is_urgent | boolean | ✅ | Message urgent |
| priority | character varying | ✅ | Priorité du message |
| status | character varying | ✅ | Statut du message |
| parent_message_id | uuid | ✅ | ID du message parent (réponse) |
| thread_id | uuid | ✅ | ID du fil de conversation |
| created_at | timestamp with time zone | ✅ | Date de création |
| updated_at | timestamp with time zone | ✅ | Date de modification |

### 10. notification
**Description :** Système de notifications pour clients, experts et admins  
**Lignes :** 1  
**Taille :** 160 kB  
**Usage :** Notifications push, emails, alertes

**Colonnes :**
| Nom | Type | Nullable | Description |
|-----|------|----------|-------------|
| id | uuid | ❌ | Identifiant unique de la notification |
| user_id | uuid | ✅ | ID de l'utilisateur destinataire |
| user_type | character varying | ✅ | Type d'utilisateur (client, expert, admin) |
| title | character varying | ✅ | Titre de la notification |
| message | text | ✅ | Contenu de la notification |
| notification_type | character varying | ✅ | Type de notification (info, warning, error, success) |
| priority | character varying | ✅ | Priorité (low, medium, high, urgent) |
| is_read | boolean | ✅ | Notification lue ou non |
| read_at | timestamp with time zone | ✅ | Date de lecture |
| action_url | text | ✅ | URL d'action associée |
| action_data | jsonb | ✅ | Données d'action (JSON) |
| expires_at | timestamp with time zone | ✅ | Date d'expiration |
| is_dismissed | boolean | ✅ | Notification rejetée |
| dismissed_at | timestamp with time zone | ✅ | Date de rejet |
| created_at | timestamp with time zone | ✅ | Date de création |
| updated_at | timestamp with time zone | ✅ | Date de modification |

### 11. Appointment
**Description :** Rendez-vous et planification  
**Lignes :** 0  
**Taille :** 48 kB  
**Usage :** Calendrier, planification client-expert

**Colonnes :** [À compléter]

---

## 🔍 Tables d'Audit & Suivi

### 12. Audit
**Description :** Audits et contrôles  
**Lignes :** 0  
**Taille :** 72 kB  
**Usage :** Processus d'audit, validation

**Colonnes :** [À compléter]

### 13. ValidationState
**Description :** États de validation  
**Lignes :** 1  
**Taille :** 80 kB  
**Usage :** Workflow de validation, états

**Colonnes :** [À compléter]

### 14. access_logs
**Description :** Logs d'accès et d'actions des utilisateurs pour audit et sécurité  
**Lignes :** 0  
**Taille :** 40 kB  
**Usage :** Audit de sécurité, traçabilité

**Colonnes :** [À compléter]

### 15. audit_logs
**Description :** Logs d'audit système  
**Lignes :** 5  
**Taille :** 96 kB  
**Usage :** Audit système, conformité

**Colonnes :** [À compléter]

### 16. AdminAuditLog
**Description :** Logs d'audit administrateurs  
**Lignes :** 13  
**Taille :** 32 kB  
**Usage :** Audit admin, actions critiques

**Colonnes :** [À compléter]

### 17. expertaccesslog
**Description :** Logs d'accès et d'activité des experts pour audit et sécurité  
**Lignes :** 0  
**Taille :** 88 kB  
**Usage :** Audit experts, sécurité

**Colonnes :** [À compléter]

---

## 🧮 Tables de Simulation

### 18. Simulation
**Description :** Table des simulations d'optimisation fiscale  
**Lignes :** 6  
**Taille :** 128 kB  
**Usage :** Calculs fiscaux, optimisations

**Colonnes :** [À compléter]

### 19. SimulationProcessed
**Description :** Simulations traitées  
**Lignes :** 0  
**Taille :** 32 kB  
**Usage :** Résultats de simulation

**Colonnes :** [À compléter]

### 20. SimulationResult
**Description :** Résultats de simulation  
**Lignes :** 0  
**Taille :** 16 kB  
**Usage :** Stockage des résultats

**Colonnes :** [À compléter]

---

## 📁 Tables de Gestion Documentaire

### 21. Document
**Description :** Documents système  
**Lignes :** 0  
**Taille :** 16 kB  
**Usage :** Gestion documentaire

**Colonnes :** [À compléter]

### 22. Dossier
**Description :** Dossiers clients  
**Lignes :** 0  
**Taille :** 16 kB  
**Usage :** Organisation des dossiers

**Colonnes :** [À compléter]

### 23. GEDDocument
**Description :** Documents GED  
**Lignes :** 0  
**Taille :** 88 kB  
**Usage :** Gestion électronique des documents

**Colonnes :** [À compléter]

### 24. GEDDocumentLabel
**Description :** Labels des documents GED  
**Lignes :** 17  
**Taille :** 80 kB  
**Usage :** Catégorisation documents

**Colonnes :** [À compléter]

### 25. GEDDocumentLabelRelation
**Description :** Relations labels-documents GED  
**Lignes :** 0  
**Taille :** 24 kB  
**Usage :** Association labels-documents

**Colonnes :** [À compléter]

### 26. GEDDocumentPermission
**Description :** Permissions documents GED  
**Lignes :** 0  
**Taille :** 48 kB  
**Usage :** Contrôle d'accès documents

**Colonnes :** [À compléter]

### 27. GEDDocumentVersion
**Description :** Versions documents GED  
**Lignes :** 0  
**Taille :** 56 kB  
**Usage :** Versioning documents

**Colonnes :** [À compléter]

### 28. GEDUserDocumentFavorite
**Description :** Favoris documents utilisateurs  
**Lignes :** 0  
**Taille :** 32 kB  
**Usage :** Documents favoris

**Colonnes :** [À compléter]

---

## ⚙️ Tables Système

### 29. authenticated_users
**Description :** Utilisateurs authentifiés  
**Lignes :** -  
**Taille :** -  
**Usage :** Gestion authentification

**Colonnes :** [À compléter]

### 30. availability_metrics
**Description :** Métriques de disponibilité  
**Lignes :** 0  
**Taille :** 16 kB  
**Usage :** Monitoring disponibilité

**Colonnes :** [À compléter]

### 31. health_checks
**Description :** Contrôles de santé système  
**Lignes :** 4  
**Taille :** 64 kB  
**Usage :** Monitoring système

**Colonnes :** [À compléter]

### 32. system_metrics
**Description :** Métriques système  
**Lignes :** 9 742  
**Taille :** 1952 kB  
**Usage :** Performance monitoring

**Colonnes :** [À compléter]

### 33. system_alerts
**Description :** Alertes système  
**Lignes :** 0  
**Taille :** 32 kB  
**Usage :** Alertes monitoring

**Colonnes :** [À compléter]

### 34. security_incidents
**Description :** Incidents de sécurité  
**Lignes :** 0  
**Taille :** 32 kB  
**Usage :** Gestion incidents

**Colonnes :** [À compléter]

### 35. security_vulnerabilities
**Description :** Vulnérabilités de sécurité  
**Lignes :** 0  
**Taille :** 16 kB  
**Usage :** Suivi vulnérabilités

**Colonnes :** [À compléter]

### 36. compliance_reports
**Description :** Rapports de conformité  
**Lignes :** 0  
**Taille :** 16 kB  
**Usage :** Conformité RGPD

**Colonnes :** [À compléter]

### 37. iso_reports
**Description :** Rapports ISO  
**Lignes :** 9  
**Taille :** 80 kB  
**Usage :** Conformité ISO

**Colonnes :** [À compléter]

### 38. performance_tests
**Description :** Tests de performance  
**Lignes :** 0  
**Taille :** 16 kB  
**Usage :** Tests performance

**Colonnes :** [À compléter]

### 39. terminal_logs
**Description :** Logs terminal  
**Lignes :** 10  
**Taille :** 80 kB  
**Usage :** Debug système

**Colonnes :** [À compléter]

---

## 🔗 Tables de Relations & Spécialisations

### 40. ExpertSpecialization
**Description :** Spécialisations des experts  
**Lignes :** 0  
**Taille :** 8192 bytes  
**Usage :** Compétences experts

**Colonnes :** [À compléter]

### 41. Specialization
**Description :** Catalogue des spécialisations  
**Lignes :** 7  
**Taille :** 48 kB  
**Usage :** Définition spécialisations

**Colonnes :** [À compléter]

### 42. ExpertCategory
**Description :** Catégories d'experts  
**Lignes :** 5  
**Taille :** 48 kB  
**Usage :** Classification experts

**Colonnes :** [À compléter]

### 43. expertcriteria
**Description :** Critères de recherche et de recommandation pour les experts  
**Lignes :** 5  
**Taille :** 152 kB  
**Usage :** Algorithme de matching

**Colonnes :** [À compléter]

### 44. expertcampaign
**Description :** Campagnes de promotion et de mise en avant des experts  
**Lignes :** 0  
**Taille :** 56 kB  
**Usage :** Marketing experts

**Colonnes :** [À compléter]

### 45. promotionbanner
**Description :** Bannières promotionnelles pour la marketplace des experts  
**Lignes :** 0  
**Taille :** 64 kB  
**Usage :** Marketing marketplace

**Colonnes :** [À compléter]

---

## 📝 Tables de Contenu

### 46. Question
**Description :** Questions système  
**Lignes :** 5  
**Taille :** 80 kB  
**Usage :** Questionnaires

**Colonnes :** [À compléter]

### 47. Question_VERSION_FINALE_60Q
**Description :** Version finale des questions (duplicate)  
**Lignes :** 61  
**Taille :** 80 kB  
**Usage :** Questions finales

**Colonnes :** [À compléter]

### 48. QuestionExploration
**Description :** Questions d'exploration  
**Lignes :** 20  
**Taille :** 64 kB  
**Usage :** Découverte client

**Colonnes :** [À compléter]

### 49. Reponse
**Description :** Réponses aux questions  
**Lignes :** 0  
**Taille :** 32 kB  
**Usage :** Stockage réponses

**Colonnes :** [À compléter]

### 50. Plan
**Description :** Plans et stratégies  
**Lignes :** 3  
**Taille :** 48 kB  
**Usage :** Plans clients

**Colonnes :** [À compléter]

### 51. EligibilityChanges
**Description :** Changements d'éligibilité  
**Lignes :** 0  
**Taille :** 32 kB  
**Usage :** Historique éligibilités

**Colonnes :** [À compléter]

### 52. Notification
**Description :** Notifications système (duplicate)  
**Lignes :** 0  
**Taille :** 16 kB  
**Usage :** Notifications

**Colonnes :** [À compléter]

### 53. ChatbotLog
**Description :** Logs chatbot  
**Lignes :** 12  
**Taille :** 144 kB  
**Usage :** IA conversationnelle

**Colonnes :** [À compléter]

### 54. chatbotsimulation
**Description :** Simulations chatbot  
**Lignes :** 0  
**Taille :** 32 kB  
**Usage :** Tests chatbot

**Colonnes :** [À compléter]

### 55. documentation
**Description :** Table de liaison pour les interactions utilisateurs avec la documentation  
**Lignes :** 1  
**Taille :** 112 kB  
**Usage :** Documentation utilisateur

**Colonnes :** [À compléter]

### 56. documentation_categories
**Description :** Catégories pour organiser la documentation  
**Lignes :** 5  
**Taille :** 96 kB  
**Usage :** Organisation documentation

**Colonnes :** [À compléter]

### 57. documentation_items
**Description :** Articles et éléments de documentation  
**Lignes :** 1  
**Taille :** 168 kB  
**Usage :** Contenu documentation

**Colonnes :** [À compléter]

---

## 🔗 Relations & Clés Étrangères

[À compléter avec les relations identifiées]

---

## 📈 Index & Performance

[À compléter avec les index existants]

---

## 🔒 Sécurité & RLS

[À compléter avec les politiques RLS]

---

## 📊 Statistiques Globales

- **Total Tables :** 57 tables
- **Tables Principales :** 8 tables
- **Tables Communication :** 3 tables
- **Tables Audit :** 6 tables
- **Tables Simulation :** 3 tables
- **Tables GED :** 8 tables
- **Tables Système :** 11 tables
- **Tables Relations :** 6 tables
- **Tables Contenu :** 12 tables

---

## 🚀 Prochaines Étapes

1. ✅ Compléter les colonnes de chaque table
2. ✅ Identifier les relations et clés étrangères
3. ✅ Documenter les index et performances
4. ✅ Analyser les politiques RLS
5. ✅ Créer les diagrammes ERD
6. ✅ Optimiser la structure

---

*Document généré automatiquement - Mise à jour requise après analyse complète* 