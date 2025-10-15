-- ============================================================================
-- CRÉATION AUTOMATIQUE DES BUCKETS STORAGE
-- ============================================================================
-- Ce script crée les buckets nécessaires pour l'application
-- À exécuter dans Supabase SQL Editor si les buckets n'existent pas
-- ============================================================================

-- Vérifier les buckets existants
SELECT 
  id,
  name, 
  public,
  file_size_limit,
  created_at
FROM storage.buckets
ORDER BY name;

-- ============================================================================
-- CRÉER LES BUCKETS (si ils n'existent pas)
-- ============================================================================

-- Bucket client-documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('client-documents', 'client-documents', false, 52428800)
ON CONFLICT (id) DO UPDATE 
SET file_size_limit = 52428800;

-- Bucket expert-documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('expert-documents', 'expert-documents', false, 52428800)
ON CONFLICT (id) DO UPDATE 
SET file_size_limit = 52428800;

-- Bucket apporteur-documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('apporteur-documents', 'apporteur-documents', false, 52428800)
ON CONFLICT (id) DO UPDATE 
SET file_size_limit = 52428800;

-- Bucket admin-documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('admin-documents', 'admin-documents', false, 104857600)
ON CONFLICT (id) DO UPDATE 
SET file_size_limit = 104857600;

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

SELECT 
  '✅ Bucket créé: ' || name as status,
  'Taille max: ' || (file_size_limit / 1024 / 1024)::text || ' MB' as limite,
  'Public: ' || public::text as visibilite
FROM storage.buckets
WHERE name IN ('client-documents', 'expert-documents', 'apporteur-documents', 'admin-documents')
ORDER BY name;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
-- Vous devriez voir 4 buckets créés :
-- ✅ client-documents    (50 MB, private)
-- ✅ expert-documents    (50 MB, private)
-- ✅ apporteur-documents (50 MB, private)
-- ✅ admin-documents     (100 MB, private)
-- ============================================================================

