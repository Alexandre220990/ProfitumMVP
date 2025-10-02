-- ============================================================================
-- SCRIPT SIMPLE POUR CORRIGER LE PROBLÈME COMPANY_TYPE
-- ============================================================================
-- Ce script supprime la contrainte et crée des apporteurs de test

-- 1. Supprimer les contraintes restrictives
ALTER TABLE "ApporteurAffaires" 
DROP CONSTRAINT IF EXISTS "ApporteurAffaires_company_type_check";

ALTER TABLE "ApporteurAffaires" 
DROP CONSTRAINT IF EXISTS "ApporteurAffaires_status_check";

-- 2. Vérifier que la contrainte a été supprimée
SELECT 'Contrainte supprimée' as status;

-- 3. Créer un apporteur de test simple
INSERT INTO "ApporteurAffaires" (
    id,
    first_name,
    last_name,
    email,
    phone,
    company_name,
    company_type,
    sector,
    siren,
    motivation_letter,
    status,
    candidature_created_at,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Test',
    'Apporteur',
    'test.apporteur@example.com',
    '0123456789',
    'Test Company',
    'SARL',
    'Conseil & Audit',
    '123456789',
    'Test de candidature apporteur d''affaires',
    'active',
    NOW(),
    NOW(),
    NOW()
);

-- 4. Vérifier l'insertion
SELECT 
    first_name,
    last_name,
    company_name,
    company_type,
    status,
    sector
FROM "ApporteurAffaires" 
WHERE email = 'test.apporteur@example.com';

-- 5. Afficher les statistiques
SELECT 
    status, 
    COUNT(*) as count 
FROM "ApporteurAffaires" 
GROUP BY status 
ORDER BY status;
