# 🔄 REFONTE COMPLÈTE DES VALIDATIONS

**Date:** 2025-01-10  
**Objectif:** Séparer clairement les validations Admin et Expert avec des champs dédiés

---

## 📋 **ÉTAPE 1 : AUDIT DE LA BDD (EN COURS)**

### Scripts créés :
1. ✅ `AUDIT-BDD-CLIENTPRODUITELIGIBLE.sql` - Structure détaillée de la table principale
2. ✅ `AUDIT-BDD-TABLES-VALIDATIONS.sql` - Toutes les tables liées aux validations

### À exécuter :
```bash
# Dans Supabase SQL Editor, exécuter les deux scripts pour obtenir :
# 1. Structure actuelle de ClientProduitEligible
# 2. Valeurs du champ statut (toutes les variantes)
# 3. Structure du metadata JSONB
# 4. Tables et colonnes liées
# 5. Impact de la migration
```

---

## 🎯 **FLUX MÉTIER CIBLE**

### **Étape 1 : Upload documents (Client)**
→ `statut: 'pending_admin_validation'`

### **Étape 1.5 : Validation Admin**
- Admin examine les documents
- Si OK → `admin_eligibility_status: 'validated'` + `statut: 'admin_validated'`
- Si KO → `admin_eligibility_status: 'rejected'` + `statut: 'admin_rejected'`

### **Étape 2 : Sélection Expert (Client)**
- Client sélectionne un expert
- Expert accepte → `statut: 'expert_assigned'`

### **Étape 3 : Validation Expert des docs pré-éligibilité**
- Expert examine TOUS les documents (pré-éligibilité + complémentaires)
- Si OK → `expert_validation_status: 'validated'` + `statut: 'expert_validated'`
- Si KO ou demande docs → `expert_validation_status: 'documents_requested'` + demande de docs complémentaires

### **Étape 3+ : Collecte documents complémentaires**
- Client uploade les docs demandés
- Expert valide → `statut: 'documents_completes'`

### **Étape 4+ : Suite du workflow**
- `statut: 'en_cours'` (Audit technique)
- Puis étapes finales...

---

## 🗄️ **STRUCTURE BDD PROPOSÉE**

### **Table : ClientProduitEligible**

#### **Nouveaux champs à ajouter :**
```sql
-- Validation Admin (Pré-éligibilité)
admin_eligibility_status VARCHAR(50) DEFAULT 'pending',
  -- Valeurs: 'pending', 'validated', 'rejected'
admin_validated_at TIMESTAMP,
admin_validated_by UUID REFERENCES "Admin"(id),
admin_validation_notes TEXT,

-- Validation Expert (Validation finale docs)
expert_validation_status VARCHAR(50) DEFAULT 'pending',
  -- Valeurs: 'pending', 'validated', 'rejected', 'documents_requested'
expert_validated_at TIMESTAMP,
expert_validation_notes TEXT,
```

#### **Champ statut - Valeurs clarifiées :**
```sql
statut VARCHAR(100) NOT NULL DEFAULT 'pending_upload',
  -- Valeurs possibles :
  -- 'pending_upload'           Client uploade docs (Étape 1)
  -- 'pending_admin_validation' En attente validation admin
  -- 'admin_validated'          ✅ Admin a validé → Étape 2
  -- 'admin_rejected'           ❌ Admin a rejeté
  -- 'expert_selection'         Client sélectionne expert
  -- 'expert_pending'           Expert pas encore accepté
  -- 'expert_assigned'          Expert a accepté
  -- 'pending_expert_validation' Expert examine les docs
  -- 'expert_validated'         ✅ Expert a validé docs pré-éligibilité
  -- 'expert_rejected'          ❌ Expert a rejeté
  -- 'documents_requested'      Expert demande docs complémentaires
  -- 'documents_pending'        Client uploade docs complémentaires
  -- 'documents_completes'      ✅ Tous docs validés par expert
  -- 'audit_en_cours'           Étape 4 - Audit technique
  -- 'validation_finale'        Étape 5
  -- 'en_attente_remboursement' Étape 6
  -- 'completed'                Dossier finalisé
  -- 'cancelled'                Annulé
```

#### **Champ metadata - Nettoyage :**
```sql
-- Supprimer de metadata :
-- - eligibility_validation (remplacé par admin_eligibility_status)
-- - validation_state (remplacé par expert_validation_status)

-- Garder dans metadata :
-- - Informations métier spécifiques
-- - Données de simulation
-- - Notes diverses
```

---

## 📝 **MIGRATION SQL**

### **Fichier à créer : `20250110_refonte_validations.sql`**

