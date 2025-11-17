# 📋 PROCESSUS COMPLET DE VALIDATION D'UN DOSSIER
## De la pré-éligibilité au succès final

**Date :** 2025-11-10  
**Version :** 1.0

---

## 👥 TYPES D'UTILISATEURS

1. **👤 CLIENT** - Entreprise cherchant des dispositifs de financement
2. **🤝 APPORTEUR** - Partenaire commercial qui amène des clients (optionnel)
3. **👨‍💼 ADMIN** - Administrateur Profitum (validation, contrôle qualité)
4. **👨‍🔧 EXPERT** - Expert métier qui accompagne le client
5. **🤖 SYSTÈME** - Automatisations et notifications

---

## 🔄 PROCESSUS COMPLET - ÉTAPES NUMÉROTÉES

### **PHASE 0 : PROSPECTION (Optionnel - si via Apporteur)**

#### **Étape 0.1 : Apporteur crée un lead**
- **👤 Utilisateur :** 🤝 APPORTEUR
- **Action :** Créer un nouveau prospect
  - Raison sociale
  - SIREN
  - Contact (nom, email, téléphone)
  - Produits potentiels
- **💾 Statut BDD :** Table "Prospect" créée avec `statut: 'lead'`
- **📧 Notification :** → ADMIN

#### **Étape 0.2 : Apporteur invite le client**
- **👤 Utilisateur :** 🤝 APPORTEUR
- **Action :** Envoyer lien d'invitation personnalisé
- **📧 Notification :** → CLIENT (email/SMS avec lien)

---

### **PHASE 1 : SIMULATION ET INSCRIPTION**

#### **Étape 1.1 : Client accède au simulateur**
- **👤 Utilisateur :** 👤 CLIENT
- **Action :** Répondre au questionnaire adaptatif
  - Secteur d'activité
  - CA, effectifs
  - Véhicules (pour TICPE)
  - Masse salariale (pour URSSAF)
  - etc.
- **💾 Statut BDD :** Table "simulations" avec `status: 'en_cours'`
- **🤖 Système :** Calcul automatique des éligibilités

#### **Étape 1.2 : Client crée son compte**
- **👤 Utilisateur :** 👤 CLIENT
- **Action :** Remplir formulaire d'inscription
  - Email + mot de passe
  - Raison sociale (pré-rempli si via apporteur)
  - SIREN
  - Coordonnées
- **💾 Statut BDD :** 
  - Table "Client" créée
  - Lien simulation → client
  - Création `ClientProduitEligible` (1 par produit éligible) avec `statut: 'pending_upload'`
- **📧 Notifications :** 
  - → CLIENT : "Bienvenue ! Confirmez votre email"
  - → APPORTEUR (si présent) : "Votre prospect s'est inscrit"
  - → ADMIN : "Nouveau client via apporteur"

---

### **PHASE 2 : ÉTAPE 1 - UPLOAD DOCUMENTS PRÉ-ÉLIGIBILITÉ**

#### **Étape 2.1 : Client uploade documents initiaux**
- **👤 Utilisateur :** 👤 CLIENT
- **Action :** Uploader documents justificatifs
  - KBIS (< 3 mois)
  - Carte grise véhicules (pour TICPE)
  - Attestation activité
  - etc.
- **💾 Statut BDD :** 
  - Table "ClientProcessDocument" (1 ligne par document)
  - `ClientProduitEligible.statut: 'pending_admin_validation'`
  - `current_step: 1`
  - `progress: 10`
- **📧 Notifications :** 
  - → ADMIN (priorité: high) : "Nouveaux documents à valider"
  - → APPORTEUR (si présent) : "Votre client a uploadé ses documents"
- **📅 Timeline :** "Client a uploadé X documents"

---

### **PHASE 3 : VALIDATION ADMIN (PRÉ-ÉLIGIBILITÉ)**

#### **Étape 3.1 : Admin examine les documents**
- **👤 Utilisateur :** 👨‍💼 ADMIN
- **Action :** Consulter le dossier et examiner chaque document
  - Vérifier authenticité
  - Contrôler cohérence
  - Vérifier éligibilité réelle

