# 🎯 ARCHITECTURE DOCUMENTAIRE OPTIMALE - PROPOSITION

## ✅ **MES RÉPONSES AUX QUESTIONS**

### **🎯 Q1 : UNIFICATION**

**Q1.1:** Unifier GED + documentation_items ?
```
✅ RÉPONSE: A - Oui, tout dans GEDDocument
```

**Raison:**
- GEDDocument est **le plus complet** (permissions, versioning, labels, favoris)
- documentation_items a des features intéressantes (SEO, helpful) mais moins structuré
- On peut migrer les bonnes idées de documentation_items vers GEDDocument

**Q1.2:** Table admin_documents (vide) ?
```
✅ RÉPONSE: A - Supprimer (doublon inutile)
```

**Raison:**
- 0 ligne actuellement
- Doublon de GEDDocument
- Simplifie l'architecture

---

### **📁 Q2 : DOCUMENTS PROCESS CLIENTS**

**Q2.1:** Types de documents clients
```
✅ RÉPONSE: Liste complète (basée sur vos workflows SQL)
```

**Documents Process Dossiers (par workflow):**
```
1. CGV Profitum (workflow-01)
2. Rapport Simulation (workflow-02)
3. Rapport Pré-Éligibilité (workflow-03)
4. Rapport Éligibilité Expert (workflow-04)
5. Bon de Commande (workflow-05)
6. Facture (workflow-06)
7. Documents Suivi Administratif (workflow-07)
8. Documents Remboursement (workflow-08)

Documents Complémentaires:
9. Justificatifs client (KBIS, bilans, etc.)
10. Documents signés (contrats, mandats)
11. Rapports audit (énergie, fiscal, social)
12. Factures reçues (paiements clients)
```

**Q2.2:** Liés à quelle table ?
```
✅ RÉPONSE: D - Créer table ClientProcessDocument
```

**Structure proposée:**
```sql
CREATE TABLE ClientProcessDocument (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES Client(id) ON DELETE CASCADE,
  produit_id UUID REFERENCES ProduitEligible(id),
  workflow_step VARCHAR(50), -- 'cgv', 'simulation', 'facture', etc.
  document_type VARCHAR(100), -- Type précis
  filename VARCHAR(255),
  storage_path VARCHAR(500), -- Chemin dans bucket
  bucket_name VARCHAR(100), -- 'client-documents', 'rapports', etc.
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_by UUID, -- Admin, Expert, ou Client
  uploaded_by_type VARCHAR(20), -- 'admin', 'expert', 'client'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'validated', 'rejected'
  validated_by UUID,
  validated_at TIMESTAMP,
  metadata JSONB, -- Infos supplémentaires
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Raison:**
- Lie fichiers Storage aux Clients/Produits
- Traçabilité complète (qui a uploadé, validé)
- Statut workflow
- Flexible avec metadata JSONB

**Q2.3:** Affichage prioritaire
```
✅ RÉPONSE: D - Dashboard avec stats + accès rapide
```

**Puis vue détaillée avec filtres multiples (Client + Type + Produit)**

---

### **📖 Q3 : DOCUMENTATION APP**

**Q3.1:** Quelle table ?
```
✅ RÉPONSE: A - GEDDocument (système complet avec permissions)
```

**Mais enrichir avec colonnes de documentation_items:**
```sql
ALTER TABLE GEDDocument ADD COLUMN IF NOT EXISTS:
- slug VARCHAR(255) UNIQUE -- Pour URLs
- meta_description TEXT -- SEO
- tags TEXT[] -- Tags flexibles
- is_published BOOLEAN DEFAULT false
- is_featured BOOLEAN DEFAULT false
- view_count INTEGER DEFAULT 0
- helpful_count INTEGER DEFAULT 0
- not_helpful_count INTEGER DEFAULT 0
```

**Q3.2:** Catégories documentation
```
✅ RÉPONSE: Liste optimale pour Profitum
```

**Catégories:**
```
1. Guides Utilisateurs
   ├─ Guide Client (comment utiliser dashboard, documents, etc.)
   ├─ Guide Expert (valider dossiers, contacter clients)
   ├─ Guide Apporteur (créer prospects, suivi commissions)
   └─ Guide Admin (gestion plateforme)

2. FAQ (Questions Fréquentes)
   ├─ FAQ Générale (pour tous)
   ├─ FAQ Technique (problèmes connexion, bugs)
   └─ FAQ par Produit (CIR, TICPE, URSSAF...)

