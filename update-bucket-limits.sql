-- ============================================================================
-- MISE À JOUR DES LIMITES DE TAILLE DES BUCKETS
-- ============================================================================
-- Les buckets existent déjà mais ont des limites incorrectes
-- Ce script met à jour les limites de taille
-- ============================================================================

-- Vérifier les limites actuelles
SELECT 
  name,
  file_size_limit,
  (file_size_limit / 1024 / 1024)::text || ' MB' as limite_mb
FROM storage.buckets
WHERE name IN ('client-documents', 'expert-documents', 'apporteur-documents', 'admin-documents')
ORDER BY name;

-- ============================================================================
-- MISE À JOUR DES LIMITES
-- ============================================================================

-- client-documents : passer de 10 MB à 50 MB
UPDATE storage.buckets
SET file_size_limit = 52428800  -- 50 MB
WHERE name = 'client-documents';

-- expert-documents : déjà à 50 MB, confirmer
UPDATE storage.buckets
SET file_size_limit = 52428800  -- 50 MB
WHERE name = 'expert-documents';

-- apporteur-documents : passer de ~36 MB à 50 MB
UPDATE storage.buckets
SET file_size_limit = 52428800  -- 50 MB
WHERE name = 'apporteur-documents';

-- admin-documents : passer de 50 MB à 100 MB
UPDATE storage.buckets
SET file_size_limit = 104857600  -- 100 MB
WHERE name = 'admin-documents';

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

SELECT 
  name,
  file_size_limit,
  (file_size_limit / 1024 / 1024)::text || ' MB' as limite_mb,
  public,
  created_at
FROM storage.buckets
WHERE name IN ('client-documents', 'expert-documents', 'apporteur-documents', 'admin-documents')
ORDER BY name;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
-- ✅ client-documents    : 50 MB
-- ✅ expert-documents    : 50 MB
-- ✅ apporteur-documents : 50 MB
-- ✅ admin-documents     : 100 MB
-- ============================================================================

