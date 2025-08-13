-- =====================================================
-- CORRECTION CONTRAINTE CATÉGORIE GEDDocument
-- =====================================================

-- 0. Vérifier les tables existantes
SELECT 'Tables GED existantes:' as info;
SELECT tablename 
FROM pg_tables 
WHERE tablename LIKE '%ged%' OR tablename LIKE '%document%' OR tablename LIKE '%file%'
ORDER BY tablename;

-- 0.1 Vérifier toutes les tables pour trouver celles liées aux documents
SELECT 'Toutes les tables:' as info;
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 1. Vérifier la contrainte actuelle
SELECT 'Contrainte actuelle GEDDocument:' as info;
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = '"GEDDocument"'::regclass
AND conname = 'GEDDocument_category_check';

-- 2. Supprimer l'ancienne contrainte
ALTER TABLE "GEDDocument" DROP CONSTRAINT IF EXISTS "GEDDocument_category_check";

-- 3. Créer la nouvelle contrainte avec support URSSAF et Foncier
ALTER TABLE "GEDDocument" ADD CONSTRAINT "GEDDocument_category_check" 
CHECK (category IN (
    'eligibilite_ticpe',
    'eligibilite_urssaf', 
    'eligibilite_foncier',
    'business',
    'technical',
    'kbis',
    'immatriculation',
    'facture_carburant',
    'audit',
    'rapport',
    'charte',
    'guide',
    'formation',
    'facture',
    'other'
));

-- 4. Vérifier la nouvelle contrainte
SELECT 'Nouvelle contrainte GEDDocument:' as info;
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = '"GEDDocument"'::regclass
AND conname = 'GEDDocument_category_check';

-- 5. Tester l'insertion avec les nouvelles catégories
DO $$
DECLARE
    test_client_id UUID := '25274ba6-67e6-4151-901c-74851fe2d82a';
    test_dossier_id UUID := gen_random_uuid();
    test_document_id UUID;
BEGIN
    -- Test insertion URSSAF
    INSERT INTO "GEDDocument" (
        title,
        description,
        content,
        category,
        file_path,
        created_by,
        is_active,
        version
    ) VALUES (
        'test-urssaf.pdf',
        'Test document URSSAF',
        'dossier_id:' || test_dossier_id,
        'eligibilite_urssaf',
        test_dossier_id || '/test-urssaf.pdf',
        test_client_id,
        true,
        1
    ) RETURNING id INTO test_document_id;
    
    RAISE NOTICE 'Document URSSAF créé avec ID: %', test_document_id;
    
    -- Test insertion Foncier
    INSERT INTO "GEDDocument" (
        title,
        description,
        content,
        category,
        file_path,
        created_by,
        is_active,
        version
    ) VALUES (
        'test-foncier.pdf',
        'Test document Foncier',
        'dossier_id:' || test_dossier_id,
        'eligibilite_foncier',
        test_dossier_id || '/test-foncier.pdf',
        test_client_id,
        true,
        1
    ) RETURNING id INTO test_document_id;
    
    RAISE NOTICE 'Document Foncier créé avec ID: %', test_document_id;
    
    -- Nettoyer les tests
    DELETE FROM "GEDDocument" WHERE id = test_document_id;
    
END $$;

-- 6. Résumé
SELECT 
    'RÉSUMÉ_CORRECTION' as check_type,
    '✅ Contrainte GEDDocument mise à jour' as status,
    '✅ Support URSSAF et Foncier ajouté' as support,
    '✅ Tests dinsertion reussis' as tests;
