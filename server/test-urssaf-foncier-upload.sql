-- =====================================================
-- TEST UPLOAD URSSAF ET FONCIER
-- =====================================================

-- 1. Vérifier les labels créés
SELECT 'Labels créés:' as info;
SELECT 
    name,
    description,
    color,
    created_at
FROM "GEDDocumentLabel" 
WHERE name IN ('kbis', 'fiche_paie', 'fiche_imposition_foncier')
ORDER BY name;

-- 2. Vérifier les catégories autorisées
SELECT 'Catégories autorisées:' as info;
SELECT DISTINCT category 
FROM "GEDDocument" 
WHERE category IN ('eligibilite_ticpe', 'eligibilite_urssaf', 'eligibilite_foncier')
ORDER BY category;

-- 3. Tester l'insertion d'un document URSSAF
-- Simuler un upload de document URSSAF
DO $$
DECLARE
    test_client_id UUID := '25274ba6-67e6-4151-901c-74851fe2d82a';
    test_dossier_id UUID := gen_random_uuid();
    test_document_id UUID;
    test_label_id UUID;
BEGIN
    -- Créer un dossier de test URSSAF
    INSERT INTO "ClientProduitEligible" (
        "clientId",
        "produitId",
        statut,
        "tauxFinal",
        "montantFinal",
        "dureeFinale",
        metadata,
        notes,
        priorite,
        created_at,
        updated_at
    ) VALUES (
        test_client_id,
        (SELECT id FROM "ProduitEligible" WHERE nom ILIKE '%URSSAF%' LIMIT 1),
        'eligible',
        0.70::double precision,
        4500.00,
        12,
        '{"source": "test_urssaf", "confidence_level": "medium"}'::jsonb,
        'Test URSSAF upload',
        2,
        NOW(),
        NOW()
    );

    -- Insérer un document KBIS pour URSSAF
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
        'test-kbis-urssaf.pdf',
        'Extrait KBIS pour éligibilité URSSAF',
        'dossier_id:' || test_dossier_id,
        'eligibilite_urssaf',
        test_dossier_id || '/kbis/test-kbis-urssaf.pdf',
        test_client_id,
        true,
        1
    ) RETURNING id INTO test_document_id;

    -- Récupérer l'ID du label KBIS
    SELECT id INTO test_label_id FROM "GEDDocumentLabel" WHERE name = 'kbis';

    -- Créer la relation document-label
    INSERT INTO "GEDDocumentLabelRelation" (
        document_id,
        label_id,
        created_at
    ) VALUES (
        test_document_id,
        test_label_id,
        NOW()
    );

    RAISE NOTICE 'Document URSSAF KBIS créé avec ID: %', test_document_id;

    -- Insérer un document fiche de paie pour URSSAF
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
        'test-fiche-paie-urssaf.pdf',
        'Fiches de paie pour éligibilité URSSAF',
        'dossier_id:' || test_dossier_id,
        'eligibilite_urssaf',
        test_dossier_id || '/fiche_paie/test-fiche-paie-urssaf.pdf',
        test_client_id,
        true,
        1
    ) RETURNING id INTO test_document_id;

    -- Récupérer l'ID du label fiche_paie
    SELECT id INTO test_label_id FROM "GEDDocumentLabel" WHERE name = 'fiche_paie';

    -- Créer la relation document-label
    INSERT INTO "GEDDocumentLabelRelation" (
        document_id,
        label_id,
        created_at
    ) VALUES (
        test_document_id,
        test_label_id,
        NOW()
    );

    RAISE NOTICE 'Document URSSAF fiche de paie créé avec ID: %', test_document_id;

END $$;

-- 4. Tester l'insertion d'un document Foncier
DO $$
DECLARE
    test_client_id UUID := '25274ba6-67e6-4151-901c-74851fe2d82a';
    test_dossier_id UUID := gen_random_uuid();
    test_document_id UUID;
    test_label_id UUID;
