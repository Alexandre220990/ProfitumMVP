-- =====================================================
-- CORRECTION RLS CLIENTPRODUITELIGIBLE
-- Pour permettre au simulateur public de créer des CPE
-- =====================================================

-- 1. Désactiver temporairement RLS (pour tester)
-- ALTER TABLE "ClientProduitEligible" DISABLE ROW LEVEL SECURITY;

-- OU

-- 2. Créer une politique pour permettre INSERT depuis le backend (service_role)
DROP POLICY IF EXISTS "Allow service role to insert" ON "ClientProduitEligible";

CREATE POLICY "Allow service role to insert"
ON "ClientProduitEligible"
FOR INSERT
TO service_role
WITH CHECK (true);

-- 3. Politique pour permettre INSERT pour les clients temporaires
DROP POLICY IF EXISTS "Allow insert for temporary clients" ON "ClientProduitEligible";

CREATE POLICY "Allow insert for temporary clients"
ON "ClientProduitEligible"
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 4. Vérifier les politiques actuelles
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
ORDER BY policyname;

