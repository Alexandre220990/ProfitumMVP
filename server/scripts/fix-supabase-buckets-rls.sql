-- ============================================================================
-- SCRIPT DE CORRECTION DES POLITIQUES RLS SUPABASE - BUCKETS
-- ============================================================================

-- 1. VÉRIFICATION DU STATUT RLS ACTUEL
SELECT 
    'RLS_STATUS' as check_type,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 2. VÉRIFICATION DES POLITIQUES EXISTANTES
SELECT 
    'EXISTING_POLICIES' as check_type,
    COUNT(*) as existing_policies_count
FROM pg_policies 
WHERE tablename = 'objects';

-- 3. CRÉER LES POLITIQUES RLS POUR CHAQUE BUCKET

-- ===== BUCKET FORMATION =====
-- Politique de lecture : Tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "formation_read_policy" ON storage.objects
FOR SELECT USING (
    bucket_id = 'formation' AND 
    auth.role() = 'authenticated'
);

-- Politique d'insertion : Utilisateurs authentifiés peuvent uploader
CREATE POLICY "formation_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'formation' AND 
    auth.role() = 'authenticated'
);

-- Politique de mise à jour : Seul l'uploader peut modifier
CREATE POLICY "formation_update_policy" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'formation' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- Politique de suppression : Seul l'uploader peut supprimer
CREATE POLICY "formation_delete_policy" ON storage.objects
FOR DELETE USING (
    bucket_id = 'formation' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- ===== BUCKET FACTURES =====
-- Politique de lecture : Clients et admins peuvent lire
CREATE POLICY "factures_read_policy" ON storage.objects
FOR SELECT USING (
    bucket_id = 'factures' AND 
    auth.role() = 'authenticated'
);

-- Politique d'insertion : Clients et admins peuvent uploader
CREATE POLICY "factures_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'factures' AND 
    auth.role() = 'authenticated'
);

-- Politique de mise à jour : Seul l'uploader peut modifier
CREATE POLICY "factures_update_policy" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'factures' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- Politique de suppression : Seul l'uploader peut supprimer
CREATE POLICY "factures_delete_policy" ON storage.objects
FOR DELETE USING (
    bucket_id = 'factures' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- ===== BUCKET GUIDES =====
-- Politique de lecture : Public (tout le monde peut lire)
CREATE POLICY "guides_read_policy" ON storage.objects
FOR SELECT USING (
    bucket_id = 'guides'
);

-- Politique d'insertion : Admins uniquement
CREATE POLICY "guides_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'guides' AND 
    auth.jwt() ->> 'role' = 'admin'
);

-- Politique de mise à jour : Admins uniquement
CREATE POLICY "guides_update_policy" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'guides' AND 
    auth.jwt() ->> 'role' = 'admin'
);

-- Politique de suppression : Admins uniquement
CREATE POLICY "guides_delete_policy" ON storage.objects
FOR DELETE USING (
    bucket_id = 'guides' AND 
    auth.jwt() ->> 'role' = 'admin'
);

-- ===== BUCKET CLIENT-DOCUMENTS =====
-- Politique de lecture : Clients peuvent lire leurs propres documents
CREATE POLICY "client_documents_read_policy" ON storage.objects
FOR SELECT USING (
    bucket_id = 'client-documents' AND 
    auth.uid()::text = (owner::uuid)::text
);  

-- Politique d'insertion : Clients peuvent uploader
CREATE POLICY "client_documents_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'client-documents' AND 
    auth.role() = 'authenticated'
);

-- Politique de mise à jour : Seul l'uploader peut modifier
CREATE POLICY "client_documents_update_policy" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'client-documents' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- Politique de suppression : Seul l'uploader peut supprimer
CREATE POLICY "client_documents_delete_policy" ON storage.objects
FOR DELETE USING (
    bucket_id = 'client-documents' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- ===== BUCKET EXPERT-DOCUMENTS =====
-- Politique de lecture : Experts peuvent lire leurs propres documents
CREATE POLICY "expert_documents_read_policy" ON storage.objects
FOR SELECT USING (
    bucket_id = 'expert-documents' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- Politique d'insertion : Experts peuvent uploader
CREATE POLICY "expert_documents_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'expert-documents' AND 
    auth.role() = 'authenticated'
);

-- Politique de mise à jour : Seul l'uploader peut modifier
CREATE POLICY "expert_documents_update_policy" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'expert-documents' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- Politique de suppression : Seul l'uploader peut supprimer
CREATE POLICY "expert_documents_delete_policy" ON storage.objects
FOR DELETE USING (
    bucket_id = 'expert-documents' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- ===== BUCKET ADMIN-DOCUMENTS =====
-- Politique de lecture : Admins uniquement
CREATE POLICY "admin_documents_read_policy" ON storage.objects
FOR SELECT USING (
    bucket_id = 'admin-documents' AND 
    auth.jwt() ->> 'role' = 'admin'
);

-- Politique d'insertion : Admins uniquement
CREATE POLICY "admin_documents_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'admin-documents' AND 
    auth.jwt() ->> 'role' = 'admin'
);

-- Politique de mise à jour : Admins uniquement
CREATE POLICY "admin_documents_update_policy" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'admin-documents' AND 
    auth.jwt() ->> 'role' = 'admin'
);

-- Politique de suppression : Admins uniquement
CREATE POLICY "admin_documents_delete_policy" ON storage.objects
FOR DELETE USING (
    bucket_id = 'admin-documents' AND 
    auth.jwt() ->> 'role' = 'admin'
);

