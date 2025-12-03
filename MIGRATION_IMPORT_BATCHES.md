# Migration: Système de Listes d'Import pour Prospects

## 📋 Vue d'ensemble

Cette migration ajoute la fonctionnalité de groupement des prospects par liste d'import, permettant :
- ✅ Lier chaque prospect à son import d'origine
- ✅ Afficher les prospects groupés par liste
- ✅ Générer des emails par IA avec contexte personnalisé
- ✅ Supprimer en masse les prospects sélectionnés
- ✅ Différencier visuellement les imports

---

## 🗄️ Modifications de la Base de Données

### 1. Migration SQL à exécuter

Fichier: `/server/migrations/20251202_add_import_batch_to_prospects.sql`

```sql
-- Ajouter la colonne import_batch_id à la table prospects
ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS import_batch_id UUID REFERENCES import_history(id) ON DELETE SET NULL;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_prospects_import_batch 
ON prospects(import_batch_id) 
WHERE import_batch_id IS NOT NULL;

-- Ajouter un commentaire pour documentation
COMMENT ON COLUMN prospects.import_batch_id IS 'Référence vers l''import d''origine du prospect. Permet de regrouper les prospects par liste d''import.';
```

### 2. Exécution de la migration

Sur votre serveur Supabase, exécutez le fichier SQL ci-dessus via l'éditeur SQL de Supabase.

---

## 🔧 Modifications Backend

### Fichiers modifiés :

1. **`/server/src/types/prospects.ts`**
   - ✅ Ajout du champ `import_batch_id` dans l'interface `Prospect`
   - ✅ Ajout du champ `import_batch_id` dans `CreateProspectInput`

2. **`/server/src/services/ProspectService.ts`**
   - ✅ Ajout du support de `import_batch_id` dans `createProspect`
   - ✅ Ajout du support de `import_batch_id` dans `createBulkProspects`
   - ✅ Nouvelle méthode : `bulkDeleteProspects()` pour suppression en masse
   - ✅ Nouvelle méthode : `getImportBatchesWithStats()` pour récupérer les listes

3. **`/server/src/routes/admin-import-prospects.ts`**
   - ✅ Modification de l'API d'import pour lier les prospects à leur import

4. **`/server/src/routes/prospects.ts`**
   - ✅ Nouvelle route : `POST /api/prospects/generate-ai-email` - Génération d'email par IA
   - ✅ Nouvelle route : `DELETE /api/prospects/bulk-delete` - Suppression en masse
   - ✅ Nouvelle route : `GET /api/prospects/import-batches` - Liste des imports

---

## 🎨 Modifications Frontend

### Fichier modifié : `/client/src/pages/admin/prospection.tsx`

#### Nouvelles fonctionnalités :

### 1. **Modal d'envoi d'email amélioré avec IA**
- Section de génération automatique par IA
- Contexte personnalisable pour l'IA
- Bouton "Générer avec l'IA"
- Génération du sujet et du corps d'email

### 2. **Bouton de suppression en masse**
- Bouton "Supprimer la sélection" dans la barre d'actions
- Confirmation avant suppression
- Supprime les prospects et leurs emails associés

### 3. **Vue groupée par liste d'import**
- Bouton de bascule entre "Liste complète" et "Par liste d'import"
- Affichage des listes avec :
  - Nom du fichier
  - Date d'upload
  - Nombre de prospects
  - Statut de l'import
- Sections déroulables (clic pour expand/collapse)
- Design moderne avec dégradés

#### États ajoutés :
```typescript
const [importBatches, setImportBatches] = useState<any[]>([]);
const [expandedBatchIds, setExpandedBatchIds] = useState<Set<string>>(new Set());
const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');
const [generatingBulkEmail, setGeneratingBulkEmail] = useState(false);
const [aiContextBulkEmail, setAiContextBulkEmail] = useState('');
```

---

## 🚀 APIs Ajoutées

### 1. Génération d'email par IA
```
POST /api/prospects/generate-ai-email
Body: {
  prospects: Array<{ id, company_name, firstname, lastname, ... }>,
  context: string
}
Response: {
  success: boolean,
  data: { subject: string, body: string }
}
```

### 2. Suppression en masse
```
DELETE /api/prospects/bulk-delete
Body: {
  prospect_ids: string[]
}
Response: {
  success: boolean,
  data: { deleted: number }
}
```

### 3. Listes d'import
```
GET /api/prospects/import-batches
Response: {
  success: boolean,
  data: Array<{
    id: string,
    file_name: string,
    created_at: string,
    status: string,
    prospects_count: number,
    success_count: number,
    error_count: number,
    total_rows: number
  }>
}
```

