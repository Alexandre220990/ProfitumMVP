-- ============================================================================
-- MISE À JOUR DES TYPES D'ENTREPRISE POUR LES APPORTEURS D'AFFAIRES
-- ============================================================================

-- 1. Supprimer l'ancienne contrainte
ALTER TABLE "ApporteurAffaires" 
DROP CONSTRAINT IF EXISTS apporteur_status_check;

-- 2. Mettre à jour les types d'entreprise existants vers les nouveaux types
UPDATE "ApporteurAffaires" 
SET company_type = 'independant'
WHERE company_type IN ('salarie', 'partenaire', 'agence', 'call_center');

-- 3. Ajouter la nouvelle contrainte avec tous les types d'entreprise
ALTER TABLE "ApporteurAffaires" 
ADD CONSTRAINT apporteur_company_type_check 
CHECK (company_type IN (
    'independant',
    'auto_entrepreneur', 
    'entreprise_individuelle',
    'sarl',
    'sas',
    'sa',
    'agence',
    'call_center',
    'partenaire',
    'salarie'
));

-- 4. Vérifier que la contrainte fonctionne
SELECT 
    company_type,
    COUNT(*) as count
FROM "ApporteurAffaires"
GROUP BY company_type
ORDER BY company_type;

-- 5. Tester l'insertion avec un nouveau type
-- (à décommenter pour tester)
/*
INSERT INTO "ApporteurAffaires" (
    id, auth_id, first_name, last_name, email, phone, 
    company_name, company_type, status, created_at, updated_at
) VALUES (
    gen_random_uuid(), 
    '00000000-0000-0000-0000-000000000001',
    'Test', 'Type', 'test.type@example.com', '0123456789',
    'Test Company', 'auto_entrepreneur', 'candidature',
    NOW(), NOW()
);

-- Nettoyer le test
DELETE FROM "ApporteurAffaires" WHERE email = 'test.type@example.com';
*/
