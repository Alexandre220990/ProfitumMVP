-- ============================================================================
-- SETUP COMPLET BUCKETS + POLICIES GED UNIFIÉE
-- ============================================================================
-- Date: 2025-10-13
-- Version: 1.0
-- Description: Configuration complète des buckets et politiques de sécurité
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : CRÉER LES BUCKETS (si pas déjà fait)
-- ============================================================================

-- Bucket client (devrait déjà exister)
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket expert (devrait déjà exister)
INSERT INTO storage.buckets (id, name, public)
VALUES ('expert-documents', 'expert-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket apporteur (NOUVEAU)
INSERT INTO storage.buckets (id, name, public)
VALUES ('apporteur-documents', 'apporteur-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket admin (optionnel)
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-documents', 'admin-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Vérifier que tous les buckets sont créés
SELECT name, public, file_size_limit, allowed_mime_types, created_at
FROM storage.buckets
WHERE name IN ('client-documents', 'expert-documents', 'apporteur-documents', 'admin-documents')
ORDER BY name;

-- ============================================================================
-- ÉTAPE 2 : SUPPRIMER LES ANCIENNES POLICIES (nettoyage)
-- ============================================================================

-- Supprimer toutes les anciennes policies sur ces buckets
DROP POLICY IF EXISTS "Client can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Client can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Client can delete own documents" ON storage.objects;
DROP POLICY IF EXISTS "Expert can view client documents" ON storage.objects;
DROP POLICY IF EXISTS "Expert can upload client documents" ON storage.objects;
DROP POLICY IF EXISTS "Apporteur can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Apporteur can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin can do everything" ON storage.objects;

-- ============================================================================
-- ÉTAPE 3 : ACTIVER RLS SUR STORAGE.OBJECTS
-- ============================================================================

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 4 : POLICIES BUCKET CLIENT-DOCUMENTS
-- ============================================================================

-- Policy SELECT : Client voit ses documents
CREATE POLICY "Client can view own documents in client-documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'client-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy INSERT : Client peut uploader ses documents
CREATE POLICY "Client can upload own documents in client-documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy UPDATE : Client peut mettre à jour ses documents
CREATE POLICY "Client can update own documents in client-documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy DELETE : Client peut supprimer ses documents (si pas validé)
CREATE POLICY "Client can delete own documents in client-documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'client-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy SELECT : Expert voit documents de ses clients
CREATE POLICY "Expert can view assigned client documents in client-documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'client-documents'
  AND EXISTS (
    SELECT 1 FROM "ClientProduitEligible" cpe
    INNER JOIN "Client" c ON c.id = cpe."clientId"
    INNER JOIN "User" u ON u."database_id" = cpe.expert_id
    WHERE u.id = auth.uid()
    AND c.id = (storage.foldername(name))[1]::uuid
  )
);

-- ============================================================================
-- ÉTAPE 5 : POLICIES BUCKET EXPERT-DOCUMENTS
-- ============================================================================

-- Policy SELECT : Expert voit ses documents
CREATE POLICY "Expert can view own documents in expert-documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'expert-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy INSERT : Expert peut uploader ses documents
CREATE POLICY "Expert can upload own documents in expert-documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'expert-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy UPDATE : Expert peut mettre à jour ses documents
CREATE POLICY "Expert can update own documents in expert-documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'expert-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy DELETE : Expert peut supprimer ses documents
CREATE POLICY "Expert can delete own documents in expert-documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'expert-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- ÉTAPE 6 : POLICIES BUCKET APPORTEUR-DOCUMENTS (NOUVEAU)
-- ============================================================================

-- Policy SELECT : Apporteur voit ses documents
CREATE POLICY "Apporteur can view own documents in apporteur-documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'apporteur-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy INSERT : Apporteur peut uploader ses documents
CREATE POLICY "Apporteur can upload own documents in apporteur-documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'apporteur-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy UPDATE : Apporteur peut mettre à jour ses documents
CREATE POLICY "Apporteur can update own documents in apporteur-documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'apporteur-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy DELETE : Apporteur peut supprimer ses documents
CREATE POLICY "Apporteur can delete own documents in apporteur-documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'apporteur-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy SELECT : Apporteur voit documents de ses prospects/clients
CREATE POLICY "Apporteur can view client documents in apporteur-documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'apporteur-documents'
  AND EXISTS (
    SELECT 1 FROM "Client" c
    INNER JOIN "User" u ON u."database_id" = c.apporteur_id
    WHERE u.id = auth.uid()
    AND c.id = (storage.foldername(name))[1]::uuid
  )
);

-- ============================================================================
-- ÉTAPE 7 : POLICIES BUCKET ADMIN-DOCUMENTS
-- ============================================================================

-- Policy SELECT : Admin voit tous les documents
CREATE POLICY "Admin can view all documents in admin-documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'admin-documents'
  AND EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid() AND type = 'admin'
  )
);

-- Policy INSERT : Admin peut uploader partout
CREATE POLICY "Admin can upload documents in admin-documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'admin-documents'
  AND EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid() AND type = 'admin'
  )
);

-- Policy UPDATE : Admin peut tout modifier
CREATE POLICY "Admin can update documents in admin-documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'admin-documents'
  AND EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid() AND type = 'admin'
  )
);

-- Policy DELETE : Admin peut tout supprimer
CREATE POLICY "Admin can delete documents in admin-documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'admin-documents'
  AND EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid() AND type = 'admin'
  )
);

-- ============================================================================
-- ÉTAPE 8 : POLICIES CROSS-BUCKET POUR ADMIN (tous les buckets)
-- ============================================================================

-- Admin peut voir TOUS les documents de TOUS les buckets
CREATE POLICY "Admin can view all documents across all buckets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id IN ('client-documents', 'expert-documents', 'apporteur-documents', 'admin-documents')
  AND EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid() AND type = 'admin'
  )
);

-- ============================================================================
-- ÉTAPE 9 : VÉRIFICATION DES POLICIES
-- ============================================================================

-- Afficher toutes les policies créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
-- Vous devriez voir environ 25+ policies listées
-- Couvrant SELECT, INSERT, UPDATE, DELETE pour chaque bucket
-- Et des policies cross-bucket pour l'admin

-- ============================================================================
-- TESTS RECOMMANDÉS
-- ============================================================================
-- 1. Connectez-vous en tant que client → testez upload sur client-documents
-- 2. Connectez-vous en tant que expert → testez upload sur expert-documents
-- 3. Connectez-vous en tant que apporteur → testez upload sur apporteur-documents
-- 4. Connectez-vous en tant que admin → testez accès à tous les buckets
-- 5. Vérifiez que client A ne peut pas voir documents de client B
-- 6. Vérifiez que expert voit uniquement documents de ses clients assignés

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- - Les paths doivent suivre le format: {user_id}/{document_type}/{filename}
-- - Les IDs utilisateurs sont des UUID Supabase Auth
-- - Les permissions sont gérées au niveau bucket + RLS
-- - Le backend utilise le Service Role Key pour bypasser RLS si nécessaire
-- - Les URLs signées sont valides 1h (download) ou 24h (preview)

