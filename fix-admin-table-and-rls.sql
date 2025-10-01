-- ============================================================================
-- CORRECTION COMPLÈTE TABLE ADMIN + POLITIQUES RLS SÉCURISÉES
-- ============================================================================
-- Date : 1er octobre 2025
-- Objectif : Ajouter auth_id à Admin et créer les politiques RLS sécurisées
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : AJOUTER LA COLONNE auth_id À LA TABLE Admin
-- ============================================================================

-- Ajouter la colonne auth_id si elle n'existe pas
ALTER TABLE "Admin" 
ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

-- Créer l'index pour les performances
CREATE INDEX IF NOT EXISTS idx_admin_auth_id ON "Admin"(auth_id);

-- Ajouter la contrainte de clé étrangère vers auth.users
ALTER TABLE "Admin"
ADD CONSTRAINT fk_admin_auth_id 
FOREIGN KEY (auth_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- ============================================================================
-- ÉTAPE 2 : LIER L'ADMIN EXISTANT À SON COMPTE AUTH (SI APPLICABLE)
-- ============================================================================

-- Cette requête va lier automatiquement l'admin à son compte auth via l'email
-- ⚠️ Exécutez cette commande UNIQUEMENT si votre admin a déjà un compte dans auth.users
UPDATE "Admin" 
SET auth_id = (
    SELECT id 
    FROM auth.users 
    WHERE auth.users.email = "Admin".email 
    LIMIT 1
)
WHERE auth_id IS NULL 
AND email IS NOT NULL;

-- Vérifier les admins mis à jour
SELECT 
    id, 
    email, 
    name, 
    auth_id,
    CASE 
        WHEN auth_id IS NOT NULL THEN '✅ Lié à auth.users'
        ELSE '❌ Non lié'
    END as statut_auth
FROM "Admin";

-- ============================================================================
-- ÉTAPE 3 : ACTIVER RLS SUR LES TABLES APPORTEUR
-- ============================================================================

-- S'assurer que RLS est activé
ALTER TABLE "ApporteurAffaires" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Prospect" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExpertNotification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProspectMeeting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApporteurCommission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProspectConversion" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 4 : CRÉER LES POLITIQUES RLS SÉCURISÉES
-- ============================================================================

-- ===== ApporteurAffaires =====
DROP POLICY IF EXISTS "admin_full_access_apporteur" ON "ApporteurAffaires";

CREATE POLICY "admin_full_access_apporteur" ON "ApporteurAffaires"
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE auth_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE auth_id = auth.uid()
        )
    );

-- ===== Prospect =====
DROP POLICY IF EXISTS "admin_full_access_prospect" ON "Prospect";

CREATE POLICY "admin_full_access_prospect" ON "Prospect"
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE auth_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE auth_id = auth.uid()
        )
    );

-- ===== ExpertNotification =====
DROP POLICY IF EXISTS "admin_full_access_expert_notification" ON "ExpertNotification";

CREATE POLICY "admin_full_access_expert_notification" ON "ExpertNotification"
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE auth_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE auth_id = auth.uid()
        )
    );

-- ===== ProspectMeeting =====
DROP POLICY IF EXISTS "admin_full_access_prospect_meeting" ON "ProspectMeeting";

CREATE POLICY "admin_full_access_prospect_meeting" ON "ProspectMeeting"
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE auth_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE auth_id = auth.uid()
        )
    );

-- ===== ApporteurCommission =====
DROP POLICY IF EXISTS "admin_full_access_commission" ON "ApporteurCommission";

CREATE POLICY "admin_full_access_commission" ON "ApporteurCommission"
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE auth_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE auth_id = auth.uid()
        )
    );

-- ===== ProspectConversion =====
DROP POLICY IF EXISTS "admin_full_access_prospect_conversion" ON "ProspectConversion";

CREATE POLICY "admin_full_access_prospect_conversion" ON "ProspectConversion"
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE auth_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE auth_id = auth.uid()
        )
    );

-- ============================================================================
-- ÉTAPE 5 : VÉRIFICATION FINALE
-- ============================================================================

-- Vérifier la structure de la table Admin
SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'Admin'
    AND column_name IN ('id', 'email', 'auth_id')
ORDER BY 
    ordinal_position;

-- Vérifier les politiques créées
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

-- Vérifier les admins
SELECT 
    id, 
    email, 
    name, 
    role,
    auth_id,
    created_at,
    CASE 
        WHEN auth_id IS NOT NULL THEN '✅ Prêt pour RLS'
        ELSE '⚠️ Manque auth_id - Utiliser UPDATE ci-dessous'
    END as statut_rls
FROM "Admin";

-- ============================================================================
-- ÉTAPE 6 (OPTIONNELLE) : SI AUCUN ADMIN N'A ÉTÉ LIÉ AUTOMATIQUEMENT
-- ============================================================================

-- Si votre admin n'a pas été lié automatiquement, récupérez d'abord votre auth.uid():
-- Exécutez cette requête après vous être connecté en tant qu'admin:
-- SELECT auth.uid();

-- Puis mettez à jour manuellement avec VOTRE auth.uid():
-- UPDATE "Admin" 
-- SET auth_id = 'VOTRE_AUTH_UID_ICI'
-- WHERE email = 'votre-email-admin@example.com';

-- ============================================================================
-- SCRIPT TERMINÉ AVEC SUCCÈS
-- ============================================================================
-- ✅ La table Admin a maintenant la colonne auth_id
-- ✅ Les politiques RLS sont créées et sécurisées
-- ✅ Seuls les vrais admins (liés à auth.users) peuvent gérer les apporteurs
-- ============================================================================

