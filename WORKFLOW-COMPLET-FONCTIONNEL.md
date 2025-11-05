# 📋 WORKFLOW COMPLET - PROCESSUS PRODUIT CLIENT

**Date:** 2025-11-05  
**Version:** 2.0 (Après refonte validations)

---

## 👥 **ACTEURS DU PROCESSUS**

1. **👤 Client** - Entreprise cherchant des dispositifs de financement
2. **🤝 Apporteur d'Affaires** - Partenaire commercial qui amène des clients
3. **👨‍💼 Admin** - Administrateur Profitum (validation, contrôle qualité)
4. **👨‍🔧 Expert** - Expert métier qui accompagne le client
5. **🤖 Système** - Automatisations et notifications

---

## 🔄 **WORKFLOW COMPLET (Cas avec Apporteur)**

---

### **PHASE 0 : PROSPECTION ET APPORT D'AFFAIRES**

#### **0.1 Apporteur crée un lead**
```
🤝 APPORTEUR se connecte à son espace
   ↓
🤝 Crée un nouveau prospect
   - Raison sociale
   - SIREN
   - Contact (nom, email, téléphone)
   - Produits potentiels
   ↓
💾 BDD: Table "Prospect" créée
   - apporteur_id: UUID de l'apporteur
   - statut: 'lead'
   - source: 'apporteur'
   ↓
📧 NOTIFICATION → ADMIN
   "Nouveau lead de [Apporteur] : [Raison sociale]"
```

#### **0.2 Apporteur invite le client**
```
🤝 APPORTEUR envoie lien d'invitation personnalisé
   - URL: /register?referral_code=XXX&prospect_id=YYY
   ↓
👤 CLIENT reçoit email/SMS avec lien
   ↓
👤 CLIENT clique sur le lien
```

---

### **PHASE 1 : SIMULATION ET INSCRIPTION**

#### **1.1 Client accède au simulateur**
```
👤 CLIENT arrive sur /simulateur-eligibilite?ref=apporteur_XXX
   ↓
🎯 Simulateur affiche :
   - Questionnaire adaptatif
   - Questions par produit (TICPE, URSSAF, DFS, etc.)
   - Barre de progression
   ↓
👤 CLIENT répond aux questions
   - Secteur d'activité
   - CA, effectifs
   - Véhicules (pour TICPE)
   - Masse salariale (pour URSSAF)
   - etc.
   ↓
💾 BDD: Table "simulations"
   - client_id: NULL (pas encore inscrit)
   - session_id: Session temporaire
   - answers: JSONB
   - status: 'en_cours'
   ↓
🤖 CALCUL automatique des éligibilités
   - Algorithmes par produit
   - Montants estimés
   - Taux d'éligibilité
   ↓
📊 AFFICHAGE résultats :
   "Vous êtes éligible à 3 dispositifs pour un gain total de XX €"
```

#### **1.2 Client crée son compte**
```
👤 CLIENT clique "Créer mon compte pour continuer"
   ↓
📝 Formulaire inscription :
   - Email + mot de passe
   - Raison sociale (pré-rempli si via apporteur)
   - SIREN
   - Coordonnées
   ↓
💾 BDD: Table "Client" créée
   - auth_user_id: UUID (table auth.users)
   - company_name, siren, email, phone
   - referred_by: apporteur_id (si via apporteur)
   - created_at: timestamp
   ↓
💾 BDD: Lien simulation → client
   UPDATE simulations SET client_id = nouveau_client_id
   ↓
💾 BDD: Création ClientProduitEligible (1 par produit éligible)
   - clientId: client_id
   - produitId: produit_id
   - statut: 'pending_upload'
   - montantFinal: montant_estimé
   - simulationId: simulation_id
   - metadata: { source: 'simulation_apporteur', apporteur_id }
   ↓
📧 NOTIFICATION → CLIENT
   "Bienvenue ! Confirmez votre email"
   ↓
📧 NOTIFICATION → APPORTEUR
   "Votre prospect [Nom] s'est inscrit ! Dossier créé."
   ↓
📧 NOTIFICATION → ADMIN
   "Nouveau client via apporteur [Nom]"
```

---

### **PHASE 2 : ÉTAPE 1 - UPLOAD DOCUMENTS PRÉ-ÉLIGIBILITÉ**

#### **2.1 Client uploade documents initiaux**
```
👤 CLIENT se connecte → Dashboard
   ↓
👤 Voit ses produits éligibles (cards)
   ↓
👤 Clique sur un produit (ex: TICPE)
   ↓
📄 Affichage workflow Étape 1 :
   "Confirmer l'éligibilité - Upload documents justificatifs"
   ↓
👤 CLIENT uploade documents :
   - KBIS (< 3 mois)
   - Carte grise véhicules
   - Attestation activité
   - etc.
   ↓
📤 Upload via /api/documents/upload
   ↓
💾 BDD: Table "ClientProcessDocument" (1 ligne par document)
   - client_id: client_id
   - client_produit_id: dossier_id
   - document_type: 'kbis', 'carte_grise', etc.
   - filename, storage_path, bucket_name
   - validation_status: 'pending'
   - uploaded_by: client_id
   - uploaded_by_type: 'client'
   ↓
🔄 UPDATE ClientProduitEligible:
   - statut: 'pending_admin_validation'
   - current_step: 1
   - progress: 10
   ↓
📧 NOTIFICATION → ADMIN (priorité: high)
   "Nouveaux documents à valider : [Client] - [Produit]"
   ↓
📧 NOTIFICATION → APPORTEUR (si présent)
   "Votre client [Nom] a uploadé ses documents"
   ↓
📅 TIMELINE: "Client a uploadé X documents"
```

