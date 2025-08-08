-- ============================================================================
-- POLITIQUES RLS CORRIGÉES POUR LES SECTIONS DE DOCUMENTS
-- Basé sur le schéma réel de votre base de données
-- ============================================================================

-- 1. Politiques RLS pour la table document_sections
-- Permettre la lecture pour tous les utilisateurs authentifiés
CREATE POLICY "document_sections_read_policy" ON public.document_sections
FOR SELECT USING (auth.role() = 'authenticated');

-- Permettre la modification uniquement aux admins
CREATE POLICY "document_sections_write_policy" ON public.document_sections
FOR ALL USING (auth.role() = 'authenticated' AND EXISTS (
  SELECT 1 FROM "Admin" WHERE id = auth.uid()::uuid
));

-- 2. Politiques RLS pour GEDDocument (table principale des documents)
-- Note: Les politiques existantes sont déjà configurées, nous les adaptons pour les sections

-- Politique de lecture pour les clients (leurs propres documents)
CREATE POLICY "ged_document_sections_read_policy" ON public."GEDDocument"
FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    -- Clients voient leurs propres documents dans les sections appropriées
    (created_by = auth.uid()::uuid AND category IN ('business', 'technical'))
    OR
    -- Admins voient tous les documents
    EXISTS (SELECT 1 FROM "Admin" WHERE id = auth.uid()::uuid)
    OR
    -- Experts voient les documents des clients qu'ils suivent
    EXISTS (
      SELECT 1 FROM "Expert" e 
      JOIN "Dossier" d ON e.id = d."expertId"
      WHERE e.id = auth.uid()::uuid AND d."clientId" = "GEDDocument".created_by
    )
  )
);

-- Politique d'insertion pour les clients
CREATE POLICY "ged_document_sections_insert_policy" ON public."GEDDocument"
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    -- Clients peuvent créer leurs propres documents
    (created_by = auth.uid()::uuid AND category IN ('business', 'technical'))
    OR
    -- Admins peuvent créer tous les documents
    EXISTS (SELECT 1 FROM "Admin" WHERE id = auth.uid()::uuid)
    OR
    -- Experts peuvent créer des documents pour leurs clients
    EXISTS (
      SELECT 1 FROM "Expert" e 
      JOIN "Dossier" d ON e.id = d."expertId"
      WHERE e.id = auth.uid()::uuid AND d."clientId" = "GEDDocument".created_by
    )
  )
);

-- Politique de mise à jour pour les clients
CREATE POLICY "ged_document_sections_update_policy" ON public."GEDDocument"
FOR UPDATE USING (
  auth.role() = 'authenticated' AND (
    -- Clients peuvent modifier leurs propres documents
    (created_by = auth.uid()::uuid AND category IN ('business', 'technical'))
    OR
    -- Admins peuvent modifier tous les documents
    EXISTS (SELECT 1 FROM "Admin" WHERE id = auth.uid()::uuid)
    OR
    -- Experts peuvent modifier les documents de leurs clients
    EXISTS (
      SELECT 1 FROM "Expert" e 
      JOIN "Dossier" d ON e.id = d."expertId"
      WHERE e.id = auth.uid()::uuid AND d."clientId" = "GEDDocument".created_by
    )
  )
);

-- Politique de suppression pour les clients
CREATE POLICY "ged_document_sections_delete_policy" ON public."GEDDocument"
FOR DELETE USING (
  auth.role() = 'authenticated' AND (
    -- Clients peuvent supprimer leurs propres documents
    (created_by = auth.uid()::uuid AND category IN ('business', 'technical'))
    OR
    -- Admins peuvent supprimer tous les documents
    EXISTS (SELECT 1 FROM "Admin" WHERE id = auth.uid()::uuid)
    OR
    -- Experts peuvent supprimer les documents de leurs clients
    EXISTS (
      SELECT 1 FROM "Expert" e 
      JOIN "Dossier" d ON e.id = d."expertId"
      WHERE e.id = auth.uid()::uuid AND d."clientId" = "GEDDocument".created_by
    )
  )
);

-- 3. Politiques RLS pour DocumentActivity (simplifié sans bloc DO)
-- Créer les politiques seulement si la table existe
CREATE POLICY "document_activity_sections_read_policy" ON public."DocumentActivity"
FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    -- Clients voient leurs propres activités
    (user_id = auth.uid()::uuid)
    OR
    -- Admins voient toutes les activités
    EXISTS (SELECT 1 FROM "Admin" WHERE id = auth.uid()::uuid)
    OR
    -- Experts voient les activités de leurs clients
    EXISTS (
      SELECT 1 FROM "Expert" e 
      JOIN "Dossier" d ON e.id = d."expertId"
      WHERE e.id = auth.uid()::uuid AND d."clientId" = "DocumentActivity".user_id
    )
  )
);

CREATE POLICY "document_activity_sections_insert_policy" ON public."DocumentActivity"
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (
    -- Clients peuvent créer leurs propres activités
    (user_id = auth.uid()::uuid)
    OR
    -- Admins peuvent créer toutes les activités
    EXISTS (SELECT 1 FROM "Admin" WHERE id = auth.uid()::uuid)
    OR
    -- Experts peuvent créer des activités pour leurs clients
    EXISTS (
      SELECT 1 FROM "Expert" e 
      JOIN "Dossier" d ON e.id = d."expertId"
      WHERE e.id = auth.uid()::uuid AND d."clientId" = "DocumentActivity".user_id
    )
  )
);

-- 4. Vérification des politiques créées
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
    AND tablename IN ('document_sections', 'GEDDocument', 'DocumentActivity')
    AND policyname LIKE '%sections%'
ORDER BY tablename, policyname;

-- 5. Vérification que RLS est activé sur les tables
SELECT 
    'RLS_ENABLED_CHECK' as check_type,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('document_sections', 'GEDDocument', 'DocumentActivity');
