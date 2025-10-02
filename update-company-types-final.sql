-- ============================================================================
-- MISE À JOUR DES TYPES D'ENTREPRISE FINALE
-- Types : independant, expert, call_center, societe_commerciale
-- ============================================================================

-- 1. Supprimer l'ancienne contrainte
ALTER TABLE "ApporteurAffaires" 
DROP CONSTRAINT IF EXISTS apporteur_status_check;

-- 2. Mettre à jour les types d'entreprise existants vers les nouveaux types
UPDATE "ApporteurAffaires" 
SET company_type = 'independant'
WHERE company_type IN ('salarie', 'partenaire', 'agence', 'call_center', 'sarl', 'sas', 'sa');

-- 3. Ajouter la nouvelle contrainte avec les 4 types d'entreprise
ALTER TABLE "ApporteurAffaires" 
ADD CONSTRAINT apporteur_company_type_check 
CHECK (company_type IN (
    'independant',
    'expert',
    'call_center',
    'societe_commerciale'
));

-- 4. Vérifier que la contrainte fonctionne
SELECT 
    company_type,
    COUNT(*) as count
FROM "ApporteurAffaires"
GROUP BY company_type
ORDER BY company_type;

-- 5. Test d'insertion avec les nouveaux types
-- (à décommenter pour tester)

INSERT INTO "ApporteurAffaires" (
    id, auth_id, first_name, last_name, email, phone, 
    company_name, company_type, status, created_at, updated_at
) VALUES (
    gen_random_uuid(), 
    '00000000-0000-0000-0000-000000000001',
    'Test', 'Independant', 'test.independant@example.com', '0123456789',
    'Test Company', 'independant', 'candidature',
    NOW(), NOW()
);

INSERT INTO "ApporteurAffaires" (
    id, auth_id, first_name, last_name, email, phone, 
    company_name, company_type, status, created_at, updated_at
) VALUES (
    gen_random_uuid(), 
    '00000000-0000-0000-0000-000000000002',
    'Test', 'Expert', 'test.expert@example.com', '0123456789',
    'Test Company', 'expert', 'candidature',
    NOW(), NOW()
);

-- Nettoyer les tests
DELETE FROM "ApporteurAffaires" WHERE email LIKE 'test.%@example.com';
*/