3. Tutoriels Vidéo
   ├─ Onboarding (premiers pas)
   ├─ Fonctionnalités avancées
   └─ Liens YouTube/Vimeo

4. Documentation Technique
   ├─ Documentation API (pour devs)
   ├─ Schémas BDD
   └─ Architecture système

5. Procédures Internes
   ├─ Procédures admin (validation dossiers)
   ├─ Procédures experts (workflow)
   └─ Checklists qualité

6. Changelog
   ├─ Historique mises à jour
   ├─ Nouvelles fonctionnalités
   └─ Corrections bugs

7. Templates & Modèles
   ├─ Templates emails
   ├─ Templates documents
   └─ Scripts de vente
```

**Q3.3:** Qui crée/modifie ?
```
✅ RÉPONSE: B - Admin + Experts (pour docs métier)
```

**Raison:**
- Admin : Toute la documentation
- Experts : Peuvent contribuer FAQ, guides métier (avec validation admin)
- Clients/Apporteurs : Lecture seule

---

### **🎨 Q4 : PAGE ADMIN UNIFIÉE**

**Q4.1:** Structure de la page
```
✅ RÉPONSE: A - 1 page avec onglets (comme Messagerie Admin)
```

**Structure proposée:**
```
Page: /admin/documents (unifiée)

┌──────────────────────────────────────────────────────────────┐
│  📚 Gestion Documentaire Profitum                            │
│  ──────────────────────────────────────────────────────────  │
│  [📁 Docs Process] [📖 Documentation] [📊 Statistiques]     │
└──────────────────────────────────────────────────────────────┘
```

**Raison:**
- Cohérent avec Messagerie Admin (1 page, plusieurs onglets)
- Tout centralisé
- Navigation rapide
- Vue d'ensemble facile

**Q4.2:** Vues d'affichage
```
✅ RÉPONSE: D - Les 3 vues avec sélecteur (comme Agenda)
```

**Vues:**
```
Tab "Docs Process":
  [📋 Liste] [🖼️ Grille] [🗂️ Arborescence]
  
Tab "Documentation":
  [📋 Liste] [🖼️ Grille]
  
Tab "Statistiques":
  Dashboard fixe
```

**Raison:**
- Cohérent avec Agenda (2 vues Liste/Calendrier)
- Flexibilité utilisateur
- Vue Arborescence utile pour docs clients (par client → par produit)

---

### **⚙️ Q5 : FONCTIONNALITÉS**

**Q5.1:** Actions admin sur documents clients
```
✅ RÉPONSE: Actions cochées
```

**Prioritaires:**
```
☑ Voir liste tous documents
☑ Filtrer par client
☑ Filtrer par type (CGV, facture, etc.)
☑ Filtrer par produit (CIR, TICPE, etc.)
☑ Recherche globale
☑ Upload nouveau document
☑ Download document
☑ Supprimer document
☑ Statistiques (uploads, downloads)
☑ Validation (approuver/rejeter) si workflow nécessite
```

**Non prioritaires (peut-être V2):**
```
□ Renommer document (risque incohérence)
□ Déplacer vers autre client (dangereux)
```

**Q5.2:** Actions admin sur documentation app
```
✅ RÉPONSE: Actions cochées
```

**Prioritaires:**
```
☑ Créer nouveau guide/FAQ
☑ Modifier contenu
☑ Publier/Dépublier
☑ Définir permissions (qui voit)
☑ Ajouter tags/labels
☑ Upload PDF/fichiers (pour guides PDF)
☑ Statistiques (vues, helpful)
```

**Peut-être V2:**
```
□ Archiver (ou juste dépublier suffit ?)
□ Versioning (historique) - déjà dans GEDDocumentVersion
```

---

### **🔐 Q6 : PERMISSIONS**

**Q6.1:** Permissions documentation app
```
✅ RÉPONSE: A - Système GEDDocumentPermission (granulaire)
```

**Mais simplifié avec presets:**
```
Presets rapides:
├─ "Public" → Tous (Client, Expert, Apporteur, Admin)
├─ "Apporteurs" → Apporteurs + Admin
├─ "Experts" → Experts + Admin
├─ "Clients" → Clients + Admin
└─ "Admin only" → Admin uniquement

