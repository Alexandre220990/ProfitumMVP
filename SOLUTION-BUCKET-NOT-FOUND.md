# Solution : Erreur "Bucket not found" 🔧

## Problème
Lors de la visualisation d'un document, l'erreur suivante apparaît :
```json
{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}
```

## Cause
Les buckets Supabase Storage nécessaires n'existent pas dans votre instance Supabase.

## Solutions

### ✅ Solution Automatique (Recommandée)
Le code a été mis à jour pour **créer automatiquement les buckets** lors du premier upload. 

**Aucune action manuelle requise** - les buckets seront créés automatiquement au prochain upload de document.

### 🔧 Solution Manuelle (Si nécessaire)
Si vous voulez créer les buckets manuellement :

1. **Ouvrir Supabase Dashboard**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet

2. **Accéder à SQL Editor**
   - Cliquez sur "SQL Editor" dans le menu de gauche

3. **Exécuter le script**
   - Copiez le contenu du fichier `create-storage-buckets.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur "Run" (ou Ctrl/Cmd + Enter)

4. **Vérifier la création**
   - Allez dans "Storage" dans le menu
   - Vous devriez voir 4 buckets :
     - ✅ `client-documents` (50 MB)
     - ✅ `expert-documents` (50 MB)
     - ✅ `apporteur-documents` (50 MB)
     - ✅ `admin-documents` (100 MB)

## Buckets créés

| Bucket | Utilisation | Taille max | Public |
|--------|-------------|-----------|--------|
| `client-documents` | Documents des clients | 50 MB | Non |
| `expert-documents` | Documents des experts | 50 MB | Non |
| `apporteur-documents` | Documents des apporteurs | 50 MB | Non |
| `admin-documents` | Documents administratifs | 100 MB | Non |

## Vérification

Pour vérifier que tout fonctionne :

1. **Uploadez un document** sur la page TICPE
2. **Cliquez sur "Visualiser"**
3. Le document devrait s'ouvrir sans erreur

## Améliorations apportées

1. ✅ **Création automatique des buckets** lors de l'upload
2. ✅ **Vérification de l'existence** avant génération d'URL signée
3. ✅ **Messages d'erreur détaillés** pour faciliter le debugging
4. ✅ **Gestion robuste des erreurs** Storage

## Commits

- `9a99f14` - Gestion automatique des buckets Supabase Storage
- `80a53d0` - Corrections upload documents (nom colonne produitId)
- `e39894e` - Résolution correcte du produit_id

## Support

Si l'erreur persiste après redéploiement :
1. Vérifiez les logs du serveur
2. Vérifiez que les buckets existent dans Supabase Dashboard
3. Vérifiez les permissions RLS sur `storage.objects`

