-- ============================================================================
-- SCRIPT ULTRA-SIMPLE POUR CRÉER UN APPORTEUR
-- ============================================================================
-- Ce script supprime toutes les contraintes et crée un apporteur basique

-- 1. Supprimer TOUTES les contraintes restrictives
ALTER TABLE "ApporteurAffaires" 
DROP CONSTRAINT IF EXISTS "ApporteurAffaires_company_type_check";

ALTER TABLE "ApporteurAffaires" 
DROP CONSTRAINT IF EXISTS "ApporteurAffaires_status_check";

ALTER TABLE "ApporteurAffaires" 
DROP CONSTRAINT IF EXISTS "apporteur_status_check";

-- 2. Créer un apporteur avec le minimum requis
INSERT INTO "ApporteurAffaires" (
    id,
    first_name,
    last_name,
    email,
    phone,
    company_name,
    company_type,
    status,
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
    'active',
    NOW(),
    NOW()
);

-- 3. Vérifier l'insertion
SELECT 
    first_name,
    last_name,
    email,
    company_name,
    company_type,
    status
FROM "ApporteurAffaires" 
WHERE email = 'test.apporteur@example.com';

-- 4. Compter tous les apporteurs
SELECT COUNT(*) as total_apporteurs FROM "ApporteurAffaires";

-- 5. Afficher les statuts existants
SELECT 
    status, 
    COUNT(*) as count 
FROM "ApporteurAffaires" 
GROUP BY status 
ORDER BY status;