+ Option "Custom" pour définir manuellement
```

**Raison:**
- Flexibilité maximale
- Presets pour rapidité
- Custom pour cas spéciaux
- Utilise table existante GEDDocumentPermission

---

## 🏗️ **ARCHITECTURE FINALE PROPOSÉE**

### **✅ OPTION A OPTIMISÉE (Ma recommandation)**

```
╔═══════════════════════════════════════════════════════════════╗
║  /admin/documents - GESTION DOCUMENTAIRE UNIFIÉE              ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║  📊 KPI Rapides:                                              ║
║  [📁 125 Docs] [⬆️ 12 ce mois] [⬇️ 456 downloads] [👥 89 users]║
║                                                                ║
║  ┌──────────────────────────────────────────────────────────┐ ║
║  │ [📁 Process Clients] [📖 Documentation] [📊 Stats]       │ ║
║  └──────────────────────────────────────────────────────────┘ ║
╚═══════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════
TAB 1️⃣ : DOCUMENTS PROCESS CLIENTS
═══════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────┐
│  🔍 [Rechercher...] [Client ▼] [Type ▼] [Produit ▼] [⬆️ Upload]│
│  Vues: [📋 Liste] [🖼️ Grille] [🗂️ Arborescence]              │
└──────────────────────────────────────────────────────────────┘

Vue Arborescence (par défaut):
┌──────────────────────────────────────────────────────────────┐
│  📁 Clients                                                   │
│  ├─ 📂 Alexandre Grandjean (Profitum SAS)                    │
│  │   ├─ 🎯 CIR - Crédit Impôt Recherche                     │
│  │   │   ├─ 📄 CGV-Profitum-20250110.pdf (Validé ✓)        │
│  │   │   ├─ 📄 Rapport-Simulation-CIR.pdf                   │
│  │   │   └─ 📄 Facture-CIR-001.pdf                          │
│  │   └─ 🎯 TICPE - Taxe Carburant                           │
│  │       └─ 📄 Rapport-Eligibilite-TICPE.pdf (En attente)   │
│  │                                                            │
│  └─ 📂 Marie Dupont (Entreprise X)                           │
│      └─ 🎯 URSSAF                                            │
│          └─ 📄 Rapport-Audit-Social.pdf                      │
└──────────────────────────────────────────────────────────────┘

Vue Liste:
┌──────────────────────────────────────────────────────────────┐
│ Document          | Client    | Produit | Type    | Date     │
├───────────────────────────────────────────────────────────────┤
│ 📄 CGV-Profitum   | A.Grand.  | CIR     | CGV     | 10/10/25 │
│ 📄 Rapport-Simul  | A.Grand.  | CIR     | Rapport | 09/10/25 │
│ 📄 Facture-001    | M.Dupont  | URSSAF  | Facture | 08/10/25 │
└──────────────────────────────────────────────────────────────┘

Table: ClientProcessDocument (nouvelle)
Storage: Buckets existants (client-documents, rapports, factures)


═══════════════════════════════════════════════════════════════
TAB 2️⃣ : DOCUMENTATION APP
═══════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────────────────────┐
│  🔍 [Rechercher...] [Catégorie ▼] [Permissions ▼] [+ Nouveau]│
│  Vues: [📋 Liste] [🖼️ Grille]                                │
└──────────────────────────────────────────────────────────────┘

Vue Liste (avec permissions visuelles):
┌──────────────────────────────────────────────────────────────┐
│ Titre                     | Catégorie | Permissions | Vues   │
├───────────────────────────────────────────────────────────────┤
│ 📖 Guide Créer Prospect   | Guides    | 🟣 Apport.  | 245    │
│ ❓ FAQ Connexion          | FAQ       | 🌐 Public   | 1,234  │
│ 🎥 Tutoriel Dashboard     | Vidéo     | 🔵 Clients  | 567    │
│ 🔧 Documentation API      | Tech      | 🔴 Admin    | 89     │
└──────────────────────────────────────────────────────────────┘

Table: GEDDocument (enrichie)
Permissions: GEDDocumentPermission (avec presets)


═══════════════════════════════════════════════════════════════
TAB 3️⃣ : STATISTIQUES
═══════════════════════════════════════════════════════════════