---

### **PHASE 3 : VALIDATION ADMIN (PRÉ-ÉLIGIBILITÉ)**

#### **3.1 Admin examine les documents**
```
👨‍💼 ADMIN se connecte → Dashboard Admin
   ↓
👨‍💼 Voit liste dossiers "pending_admin_validation"
   ↓
👨‍💼 Clique sur un dossier
   ↓
📄 Affichage :
   - Infos client
   - Documents uploadés
   - Calculs de simulation
   ↓
👨‍💼 ADMIN examine chaque document
   - Vérifie authenticité
   - Contrôle cohérence
   - Vérifie éligibilité réelle
```

#### **3.2A Admin VALIDE l'éligibilité** ✅
```
👨‍💼 ADMIN clique "Valider l'éligibilité"
   - Peut ajouter des notes
   ↓
📤 POST /api/admin/dossiers/:id/validate-eligibility
   { action: 'approve', notes: '...' }
   ↓
💾 UPDATE ClientProduitEligible:
   - admin_eligibility_status: 'validated' ✅
   - admin_validated_by: admin_id
   - eligibility_validated_at: timestamp
   - validation_admin_notes: notes
   - statut: 'admin_validated'
   - current_step: 2
   - progress: 25
   ↓
📅 TIMELINE: "Admin [Nom] a validé l'éligibilité"
   - Icon: ✅
   - Color: green
   - Metadata: { admin_id, notes }
   ↓
📧 NOTIFICATION → CLIENT (priorité: high)
   "✅ Félicitations ! Votre éligibilité est validée"
   "Prochaine étape : Sélectionnez votre expert"
   Action: Bouton "Choisir mon expert"
   ↓
📧 NOTIFICATION → APPORTEUR
   "Bonne nouvelle ! Le dossier de [Client] est éligible"
   "Montant estimé : XX €"
   ↓
💰 Mise à jour commission apporteur (potentielle)
```

#### **3.2B Admin REJETTE l'éligibilité** ❌
```
👨‍💼 ADMIN clique "Rejeter"
   - Doit préciser la raison
   ↓
💾 UPDATE ClientProduitEligible:
   - admin_eligibility_status: 'rejected' ❌
   - statut: 'admin_rejected'
   - validation_admin_notes: raison
   - current_step: 1 (reste à l'étape 1)
   ↓
📅 TIMELINE: "Admin a refusé l'éligibilité"
   - Icon: ❌
   - Raison affichée
   ↓
📧 NOTIFICATION → CLIENT
   "Votre dossier n'est pas éligible. Raison : [...]"
   ↓
📧 NOTIFICATION → APPORTEUR
   "Le dossier de [Client] n'est pas éligible"
   ↓
🛑 FIN du processus pour ce produit
```

---

### **PHASE 4 : ÉTAPE 2 - SÉLECTION DE L'EXPERT**

#### **4.1 Client sélectionne un expert**
```
👤 CLIENT reçoit notification "Éligibilité validée"
   ↓
👤 CLIENT se connecte → Voit son dossier
   ↓
📄 Affichage Étape 2 : "Sélection de l'expert"
   - Modal avec liste d'experts disponibles
   - Filtres par spécialité, rating, expérience
   ↓
👤 CLIENT clique sur un expert → Fiche détaillée :
   - Nom, entreprise
   - Spécialités
   - Années d'expérience
   - Rating (⭐⭐⭐⭐⭐)
   - Dossiers complétés
   - Avis clients
   ↓
👤 CLIENT clique "Sélectionner cet expert"
   ↓
⚠️ Message confirmation :
   "Confirmez-vous votre choix ? Une fois validé, l'expert sera notifié."
   ↓
👤 CLIENT clique "Valider définitivement"
   ↓
📤 POST /api/dossier-steps/expert/select
   { dossier_id, expert_id }
   ↓
💾 UPDATE ClientProduitEligible:
   - expert_pending_id: expert_id (temporaire)
   - statut: 'expert_pending_acceptance'
   - metadata: { expert_selected_at, selected_by: 'client' }
   ↓
📅 TIMELINE: "Client a sélectionné l'expert [Nom]"
   ↓
📧 NOTIFICATION → EXPERT (priorité: high)
   "🎯 Nouveau dossier assigné !"
   "Client: [Raison sociale]"
   "Produit: [TICPE/URSSAF/etc.]"
   "Montant estimé: XX €"
   "Vous avez 48h pour accepter ou refuser"
   Actions: [Accepter] [Refuser]
   ↓
📧 NOTIFICATION → APPORTEUR
   "Le client [Nom] a sélectionné l'expert [Nom Expert]"
   ↓
📧 NOTIFICATION → ADMIN
   "Attribution expert : [Client] → [Expert]"
```

#### **4.2 Option alternative : Admin propose un expert**
```
👨‍💼 ADMIN consulte le dossier
   ↓
👨‍💼 ADMIN clique "Proposer un expert"
   - Sélectionne dans la liste
   - Peut ajouter un message personnalisé
   ↓
💾 UPDATE: expert_pending_id + metadata.proposed_by = 'admin'
   ↓
📧 NOTIFICATION → CLIENT
   "L'expert [Nom] vous est proposé"
   "Vous pouvez accepter ou choisir un autre expert"
   Actions: [Accepter] [Choisir autre]
```

---

### **PHASE 5 : ACCEPTATION EXPERT**