#### **Étape 3.2A : Admin VALIDE l'éligibilité** ✅
- **👤 Utilisateur :** 👨‍💼 ADMIN
- **Action :** Cliquer "Valider l'éligibilité" (peut ajouter des notes)
- **💾 Statut BDD :** 
  - `statut: 'admin_validated'`
  - `current_step: 2`
  - `progress: 25`
  - `admin_eligibility_status: 'validated'`
- **📧 Notifications :** 
  - → CLIENT (priorité: high) : "Félicitations ! Pré-éligibilité validée"
  - → APPORTEUR (si présent) : "Pré-éligibilité validée pour [Client]"
- **📅 Timeline :** "Pré-éligibilité validée par Admin"

#### **Étape 3.2B : Admin REJETTE l'éligibilité** ❌
- **👤 Utilisateur :** 👨‍💼 ADMIN
- **Action :** Cliquer "Rejeter l'éligibilité" (doit ajouter des notes)
- **💾 Statut BDD :** 
  - `statut: 'admin_rejected'`
  - `current_step: 1`
  - `progress: 10`
  - `admin_eligibility_status: 'rejected'`
- **📧 Notifications :** 
  - → CLIENT : "Pré-éligibilité rejetée - Raisons: [notes]"
  - → APPORTEUR (si présent) : "Pré-éligibilité rejetée pour [Client]"
- **📅 Timeline :** "Pré-éligibilité rejetée par Admin"
- **🛑 FIN DU PROCESSUS** (dossier rejeté)

---

### **PHASE 4 : SÉLECTION DE L'EXPERT**

#### **Étape 4.1A : Client sélectionne un expert** (Option A - Workflow normal)
- **👤 Utilisateur :** 👤 CLIENT
- **Action :** Consulter la liste des experts disponibles et sélectionner un expert
- **💾 Statut BDD :** 
  - `expert_pending_id: expert_id` (temporaire)
  - `statut: 'expert_pending_acceptance'`
  - `metadata.expert_selected_at`
- **📧 Notifications :** 
  - → EXPERT (priorité: high) : "Nouveau dossier assigné ! Vous avez 48h pour accepter"
  - → APPORTEUR : "Le client a sélectionné l'expert [Nom]"
  - → ADMIN : "Attribution expert : [Client] → [Expert]"
- **📅 Timeline :** "Client a sélectionné l'expert [Nom]"

#### **Étape 4.1B : Admin propose un expert** (Option B - Alternative)
- **👤 Utilisateur :** 👨‍💼 ADMIN
- **Action :** Cliquer "Proposer un expert" et sélectionner dans la liste
- **💾 Statut BDD :** 
  - `expert_pending_id: expert_id`
  - `statut: 'expert_proposed'`
  - `metadata.proposed_by: 'admin'`
- **📧 Notification :** 
  - → CLIENT : "L'expert [Nom] vous est proposé. Vous pouvez accepter ou choisir un autre expert"
- **📅 Timeline :** "Admin a proposé l'expert [Nom]"

#### **Étape 4.2 : Client répond à la proposition** (Si Option B)
- **👤 Utilisateur :** 👤 CLIENT
- **Action :** Accepter la proposition OU choisir un autre expert
- **💾 Statut BDD :** 
  - Si accepte : `expert_pending_id: proposed_expert_id`
  - Si choisit autre : `expert_pending_id: chosen_expert_id`
- **📧 Notifications :** 
  - → EXPERT : "Nouveau dossier assigné"
  - → ADMIN : "Client a accepté/changé l'expert"

---

### **PHASE 5 : ACCEPTATION EXPERT**

#### **Étape 5.1A : Expert ACCEPTE le dossier** ✅
- **👤 Utilisateur :** 👨‍🔧 EXPERT
- **Action :** Cliquer "Accepter le dossier" (peut ajouter des notes)
- **💾 Statut BDD :** 
  - `expert_id: expert_id` (définitif)
  - `expert_pending_id: NULL`
  - `date_expert_accepted: timestamp`
  - `statut: 'expert_assigned'`
  - `current_step: 3`
  - `progress: 30`
