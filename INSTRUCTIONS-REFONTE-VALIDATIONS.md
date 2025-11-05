# 🎯 INSTRUCTIONS - REFONTE VALIDATIONS

**Date:** 2025-01-10

---

## 📦 **FICHIERS CRÉÉS**

### **Scripts SQL (à exécuter dans Supabase)**
1. ✅ `AUDIT-BDD-CLIENTPRODUITELIGIBLE.sql` - Audit structure table principale
2. ✅ `AUDIT-BDD-TABLES-VALIDATIONS.sql` - Audit tables liées
3. ✅ `server/migrations/20250110_refonte_validations.sql` - **MIGRATION À EXÉCUTER**

### **Documentation**
4. ✅ `REFONTE-VALIDATIONS-PLAN.md` - Plan détaillé
5. ✅ `REFONTE-VALIDATIONS-SYNTHESE.md` - Synthèse complète
6. ✅ `INSTRUCTIONS-REFONTE-VALIDATIONS.md` - Ce fichier

---

## 🚀 **ÉTAPES À SUIVRE**

### **ÉTAPE 1 : Exécuter la migration SQL** ⚠️

**Dans Supabase SQL Editor :**

1. Ouvrir le fichier `server/migrations/20250110_refonte_validations.sql`
2. Copier tout le contenu
3. Coller dans Supabase SQL Editor
4. **EXÉCUTER** ✅

**Ce que la migration fait :**
- ✅ Ajoute 4 nouveaux champs (admin_eligibility_status, admin_validated_by, expert_validation_status, expert_validated_at)
- ✅ Migre les données depuis `metadata` vers les colonnes
- ✅ Nettoie le champ `statut` (58 dossiers `eligible` → `pending_admin_validation`)
- ✅ Crée les index pour performance
- ✅ Sauvegarde l'ancien statut dans `metadata.old_statut` (rollback possible)

**Sécurité :**
- Aucune donnée n'est supprimée
- L'ancien statut est sauvegardé
- Rollback possible (voir fin du fichier SQL)

---

### **ÉTAPE 2 : Vérifier les résultats**

**Exécuter cette requête dans Supabase :**
```sql
-- Vérifier la distribution des statuts après migration
SELECT 
  statut,
  admin_eligibility_status,
  expert_validation_status,
  COUNT(*) as nombre
FROM "ClientProduitEligible"
GROUP BY statut, admin_eligibility_status, expert_validation_status
ORDER BY COUNT(*) DESC;
```

**Résultat attendu :**
- 4 dossiers avec `admin_eligibility_status = 'validated'`
- 62 dossiers avec `admin_eligibility_status = 'pending'`
- Tous les dossiers avec `expert_validation_status = 'pending'` (car pas encore de validation expert dans les données)

---

### **ÉTAPE 3 : Mettre à jour le Backend (après confirmation)**

**Je vais modifier automatiquement :**

1. **Route Admin** (`server/src/routes/admin.ts`)
   - POST `/api/admin/dossiers/:id/validate-eligibility`
   - Utiliser les nouveaux champs

2. **Route Expert** (`server/src/routes/expert.ts`)
   - POST `/api/expert/dossier/:id/validate-eligibility`
   - Utiliser les nouveaux champs

3. **Autres routes** (recherche globale)
   - Mettre à jour tous les filtres `WHERE statut = 'eligible'`
   - Mettre à jour les conditions sur metadata

4. **Timeline** (`server/src/services/dossier-timeline-service.ts`)
   - Ajouter événements distincts pour validation admin et expert

---

### **ÉTAPE 4 : Mettre à jour le Frontend (après backend)**

**Fichiers à modifier :**
1. Types TypeScript
2. Composants d'affichage (badges, cartes)
3. Logique conditionnelle

---

## ⚠️ **ROLLBACK (En cas de problème)**

**Si quelque chose ne va pas, exécuter dans Supabase :**

```sql
-- Restaurer les anciens statuts
UPDATE "ClientProduitEligible"
SET statut = metadata->>'old_statut'
WHERE metadata->>'old_statut' IS NOT NULL;

-- Supprimer les colonnes ajoutées
ALTER TABLE "ClientProduitEligible"
  DROP COLUMN admin_eligibility_status,
  DROP COLUMN admin_validated_by,
  DROP COLUMN expert_validation_status,
  DROP COLUMN expert_validated_at;
```

---

## 📊 **MAPPING DES STATUTS**

### **Anciens → Nouveaux**

| Ancien statut          | Nouveau statut global        | admin_status | expert_status |
|------------------------|------------------------------|--------------|---------------|
| `eligible`             | `pending_admin_validation`   | `pending`    | `pending`     |
| `documents_uploaded`   | `pending_admin_validation`   | `pending`    | `pending`     |
| `eligibility_validated`| `admin_validated`            | `validated`  | `pending`     |
| `documents_manquants`  | `documents_requested`        | `validated`  | `documents_requested` |
| `en_cours` (avec expert) | `expert_assigned`          | `validated`  | `pending`     |

---

## ✅ **CHECKLIST**

- [ ] Migration SQL exécutée dans Supabase
- [ ] Résultats vérifiés (requête de vérification)
- [ ] Confirmation OK pour mettre à jour le code
- [ ] Backend mis à jour (routes admin + expert)
- [ ] Frontend mis à jour (types + composants)
- [ ] Tests end-to-end
- [ ] Commit + Push

---

## 🎯 **ACTION IMMÉDIATE**

**→ Exécuter `server/migrations/20250110_refonte_validations.sql` dans Supabase**

**Ensuite me confirmer :** 
- "Migration exécutée ✅" 
- Ou me donner le message d'erreur si problème

Je prendrai ensuite le relais pour mettre à jour tout le code ! 🚀