#### **5.1A Expert ACCEPTE le dossier** ✅
```
👨‍🔧 EXPERT reçoit notification
   ↓
👨‍🔧 EXPERT se connecte → Dashboard Expert
   ↓
👨‍🔧 Voit carte "Nouveau dossier en attente"
   ↓
👨‍🔧 Clique "Accepter le dossier"
   ↓
📤 POST /api/expert/dossier/:id/accept
   ↓
💾 UPDATE ClientProduitEligible:
   - expert_id: expert_id (définitif)
   - expert_pending_id: NULL
   - date_expert_accepted: timestamp
   - statut: 'expert_assigned'
   - current_step: 3
   - progress: 30
   ↓
📅 TIMELINE: "Expert [Nom] a accepté le dossier"
   - Icon: 🤝
   - Color: blue
   ↓
📧 NOTIFICATION → CLIENT (priorité: high)
   "✅ Votre expert a accepté votre dossier !"
   "Expert: [Nom]"
   "Prochaine étape: Examen des documents"
   ↓
📧 NOTIFICATION → APPORTEUR
   "L'expert a accepté le dossier de [Client]"
   ↓
📧 NOTIFICATION → ADMIN
   "Dossier [ID] : Expert accepté, processus en cours"
```

#### **5.1B Expert REFUSE le dossier** ❌
```
👨‍🔧 EXPERT clique "Refuser le dossier"
   - Doit préciser la raison
   ↓
💾 UPDATE ClientProduitEligible:
   - expert_pending_id: NULL
   - statut: 'admin_validated' (retour étape 2)
   - metadata: { expert_rejection: { expert_id, reason, date } }
   ↓
📧 NOTIFICATION → CLIENT
   "L'expert n'est pas disponible. Veuillez sélectionner un autre expert."
   ↓
📧 NOTIFICATION → ADMIN
   "Expert [Nom] a refusé le dossier [ID]. Raison: [...]"
   ↓
🔄 Retour à l'étape 4.1 (Sélection d'un autre expert)
```

---

### **PHASE 6 : ÉTAPE 3 - EXAMEN DOCUMENTS PAR L'EXPERT**

#### **6.1 Expert examine les documents de pré-éligibilité**
```
👨‍🔧 EXPERT se connecte → Dossier client
   ↓
📄 Affichage onglet "Documents" :
   - Tous les documents uploadés par le client
   - KBIS, cartes grises, attestations, etc.
   - Statut: 'pending' (en attente validation expert)
   ↓
👨‍🔧 EXPERT consulte chaque document :
   - Bouton "Voir" (PDF dans nouvel onglet)
   - Bouton "Télécharger"
   ↓
👨‍🔧 EXPERT peut :
   Option A: Tout valider en bloc
   Option B: Valider/Rejeter individuellement
```

#### **6.2A Expert valide TOUS les documents** ✅
```
👨‍🔧 EXPERT clique "Valider tous les documents"
   ↓
📤 POST /api/expert/document/:id/validate (pour chaque doc)
   ↓
💾 UPDATE ClientProcessDocument (pour chaque):
   - validation_status: 'validated'
   - validated_by: expert_id
   - validated_at: timestamp
   ↓
📤 POST /api/expert/dossier/:id/validate-eligibility
   { validated: true, notes: '...' }
   ↓
💾 UPDATE ClientProduitEligible:
   - expert_validation_status: 'validated' ✅
   - expert_validated_at: timestamp
   - statut: 'documents_completes'
   - current_step: 4 (Passe à l'audit)
   - progress: 50
   ↓
📅 TIMELINE: "Expert a validé tous les documents"
   - Icon: ✅
   - Color: green
   - Metadata: { expert_id, documents_count }
   ↓
📧 NOTIFICATION → CLIENT (priorité: high)
   "✅ Documents validés par votre expert !"
   "Votre dossier passe en phase d'audit technique"
   ↓
📧 NOTIFICATION → APPORTEUR
   "Documents validés pour [Client] - Dossier en audit"
   ↓
📧 NOTIFICATION → ADMIN
   "Expert a validé les documents - Dossier [ID]"
```

#### **6.2B Expert demande documents complémentaires** 📄
```
👨‍🔧 EXPERT clique "Demander documents complémentaires"
   ↓
📝 Modal :
   - Liste de documents à demander
   - Peut ajouter descriptions personnalisées
   - Marquer comme "Obligatoire" ou "Optionnel"
   - Message personnalisé au client
   ↓
📤 POST /api/expert/dossier/:id/request-documents
   { 
     requested_documents: [
       { description: 'Justificatif domicile', required: true },
       { description: 'RIB', required: true }
     ],
     message: 'Merci de fournir...'
   }
   ↓
💾 INSERT document_request:
   - dossier_id: dossier_id
   - expert_id: expert_id
   - client_id: client_id
   - requested_documents: JSONB[]
   - status: 'pending'
   - notes: message
   ↓
💾 UPDATE ClientProduitEligible:
   - expert_validation_status: 'documents_requested'
   - statut: 'documents_requested'
   - metadata: { documents_missing: true }
   ↓
📅 TIMELINE: "Expert a demandé des documents complémentaires"
   - Icon: 📄
   - Color: orange
   - Metadata: { documents_count, expert_message }
   ↓
📧 NOTIFICATION → CLIENT (priorité: high)
   "📄 Documents complémentaires requis"
   "Votre expert a besoin de X documents supplémentaires"
   Message: [Message expert]
   Action: Bouton "Voir la liste"
   ↓
📧 NOTIFICATION → APPORTEUR
   "Documents complémentaires demandés pour [Client]"
```

---

### **PHASE 7 : ÉTAPE 3 - UPLOAD DOCUMENTS COMPLÉMENTAIRES**

