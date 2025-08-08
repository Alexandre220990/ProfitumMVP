-- ============================================================================
-- POLITIQUES RLS POUR LES SECTIONS DE DOCUMENTS
-- ============================================================================

-- 1. Politiques RLS pour la table document_sections
-- Permettre la lecture pour tous les utilisateurs authentifiés
CREATE POLICY "document_sections_read_policy" ON public.document_sections
FOR SELECT USING (auth.role() = 'authenticated');

-- Permettre la modification uniquement aux admins
CREATE POLICY "document_sections_write_policy" ON public.document_sections
FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (
  SELECT 1 FROM "Admin" WHERE auth_id = auth.uid()
));

-- 2. Politiques RLS pour DocumentFile selon les sections
-- Politique de lecture pour les clients (leurs propres fichiers)
CREATE POLICY "document_files_client_read_policy" ON public."DocumentFile"
FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    -- Clients voient leurs propres fichiers
    (client_id = auth.uid() AND category IN ('guide', 'autre', 'rapport', 'facture'))
    OR
    -- Admins voient tous les fichiers
    EXISTS (SELECT 1 FROM "Admin" WHERE auth_id = auth.uid())
    OR
    -- Experts voient les fichiers des clients qu'ils suivent
    EXISTS (
      SELECT 1 FROM "Expert" e 
      JOIN "Dossier" d ON e.id = d.expert_id 
      WHERE e.auth_id = auth.uid() AND d.client_id = "DocumentFile".client_id
    )
  )
);

-- Politique d'insertion pour les clients
CREATE POLICY "document_files_client_insert_policy" ON public."DocumentFile"
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    -- Clients peuvent uploader leurs propres fichiers
    (client_id = auth.uid() AND category IN ('guide', 'autre', 'rapport', 'facture'))
    OR
    -- Admins peuvent uploader tous les fichiers
    EXISTS (SELECT 1 FROM "Admin" WHERE auth_id = auth.uid())
    OR
    -- Experts peuvent uploader pour leurs clients
    EXISTS (
      SELECT 1 FROM "Expert" e 
      JOIN "Dossier" d ON e.id = d.expert_id 
      WHERE e.auth_id = auth.uid() AND d.client_id = "DocumentFile".client_id
    )
  )
);

-- Politique de mise à jour pour les clients
CREATE POLICY "document_files_client_update_policy" ON public."DocumentFile"
FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    -- Clients peuvent modifier leurs propres fichiers
    (client_id = auth.uid() AND category IN ('guide', 'autre', 'rapport', 'facture'))
    OR
    -- Admins peuvent modifier tous les fichiers
    EXISTS (SELECT 1 FROM "Admin" WHERE auth_id = auth.uid())
    OR
    -- Experts peuvent modifier les fichiers de leurs clients
    EXISTS (
      SELECT 1 FROM "Expert" e 
      JOIN "Dossier" d ON e.id = d.expert_id 
      WHERE e.auth_id = auth.uid() AND d.client_id = "DocumentFile".client_id
    )
  )
);

-- Politique de suppression pour les clients
CREATE POLICY "document_files_client_delete_policy" ON public."DocumentFile"
FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    -- Clients peuvent supprimer leurs propres fichiers
    (client_id = auth.uid() AND category IN ('guide', 'autre', 'rapport', 'facture'))
    OR
    -- Admins peuvent supprimer tous les fichiers
    EXISTS (SELECT 1 FROM "Admin" WHERE auth_id = auth.uid())
    OR
    -- Experts peuvent supprimer les fichiers de leurs clients
    EXISTS (
      SELECT 1 FROM "Expert" e 
      JOIN "Dossier" d ON e.id = d.expert_id 
      WHERE e.auth_id = auth.uid() AND d.client_id = "DocumentFile".client_id
    )
  )
);

-- 3. Politiques RLS pour DocumentActivity
CREATE POLICY "document_activity_read_policy" ON public."DocumentActivity"
FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    -- Clients voient leurs propres activités
    (client_id = auth.uid())
    OR
    -- Admins voient toutes les activités
    EXISTS (SELECT 1 FROM "Admin" WHERE auth_id = auth.uid())
    OR
    -- Experts voient les activités de leurs clients
    EXISTS (
      SELECT 1 FROM "Expert" e 
      JOIN "Dossier" d ON e.id = d.expert_id 
      WHERE e.auth_id = auth.uid() AND d.client_id = "DocumentActivity".client_id
    )
  )
);

CREATE POLICY "document_activity_insert_policy" ON public."DocumentActivity"
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    -- Clients peuvent créer leurs propres activités
    (client_id = auth.uid())
    OR
    -- Admins peuvent créer toutes les activités
    EXISTS (SELECT 1 FROM "Admin" WHERE auth_id = auth.uid())
    OR
    -- Experts peuvent créer des activités pour leurs clients
    EXISTS (
      SELECT 1 FROM "Expert" e 
      JOIN "Dossier" d ON e.id = d.expert_id 
      WHERE e.auth_id = auth.uid() AND d.client_id = "DocumentActivity".client_id
    )
  )
);

-- 4. Politiques de stockage pour les buckets
-- Note: Les politiques de stockage sont gérées via l'API Supabase Storage
-- et sont configurées dans le service EnhancedDocumentStorageService

-- 5. Vérification des politiques créées
SELECT 
    'RLS_POLICIES_CHECK' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('document_sections', 'DocumentFile', 'DocumentActivity')
ORDER BY tablename, policyname;

-- 6. Vérification que RLS est activé sur les tables
SELECT 
    'RLS_ENABLED_CHECK' as check_type,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('document_sections', 'DocumentFile', 'DocumentActivity');
