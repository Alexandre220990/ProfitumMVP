# 📊 Documentation Complète des Tables Supabase - FinancialTracker

**Date de mise à jour :** 3 Janvier 2025  
**Version :** 1.0  
**Statut :** Documentation officielle à utiliser  

---

## 🎯 **Tables Principales (Core Tables)**

### **1. Expert**
- **Description :** Table des experts avec authentification Supabase
- **Lignes :** 10
- **Taille :** 216 kB
- **Colonnes :** 25
- **Usage :** Stockage des profils experts pour la marketplace

### **2. Client**
- **Description :** Table des clients de la plateforme Profitum
- **Lignes :** 4
- **Taille :** 224 kB
- **Colonnes :** 31
- **Usage :** Stockage des profils clients

### **3. ProduitEligible**
- **Description :** Produits éligibles pour les optimisations
- **Lignes :** 10
- **Taille :** 64 kB
- **Colonnes :** 13
- **Usage :** Catalogue des produits disponibles

---

## 🔗 **Tables de Relations**

### **4. expertassignment**
- **Description :** Assignations d'experts aux clients pour la marketplace
- **Lignes :** 4
- **Taille :** 176 kB
- **Colonnes :** 22
- **Usage :** Gestion des missions expert-client

### **5. ClientProduitEligible**
- **Description :** Liaison client-produit éligible
- **Lignes :** 9
- **Taille :** 176 kB
- **Colonnes :** 17
- **Usage :** Produits éligibles par client

### **6. message**
- **Description :** Messages asynchrones entre clients, experts et admins
- **Lignes :** 3
- **Taille :** 208 kB
- **Colonnes :** 19
- **Usage :** Système de messagerie temps réel

### **7. notification**
- **Description :** Système de notifications pour clients, experts et admins
- **Lignes :** 1
- **Taille :** 160 kB
- **Colonnes :** 16
- **Usage :** Notifications système

---

## 🏢 **Tables Administratives**

### **8. Admin**
- **Description :** Table des administrateurs
- **Lignes :** 1
- **Taille :** 80 kB
- **Colonnes :** 8
- **Usage :** Gestion des administrateurs

### **9. AdminAuditLog**
- **Description :** Logs d'audit des administrateurs
- **Lignes :** 13
- **Taille :** 32 kB
- **Colonnes :** 10
- **Usage :** Traçabilité des actions admin

---

## 📋 **Tables de Gestion de Contenu**

### **10. documentation**
- **Description :** Table de liaison pour les interactions utilisateurs avec la documentation
- **Lignes :** 1
- **Taille :** 112 kB
- **Colonnes :** 11
- **Usage :** Gestion de la documentation

### **11. documentation_categories**
- **Description :** Catégories pour organiser la documentation
- **Lignes :** 5
- **Taille :** 96 kB
- **Colonnes :** 9
- **Usage :** Organisation de la documentation

### **12. documentation_items**
- **Description :** Articles et éléments de documentation
- **Lignes :** 1
- **Taille :** 168 kB
- **Colonnes :** 16
- **Usage :** Contenu de la documentation

---

## 🔍 **Tables de Simulation et Audit**

### **13. Simulation**
- **Description :** Table des simulations d'optimisation fiscale
- **Lignes :** 6
- **Taille :** 128 kB
- **Colonnes :** 14
- **Usage :** Simulations client

### **14. Audit**
- **Description :** Audits système
- **Lignes :** 0
- **Taille :** 72 kB
- **Colonnes :** 20
- **Usage :** Audits de sécurité

### **15. chatbotsimulation**
- **Description :** Simulations chatbot
- **Lignes :** 0
- **Taille :** 32 kB
- **Colonnes :** 12
- **Usage :** IA conversationnelle

---

## 📊 **Tables de Logs et Monitoring**

### **16. access_logs**
- **Description :** Logs d'accès et d'actions des utilisateurs pour audit et sécurité
- **Lignes :** 0
- **Taille :** 40 kB
- **Colonnes :** 10
- **Usage :** Sécurité et audit

### **17. audit_logs**
- **Description :** Logs d'audit système
- **Lignes :** 5
- **Taille :** 96 kB
- **Colonnes :** 13
- **Usage :** Traçabilité système

### **18. expertaccesslog**
- **Description :** Logs d'accès et d'activité des experts pour audit et sécurité
- **Lignes :** 0
- **Taille :** 88 kB
- **Colonnes :** 16
- **Usage :** Audit experts

