-- ============================================================================
-- CRÉER BUCKET APPORTEUR-DOCUMENTS
-- ============================================================================

-- ⚠️ MÉTHODE 1 : Via Supabase Storage UI (RECOMMANDÉ)
-- ============================================================================
-- 1. Aller sur https://supabase.com/dashboard/project/[votre-projet]/storage/buckets
-- 2. Cliquer "New bucket"
-- 3. Name: apporteur-documents
-- 4. Public bucket: NON (décocher)
-- 5. File size limit: 52428800 (50 MB)
-- 6. Allowed MIME types: Laisser vide (tous types autorisés)
-- 7. Cliquer "Create bucket"

-- ============================================================================
-- MÉTHODE 2 : Via SQL (fonction admin)
-- ============================================================================

-- Créer le bucket (nécessite admin rights)
SELECT storage.create_bucket('apporteur-documents', false);

-- Vérifier que le bucket est créé
SELECT name, public FROM storage.buckets WHERE name = 'apporteur-documents';

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
-- | name                | public |
-- | ------------------- | ------ |
-- | apporteur-documents | false  |