-- ===== BUCKET CLIENTS =====
-- Politique de lecture : Admins et experts peuvent lire
CREATE POLICY "clients_read_policy" ON storage.objects
FOR SELECT USING (
    bucket_id = 'clients' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'expert')
);

-- Politique d'insertion : Admins et experts peuvent uploader
CREATE POLICY "clients_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'clients' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'expert')
);

-- Politique de mise à jour : Seul l'uploader peut modifier
CREATE POLICY "clients_update_policy" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'clients' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- Politique de suppression : Seul l'uploader peut supprimer
CREATE POLICY "clients_delete_policy" ON storage.objects
FOR DELETE USING (
    bucket_id = 'clients' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- ===== BUCKET AUDITS =====
-- Politique de lecture : Admins et experts peuvent lire
CREATE POLICY "audits_read_policy" ON storage.objects
FOR SELECT USING (
    bucket_id = 'audits' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'expert')
);

-- Politique d'insertion : Admins et experts peuvent uploader
CREATE POLICY "audits_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'audits' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'expert')
);

-- Politique de mise à jour : Seul l'uploader peut modifier
CREATE POLICY "audits_update_policy" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'audits' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- Politique de suppression : Seul l'uploader peut supprimer
CREATE POLICY "audits_delete_policy" ON storage.objects
FOR DELETE USING (
    bucket_id = 'audits' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- ===== BUCKET RAPPORTS =====
-- Politique de lecture : Admins et experts peuvent lire
CREATE POLICY "rapports_read_policy" ON storage.objects
FOR SELECT USING (
    bucket_id = 'rapports' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'expert')
);

-- Politique d'insertion : Admins et experts peuvent uploader
CREATE POLICY "rapports_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'rapports' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'expert')
);

-- Politique de mise à jour : Seul l'uploader peut modifier
CREATE POLICY "rapports_update_policy" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'rapports' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- Politique de suppression : Seul l'uploader peut supprimer
CREATE POLICY "rapports_delete_policy" ON storage.objects
FOR DELETE USING (
    bucket_id = 'rapports' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- ===== BUCKET CHARTES =====
-- Politique de lecture : Admins et experts peuvent lire
CREATE POLICY "chartes_read_policy" ON storage.objects
FOR SELECT USING (
    bucket_id = 'chartes' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'expert')
);

-- Politique d'insertion : Admins et experts peuvent uploader
CREATE POLICY "chartes_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'chartes' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'expert')
);

-- Politique de mise à jour : Seul l'uploader peut modifier
CREATE POLICY "chartes_update_policy" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'chartes' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- Politique de suppression : Seul l'uploader peut supprimer
CREATE POLICY "chartes_delete_policy" ON storage.objects
FOR DELETE USING (
    bucket_id = 'chartes' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- ===== BUCKET CHARTES-SIGNATURES =====
-- Politique de lecture : Admins et experts peuvent lire
CREATE POLICY "chartes_signatures_read_policy" ON storage.objects
FOR SELECT USING (
    bucket_id = 'chartes-signatures' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'expert')
);

-- Politique d'insertion : Admins et experts peuvent uploader
CREATE POLICY "chartes_signatures_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'chartes-signatures' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'expert')
);

-- Politique de mise à jour : Seul l'uploader peut modifier
CREATE POLICY "chartes_signatures_update_policy" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'chartes-signatures' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- Politique de suppression : Seul l'uploader peut supprimer
CREATE POLICY "chartes_signatures_delete_policy" ON storage.objects
FOR DELETE USING (
    bucket_id = 'chartes-signatures' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- ===== BUCKET RAPPORTS-AUDIT =====
-- Politique de lecture : Admins et experts peuvent lire
CREATE POLICY "rapports_audit_read_policy" ON storage.objects
FOR SELECT USING (
    bucket_id = 'rapports-audit' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'expert')
);

-- Politique d'insertion : Admins et experts peuvent uploader
CREATE POLICY "rapports_audit_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'rapports-audit' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'expert')
);

-- Politique de mise à jour : Seul l'uploader peut modifier
CREATE POLICY "rapports_audit_update_policy" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'rapports-audit' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- Politique de suppression : Seul l'uploader peut supprimer
CREATE POLICY "rapports_audit_delete_policy" ON storage.objects
FOR DELETE USING (
    bucket_id = 'rapports-audit' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- ===== BUCKET DOCUMENTS =====
-- Politique de lecture : Admins et experts peuvent lire
CREATE POLICY "documents_read_policy" ON storage.objects
FOR SELECT USING (
    bucket_id = 'documents' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'expert')
);

-- Politique d'insertion : Admins et experts peuvent uploader
CREATE POLICY "documents_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'expert')
);

-- Politique de mise à jour : Seul l'uploader peut modifier
CREATE POLICY "documents_update_policy" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- Politique de suppression : Seul l'uploader peut supprimer
CREATE POLICY "documents_delete_policy" ON storage.objects
FOR DELETE USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (owner::uuid)::text
);

-- 4. VÉRIFICATION DES POLITIQUES CRÉÉES
SELECT 
    'POLICIES_CREATED' as verification_type,
    schemaname,
    tablename as bucket_name,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'objects'
ORDER BY tablename, policyname;

-- 5. RÉSUMÉ FINAL
SELECT 
    'FINAL_SUMMARY' as summary_type,
    COUNT(DISTINCT b.name) as total_buckets,
    COUNT(DISTINCT p.tablename) as buckets_with_policies,
    COUNT(p.policyname) as total_policies_created
FROM storage.buckets b
LEFT JOIN pg_policies p ON p.tablename = 'objects'
GROUP BY summary_type;
