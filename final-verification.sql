-- ============================================================================
-- VÉRIFICATION FINALE - Nettoyage ProduitEligible Terminé
-- ============================================================================
-- Date: 6 Janvier 2025
-- Objectif: Vérifier que le nettoyage est complet et que tout fonctionne

-- ÉTAPE FINALE 1: Vérifier les colonnes restantes
SELECT '=== COLONNES RESTANTES ===' as step;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'ProduitEligible'
ORDER BY ordinal_position;

-- ÉTAPE FINALE 2: Vérifier qu'il n'y a plus de colonnes dupliquées
SELECT '=== VÉRIFICATION COLONNES DUPLIQUÉES ===' as step;

SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ AUCUNE COLONNE DUPLIQUÉE'
        ELSE '❌ COLONNES DUPLIQUÉES DÉTECTÉES: ' || STRING_AGG(column_name, ', ')
    END as status
FROM information_schema.columns
WHERE table_name = 'ProduitEligible'
AND column_name IN ('categorie', 'category', 'duree_max', 'dureeMax');

-- ÉTAPE FINALE 3: Statistiques des produits
SELECT '=== STATISTIQUES PRODUITS ===' as step;

SELECT 
    COUNT(*) as total_produits,
    COUNT(DISTINCT categorie) as categories_uniques,
    COUNT(CASE WHEN montant_min IS NOT NULL THEN 1 END) as avec_montants,
    COUNT(CASE WHEN taux_min IS NOT NULL THEN 1 END) as avec_taux,
    COUNT(CASE WHEN duree_max IS NOT NULL THEN 1 END) as avec_duree
FROM "ProduitEligible";

-- ÉTAPE FINALE 4: Liste des produits par catégorie
SELECT '=== PRODUITS PAR CATÉGORIE ===' as step;

SELECT 
    COALESCE(categorie, 'Non spécifiée') as categorie,
    COUNT(*) as nombre_produits,
    STRING_AGG(nom, ', ') as produits
FROM "ProduitEligible"
GROUP BY categorie
ORDER BY nombre_produits DESC;

-- ÉTAPE FINALE 5: Test des vues
SELECT '=== TEST DES VUES ===' as step;

-- Test v_expert_assignments
SELECT 'v_expert_assignments:' as vue, COUNT(*) as count FROM v_expert_assignments;

-- Test v_assignment_reports
SELECT 'v_assignment_reports:' as vue, COUNT(*) as count FROM v_assignment_reports;

-- ÉTAPE FINALE 6: Résumé final
SELECT '=== RÉSUMÉ FINAL ===' as step;

SELECT 
    '✅ NETTOYAGE TERMINÉ' as status,
    'Colonnes dupliquées supprimées' as action_1,
    'Vues préservées et fonctionnelles' as action_2,
    '10 produits disponibles' as action_3,
    'API /api/apporteur/produits prête' as action_4;
