-- Script pour supprimer la politique trop permissive
-- Date: 2025-01-27

-- Supprimer la politique trop permissive qui peut causer des conflits
DROP POLICY IF EXISTS "Enable all operations for service_role" ON "ClientProduitEligible";

-- Vérifier les politiques restantes
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
AND schemaname = 'public'
ORDER BY policyname;

-- Vérifier que RLS est toujours activé
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'ClientProduitEligible'
AND schemaname = 'public'; 