#### **7.1 Client uploade documents complémentaires**
```
👤 CLIENT se connecte → Dashboard
   ↓
👤 Voit notification "Documents requis"
   ↓
👤 Clique sur le dossier
   ↓
📄 Affichage Étape 3 : "Collecte des documents"
   Module Step3 intégré DANS l'étape :
   ┌──────────────────────────────────────┐
   │ 💬 Message expert: "Merci de..."    │
   │                                      │
   │ 📊 2 actions restantes               │
   │ [====------] 40%                     │
   │                                      │
   │ 📄 KBIS.pdf  ✓ Validé  [Voir]       │
   │ 📄 CG_1.pdf  ✗ Rejeté  [Remplacer]  │
   │    Raison: Photo floue               │
   │ 🟠 Justificatif domicile Obligatoire│
   │    [Uploader]                        │
   │ 🟠 RIB Obligatoire [Uploader]       │
   └──────────────────────────────────────┘
   ↓
👤 CLIENT uploade les documents demandés
   - Clique "Uploader" sur chaque document
   - Sélectionne fichier
   ↓
📤 Upload via /api/documents/upload
   - parent_document_id: NULL (nouveau doc)
   - category: 'document_complementaire'
   ↓
💾 INSERT ClientProcessDocument:
   - validation_status: 'pending'
   - document_type: type du document
   ↓
🔄 UPDATE document_request:
   - requested_documents[X].uploaded: true
   - requested_documents[X].document_id: nouveau_doc_id
   ↓
📊 Frontend met à jour la liste en temps réel
   🟠 → 🟢 Badge "✓ Uploadé"
```

#### **7.2 Client remplace un document rejeté**
```
👤 CLIENT voit document rejeté (rouge)
   "📄 CG_1.pdf ✗ Rejeté - Raison: Photo floue"
   ↓
👤 CLIENT clique "Remplacer"
   ↓
📤 Upload nouveau document
   - FormData: parent_document_id = doc_rejeté_id ✅ VERSIONING
   ↓
💾 INSERT ClientProcessDocument:
   - parent_document_id: doc_rejeté_id
   - validation_status: 'pending'
   - version_number: 2 (ou +1)
   ↓
📊 GET /api/client/dossier/:id/documents
   → Backend filtre : ne retourne QUE la dernière version
   → Document rejeté disparaît de la liste (remplacé)
   → Nouveau document apparaît (pending)
```

#### **7.3 Client valide l'étape 3**
```
👤 CLIENT voit :
   "✅ Tous les documents requis ont été fournis"
   [Bouton "Valider l'étape"]
   ↓
👤 CLIENT clique "Valider l'étape"
   ↓
📤 POST /api/client/dossier/:id/validate-step-3
   ↓
🔍 VÉRIFICATIONS BACKEND (avec versioning):
   - Récupère tous docs rejetés
   - Filtre ceux qui ont un remplacement (via parent_document_id)
   - Vérifie docs complémentaires uploadés
   - Si OK → Continue
   - Si KO → Erreur 400
   ↓
💾 UPDATE DossierStep:
   - step_name: 'Collecte des documents'
   - status: 'completed'
   - progress: 100
   ↓
💾 UPDATE document_request:
   - status: 'completed'
   - completed_at: timestamp
   ↓
💾 UPDATE ClientProduitEligible:
   - statut: 'documents_completes'
   - metadata: { documents_missing: false, step_3_completed_at }
   ↓
📅 TIMELINE: "Étape 3 validée : Collecte des documents"
   - Actor: client
   - Icon: ✅
   ↓
📧 NOTIFICATION → EXPERT (priorité: high)
   "✅ Documents complémentaires reçus"
   "Client: [Nom]"
   "Vous pouvez maintenant procéder à l'audit"
   Action: Lien vers dossier
   ↓
📧 NOTIFICATION → APPORTEUR
   "Documents complétés pour [Client]"
```

---

### **PHASE 8 : ÉTAPE 4 - AUDIT TECHNIQUE**

#### **8.1 Expert réalise l'audit**
```
👨‍🔧 EXPERT se connecte → Dossier
   ↓
👨‍🔧 Accède à l'onglet "Audit"
   ↓
📊 EXPERT réalise l'étude :
   - Analyse technique approfondie
   - Calculs précis (TICPE: litres × taux × durée)
   - Vérifications réglementaires
   - Optimisations possibles
   ↓
👨‍🔧 EXPERT rédige le rapport d'audit :
   - Montant final calculé
   - Taux final
   - Durée d'éligibilité
   - Justifications
   - Recommandations
   ↓
💾 UPDATE ClientProduitEligible:
   - montantFinal: montant_calculé
   - tauxFinal: taux
   - dureeFinale: mois
   - expert_report_status: 'completed'
   - calcul_details: JSONB
   ↓
👨‍🔧 EXPERT clique "Envoyer audit au client"
   ↓
💾 INSERT Audit (table):
   - clientId, expertId
   - dossier_id
   - status: 'pending_client_validation'
   - montant_final, taux, duree
   - rapport_pdf: lien Storage
   ↓
💾 UPDATE ClientProduitEligible:
   - statut: 'audit_en_cours'
   - current_step: 4
   - progress: 60
   ↓
📅 TIMELINE: "Expert a envoyé l'audit technique"
   - Metadata: { montant_final, audit_id }
   ↓
📧 NOTIFICATION → CLIENT (priorité: high)
   "📊 Audit technique disponible !"
   "Montant final calculé: XX €"
   Action: "Consulter l'audit"
   ↓
📧 NOTIFICATION → APPORTEUR
   "Audit complété pour [Client] - Montant: XX €"
   💰 Commission calculée visible
```

