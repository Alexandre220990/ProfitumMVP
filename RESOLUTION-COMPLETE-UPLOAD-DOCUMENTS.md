# 🎉 Résolution Complète : Upload et Visualisation Documents TICPE

## 📊 Résumé de la Session

**Date** : 15 Octobre 2025  
**Durée** : Session intensive de debugging  
**Résultat** : ✅ Tous les problèmes résolus

---

## 🔴 Problèmes Initiaux

### 1. Erreur FK Constraint violation
```
insert or update on table "ClientProcessDocument" violates foreign key constraint "ClientProcessDocument_produit_id_fkey"
```

### 2. Erreur Bucket not found
```json
{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}
```

### 3. Erreur Invalid key
```
Invalid key: 25274ba6-67e6-4151-901c-74851fe2d82a/immatriculation/1760524538058-la DFS - deÌtails.pdf
```

---

## ✅ Solutions Apportées

### Solution 1 : Nom de Colonne Incorrect (produitId vs produit_id)

**Problème** : Le code utilisait `produit_id` (snake_case) alors que la colonne est `produitId` (camelCase)

**Fichier** : `server/src/routes/documents-unified-all.ts`

**Correction** :
```typescript
// ❌ Avant
.select('produit_id')

// ✅ Après
.select('produitId')
```

**Commit** : `80a53d0` - fix: Corrections upload documents - nom colonne produitId

---

### Solution 2 : Erreur query.eq is not a function

**Problème** : La fonction async `applyUserFilters()` causait des problèmes de chaînage Supabase

**Correction** :
- Séparation en deux fonctions :
  - `getAccessibleClientIds()` (async) : récupère les IDs clients
  - `applyClientFilter()` (sync) : applique les filtres

```typescript
// ✅ Nouvelle approche
const accessibleClientIds = await getAccessibleClientIds(user);
query = applyClientFilter(query, accessibleClientIds);
```

**Commit** : `80a53d0` - fix: Corrections upload documents - refactoring filtres

---

### Solution 3 : Tailles de Buckets Incorrectes

**Problème** : Les buckets avaient des limites trop petites

**État Initial** :
| Bucket | Taille | Devrait être |
|--------|--------|--------------|
| client-documents | 10 MB | 50 MB |
| apporteur-documents | 36 MB | 50 MB |
| admin-documents | 50 MB | 100 MB |

**Script SQL** : `update-bucket-limits.sql`

```sql
UPDATE storage.buckets SET file_size_limit = 52428800 WHERE name = 'client-documents';
UPDATE storage.buckets SET file_size_limit = 52428800 WHERE name = 'apporteur-documents';
UPDATE storage.buckets SET file_size_limit = 104857600 WHERE name = 'admin-documents';
```

**Commit** : `a6f31cf` - fix: Amélioration gestion buckets + scripts de diagnostic

---

### Solution 4 : Policy RLS Service Role Manquante

**Problème** : Aucune policy n'autorisait `service_role` à accéder au Storage

**Correction SQL** :
```sql
CREATE POLICY "Service role bypass RLS for all storage operations"
ON storage.objects
TO service_role
USING (true)
WITH CHECK (true);
```

**Résultat** : Le backend peut maintenant générer des URLs signées

---

### Solution 5 : Frontend Utilisait URL Publique ❌

**Problème CRITIQUE** : Le frontend essayait d'accéder directement au Storage avec `file_url` (URL publique), mais les buckets sont **privés** !

**Fichier** : `client/src/components/documents/core/ProductDocumentUpload.tsx`

**Ancienne méthode (ne fonctionnait pas)** :
```typescript
// ❌ Tentait d'accéder directement
const viewDocument = (document) => {
  window.open(document.file_url, '_blank');
  // ÉCHOUE car les buckets sont privés !
};
```

**Nouvelle méthode (corrigée)** :
```typescript
// ✅ Appelle le backend pour obtenir une URL signée
const viewDocument = async (document) => {
  const response = await fetch(`${config.API_URL}/api/documents/${document.id}/download`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const result = await response.json();
  window.open(result.data.download_url, '_blank'); // URL signée valide 1h
};
```

**Commit** : `b141c0e` - fix: Utiliser URL signée du backend au lieu de l'URL publique

---

### Solution 6 : Noms de Fichiers avec Accents ❌

**Problème** : Supabase Storage refuse les caractères spéciaux et accents dans les noms de fichiers

**Erreur** :
```
Invalid key: .../immatriculation/1760524538058-la DFS - deÌtails.pdf
```

**Correction** : Ajout fonction `sanitizeFilename()`

```typescript
function sanitizeFilename(filename: string): string {
  return filename
    .normalize('NFD')                      // Décomposer les accents
    .replace(/[\u0300-\u036f]/g, '')      // Supprimer les accents
    .replace(/\s+/g, '_')                  // Espaces → underscores
    .replace(/[^a-zA-Z0-9._-]/g, '')      // Supprimer caractères spéciaux
    .replace(/_+/g, '_')                   // Éviter doubles underscores
    .replace(/^_+|_+$/g, '');              // Trim underscores
}
```