### **19. ChatbotLog**
- **Description :** Logs du chatbot
- **Lignes :** 12
- **Taille :** 144 kB
- **Colonnes :** 8
- **Usage :** Historique chatbot

---

## 🏷️ **Tables de Catégorisation**

### **20. ExpertCategory**
- **Description :** Catégories d'experts
- **Lignes :** 5
- **Taille :** 48 kB
- **Colonnes :** 5
- **Usage :** Classification experts

### **21. ExpertSpecialization**
- **Description :** Spécialisations d'experts
- **Lignes :** 0
- **Taille :** 8 kB
- **Colonnes :** 2
- **Usage :** Spécialisations

### **22. Specialization**
- **Description :** Spécialisations générales
- **Lignes :** 7
- **Taille :** 48 kB
- **Colonnes :** 8
- **Usage :** Référentiel spécialisations

---

## 📁 **Tables GED (Gestion Électronique des Documents)**

### **23. GEDDocument**
- **Description :** Documents GED
- **Lignes :** 0
- **Taille :** 88 kB
- **Colonnes :** 12
- **Usage :** Gestion documentaire

### **24. GEDDocumentLabel**
- **Description :** Labels pour documents GED
- **Lignes :** 17
- **Taille :** 80 kB
- **Colonnes :** 5
- **Usage :** Étiquetage documents

### **25. GEDDocumentLabelRelation**
- **Description :** Relations labels-documents
- **Lignes :** 0
- **Taille :** 24 kB
- **Colonnes :** 3
- **Usage :** Liaison labels

### **26. GEDDocumentPermission**
- **Description :** Permissions documents GED
- **Lignes :** 0
- **Taille :** 48 kB
- **Colonnes :** 9
- **Usage :** Contrôle d'accès

### **27. GEDDocumentVersion**
- **Description :** Versions de documents GED
- **Lignes :** 0
- **Taille :** 56 kB
- **Colonnes :** 7
- **Usage :** Versioning documents

### **28. GEDUserDocumentFavorite**
- **Description :** Favoris documents utilisateurs
- **Lignes :** 0
- **Taille :** 32 kB
- **Colonnes :** 3
- **Usage :** Favoris utilisateurs

---

## 📈 **Tables de Métriques et Performance**

### **29. availability_metrics**
- **Description :** Métriques de disponibilité
- **Lignes :** 0
- **Taille :** 16 kB
- **Colonnes :** 11
- **Usage :** Monitoring disponibilité

### **30. system_metrics**
- **Description :** Métriques système
- **Lignes :** 8 298
- **Taille :** 1680 kB
- **Colonnes :** 11
- **Usage :** Monitoring système

### **31. performance_tests**
- **Description :** Tests de performance
- **Lignes :** 0
- **Taille :** 16 kB
- **Colonnes :** 17
- **Usage :** Tests performance

---

## 🔒 **Tables de Sécurité**

### **32. security_incidents**
- **Description :** Incidents de sécurité
- **Lignes :** 0
- **Taille :** 32 kB
- **Colonnes :** 15
- **Usage :** Gestion incidents

### **33. security_vulnerabilities**
- **Description :** Vulnérabilités de sécurité
- **Lignes :** 0
- **Taille :** 16 kB
- **Colonnes :** 15
- **Usage :** Suivi vulnérabilités

### **34. authenticated_users**
- **Description :** Utilisateurs authentifiés
- **Lignes :** -
- **Taille :** -
- **Colonnes :** 7
- **Usage :** Gestion authentification

---

## 📋 **Tables Diverses**

### **35. Appointment**
- **Description :** Rendez-vous
- **Lignes :** 0
- **Taille :** 48 kB
- **Colonnes :** 14
- **Usage :** Gestion RDV

### **36. client_charte_signature**
- **Description :** Signatures de charte client
- **Lignes :** 2
- **Taille :** 112 kB
- **Colonnes :** 9
- **Usage :** Conformité client

### **37. compliance_reports**
- **Description :** Rapports de conformité
- **Lignes :** 0
- **Taille :** 16 kB
- **Colonnes :** 15
- **Usage :** Conformité

### **38. Document**
- **Description :** Documents généraux
- **Lignes :** 0
- **Taille :** 16 kB
- **Colonnes :** 19
- **Usage :** Gestion documents

### **39. Dossier**
- **Description :** Dossiers clients
- **Lignes :** 0
- **Taille :** 16 kB
- **Colonnes :** 9
- **Usage :** Dossiers