#### **8.2 Client valide ou refuse l'audit**
```
👤 CLIENT se connecte → Dossier
   ↓
👤 Voit l'audit de l'expert
   - Montant final
   - Détails des calculs
   - Rapport PDF téléchargeable
   ↓
OPTION A: CLIENT ACCEPTE ✅
   ↓
👤 Clique "Valider l'audit"
   ↓
💾 UPDATE Audit:
   - status: 'validated_by_client'
   - client_validated_at: timestamp
   ↓
💾 UPDATE ClientProduitEligible:
   - statut: 'audit_validé'
   - date_audit_validated_by_client: timestamp
   - current_step: 5
   - progress: 75
   ↓
📅 TIMELINE: "Client a validé l'audit"
   ↓
📧 NOTIFICATION → EXPERT
   "Client a validé votre audit !"
   ↓
📧 NOTIFICATION → ADMIN
   "Audit validé - Passage validation finale"
   ↓
   
OPTION B: CLIENT REFUSE ❌
   ↓
👤 Clique "Refuser l'audit" + raison
   ↓
💾 UPDATE Audit:
   - status: 'rejected_by_client'
   - rejection_reason: raison
   ↓
📧 NOTIFICATION → EXPERT
   "Client a refusé l'audit. Raison: [...]"
   "Veuillez réviser votre calcul"
   ↓
🔄 Retour expert pour modification
```

---

### **PHASE 9 : ÉTAPE 5 - VALIDATION FINALE (CLIENT VALIDE L'AUDIT)**

#### **9.1 Client valide l'audit = Validation finale** ✅
```
👤 CLIENT consulte l'audit de l'expert
   ↓
👤 CLIENT clique "Valider l'audit"
   ↓
💾 UPDATE Audit:
   - status: 'validated_by_client'
   - client_validated_at: timestamp
   ↓
💾 UPDATE ClientProduitEligible:
   - statut: 'validation_finale' (⚠️ = VALIDATION FINALE DU DOSSIER)
   - date_audit_validated_by_client: timestamp
   - current_step: 5
   - progress: 75
   ↓
📅 TIMELINE: "✅ VALIDATION FINALE : Client a validé l'audit"
   - Icon: ✅
   - Color: green
   ↓
🧾 GÉNÉRATION AUTOMATIQUE DE LA FACTURE PROFITUM
   ↓
💾 INSERT invoice (facture Profitum):
   - numero_facture: "PROF-2025-XXXX"
   - client_id: client_id
   - client_produit_eligible_id: dossier_id
   - expert_id: expert_id
   - apporteur_id: apporteur_id (si présent)
   - montant_audit: montantFinal (ex: 75 000 €)
   - taux_compensation_expert: expert.compensation (ex: 10%) ou 20% si NULL
   - montant_ht: montantFinal × taux_compensation
   - tva: montant_ht × 0.20
   - montant_ttc: montant_ht + tva
   - status: 'generated'
   - metadata: {
       dossier_ref,
       expert_name,
       apporteur_name,
       calculation_details
     }
   - created_at: timestamp
   ↓
   SI ERREUR (données manquantes ou calcul impossible):
   ↓
💾 INSERT Facture avec mention erreur:
   - montant_ht: 0
   - montant_ttc: 0
   - status: 'error'
   - error_message: "ERREUR: [détails]"
   - metadata: { error_details, missing_data }
   ↓
📄 PDF Facture généré automatiquement (même si erreur)
   - En-tête Profitum
   - Coordonnées client
   - Référence dossier
   - Expert assigné
   - Apporteur (si présent)
   - Détail calcul OU mention erreur
   - Total HT/TTC OU "ERREUR - Contacter support"
   ↓
📅 TIMELINE: "Facture Profitum générée"
   - Metadata: { facture_id, montant, numero }
   ↓
📧 NOTIFICATION → EXPERT (priorité: high)
   "✅ Audit validé par le client !"
   "💼 Dossier sous votre responsabilité jusqu'au remboursement"
   "🧾 Facture Profitum générée"
   Action: "Voir la facture"
   ↓
📧 NOTIFICATION → APPORTEUR
   "✅ Audit validé pour [Client]"
   "💰 Facture générée - Commission confirmée"
   ↓
📧 NOTIFICATION → ADMIN
   "Audit validé - Facture générée automatiquement"
   "Vérifier facture si erreur de calcul"
```

#### **9.2 Expert prend en charge le dossier**
```
👨‍🔧 EXPERT voit notification "Audit validé"
   ↓
👨‍🔧 EXPERT devient responsable jusqu'au remboursement final
   - Prépare dossier administratif
   - Suit l'avancée
   - Informe le client des étapes
```

---

### **PHASE 10 : ÉTAPE 6 - DEMANDE DE REMBOURSEMENT**

#### **10.1 Préparation du dossier final**
```
👨‍🔧 EXPERT prépare dossier de remboursement :
   - Rassemble tous les documents validés
   - Génère formulaires administratifs
   - Calculs finaux
   - Justificatifs
   ↓
💾 UPDATE ClientProduitEligible:
   - statut: 'preparation_demande'
   - current_step: 6
   - documents_sent: JSONB[] (liste docs envoyés)
   ↓
📅 TIMELINE: "Dossier prêt pour soumission"
```

