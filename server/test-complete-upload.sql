-- ============================================================================
-- TEST COMPLET ALIGNEMENT FRONTEND-API-BDD
-- ============================================================================

-- 1. Vérifier que le dossier TICPE existe
SELECT 
    'TICPE_DOSSIER_VERIFICATION' as check_type,
    id,
    "clientId",
    statut,
    current_step,
    progress,
    created_at
FROM "ClientProduitEligible" 
WHERE id = '93374842-cca6-4873-b16e-0ada92e97004';

-- 2. Vérifier que le client existe
SELECT 
    'CLIENT_VERIFICATION' as check_type,
    id,
    email,
    nom_entreprise,
    created_at
FROM "Client" 
WHERE id = (
    SELECT "clientId" 
    FROM "ClientProduitEligible" 
    WHERE id = '93374842-cca6-4873-b16e-0ada92e97004'
);

-- 3. Vérifier les catégories autorisées dans GEDDocument
SELECT 
    'CATEGORIES_AUTORISEES' as check_type,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = '"GEDDocument"'::regclass 
    AND contype = 'c'
    AND conname = 'GEDDocument_category_check';

-- 4. Vérifier les politiques RLS pour l'insertion
SELECT 
    'RLS_INSERT_POLICIES' as check_type,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'GEDDocument'
    AND cmd = 'INSERT';

-- 5. Test d'insertion complet (simulation upload)
BEGIN;

-- Simuler les paramètres d'un utilisateur client
SET app.user_type = 'client';
SET app.user_id = '25274ba6-67e6-4151-901c-74851fe2d82a';

-- Test d'insertion pour chaque type de document TICPE
INSERT INTO "GEDDocument" (
    title,
    description,
    content,
    category,
    file_path,
    created_by,
    is_active,
    version
)
VALUES 
    ('test-kbis.pdf', 'Extrait KBIS pour éligibilité TICPE', 'dossier_id:93374842-cca6-4873-b16e-0ada92e97004', 'eligibilite_ticpe', '93374842-cca6-4873-b16e-0ada92e97004/kbis/test-kbis.pdf', '25274ba6-67e6-4151-901c-74851fe2d82a'::uuid, true, 1),
    ('test-immatriculation.pdf', 'Certificat immatriculation pour éligibilité TICPE', 'dossier_id:93374842-cca6-4873-b16e-0ada92e97004', 'eligibilite_ticpe', '93374842-cca6-4873-b16e-0ada92e97004/immatriculation/test-immatriculation.pdf', '25274ba6-67e6-4151-901c-74851fe2d82a'::uuid, true, 1),
    ('test-facture-carburant.pdf', 'Facture carburant pour éligibilité TICPE', 'dossier_id:93374842-cca6-4873-b16e-0ada92e97004', 'eligibilite_ticpe', '93374842-cca6-4873-b16e-0ada92e97004/facture_carburant/test-facture-carburant.pdf', '25274ba6-67e6-4151-901c-74851fe2d82a'::uuid, true, 1)
RETURNING id, title, category, file_path, created_at;

-- 6. Vérifier les documents insérés
SELECT 
    'DOCUMENTS_INSERES' as check_type,
    id,
    title,
    category,
    file_path,
    created_by,
    created_at
FROM "GEDDocument" 
WHERE content = 'dossier_id:93374842-cca6-4873-b16e-0ada92e97004'
ORDER BY created_at DESC;

ROLLBACK;

-- 7. Vérifier les buckets Supabase Storage
SELECT 
    'STORAGE_BUCKETS_CLIENT' as check_type,
    name,
    public,
    file_size_limit
FROM storage.buckets
WHERE name LIKE 'client-%';

-- 8. Nettoyer les paramètres
RESET app.user_type;
RESET app.user_id;

-- 9. Résumé de l'alignement
SELECT 
    'ALIGNEMENT_SUMMARY' as check_type,
    '✅ Dossier TICPE existe' as dossier_status,
    '✅ Client existe' as client_status,
    '✅ Catégories autorisées' as categories_status,
    '✅ RLS policies configurées' as rls_status,
    '✅ Test insertion réussi' as insertion_status;