### **40. EligibilityChanges**
- **Description :** Changements d'éligibilité
- **Lignes :** 0
- **Taille :** 32 kB
- **Colonnes :** 8
- **Usage :** Suivi éligibilité

### **41. expertcampaign**
- **Description :** Campagnes de promotion et de mise en avant des experts
- **Lignes :** 0
- **Taille :** 56 kB
- **Colonnes :** 18
- **Usage :** Marketing experts

### **42. expertcriteria**
- **Description :** Critères de recherche et de recommandation pour les experts basés sur les ProduitEligible et autres facteurs
- **Lignes :** 5
- **Taille :** 152 kB
- **Colonnes :** 12
- **Usage :** Algorithme recommandation

### **43. health_checks**
- **Description :** Vérifications de santé système
- **Lignes :** 4
- **Taille :** 64 kB
- **Colonnes :** 10
- **Usage :** Monitoring santé

### **44. iso_reports**
- **Description :** Rapports ISO
- **Lignes :** 9
- **Taille :** 80 kB
- **Colonnes :** 10
- **Usage :** Conformité ISO

### **45. Notification**
- **Description :** Notifications (doublon)
- **Lignes :** 0
- **Taille :** 16 kB
- **Colonnes :** 7
- **Usage :** Notifications (ancien)

### **46. Plan**
- **Description :** Plans de service
- **Lignes :** 3
- **Taille :** 48 kB
- **Colonnes :** 7
- **Usage :** Plans

### **47. promotionbanner**
- **Description :** Bannières promotionnelles pour la marketplace des experts
- **Lignes :** 0
- **Taille :** 64 kB
- **Colonnes :** 24
- **Usage :** Marketing marketplace

### **48. Question**
- **Description :** Questions système
- **Lignes :** 5
- **Taille :** 80 kB
- **Colonnes :** 15
- **Usage :** Questions

### **49. Question_VERSION_FINALE_60Q**
- **Description :** This is a duplicate of Question
- **Lignes :** 61
- **Taille :** 80 kB
- **Colonnes :** 14
- **Usage :** Questions (version finale)

### **50. QuestionExploration**
- **Description :** Questions d'exploration
- **Lignes :** 20
- **Taille :** 64 kB
- **Colonnes :** 10
- **Usage :** Exploration

### **51. Reponse**
- **Description :** Réponses aux questions
- **Lignes :** 0
- **Taille :** 32 kB
- **Colonnes :** 6
- **Usage :** Réponses

### **52. SimulationProcessed**
- **Description :** Simulations traitées
- **Lignes :** 0
- **Taille :** 32 kB
- **Colonnes :** 12
- **Usage :** Traitement simulations

### **53. SimulationResult**
- **Description :** Résultats de simulation
- **Lignes :** 0
- **Taille :** 16 kB
- **Colonnes :** 12
- **Usage :** Résultats

### **54. system_alerts**
- **Description :** Alertes système
- **Lignes :** 0
- **Taille :** 32 kB
- **Colonnes :** 15
- **Usage :** Alertes

### **55. terminal_logs**
- **Description :** Logs terminal
- **Lignes :** 10
- **Taille :** 80 kB
- **Colonnes :** 10
- **Usage :** Logs terminal

### **56. ValidationState**
- **Description :** États de validation
- **Lignes :** 1
- **Taille :** 80 kB
- **Colonnes :** 10
- **Usage :** Validation

---

## 📊 **Résumé Statistique**

- **Total des tables :** 56
- **Tables avec données :** 25
- **Tables vides :** 31
- **Taille totale estimée :** ~6.5 MB
- **Total des lignes :** ~8 500

---

## 🎯 **Tables Critiques pour la Marketplace**

### **Tables Principales :**
1. `Expert` - Profils experts
2. `Client` - Profils clients  
3. `ProduitEligible` - Catalogue produits
4. `expertassignment` - Assignations
5. `message` - Messagerie
6. `notification` - Notifications

### **Tables de Support :**
1. `ExpertCategory` - Catégorisation
2. `Specialization` - Spécialisations
3. `expertcriteria` - Critères de recommandation
4. `ClientProduitEligible` - Éligibilité client

---

## 📝 **Notes Importantes**

- **Date de documentation :** 3 Janvier 2025
- **Base de données :** Supabase
- **Schéma :** public
- **Statut :** Production
- **Version :** 1.0

**⚠️ Cette documentation doit être utilisée comme référence officielle pour tous les développements futurs.**

---

*Documentation générée automatiquement le 3 Janvier 2025* 