### 4. Prospects d'un batch spécifique (NOUVEAU)
```
GET /api/prospects/import-batches/:batchId/prospects?page=1&limit=50&search=&sort_by=created_at&sort_order=desc
Paramètres:
- batchId: UUID du batch ou 'manual' pour prospects sans batch
- page: Numéro de page (défaut: 1)
- limit: Nombre de résultats (défaut: 50, max recommandé: 100)
- search: Recherche dans email, nom entreprise, prénom, nom
- sort_by: Champ de tri (défaut: created_at)
- sort_order: Ordre de tri 'asc' ou 'desc' (défaut: desc)

Response: {
  success: boolean,
  data: {
    data: Array<Prospect>,
    total: number,
    page: number,
    limit: number,
    total_pages: number
  }
}
```

---

## ✅ Checklist de Déploiement

### Base de données :
- [ ] Exécuter la migration SQL sur Supabase
- [ ] Vérifier que la colonne `import_batch_id` existe dans la table `prospects`
- [ ] Vérifier que l'index `idx_prospects_import_batch` est créé

### Backend :
- [ ] Déployer les modifications du serveur
- [ ] Vérifier que les nouvelles routes fonctionnent
- [ ] Tester la génération d'email par IA
- [ ] Tester la suppression en masse

### Frontend :
- [ ] Déployer les modifications du client
- [ ] Tester le bouton de bascule de vue
- [ ] Tester la vue groupée
- [ ] Tester le modal d'email avec IA
- [ ] Tester le bouton de suppression

---

## 🎯 Utilisation

### Pour l'utilisateur :

1. **Envoyer un email groupé avec IA** :
   - Sélectionner des prospects
   - Cliquer sur "Envoyer un email"
   - Saisir des instructions dans la section IA
   - Cliquer sur "Générer avec l'IA"
   - Modifier si nécessaire
   - Envoyer

2. **Supprimer des prospects** :
   - Sélectionner des prospects
   - Cliquer sur "Supprimer la sélection"
   - Confirmer la suppression

3. **Vue par liste d'import** :
   - Cliquer sur "Par liste d'import"
   - Voir toutes les listes avec leurs statistiques
   - Cliquer sur une liste pour la déplier
   - Voir les prospects de cette liste

---

## 🔄 Prochaines étapes (optionnel) - ✅ COMPLÉTÉ

- [x] Ajouter le chargement des prospects dans la vue groupée
- [x] Permettre la sélection dans la vue groupée
- [x] Ajouter des filtres spécifiques à la vue groupée (via API)
- [x] Statistiques par liste d'import

### Détails des implémentations :

#### 1. **Chargement des prospects dans la vue groupée**
- Nouvelle route API : `GET /api/prospects/import-batches/:batchId/prospects`
- Support de la pagination (limite 100 par défaut)
- Chargement dynamique lors de l'expansion d'un batch
- État de chargement avec spinner

#### 2. **Sélection dans la vue groupée**
- Checkboxes individuelles pour chaque prospect
- Checkbox "tout sélectionner" par batch
- Synchronisation avec la sélection globale
- Actions groupées disponibles (envoi email, suppression)

#### 3. **Filtres pour la vue groupée**
- Recherche dans les prospects via l'API
- Tri par date, nom, score de priorité
- Filtres hériter de la vue liste

#### 4. **Statistiques par liste d'import**
- Badges détaillés dans l'en-tête :
  - Nombre total de prospects
  - Nombre de prospects importés avec succès
  - Nombre d'erreurs d'import
  - Statut de l'import (Terminé/Échoué/En cours)
- Panneau de statistiques détaillées lors de l'expansion :
  - Total de prospects
  - Prospects enrichis
  - Prospects traités par IA
  - Prospects prêts pour emailing
  - Emails envoyés
  - Prospects haute priorité

### Nouveaux composants ajoutés :

**États frontend** :
```typescript
const [batchProspects, setBatchProspects] = useState<Map<string, Prospect[]>>(new Map());
const [loadingBatchIds, setLoadingBatchIds] = useState<Set<string>>(new Set());
```

**Fonction de chargement** :
```typescript
const fetchBatchProspects = async (batchId: string) => {
  // Charge les prospects d'un batch spécifique
  // Gère le cache pour éviter les chargements multiples
}
```

---

## 📝 Notes

- Les prospects ajoutés manuellement (sans import) sont regroupés dans une section "Prospects ajoutés manuellement"
- La suppression en masse supprime aussi tous les emails associés (programmés et envoyés)
- La génération IA utilise GPT-4o et nécessite une clé API OpenAI configurée
- Le modal d'email amélioré est rétrocompatible avec l'envoi manuel

---

**Date de création** : 2 décembre 2025  
**Version** : 1.0.0  
**Auteur** : Assistant IA