#### **10.2 Expert soumet le dossier à l'administration**
```
👨‍🔧 EXPERT dans son interface dossier
   ↓
👨‍🔧 Voit bouton [Marquer comme soumis à l'administration]
   ↓
👨‍🔧 Clique sur le bouton
   ↓
📝 Modal :
   - Date de soumission
   - Référence AR (recommandé)
   - Organisme (DGDDI, URSSAF, etc.)
   - Commentaires
   ↓
📤 POST /api/expert/dossier/:id/mark-as-submitted
   {
     submission_date,
     reference,
     organisme,
     notes
   }
   ↓
💾 UPDATE ClientProduitEligible:
   - statut: 'soumis_administration'
   - date_demande_envoyee: submission_date
   - metadata: {
       submission_ref: reference,
       submission_organisme: organisme,
       submission_method: 'expert_declaration'
     }
   ↓
📅 TIMELINE: "📨 Dossier soumis à l'administration"
   - Icon: 📨
   - Color: blue
   - Metadata: { reference, organisme, date }
   ↓
📧 NOTIFICATION → CLIENT (priorité: high)
   "📨 Demande de remboursement envoyée !"
   "Référence: [XXX]"
   "Organisme: [DGDDI/URSSAF/etc.]"
   "Délai estimé: 6-12 mois"
   "Votre expert assure le suivi"
   ↓
📧 NOTIFICATION → APPORTEUR
   "📨 Demande envoyée pour [Client]"
   "Référence: [XXX]"
   ↓
📧 NOTIFICATION → ADMIN
   "Dossier [ID] soumis à l'administration"
   ↓
🔄 Bouton expert change automatiquement →
   [Retour obtenu : Saisir résultat final]
```

#### **10.3 Expert reçoit le retour de l'administration**
```
👨‍🔧 EXPERT reçoit retour administration (6-18 mois plus tard)
   - Email/Courrier de l'administration
   - Montant accordé (peut différer du montant demandé)
   - Décision : Accepté / Partiellement accepté / Refusé
   ↓
👨‍🔧 EXPERT clique [Retour obtenu : Saisir résultat final]
   ↓
📝 Modal :
   - Date de retour
   - Décision: Accepté / Partiel / Refusé
   - Montant RÉEL accordé
   - Motif si différent du montant demandé
   - Documents justificatifs
   ↓
📤 POST /api/expert/dossier/:id/record-final-result
   {
     decision,
     montant_reel_accorde,
     date_retour,
     motif_difference,
     documents
   }
   ↓
💾 UPDATE ClientProduitEligible:
   - statut: 'resultat_obtenu'
   - metadata: {
       administration_decision: decision,
       montant_demande: montantFinal,
       montant_accorde: montant_reel,
       difference: montant_reel - montantFinal,
       date_retour,
       motif_difference
     }
   ↓
📅 TIMELINE: "📋 Retour administration reçu"
   - Icon: 📋
   - Color: decision === 'accepte' ? 'green' : 'orange'
   - Metadata: {
       decision,
       montant_demande,
       montant_accorde,
       difference
     }
   ↓
📧 NOTIFICATION → CLIENT (priorité: high)
   SI ACCEPTÉ TOTAL:
   "✅ Demande acceptée !"
   "Montant accordé: XX €"
   "Prochaine étape: Réception du remboursement"
   
   SI ACCEPTÉ PARTIEL:
   "⚠️ Demande partiellement acceptée"
   "Montant demandé: XX €"
   "Montant accordé: XX €"
   "Différence: -XX €"
   "Motif: [...]"
   
   SI REFUSÉ:
   "❌ Demande refusée"
   "Motif: [...]"
   ↓
📧 NOTIFICATION → APPORTEUR
   "Retour administration pour [Client]"
   "Décision: [...]"
   "Montant: XX €"
   ↓
📧 NOTIFICATION → ADMIN
   "Retour administration - Dossier [ID]"
   "Vérifier cohérence si montant différent"
```

---

### **PHASE 11 : RÉCEPTION DU REMBOURSEMENT**

#### **11.1 Client confirme réception du remboursement** 💰
```
👤 CLIENT reçoit le virement de l'administration
   - Sur son compte bancaire
   - Montant accordé par l'administration
   ↓
👤 CLIENT se connecte → Dossier
   ↓
👤 Voit bouton [Confirmer réception du remboursement]
   ↓
👤 CLIENT clique
   ↓
📝 Modal :
   - Date de réception
   - Montant reçu (pré-rempli si déjà connu)
   - Confirmation
   ↓
📤 POST /api/client/dossier/:id/confirm-payment-received
   { date_reception, montant_reel }
   ↓
💾 UPDATE ClientProduitEligible:
   - statut: 'completed' ✅
   - date_remboursement: date_reception
   - current_step: 6
   - progress: 100
   - metadata: { 
       remboursement_recu: true,
       montant_reel_recu: montant,
       confirme_par_client: true,
       date_confirmation
     }
   ↓
📅 TIMELINE: "🎉 Remboursement reçu et confirmé !"
   - Icon: 💰
   - Color: gold
   - Montant affiché
   ↓
📧 NOTIFICATION → EXPERT (priorité: high)
   "🎉 Remboursement confirmé pour [Client] !"
   "Montant reçu: XX €"
   "💰 Votre commission: XX € (calculée sur montant réel)"
   Action: "Voir détails commissions"
   ↓
📧 NOTIFICATION → APPORTEUR
   "🎉 Remboursement confirmé pour [Client]"
   "💰 Votre commission: XX €"
   Action: "Voir détails commissions"
   ↓
📧 NOTIFICATION → ADMIN
   "✅ Dossier [ID] finalisé avec succès"
   "Montant: XX €"
   "Préparer paiement commissions"
   ↓
💰 Recalcul automatique des commissions sur montant RÉEL:
   - Commission expert = montant_reel × taux_expert
   - Commission apporteur = commission_expert × taux_apporteur
   ↓
💾 UPDATE ApporteurCommission + ExpertCommission:
   - montant_base: montant_reel (actualisé)
   - commission_calculee: recalculée
   - status: 'ready_to_pay'
```