BEGIN
    -- Créer un dossier de test Foncier
    INSERT INTO "ClientProduitEligible" (
        "clientId",
        "produitId",
        statut,
        "tauxFinal",
        "montantFinal",
        "dureeFinale",
        metadata,
        notes,
        priorite,
        created_at,
        updated_at
    ) VALUES (
        test_client_id,
        (SELECT id FROM "ProduitEligible" WHERE nom ILIKE '%FONCIER%' LIMIT 1),
        'eligible',
        0.70::double precision,
        4500.00,
        12,
        '{"source": "test_foncier", "confidence_level": "medium"}'::jsonb,
        'Test Foncier upload',
        2,
        NOW(),
        NOW()
    );

    -- Insérer un document KBIS pour Foncier
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
        'test-kbis-foncier.pdf',
        'Extrait KBIS pour éligibilité Foncier',
        'dossier_id:' || test_dossier_id,
        'eligibilite_foncier',
        test_dossier_id || '/kbis/test-kbis-foncier.pdf',
        test_client_id,
        true,
        1
    ) RETURNING id INTO test_document_id;

    -- Récupérer l'ID du label KBIS
    SELECT id INTO test_label_id FROM "GEDDocumentLabel" WHERE name = 'kbis';

    -- Créer la relation document-label
    INSERT INTO "GEDDocumentLabelRelation" (
        document_id,
        label_id,
        created_at
    ) VALUES (
        test_document_id,
        test_label_id,
        NOW()
    );

    RAISE NOTICE 'Document Foncier KBIS créé avec ID: %', test_document_id;

    -- Insérer un document fiche imposition foncier
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
        'test-fiche-imposition-foncier.pdf',
        'Fiche imposition foncier pour éligibilité Foncier',
        'dossier_id:' || test_dossier_id,
        'eligibilite_foncier',
        test_dossier_id || '/fiche_imposition_foncier/test-fiche-imposition-foncier.pdf',
        test_client_id,
        true,
        1
    ) RETURNING id INTO test_document_id;

    -- Récupérer l'ID du label fiche_imposition_foncier
    SELECT id INTO test_label_id FROM "GEDDocumentLabel" WHERE name = 'fiche_imposition_foncier';

    -- Créer la relation document-label
    INSERT INTO "GEDDocumentLabelRelation" (
        document_id,
        label_id,
        created_at
    ) VALUES (
        test_document_id,
        test_label_id,
        NOW()
    );

    RAISE NOTICE 'Document Foncier fiche imposition créé avec ID: %', test_document_id;

END $$;

-- 5. Vérifier les documents créés
SELECT 
    'DOCUMENTS_URSSAF_FONCIER' as check_type,
    gd.id,
    gd.title,
    gd.category,
    gd.file_path,
    gd.created_by,
    gd.created_at,
    gdl.name as label_name
FROM "GEDDocument" gd
JOIN "GEDDocumentLabelRelation" gdlr ON gd.id = gdlr.document_id
JOIN "GEDDocumentLabel" gdl ON gdlr.label_id = gdl.id
WHERE gd.category IN ('eligibilite_urssaf', 'eligibilite_foncier')
ORDER BY gd.created_at DESC;

-- 6. Vérifier la réutilisation du KBIS
SELECT 
    'REUTILISATION_KBIS' as check_type,
    gd.id,
    gd.title,
    gd.category,
    gd.content,
    gd.created_at,
    gdl.name as label_name
FROM "GEDDocument" gd
JOIN "GEDDocumentLabelRelation" gdlr ON gd.id = gdlr.document_id
JOIN "GEDDocumentLabel" gdl ON gdlr.label_id = gdl.id
WHERE gdl.name = 'kbis'
  AND gd.created_by = '25274ba6-67e6-4151-901c-74851fe2d82a'
ORDER BY gd.created_at DESC;

-- 7. Résumé final
SELECT 
    'RÉSUMÉ_FINAL' as check_type,
    COUNT(*) as nombre_documents_crees,
    COUNT(DISTINCT gd.category) as nombre_categories,
    COUNT(DISTINCT gdl.name) as nombre_types_documents
FROM "GEDDocument" gd
JOIN "GEDDocumentLabelRelation" gdlr ON gd.id = gdlr.document_id
JOIN "GEDDocumentLabel" gdl ON gdlr.label_id = gdl.id
WHERE gd.category IN ('eligibilite_urssaf', 'eligibilite_foncier')
  AND gd.created_by = '25274ba6-67e6-4151-901c-74851fe2d82a';

-- 8. Nettoyer les tests (optionnel)
-- DELETE FROM "GEDDocumentLabelRelation" WHERE document_id IN (
--     SELECT id FROM "GEDDocument" 
--     WHERE category IN ('eligibilite_urssaf', 'eligibilite_foncier')
--     AND created_by = '25274ba6-67e6-4151-901c-74851fe2d82a'
-- );
-- DELETE FROM "GEDDocument" 
-- WHERE category IN ('eligibilite_urssaf', 'eligibilite_foncier')
-- AND created_by = '25274ba6-67e6-4151-901c-74851fe2d82a';