Dashboard:
┌──────────────────────────────────────────────────────────────┐
│  📊 Documents Process Clients                                │
│  ├─ Total: 125 documents                                     │
│  ├─ Uploads ce mois: 12                                      │
│  ├─ Par type: CGV (45), Rapports (38), Factures (22)...     │
│  └─ Par produit: CIR (34), TICPE (28), URSSAF (21)...       │
│                                                               │
│  📖 Documentation App                                        │
│  ├─ Total: 47 guides/FAQ                                     │
│  ├─ Publiés: 35 | Brouillons: 12                             │
│  ├─ Vues totales: 12,456                                     │
│  └─ Top 5 consultés                                          │
│                                                               │
│  👥 Activité Utilisateurs                                    │
│  └─ Derniers uploads, consultations, validations             │
└──────────────────────────────────────────────────────────────┘
```

---

### **Q2.3:** Affichage docs process
```
✅ RÉPONSE: D - Dashboard + accès rapide
```

**Puis filtres multiples** (Client + Type + Produit + Date + Statut)

---

### **Q3.3:** Qui crée/modifie docs app
```
✅ RÉPONSE: B - Admin + Experts
```

**Workflow:**
```
Admin:
- Crée/Modifie toute documentation
- Publie/Dépublie
- Définit permissions
- Valide contributions experts

Expert:
- Peut créer docs métier (guides produit, FAQ)
- Statut "brouillon" par défaut
- Admin valide avant publication
```

---

### **Q6.1:** Permissions
```
✅ RÉPONSE: A - Granulaire avec GEDDocumentPermission
```

**Mais avec PRESETS pour simplicité:**
```
Interface admin:
┌──────────────────────────────────────────────────────────────┐
│  Qui peut voir ce document ?                                 │
│  ○ Public (Tous)                                             │
│  ○ Clients uniquement                                        │
│  ○ Experts uniquement                                        │
│  ● Apporteurs uniquement                                     │
│  ○ Admin uniquement                                          │
│  ○ Custom (définir manuellement) ▼                           │
│     ☑ Clients  ☑ Experts  ☐ Apporteurs  ☑ Admin             │
└──────────────────────────────────────────────────────────────┘
```

---

## 🗂️ **STRUCTURE BDD FINALE**

### **Tables à CONSERVER & OPTIMISER:**

```sql
✅ GEDDocument (enrichie)
   → Documentation app (guides, FAQ, tutoriels)
   → Ajout colonnes: slug, tags, is_published, view_count, helpful_count

✅ GEDDocumentPermission
   → Permissions granulaires par user_type

✅ GEDDocumentVersion
   → Historique modifications

✅ GEDDocumentLabel
   → Tags/labels organisation

✅ ClientProcessDocument (à créer)
   → Fichiers process clients (CGV, factures, rapports)
   → Lien Storage buckets

✅ DocumentActivity
   → Log activités (upload, download, validation)
```

### **Tables à MIGRER puis SUPPRIMER:**

```sql
⚠️ documentation_items → Migrer vers GEDDocument
   - Copier les 16 items existants (si existent)
   - Mapper: title, content, slug, tags, is_published, view_count

⚠️ documentation_categories → Migrer vers GEDDocumentLabel
   - Transformer en labels

⚠️ documentation → Migrer vers DocumentActivity
   - Historique consultations

❌ admin_documents → Supprimer (vide, doublon)

⚠️ document_sections → À analyser (10 colonnes, usage ?)
```

---

## 🎨 **INTERFACE PROPOSÉE (Type Agenda)**

### **Design cohérent avec Agenda/Messagerie:**

```
╔═══════════════════════════════════════════════════════════════╗
║  📚 Gestion Documentaire                    [+ Upload] [⚙️]   ║
╠═══════════════════════════════════════════════════════════════╣
║  📊 125 docs | ⬆️ 12 ce mois | ⬇️ 456 DL | 👥 89 users      ║
╠═══════════════════════════════════════════════════════════════╣
║  [📁 Docs Process] [📖 Documentation] [📊 Statistiques]      ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║  TAB ACTIF: Docs Process                                      ║
║  ─────────────────────────────────────────────────────────    ║
║                                                                ║
║  🔍 [Rechercher...]  [Client ▼] [Type ▼] [Produit ▼]         ║
║  Vues: [📋 Liste] [🖼️ Grille] [🗂️ Arborescence]              ║
║                                                                ║
║  ┌──────────────────────────────────────────────────────────┐ ║
║  │  📂 Alexandre Grandjean (Profitum SAS)                  │ ║
║  │  ├─ 🎯 CIR                                              │ ║
║  │  │   ├─ 📄 CGV-Profitum.pdf [✓ Validé] [👁️] [⬇️]      │ ║
║  │  │   └─ 📄 Rapport-Simulation.pdf [⏳] [👁️] [⬇️]        │ ║
║  │  └─ 🎯 TICPE                                            │ ║
║  │      └─ 📄 Rapport-Eligibilite.pdf [👁️] [⬇️]           │ ║
║  └──────────────────────────────────────────────────────────┘ ║
║                                                                ║
║  (Animations framer-motion comme Agenda)                      ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 📋 **PLAN D'ACTION PROPOSÉ**

