-- Script pour corriger les politiques RLS de ClientProduitEligible
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

-- 2. Vérifier si RLS est activé
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'ClientProduitEligible'
AND schemaname = 'public';

-- 3. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "ClientProduitEligible_insert_policy" ON "ClientProduitEligible";
DROP POLICY IF EXISTS "ClientProduitEligible_select_policy" ON "ClientProduitEligible";
DROP POLICY IF EXISTS "ClientProduitEligible_update_policy" ON "ClientProduitEligible";
DROP POLICY IF EXISTS "ClientProduitEligible_delete_policy" ON "ClientProduitEligible";

-- 4. Créer de nouvelles politiques RLS appropriées

-- Politique pour l'insertion (permettre l'insertion pour les clients authentifiés ET les migrations)
CREATE POLICY "ClientProduitEligible_insert_policy" ON "ClientProduitEligible"
FOR INSERT 
TO authenticated, anon
WITH CHECK (
    -- Permettre l'insertion si le clientId correspond à l'utilisateur authentifié
    (auth.role() = 'authenticated' AND EXISTS (
        SELECT 1 FROM "Client" 
        WHERE "Client".id = "ClientProduitEligible"."clientId" 
        AND "Client".email = auth.jwt() ->> 'email'
    ))
    OR
    -- Permettre l'insertion pour les migrations (clientId doit exister dans la table Client)
    (auth.role() = 'anon' AND EXISTS (
        SELECT 1 FROM "Client" 
        WHERE "Client".id = "ClientProduitEligible"."clientId"
    ))
);

-- Politique pour la sélection (permettre la lecture pour les clients propriétaires)
CREATE POLICY "ClientProduitEligible_select_policy" ON "ClientProduitEligible"
FOR SELECT 
TO authenticated
USING (
    -- Permettre la lecture si le clientId correspond à l'utilisateur authentifié
    EXISTS (
        SELECT 1 FROM "Client" 
        WHERE "Client".id = "ClientProduitEligible"."clientId" 
        AND "Client".email = auth.jwt() ->> 'email'
    )
    OR
    -- Permettre la lecture pour les experts (à adapter selon vos besoins)
    EXISTS (
        SELECT 1 FROM "Expert" 
        WHERE "Expert".id = "ClientProduitEligible"."expert_id" 
        AND "Expert".email = auth.jwt() ->> 'email'
    )
);

-- Politique pour la mise à jour (permettre la mise à jour pour les clients propriétaires et experts)
CREATE POLICY "ClientProduitEligible_update_policy" ON "ClientProduitEligible"
FOR UPDATE 
TO authenticated
USING (
    -- Permettre la mise à jour si le clientId correspond à l'utilisateur authentifié
    EXISTS (
        SELECT 1 FROM "Client" 
        WHERE "Client".id = "ClientProduitEligible"."clientId" 
        AND "Client".email = auth.jwt() ->> 'email'
    )
    OR
    -- Permettre la mise à jour pour les experts assignés
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

-- Politique pour la suppression (permettre la suppression pour les clients propriétaires)
CREATE POLICY "ClientProduitEligible_delete_policy" ON "ClientProduitEligible"
FOR DELETE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM "Client" 
        WHERE "Client".id = "ClientProduitEligible"."clientId" 
        AND "Client".email = auth.jwt() ->> 'email'
    )
);

-- 5. Vérifier que RLS est activé
ALTER TABLE "ClientProduitEligible" ENABLE ROW LEVEL SECURITY;

-- 6. Vérifier les nouvelles politiques
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

-- 7. Test de connexion avec la clé anonyme
-- (Ceci sera testé via l'API) 