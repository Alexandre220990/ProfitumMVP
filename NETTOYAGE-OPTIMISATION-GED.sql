-- ============================================================================
-- NETTOYAGE & OPTIMISATION MODULE GED
-- Exécutez CHAQUE section séparément dans Supabase
-- ============================================================================

-- ÉTAPE 1 : Supprimer RLS policies obsolètes (système auth.uid())
-- ============================================================================

DROP POLICY IF EXISTS ged_document_sections_read_policy ON "GEDDocument";
DROP POLICY IF EXISTS ged_document_sections_update_policy ON "GEDDocument";
DROP POLICY IF EXISTS ged_document_sections_delete_policy ON "GEDDocument";

-- Vérification
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'GEDDocument'
ORDER BY policyname;

-- ÉTAPE 2 : Créer permissions manquantes pour Expert
-- ============================================================================

INSERT INTO "GEDDocumentPermission" (
  id,
  document_id,
  user_type,
  can_read,
  can_write,
  can_delete,
  can_share,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  id,
  'expert',
  true,
  false,
  false,
  false,
  NOW(),
  NOW()
FROM "GEDDocument"
WHERE is_published = true
  AND NOT EXISTS (
    SELECT 1 FROM "GEDDocumentPermission" 
    WHERE document_id = "GEDDocument".id 
    AND user_type = 'expert'
  );

-- ÉTAPE 3 : Créer permissions manquantes pour Apporteur
-- ============================================================================

INSERT INTO "GEDDocumentPermission" (
  id,
  document_id,
  user_type,
  can_read,
  can_write,
  can_delete,
  can_share,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  id,
  'apporteur',
  true,
  false,
  false,
  false,
  NOW(),
  NOW()
FROM "GEDDocument"
WHERE is_published = true
  AND NOT EXISTS (
    SELECT 1 FROM "GEDDocumentPermission" 
    WHERE document_id = "GEDDocument".id 
    AND user_type = 'apporteur'
  );

-- ÉTAPE 4 : Vérifier permissions créées
-- ============================================================================

SELECT 
  user_type,
  COUNT(*) as nb_permissions,
  COUNT(CASE WHEN can_read THEN 1 END) as can_read,
  COUNT(CASE WHEN can_write THEN 1 END) as can_write,
  COUNT(CASE WHEN can_delete THEN 1 END) as can_delete
FROM "GEDDocumentPermission"
GROUP BY user_type
ORDER BY user_type;

-- ÉTAPE 5 : Vérifier table document_sections (si vide, peut être supprimée)
-- ============================================================================

SELECT COUNT(*) as nb_lignes FROM document_sections;

-- SI 0 lignes, exécuter :
-- DROP TABLE IF EXISTS document_sections CASCADE;

-- ÉTAPE 6 : Créer bucket apporteur-documents (à faire dans Supabase Storage UI)
-- ============================================================================

-- Dans Supabase Storage UI :
-- 1. Cliquer "New bucket"
-- 2. Name: apporteur-documents
-- 3. Public: false (private)
-- 4. Allowed MIME types: image/*, application/pdf, application/msword, etc.

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================

-- RLS Policies GEDDocument : 5 policies (3 obsolètes supprimées)
-- Permissions : client (156), expert (52+), apporteur (52+)
-- Buckets : 8 (+ apporteur-documents)