---

### **PHASE 12 : PAIEMENT DES COMMISSIONS**

#### **12.1 Calcul des commissions**
```
💾 Table ApporteurCommission:
   - apporteur_id
   - client_produit_eligible_id
   - montant_final: XX €
   - taux_commission: 10%
   - commission_calculee: XX € × 10%
   - status: 'pending'
   ↓
💾 Table ExpertCommission (similaire):
   - expert_id
   - commission selon grille tarifaire
```

#### **12.2 Admin valide les paiements**
```
👨‍💼 ADMIN → Module "Commissions"
   ↓
👨‍💼 Voit liste commissions à payer
   ↓
👨‍💼 Valide les paiements
   ↓
💾 UPDATE Commissions:
   - status: 'paid'
   - paid_at: timestamp
   - payment_ref: référence virement
   ↓
📧 NOTIFICATION → EXPERT
   "💰 Commission versée : XX €"
   "Référence: [XXX]"
   ↓
📧 NOTIFICATION → APPORTEUR
   "💰 Commission versée : XX €"
   "Référence: [XXX]"
```

---

## 🔀 **CAS PARTICULIERS**

### **CAS 1 : Client sans apporteur (direct)**
```
Même workflow SAUF :
- Pas de notifications apporteur
- metadata.source = 'direct'
- Pas de commission apporteur
```

### **CAS 2 : Expert demande plusieurs fois des documents**
```
Boucle Phase 6-7 :
   Expert demande docs → Client uploade → Expert re-examine
   ↓ (peut se répéter)
   Jusqu'à validation complète
```

### **CAS 3 : Document rejeté remplacé plusieurs fois**
```
Version 1: rejeté (photo floue)
   ↓ parent_document_id
Version 2: rejeté (date illisible)
   ↓ parent_document_id
Version 3: validé ✅
   
Système de versioning :
- Toutes les versions en BDD
- Seule la dernière affichée
- Historique complet conservé
```

### **CAS 4 : Client change d'expert**
```
Avant acceptation expert :
   - Client peut sélectionner un autre expert
   - expert_pending_id mis à jour
   - Ancien expert notifié de l'annulation
   
Après acceptation expert :
   - Changement impossible sauf avec validation admin
```

---

## 📊 **TABLEAU RÉCAPITULATIF DES STATUTS**

| Statut | Phase | Admin | Expert | Apporteur | Client |
|--------|-------|-------|--------|-----------|--------|
| `pending_upload` | 0 | - | - | Peut voir lead | Doit uploader |
| `pending_admin_validation` | 1 | ✅ Doit valider | - | Attend | Attend |
| `admin_validated` | 2 | ✅ Validé | - | ✅ | Doit choisir expert |
| `admin_rejected` | FIN | ❌ Rejeté | - | ❌ | ❌ Fin |
| `expert_pending_acceptance` | 2.5 | Attend | Doit accepter | Attend | Attend |
| `expert_assigned` | 3 | - | ✅ Accepté | ✅ | - |
| `documents_requested` | 3 | - | Attend | - | Doit uploader |
| `documents_completes` | 3 | - | ✅ Validé | ✅ | - |
| `audit_en_cours` | 4 | - | Travaille | Attend | Attend |
| `completed` | FIN | ✅ | ✅ | 💰 | 💰 |

---

## 📅 **TIMELINE COMPLÈTE (Exemple réel)**

```
🕐 01/11/2025 10:30 | 🤝 Apporteur a créé le lead "Entreprise ABC"
🕐 01/11/2025 14:15 | 👤 Client "Entreprise ABC" s'est inscrit
🕐 01/11/2025 14:20 | 👤 Client a uploadé 3 documents
🕐 02/11/2025 09:00 | 👨‍💼 Admin Alexandre a validé l'éligibilité
🕐 02/11/2025 16:45 | 👤 Client a sélectionné l'expert "Cabinet Dupont"
🕐 03/11/2025 08:30 | 👨‍🔧 Expert a accepté le dossier
🕐 03/11/2025 11:00 | 👨‍🔧 Expert a demandé 2 documents complémentaires
🕐 03/11/2025 17:00 | 👤 Client a uploadé les documents demandés
🕐 04/11/2025 09:15 | 👤 Client a validé l'étape 3
🕐 04/11/2025 14:30 | 👨‍🔧 Expert a validé tous les documents
🕐 10/11/2025 10:00 | 👨‍🔧 Expert a envoyé l'audit technique (75 000 €)
🕐 10/11/2025 16:20 | 👤 Client a validé l'audit
🕐 11/11/2025 09:00 | 👨‍💼 Admin a validé définitivement le dossier
🕐 15/11/2025 14:00 | 👨‍🔧 Expert a envoyé la demande de remboursement
🕐 15/06/2026 11:30 | 💰 Remboursement reçu : 75 000 €
🕐 20/06/2026 10:00 | 💰 Commission expert versée : 7 500 €
🕐 20/06/2026 10:00 | 💰 Commission apporteur versée : 750 €
```

---

## 💰 **CALCUL DES COMMISSIONS**