### **Phase 1️⃣ : Nettoyage BDD (Script SQL)**
```sql
1. Migrer documentation_items → GEDDocument
2. Migrer documentation_categories → GEDDocumentLabel  
3. Migrer documentation → DocumentActivity
4. Supprimer admin_documents (vide)
5. Créer ClientProcessDocument
6. Enrichir GEDDocument (colonnes supplémentaires)
```

### **Phase 2️⃣ : Backend**
```typescript
Routes à créer/optimiser:
1. GET /api/admin/documents/process (liste fichiers clients)
2. POST /api/admin/documents/process/upload
3. GET /api/admin/documents/process/:id/download
4. DELETE /api/admin/documents/process/:id
5. PUT /api/admin/documents/process/:id/validate

6. GET /api/admin/documentation (guides, FAQ)
7. POST /api/admin/documentation (créer)
8. PUT /api/admin/documentation/:id
9. POST /api/admin/documentation/:id/publish
10. PUT /api/admin/documentation/:id/permissions

11. GET /api/admin/documents/stats (statistiques)
```

### **Phase 3️⃣ : Frontend**
```typescript
Composant principal:
└─ client/src/pages/admin/documents-unified.tsx

Sous-composants:
├─ DocumentsProcessTab.tsx (docs clients)
├─ DocumentationAppTab.tsx (guides/FAQ)
├─ DocumentsStatsTab.tsx (statistiques)
└─ DocumentUploadModal.tsx (upload)

Réutiliser:
├─ UnifiedAgendaView pattern (3 vues)
├─ OptimizedMessagingApp pattern (onglets)
└─ Animations framer-motion cohérentes
```

### **Phase 4️⃣ : Tests & Documentation**
```
1. Tests upload/download
2. Tests permissions
3. Tests filtres
4. Documentation admin
```

---

## ✅ **VALIDATION REQUISE**

**Êtes-vous d'accord avec :**

1. ✅ Unifier vers GEDDocument (enrichi)
2. ✅ Créer table ClientProcessDocument
3. ✅ Supprimer admin_documents
4. ✅ Migrer documentation_items → GEDDocument
5. ✅ 1 page avec 3 onglets (Process | Documentation | Stats)
6. ✅ 3 vues (Liste | Grille | Arborescence) pour Process
7. ✅ 2 vues (Liste | Grille) pour Documentation
8. ✅ Permissions granulaires avec presets
9. ✅ Design type Agenda/Messagerie (cohérent)
10. ✅ Animations framer-motion

**12 types de documents clients:**
```
1. CGV Profitum
2. Rapport Simulation
3. Rapport Pré-Éligibilité
4. Rapport Éligibilité Expert
5. Bon de Commande
6. Facture
7. Documents Suivi Admin
8. Documents Remboursement
9. Justificatifs (KBIS, bilans)
10. Contrats signés
11. Rapports audit
12. Factures reçues
```

**7 catégories documentation app:**
```
1. Guides Utilisateurs (Client, Expert, Apporteur, Admin)
2. FAQ (Générale, Technique, Par produit)
3. Tutoriels Vidéo
4. Documentation Technique (API, BDD)
5. Procédures Internes
6. Changelog
7. Templates & Modèles
```

---

## 🚀 **SI VALIDÉ, JE CRÉERAI:**

```
1. Script SQL migration complet (exécution guidée)
2. Table ClientProcessDocument
3. Enrichissement GEDDocument
4. Page admin/documents-unified.tsx
5. Routes backend optimisées
6. Documentation complète

Temps estimé: 90-120 minutes
```

---

**👉 VALIDEZ-VOUS CET PLAN ? (Oui / Modifications nécessaires)**

