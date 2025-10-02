-- ============================================================================
-- SCRIPT POUR SUPPRIMER LA CONTRAINTE COMPANY_TYPE SI NÉCESSAIRE
-- ============================================================================
-- Ce script supprime la contrainte restrictive sur company_type

-- 1. Vérifier les contraintes existantes
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = '"ApporteurAffaires"'::regclass 
AND contype = 'c'
AND conname LIKE '%company_type%';

-- 2. Supprimer la contrainte si elle existe
ALTER TABLE "ApporteurAffaires" 
DROP CONSTRAINT IF EXISTS "ApporteurAffaires_company_type_check";

-- 3. Vérifier que la contrainte a été supprimée
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = '"ApporteurAffaires"'::regclass 
AND contype = 'c'
AND conname LIKE '%company_type%';

-- 4. Maintenant vous pouvez insérer avec n'importe quelle valeur de company_type
-- Exemple d'insertion après suppression de la contrainte
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
    cv_file_path,
    sponsor_code,
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
    '/uploads/cv/cv-test.pdf',
    NULL,
    'candidature',
    NOW(),
    NOW(),
    NOW()
);

-- 5. Vérifier l'insertion
SELECT 
    first_name,
    last_name,
    company_name,
    company_type,
    status
FROM "ApporteurAffaires" 
WHERE email = 'test.apporteur@example.com';
