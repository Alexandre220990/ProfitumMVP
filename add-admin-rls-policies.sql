-- ============================================================================
-- AJOUT DES POLITIQUES RLS POUR LES ADMINS
-- ============================================================================
-- À copier-coller dans Supabase SQL Editor
-- Date : 1er octobre 2025
-- Objectif : Permettre aux admins d'accéder et créer des apporteurs
-- ============================================================================

-- ============================================================================
-- 1. AJOUTER LES POLITIQUES ADMIN POUR ApporteurAffaires
-- ============================================================================

-- Supprimer la politique si elle existe déjà
DROP POLICY IF EXISTS "admin_full_access_apporteur" ON "ApporteurAffaires";

-- Politique pour lecture/écriture complète pour les admins
-- Note: Utilise 'id' au lieu de 'auth_id' si la table Admin n'a pas de colonne auth_id
CREATE POLICY "admin_full_access_apporteur" ON "ApporteurAffaires"
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE id = (
                SELECT id FROM "Admin" LIMIT 1
            )
        )
        OR
        auth.uid() IN (
            SELECT COALESCE(auth_id, id) FROM "Admin"
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE id = (
                SELECT id FROM "Admin" LIMIT 1
            )
        )
        OR
        auth.uid() IN (
            SELECT COALESCE(auth_id, id) FROM "Admin"
        )
    );

-- ============================================================================
-- 2. AJOUTER LES POLITIQUES ADMIN POUR Prospect
-- ============================================================================

DROP POLICY IF EXISTS "admin_full_access_prospect" ON "Prospect";

CREATE POLICY "admin_full_access_prospect" ON "Prospect"
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE id = (
                SELECT id FROM "Admin" LIMIT 1
            )
        )
        OR
        auth.uid() IN (
            SELECT COALESCE(auth_id, id) FROM "Admin"
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE id = (
                SELECT id FROM "Admin" LIMIT 1
            )
        )
        OR
        auth.uid() IN (
            SELECT COALESCE(auth_id, id) FROM "Admin"
        )
    );

-- ============================================================================
-- 3. AJOUTER LES POLITIQUES ADMIN POUR ExpertNotification
-- ============================================================================

DROP POLICY IF EXISTS "admin_full_access_expert_notification" ON "ExpertNotification";

CREATE POLICY "admin_full_access_expert_notification" ON "ExpertNotification"
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE id = (
                SELECT id FROM "Admin" LIMIT 1
            )
        )
        OR
        auth.uid() IN (
            SELECT COALESCE(auth_id, id) FROM "Admin"
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE id = (
                SELECT id FROM "Admin" LIMIT 1
            )
        )
        OR
        auth.uid() IN (
            SELECT COALESCE(auth_id, id) FROM "Admin"
        )
    );

-- ============================================================================
-- 4. AJOUTER LES POLITIQUES ADMIN POUR ProspectMeeting
-- ============================================================================

DROP POLICY IF EXISTS "admin_full_access_prospect_meeting" ON "ProspectMeeting";

CREATE POLICY "admin_full_access_prospect_meeting" ON "ProspectMeeting"
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE id = (
                SELECT id FROM "Admin" LIMIT 1
            )
        )
        OR
        auth.uid() IN (
            SELECT COALESCE(auth_id, id) FROM "Admin"
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE id = (
                SELECT id FROM "Admin" LIMIT 1
            )
        )
        OR
        auth.uid() IN (
            SELECT COALESCE(auth_id, id) FROM "Admin"
        )
    );

-- ============================================================================
-- 5. AJOUTER LES POLITIQUES ADMIN POUR ApporteurCommission
-- ============================================================================

DROP POLICY IF EXISTS "admin_full_access_commission" ON "ApporteurCommission";

CREATE POLICY "admin_full_access_commission" ON "ApporteurCommission"
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE id = (
                SELECT id FROM "Admin" LIMIT 1
            )
        )
        OR
        auth.uid() IN (
            SELECT COALESCE(auth_id, id) FROM "Admin"
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE id = (
                SELECT id FROM "Admin" LIMIT 1
            )
        )
        OR
        auth.uid() IN (
            SELECT COALESCE(auth_id, id) FROM "Admin"
        )
    );

-- ============================================================================
-- 6. AJOUTER LES POLITIQUES ADMIN POUR ProspectConversion
-- ============================================================================

DROP POLICY IF EXISTS "admin_full_access_prospect_conversion" ON "ProspectConversion";

CREATE POLICY "admin_full_access_prospect_conversion" ON "ProspectConversion"
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE id = (
                SELECT id FROM "Admin" LIMIT 1
            )
        )
        OR
        auth.uid() IN (
            SELECT COALESCE(auth_id, id) FROM "Admin"
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE id = (
                SELECT id FROM "Admin" LIMIT 1
            )
        )
        OR
        auth.uid() IN (
            SELECT COALESCE(auth_id, id) FROM "Admin"
        )
    );

-- ============================================================================
-- 7. VÉRIFIER LES POLITIQUES CRÉÉES
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM 
    pg_policies
WHERE 
    tablename IN (
        'ApporteurAffaires',
        'Prospect',
        'ExpertNotification',
        'ProspectMeeting',
        'ApporteurCommission',
        'ProspectConversion'
    )
ORDER BY 
    tablename, policyname;

-- ============================================================================
-- SCRIPT TERMINÉ AVEC SUCCÈS
-- ============================================================================
-- Les admins peuvent maintenant créer et gérer les apporteurs d'affaires
-- ============================================================================

