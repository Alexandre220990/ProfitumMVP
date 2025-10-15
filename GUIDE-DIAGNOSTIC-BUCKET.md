# 🔍 Guide de Diagnostic : Erreur "Bucket not found"

## 📊 État Actuel des Buckets

Vos buckets Supabase existent déjà :

| Bucket | Taille actuelle | Taille recommandée | Action |
|--------|-----------------|-------------------|--------|
| `client-documents` | 10 MB | 50 MB | ⚠️ À augmenter |
| `expert-documents` | 50 MB | 50 MB | ✅ OK |
| `apporteur-documents` | 36 MB | 50 MB | ⚠️ À augmenter |
| `admin-documents` | 50 MB | 100 MB | ⚠️ À augmenter |

## 🔧 Étapes de Diagnostic

### Étape 1 : Mettre à jour les limites de taille

```sql
-- Exécuter dans Supabase SQL Editor
-- Fichier: update-bucket-limits.sql
```

Cela mettra les buckets aux bonnes tailles.

### Étape 2 : Vérifier quel bucket est utilisé par les documents

```sql
-- Exécuter dans Supabase SQL Editor
-- Fichier: check-document-bucket.sql
```

**Problème probable :** Les documents sont enregistrés avec un `bucket_name` qui n'existe pas ou est incorrect.

### Étape 3 : Vérifier les policies RLS

```sql
-- Exécuter dans Supabase SQL Editor  
-- Fichier: verify-storage-policies.sql
```

**Note :** Le backend utilise `SUPABASE_SERVICE_ROLE_KEY` donc les RLS ne devraient pas bloquer.

## 🎯 Solutions Possibles

### Solution A : Le bucket_name en BDD est incorrect

Si `check-document-bucket.sql` montre des bucket_name invalides :

```sql
-- Corriger les documents clients
UPDATE "ClientProcessDocument"
SET bucket_name = 'client-documents'
WHERE uploaded_by_type = 'client'
  AND (bucket_name IS NULL OR bucket_name NOT IN ('client-documents', 'expert-documents', 'apporteur-documents', 'admin-documents'));

-- Corriger les documents experts
UPDATE "ClientProcessDocument"
SET bucket_name = 'expert-documents'
WHERE uploaded_by_type = 'expert'
  AND (bucket_name IS NULL OR bucket_name NOT IN ('client-documents', 'expert-documents', 'apporteur-documents', 'admin-documents'));

-- Vérifier
SELECT bucket_name, COUNT(*) 
FROM "ClientProcessDocument" 
GROUP BY bucket_name;
```

### Solution B : Le fichier n'existe pas physiquement dans Storage

Si le bucket existe mais le fichier n'y est pas :

1. Aller dans **Supabase Dashboard → Storage**
2. Ouvrir le bucket `client-documents`
3. Vérifier si le chemin `{user_id}/{document_type}/{timestamp}-{filename}` existe

Si le fichier manque, il faut réuploader le document.

### Solution C : Problème de permissions Service Role

Vérifier dans `.env` que `SUPABASE_SERVICE_ROLE_KEY` est bien définie :

```bash
# Dans /server/.env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (la clé service_role)
```

⚠️ **Important :** Utiliser la clé `service_role` et non la clé `anon`.

## 🚀 Améliorations du Code

Le code a été amélioré pour :

1. ✅ **Vérifier l'existence du bucket** avant upload
2. ✅ **Logger clairement** les erreurs de bucket
3. ✅ **Continuer même si la création échoue** (bucket existe déjà)
4. ✅ **Meilleurs messages d'erreur** pour le debugging

## 📝 Commandes Rapides

### Voir les derniers uploads
```sql
SELECT id, filename, bucket_name, storage_path, created_at
FROM "ClientProcessDocument"
ORDER BY created_at DESC
LIMIT 5;
```

### Voir les fichiers dans un bucket
```sql
SELECT name, created_at, metadata->>'size' as size
FROM storage.objects
WHERE bucket_id = 'client-documents'
ORDER BY created_at DESC
LIMIT 10;
```

### Tester l'accès à un bucket
```sql
SELECT * FROM storage.buckets WHERE name = 'client-documents';
```

## 🔄 Après Résolution

1. **Redémarrer le serveur backend** (Railway auto-deploy)
2. **Réessayer l'upload** d'un document
3. **Cliquer sur "Visualiser"** pour vérifier le download

## 📞 Si le Problème Persiste

Vérifier les logs du serveur backend :
- Railway Dashboard → Deploy Logs
- Chercher les messages avec `📦`, `📁`, `✅`, `❌`

Les logs montreront exactement quel bucket est utilisé et pourquoi ça échoue.

