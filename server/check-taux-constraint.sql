-- =====================================================
-- VÉRIFICATION CONTRAINTE TAUX FINAL
-- =====================================================

-- 0. Vérifier les tables existantes
SELECT 'Tables existantes:' as info;
SELECT tablename 
FROM pg_tables 
WHERE tablename LIKE '%client%' OR tablename LIKE '%produit%' OR tablename LIKE '%eligible%'
ORDER BY tablename;

-- 1. Vérifier la contrainte existante
SELECT 'Contraintes existantes:' as info;
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conname LIKE '%tauxFinal%' OR conname LIKE '%taux%';

-- 2. Vérifier les valeurs actuelles dans la table
SELECT 
    'VALEURS_ACTUELLES' as check_type,
    "tauxFinal",
    COUNT(*) as nombre_occurrences,
    MIN("tauxFinal") as min_taux,
    MAX("tauxFinal") as max_taux
FROM "ClientProduitEligible"
GROUP BY "tauxFinal"
ORDER BY "tauxFinal";

-- 3. Vérifier les produits existants
SELECT 
    'PRODUITS_EXISTANTS' as check_type,
    id,
    nom,
    description
FROM "ProduitEligible"
WHERE nom ILIKE '%URSSAF%' OR nom ILIKE '%FONCIER%'
ORDER BY nom;

-- 4. Tester des valeurs de taux
SELECT 
    'TEST_VALEURS' as check_type,
    0.70 as taux_test_1,
    70 as taux_test_2,
    0.7 as taux_test_3,
    CASE 
        WHEN 0.70 BETWEEN 0 AND 1 THEN '✅ Valide (0.70)'
        ELSE '❌ Invalide (0.70)'
    END as validation_1,
    CASE 
        WHEN 70 BETWEEN 0 AND 1 THEN '✅ Valide (70)'
        ELSE '❌ Invalide (70)'
    END as validation_2,
    CASE 
        WHEN 0.7 BETWEEN 0 AND 1 THEN '✅ Valide (0.7)'
        ELSE '❌ Invalide (0.7)'
    END as validation_3;

-- 5. Vérifier la structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ClientProduitEligible' 
AND column_name = 'tauxFinal';