### **Commission Expert (Rémunération Profitum)**
```
Base: montant RÉEL reçu par le client
Taux: Expert.compensation (colonne BDD)
  - Défaut: 30% (0.30) pour nouveaux experts
  - Personnalisable par admin selon contrat expert
Commission Profitum = montant_reel × Expert.compensation

Exemple: 
- Expert avec compensation 30% : 75 000 € × 30% = 22 500 €
- Expert avec compensation 25% : 75 000 € × 25% = 18 750 €
- Expert avec compensation 35% : 75 000 € × 35% = 26 250 €

⚠️ Cette commission = ce que Profitum facture au client
⚠️ L'expert reçoit une partie de cette commission (selon son contrat)
```

### **Commission Apporteur**
```
Base: Commission de l'expert (= Commission Profitum)
Taux: ApporteurAffaires.commission_rate (colonne BDD)
  - Défaut: 10% (0.10) standard
  - Modifiable par admin manuellement pour chaque apporteur
Commission = commission_profitum × taux_apporteur

Exemple:
- Commission Profitum = 22 500 €
- Taux apporteur standard (10%) : 22 500 € × 10% = 2 250 €
- Taux apporteur spécial (15%) : 22 500 € × 15% = 3 375 €
```

### **Calcul automatique dans le système**
```typescript
// Lors de la génération de facture (client valide audit)
const expertCompensation = expert.compensation ?? 0.30; // 30% par défaut
const apporteurRate = apporteur?.commission_rate ?? 0.10; // 10% par défaut

// Commission Profitum (= ce qui est facturé au client)
const commissionProfitum = montantAudit × expertCompensation;

// Commission apporteur (% de la commission Profitum)
const commissionApporteur = commissionProfitum × apporteurRate;

// Facture Profitum
const montant_ht = commissionProfitum;
const tva = montant_ht × 0.20; // TVA 20%
const montant_ttc = montant_ht + tva;

// Sauvegarde BDD
INSERT Facture {
  montant_audit: montantAudit,
  taux_compensation_expert: expertCompensation,
  taux_commission_apporteur: apporteurRate,
  montant_ht: commissionProfitum,
  tva: tva,
  montant_ttc: montant_ttc,
  status: 'generated'
}
```

### **Exemple complet**
```
Dossier TICPE :
- Montant audit validé par client : 75 000 €
- Expert.compensation : 30%
- Apporteur.commission_rate : 10%

Calculs :
1. Commission Profitum = 75 000 € × 30% = 22 500 € HT
2. TVA = 22 500 € × 20% = 4 500 €
3. Total facture client = 27 000 € TTC

4. Commission apporteur = 22 500 € × 10% = 2 250 €

Facture Profitum au client :
- Montant HT : 22 500 €
- TVA 20% : 4 500 €
- Total TTC : 27 000 €

Commissions à verser :
- Expert : (selon contrat avec Profitum)
- Apporteur : 2 250 €
```

---

## 📧 **RÉCAPITULATIF DES NOTIFICATIONS**

| Événement | Client | Expert | Apporteur | Admin |
|-----------|--------|--------|-----------|-------|
| Lead créé | - | - | - | ✅ |
| Client inscrit | ✅ Bienvenue | - | ✅ | ✅ |
| Docs uploadés | - | - | ✅ | ✅ |
| Admin valide | ✅ Éligible | - | ✅ | - |
| Admin rejette | ❌ Non éligible | - | ✅ | - |
| Expert sélectionné | - | ✅ Nouveau dossier | ✅ | ✅ |
| Expert accepte | ✅ | - | ✅ | ✅ |
| Expert refuse | ✅ Choisir autre | - | - | ✅ |
| Docs demandés | ✅ Liste docs | - | ✅ | - |
| Docs uploadés | - | ✅ | ✅ | - |
| Expert valide docs | ✅ | - | ✅ | ✅ |
| Audit envoyé | ✅ Consulter | - | ✅ | - |
| Client valide audit | - | ✅ | ✅ | ✅ |
| Validation finale | ✅ | ✅ | ✅ | - |
| Demande envoyée | ✅ | - | ✅ | ✅ |
| Remboursement reçu | ✅ 🎉 | ✅ 💰 | ✅ 💰 | ✅ |

---

## 🎯 **DURÉES MOYENNES**

| Phase | Acteur | Délai |
|-------|--------|-------|
| Simulation + Inscription | Client | 10-30 min |
| Upload docs pré-éligibilité | Client | 1-2 jours |
| Validation admin | Admin | 24-48h |
| Sélection expert | Client | Quelques heures |
| Acceptation expert | Expert | 24-48h |
| Examen docs + demande complémentaires | Expert | 2-5 jours |
| Upload docs complémentaires | Client | 2-7 jours |
| Validation expert finale | Expert | 1-2 jours |
| Audit technique | Expert | 5-15 jours |
| Validation client audit | Client | 1-3 jours |
| Validation finale admin | Admin | 24-48h |
| Demande remboursement | Expert | 2-5 jours |
| Remboursement administration | État | 6-18 mois |

**Délai total moyen :** 7-30 jours (hors délai administration)

---

## ✅ **INDICATEURS DE SUCCÈS**

### **Client**
- ✅ Dossier finalisé
- ✅ Remboursement reçu
- ✅ Gain financier réalisé
- ✅ Accompagnement expert de qualité

### **Expert**
- ✅ Dossier validé
- ✅ Commission versée
- ✅ Client satisfait
- ✅ Rating maintenu/amélioré

### **Apporteur**
- ✅ Client activé
- ✅ Dossier finalisé
- ✅ Commission versée
- ✅ Relation pérenne

### **Admin**
- ✅ Qualité maintenue
- ✅ Conformité respectée
- ✅ Processus fluide
- ✅ Satisfaction utilisateurs

---

**FIN DU WORKFLOW** 🎊