```sql
-- 1. Ajouter les nouveaux champs
ALTER TABLE "ClientProduitEligible"
  ADD COLUMN admin_eligibility_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN admin_validated_at TIMESTAMP,
  ADD COLUMN admin_validated_by UUID REFERENCES "Admin"(id),
  ADD COLUMN admin_validation_notes TEXT,
  ADD COLUMN expert_validation_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN expert_validated_at TIMESTAMP,
  ADD COLUMN expert_validation_notes TEXT;

-- 2. Migrer les données existantes depuis metadata vers les nouveaux champs
UPDATE "ClientProduitEligible"
SET 
  admin_eligibility_status = CASE
    WHEN metadata->>'eligibility_validation'->>'status' = 'validated' THEN 'validated'
    WHEN metadata->>'eligibility_validation'->>'status' = 'rejected' THEN 'rejected'
    ELSE 'pending'
  END,
  admin_validated_at = (metadata->'eligibility_validation'->>'validated_at')::timestamp,
  expert_validation_status = CASE
    WHEN metadata->>'validation_state' = 'eligibility_validated' THEN 'validated'
    WHEN metadata->>'validation_state' = 'rejected' THEN 'rejected'
    ELSE 'pending'
  END
WHERE metadata IS NOT NULL;

-- 3. Nettoyer le champ statut
-- (À faire après vérification des valeurs actuelles avec l'audit)

-- 4. Créer des index
CREATE INDEX idx_cpe_admin_status ON "ClientProduitEligible"(admin_eligibility_status);
CREATE INDEX idx_cpe_expert_status ON "ClientProduitEligible"(expert_validation_status);
CREATE INDEX idx_cpe_statut ON "ClientProduitEligible"(statut);

-- 5. Ajouter des commentaires
COMMENT ON COLUMN "ClientProduitEligible".admin_eligibility_status IS 'Statut validation admin (pending/validated/rejected)';
COMMENT ON COLUMN "ClientProduitEligible".expert_validation_status IS 'Statut validation expert (pending/validated/rejected/documents_requested)';
```

---

## 🔧 **ROUTES À METTRE À JOUR**

### **Backend :**
1. ✅ `/api/admin/dossiers/:id/validate-eligibility` - Utiliser les nouveaux champs
2. ✅ `/api/expert/dossier/:id/validate-eligibility` - Utiliser les nouveaux champs
3. ⚠️ Toutes les routes qui lisent/filtrent sur `statut`
4. ⚠️ Routes qui lisent `metadata.eligibility_validation`
5. ⚠️ Routes qui lisent `metadata.validation_state`

### **Frontend :**
1. Composants qui affichent le statut
2. Filtres par statut
3. Logique conditionnelle basée sur le statut

---

## 📊 **TIMELINE - Événements à ajouter**

```typescript
// Admin valide
DossierTimelineService.adminEligibiliteValidee({
  dossier_id,
  admin_name,
  notes
});

// Expert valide
DossierTimelineService.expertDocumentsValides({
  dossier_id,
  expert_name,
  documents_count
});
```

---

## ✅ **CHECKLIST DE LA REFONTE**

### **Phase 1 : Audit (EN COURS)**
- [ ] Exécuter `AUDIT-BDD-CLIENTPRODUITELIGIBLE.sql`
- [ ] Exécuter `AUDIT-BDD-TABLES-VALIDATIONS.sql`
- [ ] Analyser les résultats
- [ ] Lister toutes les valeurs de `statut` actuellement en BDD
- [ ] Identifier les dossiers en cours (à ne pas casser)

### **Phase 2 : Migration BDD**
- [ ] Créer le fichier de migration SQL
- [ ] Tester sur environnement de dev
- [ ] Vérifier l'intégrité des données
- [ ] Exécuter en prod

### **Phase 3 : Backend**
- [ ] Mettre à jour route admin validation
- [ ] Mettre à jour route expert validation
- [ ] Mettre à jour toutes les routes qui filtrent sur statut
- [ ] Ajouter événements timeline
- [ ] Tests

### **Phase 4 : Frontend**
- [ ] Mettre à jour les types TypeScript
- [ ] Mettre à jour les composants d'affichage
- [ ] Mettre à jour les filtres
- [ ] Tests

### **Phase 5 : Vérification**
- [ ] Tests end-to-end
- [ ] Vérifier que rien n'est cassé
- [ ] Commit + Push

---

## 🚀 **PROCHAINES ÉTAPES**

1. **Vous devez exécuter les 2 scripts SQL dans Supabase**
2. Me donner les résultats (notamment les valeurs du champ `statut`)
3. Je vais créer la migration SQL complète
4. Puis on mettra à jour le code

**Fichiers à exécuter dans Supabase SQL Editor :**
- `AUDIT-BDD-CLIENTPRODUITELIGIBLE.sql`
- `AUDIT-BDD-TABLES-VALIDATIONS.sql`

---

**Note :** Cette refonte va toucher beaucoup de code, mais c'est nécessaire pour avoir une structure propre et maintenable ! 🎯