- **📧 Notifications :** 
  - → CLIENT (priorité: high) : "Votre expert a accepté votre dossier !"
  - → APPORTEUR : "L'expert a accepté le dossier de [Client]"
  - → ADMIN : "Expert [Nom] a accepté le dossier [Client]"
- **📅 Timeline :** "Expert [Nom] a accepté le dossier"

#### **Étape 5.1B : Expert REFUSE le dossier** ❌
- **👤 Utilisateur :** 👨‍🔧 EXPERT
- **Action :** Cliquer "Refuser le dossier" (doit ajouter des notes)
- **💾 Statut BDD :** 
  - `expert_pending_id: NULL`
  - `statut: 'admin_validated'` (retour à l'étape précédente)
  - `metadata.expert_rejected: { expert_id, reason, rejected_at }`
- **📧 Notifications :** 
  - → CLIENT : "L'expert a refusé. Veuillez sélectionner un autre expert"
  - → ADMIN : "Expert [Nom] a refusé le dossier [Client]"
- **📅 Timeline :** "Expert [Nom] a refusé le dossier"
- **🔄 RETOUR À L'ÉTAPE 4** (Client doit sélectionner un autre expert)

---

### **PHASE 6 : EXAMEN DES DOCUMENTS PAR L'EXPERT**

#### **Étape 6.1 : Expert examine les documents**
- **👤 Utilisateur :** 👨‍🔧 EXPERT
- **Action :** Consulter tous les documents uploadés par le client
- **💾 Statut BDD :** Aucun changement (examen en cours)

#### **Étape 6.2A : Expert valide un document individuel** ✅
- **👤 Utilisateur :** 👨‍🔧 EXPERT
- **Action :** Cliquer "Valider" sur un document spécifique
- **💾 Statut BDD :** 
  - `ClientProcessDocument.validation_status: 'validated'`
  - `validated_by: expert_id`
  - `validated_at: timestamp`
- **📅 Timeline :** "Expert a validé le document [nom]"

#### **Étape 6.2B : Expert rejette un document individuel** ❌
- **👤 Utilisateur :** 👨‍🔧 EXPERT
- **Action :** Cliquer "Rejeter" sur un document (doit ajouter une raison)
- **💾 Statut BDD :** 
  - `ClientProcessDocument.validation_status: 'rejected'`
  - `rejection_reason: raison`
  - `rejected_by: expert_id`
- **📧 Notification :** 
  - → CLIENT : "Document [nom] rejeté - Raison: [raison]"
- **📅 Timeline :** "Expert a rejeté le document [nom]"

#### **Étape 6.3 : Expert demande des documents complémentaires**
- **👤 Utilisateur :** 👨‍🔧 EXPERT
- **Action :** Cliquer "Demander documents complémentaires" et sélectionner les documents requis
- **💾 Statut BDD :** 
  - Table "document_request" créée avec `status: 'pending'`
  - `ClientProduitEligible.statut: 'documents_requested'`
  - `metadata.documents_requested: { documents: [...], requested_at }`
- **📧 Notifications :** 
  - → CLIENT (priorité: high) : "Documents complémentaires demandés"
  - → ADMIN : "Expert demande documents pour [Client]"
- **📅 Timeline :** "Documents complémentaires demandés par Expert"

---

### **PHASE 7 : UPLOAD DOCUMENTS COMPLÉMENTAIRES**

#### **Étape 7.1 : Client uploade les documents complémentaires**
- **👤 Utilisateur :** 👤 CLIENT
- **Action :** Uploader les documents demandés par l'expert
- **💾 Statut BDD :** 
  - Table "ClientProcessDocument" (nouveaux documents)
  - `validation_status: 'pending'`
  - `document_request.status: 'in_progress'` (si tous uploadés)
- **📧 Notifications :** 
  - → EXPERT : "Nouveaux documents uploadés par [Client]"
- **📅 Timeline :** "Documents complémentaires envoyés par Client"

#### **Étape 7.2 : Client valide l'étape 3 (Collecte des documents)**
- **👤 Utilisateur :** 👤 CLIENT
- **Action :** Cliquer "Valider l'étape 3" (vérifie que tous les documents rejetés ont été remplacés)
- **💾 Statut BDD :** 
  - `DossierStep.step_name: 'Collecte des documents'` → `completed: true`
  - `ClientProduitEligible.current_step: 3`
- **📅 Timeline :** "Étape 3 complétée par Client"

---

### **PHASE 8 : VALIDATION FINALE DES DOCUMENTS PAR L'EXPERT**

#### **Étape 8.1 : Expert valide tous les documents (Lancement audit)**
- **👤 Utilisateur :** 👨‍🔧 EXPERT
- **Action :** Cliquer "Lancer l'audit" (valide tous les documents en attente)
- **💾 Statut BDD :** 
  - Tous les documents `validation_status: 'validated'`
  - `ClientProduitEligible.statut: 'documents_completes'`
  - `current_step: 4`
  - `progress: 60`
  - `document_request.status: 'completed'`
- **📧 Notifications :** 
  - → CLIENT : "Tous vos documents ont été validés ! Audit en cours"
  - → ADMIN : "Expert a validé tous les documents pour [Client]"
- **📅 Timeline :** "Documents validés par Expert - Audit lancé"

---

### **PHASE 9 : AUDIT TECHNIQUE**

#### **Étape 9.1 : Expert réalise l'audit technique**
- **👤 Utilisateur :** 👨‍🔧 EXPERT
- **Action :** Analyser le dossier en profondeur
  - Vérifier la cohérence des données
  - Calculer le montant final
  - Préparer le rapport d'audit
  - Rédiger les commentaires
- **💾 Statut BDD :** 
  - `ClientProduitEligible.statut: 'audit_en_cours'` ou `'documents_completes'`
  - `current_step: 4`
  - `progress: 60-70`
- **📝 Note :** L'expert travaille sur l'audit mais ne l'a pas encore finalisé

---

### **PHASE 10 : VALIDATION CLIENT DE L'AUDIT ET DU CONTRAT EXPERT**

#### **Étape 10.1 : Expert finalise l'audit et envoie le résultat**
- **👤 Utilisateur :** 👨‍🔧 EXPERT
- **Action :** Cliquer "Finaliser l'audit" et saisir :
  - Montant final calculé (`montant_final`)
  - Commentaires/notes (`notes`)
  - Rapport optionnel (`rapport_url`)
  - **Commission négociée (`client_fee_percentage`) - OPTIONNEL** : L'expert peut baisser la commission si le owner du cabinet a défini un minimum
- **💾 Statut BDD :** 
  - `statut: 'audit_completed'`
  - `current_step: 4`
  - `progress: 70`
  - `montantFinal: montant_final`
  - `metadata.audit_result: { montant_final, notes, rapport_url, completed_at, client_fee_percentage_negotiated, commission_negotiated }`
- **💰 NÉGOCIATION COMMISSION :**
  - Par défaut, l'expert utilise le `client_fee_percentage` max défini pour le produit
  - Si le owner du cabinet a défini un `client_fee_percentage_min` dans `CabinetProduitEligible` pour ce produit, l'expert peut négocier entre ce minimum et le maximum
  - Si aucun minimum n'est défini, l'expert ne peut pas baisser la commission (doit utiliser le maximum)
  - La commission négociée est validée automatiquement et enregistrée dans les métadonnées
- **📧 Notifications :** 
  - → CLIENT (priorité: high) : "Audit terminé - Montant estimé : XX €. Veuillez confirmer l'audit pour demander le remboursement. ** En validant, vous acceptez les CGV et le contrat de l'expert avec son commissionnement."
  - → ADMIN : "Audit terminé - En attente validation client"
  - → APPORTEUR : "Audit complété pour votre client"
- **📅 Timeline :** "Audit terminé par Expert"

#### **Étape 10.2 : Client reçoit la synthèse avec montant final et commentaires**
- **👤 Utilisateur :** 👤 CLIENT
- **Action :** Consulter la synthèse de l'audit
- **💾 Statut BDD :** Aucun changement (consultation)
- **📄 Contenu affiché :**
  - Montant final du remboursement
  - Commentaires de l'expert
  - Rapport d'audit (si fourni)
  - **Contrat expert** : Conditions de commission (modèle WATERFALL)
    - Commission expert (%)
    - Commission Profitum (%)
    - Estimation HT/TVA/TTC
- **🔗 Route :** `GET /api/client/dossier/:id/audit-commission-info`
- **📱 Interface :** Modal `AuditValidationModal` avec toutes les informations

#### **Étape 10.3A : Client accepte l'audit et valide le contrat expert** ✅
- **👤 Utilisateur :** 👤 CLIENT
- **Action :** Cliquer "Accepter et valider l'audit" (valide implicitement le contrat expert)
- **💾 Statut BDD :** 
  - `statut: 'validation_finale'`
  - `current_step: 5`
  - `progress: 75`
  - `date_audit_validated_by_client: timestamp`
  - `metadata.commission_conditions_accepted: { waterfall_model, client_fee_percentage, profitum_fee_percentage, montant_remboursement, expert_total_fee, profitum_total_fee, estimation_ht, estimation_tva, estimation_ttc, accepted_at }`
- **📧 Notifications :** 
  - → EXPERT (priorité: high) : "Audit accepté par le client - Lancement de la production"
  - → ADMIN : "Audit accepté - Lancement production"
  - → APPORTEUR : "Audit accepté par le client"
- **📅 Timeline :** "Audit accepté par le client"
- **✅ CONTINUE VERS PHASE 11**

#### **Étape 10.3B : Client refuse l'audit avec motif** ❌
- **👤 Utilisateur :** 👤 CLIENT
- **Action :** Cliquer "Refuser l'audit" et saisir un motif de refus (`reason`) dans le modal de refus
- **💾 Statut BDD :** 
  - `statut: 'audit_rejected_by_client'`
  - `current_step: 4`
  - `progress: 70`
  - `metadata.client_validation: { action: 'reject', reason, validated_at }`
- **📧 Notifications :** 
  - → EXPERT (priorité: high) : "Audit refusé par le client - Raison : [reason] - Veuillez proposer une nouvelle version"
  - → ADMIN : "Audit refusé par client - Raison : [reason]"
- **📅 Timeline :** "Audit refusé par le client - Raison : [reason]"
- **🔗 Route :** `POST /api/client/dossier/:id/validate-audit` avec `action: 'reject'` et `reason`
- **🔄 RETOUR À L'ÉTAPE 10.4** (Expert peut faire une nouvelle proposition)

#### **Étape 10.4 : Expert reçoit le refus et peut faire une nouvelle proposition**
- **👤 Utilisateur :** 👨‍🔧 EXPERT
- **Action :** Consulter le refus avec le motif, puis :
  - Modifier le montant final si nécessaire
  - Modifier les commentaires
  - **Négocier la commission (`client_fee_percentage`) si besoin** (dans les limites définies par le owner)
  - Créer une nouvelle proposition
- **💾 Statut BDD :** 
  - `statut: 'audit_completed'` (retour à l'état précédent)
  - `metadata.audit_result.revision: { previous_rejection_reason, previous_rejection_at, revised_at, revision_number }`
  - `metadata.client_validation_history: [...]` (historique des refus conservé)
- **💰 NÉGOCIATION COMMISSION :**
  - Même logique que lors de la finalisation initiale de l'audit
  - L'expert peut baisser la commission si le owner a défini un minimum
  - La commission négociée est validée et enregistrée
- **📧 Notifications :** 
  - → CLIENT (priorité: high) : "Nouvelle proposition d'audit disponible"
  - → ADMIN : "Nouvelle proposition d'audit"
- **📅 Timeline :** "Nouvelle proposition d'audit par Expert"
- **🔗 Route :** `POST /api/expert/dossier/:id/update-audit`
- **🔄 RETOUR À L'ÉTAPE 10.2** (Client reçoit la nouvelle synthèse)

---

### **PHASE 11 : DEMANDE DE REMBOURSEMENT**

#### **Étape 11.1 : Client soumet la demande de remboursement**
- **👤 Utilisateur :** 👤 CLIENT
- **Action :** Cliquer "Soumettre la demande de remboursement"
- **💾 Statut BDD :** 
  - `statut: 'refund_requested'`
  - `current_step: 6`
  - `progress: 95`
  - `metadata.refund_requested_at: timestamp`
- **📧 Notifications :** 
  - → ADMIN : "Nouvelle demande de remboursement : [Client] - XX €"
  - → EXPERT : "Demande de remboursement soumise pour [Client]"
- **📅 Timeline :** "Demande de remboursement soumise par Client"

#### **Étape 11.2 : Admin traite la demande**
- **👤 Utilisateur :** 👨‍💼 ADMIN
- **Action :** Soumettre le dossier à l'administration (externe)
- **💾 Statut BDD :** 
  - `statut: 'refund_in_progress'`
  - `current_step: 6`
  - `progress: 98`
  - `metadata.refund_submitted_at: timestamp`
- **📧 Notifications :** 
  - → CLIENT : "Votre demande de remboursement a été soumise à l'administration"
- **📅 Timeline :** "Demande soumise à l'administration par Admin"

---

### **PHASE 12 : REMBOURSEMENT OBTENU**

#### **Étape 12.1 : Admin confirme le remboursement**
- **👤 Utilisateur :** 👨‍💼 ADMIN
- **Action :** Cliquer "Confirmer le remboursement" (après réception de l'administration)
- **💾 Statut BDD :** 
  - `statut: 'refund_completed'`
  - `current_step: 6`
  - `progress: 100`
  - `metadata.refund_completed_at: timestamp`
  - `metadata.refund_amount: montant_final`
- **📧 Notifications :** 
  - → CLIENT (priorité: high) : "🎉 Remboursement obtenu ! Montant: XX €"
  - → EXPERT : "Remboursement obtenu pour [Client]"
  - → APPORTEUR : "Remboursement obtenu pour [Client]"
- **📅 Timeline :** "Remboursement obtenu - Dossier finalisé"

#### **Étape 12.2 : Clôture du dossier**
- **👤 Utilisateur :** 🤖 SYSTÈME (automatique)
- **Action :** Archivage automatique après X jours
- **💾 Statut BDD :** 
  - `statut: 'completed'` ou `'archived'`
- **📅 Timeline :** "Dossier clôturé"

---

## 📊 RÉSUMÉ DES STATUTS PAR PHASE

| Phase | Statut BDD | Étape | Progression |
|-------|-----------|-------|-------------|
| **Phase 1** | `pending_upload` | 1 | 0% |
| **Phase 2** | `pending_admin_validation` | 1 | 10% |
| **Phase 3** | `admin_validated` / `admin_rejected` | 2 | 25% / 10% |
| **Phase 4** | `expert_pending_acceptance` | 2 | 25% |
| **Phase 5** | `expert_assigned` | 3 | 30% |
| **Phase 6-7** | `documents_requested` | 3 | 40% |
| **Phase 8** | `documents_completes` | 4 | 60% |
| **Phase 9** | `audit_en_cours` → `audit_completed` | 4-5 | 70-80% |
| **Phase 10** | `validated` | 5-6 | 90% |
| **Phase 11** | `refund_requested` → `refund_in_progress` | 6 | 95-98% |
| **Phase 12** | `refund_completed` | 6 | 100% |

---

## 🔄 POINTS DE RETOUR EN ARRIÈRE

1. **Étape 3.2B** : Rejet admin → **FIN** du processus
2. **Étape 5.1B** : Refus expert → **RETOUR** à l'étape 4 (sélection expert)
3. **Étape 6.2B** : Rejet document → **RETOUR** à l'étape 7 (upload nouveau document)
4. **Étape 10.2B** : Corrections demandées → **RETOUR** à l'étape 9 (audit)

---

## ✅ FINALISATION

**Le processus est terminé lorsque :**
- Le statut est `refund_completed`
- La progression est à 100%
- Le dossier est archivé

**Durée moyenne estimée :** 2-4 mois (selon la complexité et les délais administratifs)

