-- ============================================================================
-- CORRECTION POLITIQUES RLS POUR UPLOAD DOCUMENTS TICPE
-- ============================================================================

-- 1. Vérifier les politiques RLS actuelles
SELECT 
    'CURRENT_RLS_POLICIES' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'GEDDocument';

-- 2. Supprimer les politiques d'insertion restrictives
DROP POLICY IF EXISTS "ged_document_insert_policy" ON "GEDDocument";
DROP POLICY IF EXISTS "ged_document_sections_insert_policy" ON "GEDDocument";

-- 3. Créer une nouvelle politique d'insertion permissive pour les clients
CREATE POLICY "ged_document_client_insert_policy" ON "GEDDocument"
FOR INSERT 
WITH CHECK (
    (current_setting('app.user_type'::text, true) = 'client'::text) OR
    (current_setting('app.user_type'::text, true) = 'admin'::text) OR
    (current_setting('app.user_type'::text, true) = 'expert'::text)
);

-- 4. Créer une politique de lecture pour les clients
CREATE POLICY "ged_document_client_read_policy" ON "GEDDocument"
FOR SELECT 
USING (
    (current_setting('app.user_type'::text, true) = 'client'::text AND created_by = current_setting('app.user_id'::text, true)::uuid) OR
    (current_setting('app.user_type'::text, true) = 'admin'::text) OR
    (current_setting('app.user_type'::text, true) = 'expert'::text)
);

-- 5. Vérifier les nouvelles politiques
SELECT 
    'UPDATED_RLS_POLICIES' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'GEDDocument'
ORDER BY policyname;

-- 6. Test d'insertion avec les nouvelles politiques
BEGIN;

-- Simuler un utilisateur client
SET app.user_type = 'client';
SET app.user_id = '3d451dde-00ba-4ad2-b572-6a10bdad354f';

INSERT INTO "GEDDocument" (
    title,
    description,
    content,
    category,
    file_path,
    created_by,
    is_active,
    version
)
VALUES (
    'Test Upload TICPE - RLS Corrigé',
    'Test pour vérifier l''upload avec RLS corrigé',
    'dossier_id:93374842-cca6-4873-b16e-0ada92e97004',
    'eligibilite_ticpe',
    '/test/upload-rls-test.pdf',
    '3d451dde-00ba-4ad2-b572-6a10bdad354f'::uuid,
    true,
    1
)
RETURNING id, title, category, created_at;

ROLLBACK;

-- 7. Réinitialiser les paramètres
RESET app.user_type;
RESET app.user_id;
