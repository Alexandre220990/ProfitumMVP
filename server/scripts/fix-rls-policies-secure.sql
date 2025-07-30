-- Script pour corriger les politiques RLS de ClientProduitEligible (VERSION SÉCURISÉE)
-- Date: 2025-01-27

-- 1. Vérifier les politiques RLS actuelles
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
WHERE tablename = 'ClientProduitEligible'
AND schemaname = 'public'
ORDER BY policyname;

-- 2. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "ClientProduitEligible_insert_policy" ON "ClientProduitEligible";
DROP POLICY IF EXISTS "ClientProduitEligible_select_policy" ON "ClientProduitEligible";
DROP POLICY IF EXISTS "ClientProduitEligible_update_policy" ON "ClientProduitEligible";
DROP POLICY IF EXISTS "ClientProduitEligible_delete_policy" ON "ClientProduitEligible";

-- 3. Créer des politiques RLS SÉCURISÉES

-- Politique pour l'insertion (SEULEMENT pour les utilisateurs authentifiés)
CREATE POLICY "ClientProduitEligible_insert_policy" ON "ClientProduitEligible"
FOR INSERT 
TO authenticated
WITH CHECK (
    -- L'utilisateur authentifié doit être le propriétaire du client
    EXISTS (
        SELECT 1 FROM "Client" 
        WHERE "Client".id = "ClientProduitEligible"."clientId" 
        AND "Client".email = auth.jwt() ->> 'email'
    )
);

-- Politique pour la sélection (SEULEMENT pour les propriétaires et experts assignés)
CREATE POLICY "ClientProduitEligible_select_policy" ON "ClientProduitEligible"
FOR SELECT 
TO authenticated
USING (
    -- Le client peut voir ses propres produits éligibles
    EXISTS (
        SELECT 1 FROM "Client" 
        WHERE "Client".id = "ClientProduitEligible"."clientId" 
        AND "Client".email = auth.jwt() ->> 'email'
    )
    OR
    -- L'expert assigné peut voir les produits éligibles
    EXISTS (
        SELECT 1 FROM "Expert" 
        WHERE "Expert".id = "ClientProduitEligible"."expert_id" 
        AND "Expert".email = auth.jwt() ->> 'email'
    )
);

-- Politique pour la mise à jour (SEULEMENT pour les propriétaires et experts assignés)
CREATE POLICY "ClientProduitEligible_update_policy" ON "ClientProduitEligible"
FOR UPDATE 
TO authenticated
USING (
    -- Le client peut mettre à jour ses propres produits éligibles
    EXISTS (
        SELECT 1 FROM "Client" 
        WHERE "Client".id = "ClientProduitEligible"."clientId" 
        AND "Client".email = auth.jwt() ->> 'email'
    )
    OR
    -- L'expert assigné peut mettre à jour les produits éligibles
    EXISTS (
        SELECT 1 FROM "Expert" 
        WHERE "Expert".id = "ClientProduitEligible"."expert_id" 
        AND "Expert".email = auth.jwt() ->> 'email'
    )
)
WITH CHECK (
    -- Même conditions pour WITH CHECK
    EXISTS (
        SELECT 1 FROM "Client" 
        WHERE "Client".id = "ClientProduitEligible"."clientId" 
        AND "Client".email = auth.jwt() ->> 'email'
    )
    OR
    EXISTS (
        SELECT 1 FROM "Expert" 
        WHERE "Expert".id = "ClientProduitEligible"."expert_id" 
        AND "Expert".email = auth.jwt() ->> 'email'
    )
);

-- Politique pour la suppression (SEULEMENT pour les propriétaires)
CREATE POLICY "ClientProduitEligible_delete_policy" ON "ClientProduitEligible"
FOR DELETE 
TO authenticated
USING (
    -- Seul le client propriétaire peut supprimer
    EXISTS (
        SELECT 1 FROM "Client" 
        WHERE "Client".id = "ClientProduitEligible"."clientId" 
        AND "Client".email = auth.jwt() ->> 'email'
    )
);

-- 4. S'assurer que RLS est activé
ALTER TABLE "ClientProduitEligible" ENABLE ROW LEVEL SECURITY;

-- 5. Vérifier les nouvelles politiques
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
WHERE tablename = 'ClientProduitEligible'
AND schemaname = 'public'
ORDER BY policyname;

-- 6. Test de sécurité : vérifier qu'aucune politique n'a de conditions trop permissives
SELECT 
    policyname,
    cmd,
    qual,
    with_check,
    CASE 
        WHEN qual LIKE '%true%' OR with_check LIKE '%true%' THEN '⚠️ ATTENTION: Politique trop permissive'
        ELSE '✅ Politique sécurisée'
    END as security_status
FROM pg_policies 
WHERE tablename = 'ClientProduitEligible'
AND schemaname = 'public'; 