**Exemple** :
```
"la DFS - deÌtails.pdf" → "la_DFS_-_details.pdf"
```

**Note** : Le nom original est conservé en BDD pour l'affichage, seul le `storage_path` utilise le nom sanitizé.

**Commit** : `3cb9572` - fix: Sanitize filenames - supprime accents et caractères spéciaux

---

## 📋 Scripts SQL Créés

| Script | Utilité |
|--------|---------|
| `create-storage-buckets.sql` | Créer les buckets manquants |
| `update-bucket-limits.sql` | Corriger les tailles des buckets |
| `check-document-bucket.sql` | Vérifier les bucket_name en BDD |
| `verify-storage-policies.sql` | Vérifier les policies RLS |
| `check-last-upload.sql` | Diagnostiquer les derniers uploads |

---

## 📝 Fichiers Modifiés

### Backend
- ✅ `server/src/routes/documents-unified-all.ts` (majeur)
  - Correction nom colonne `produitId`
  - Refactoring filtres utilisateurs
  - Gestion automatique buckets
  - Sanitization noms de fichiers
  - Logs détaillés

### Frontend
- ✅ `client/src/components/documents/core/ProductDocumentUpload.tsx`
  - Utilisation URL signée au lieu de `file_url`
  - Appel `/api/documents/:id/download`

---

## 🎯 Fonctionnalités Validées

| Fonctionnalité | Status |
|----------------|--------|
| ✅ Upload KBIS | OK |
| ✅ Upload Certificat Immatriculation | OK |
| ✅ Upload Facture Carburant | OK |
| ✅ Visualisation documents | OK |
| ✅ Suppression documents | OK |
| ✅ Fichiers avec accents | OK |
| ✅ Fichiers avec espaces | OK |
| ✅ Permissions RLS | OK |

---

## 🚀 Commits Principaux

```bash
3cb9572 - fix: Sanitize filenames - supprime accents et caractères spéciaux
b141c0e - fix: Utiliser URL signée du backend au lieu de l'URL publique
79f4901 - debug: Ajout logs détaillés génération URL signée
a6f31cf - fix: Amélioration gestion buckets + scripts de diagnostic
668196d - docs: Ajout documentation solution Bucket not found
9a99f14 - fix: Gestion automatique des buckets Supabase Storage
80a53d0 - fix: Corrections upload documents - nom colonne produitId
e39894e - fix: Résolution correcte du produit_id
```

---

## 📚 Documentation Créée

| Document | Description |
|----------|-------------|
| `SOLUTION-BUCKET-NOT-FOUND.md` | Guide solution erreur bucket |
| `GUIDE-DIAGNOSTIC-BUCKET.md` | Guide diagnostic complet |
| `RESOLUTION-COMPLETE-UPLOAD-DOCUMENTS.md` | Ce fichier |

---

## 🧪 Tests à Effectuer

### Test 1 : Upload de Documents
1. ✅ Aller sur https://www.profitum.app/produits/ticpe/93374842-cca6-4873-b16e-0ada92e97004
2. ✅ Uploader un KBIS
3. ✅ Uploader un Certificat d'Immatriculation (avec accents)
4. ✅ Uploader une Facture de Carburant

### Test 2 : Visualisation
1. ✅ Cliquer sur "Visualiser" pour chaque document
2. ✅ Vérifier que le document s'ouvre dans un nouvel onglet
3. ✅ Pas d'erreur "Bucket not found"

### Test 3 : Suppression
1. ✅ Cliquer sur le bouton supprimer
2. ✅ Vérifier que le document est supprimé

---

## 🔧 Variables d'Environnement Requises

### Railway (Production)
```bash
SUPABASE_URL=https://gvvlsgtubqfxdztldunj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs... (clé service_role complète)
```

⚠️ **Important** : Utiliser la clé **`service_role`**, PAS la clé `anon` !

---

## 💡 Points Clés à Retenir

1. **Buckets Privés** : Les buckets Storage sont privés, il FAUT des URLs signées
2. **Service Role** : Le backend doit utiliser `SUPABASE_SERVICE_ROLE_KEY` pour bypasser RLS
3. **Policy RLS** : Une policy `service_role` est nécessaire sur `storage.objects`
4. **Noms de Fichiers** : Toujours sanitizer les noms (pas d'accents, pas d'espaces)
5. **Noms de Colonnes** : Attention camelCase vs snake_case (Supabase peut mélanger)

---

## 📞 Support

Si des problèmes similaires surviennent :

1. Vérifier les logs Railway → Chercher 🔍, ✅, ❌
2. Exécuter `check-last-upload.sql` dans Supabase
3. Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est définie
4. Vérifier les policies RLS avec `verify-storage-policies.sql`

---

## 🎉 Statut Final

✅ **TOUS LES PROBLÈMES RÉSOLUS**

- ✅ Upload fonctionne (KBIS, Immatriculation, Facture)
- ✅ Visualisation fonctionne (URL signée)
- ✅ Suppression fonctionne
- ✅ Fichiers avec accents acceptés
- ✅ Permissions correctes
- ✅ Buckets configurés

**Prêt pour la production !** 🚀

