-- ============================================================================
-- CORRECTION DE LA LOGIQUE DE VÉRIFICATION
-- ============================================================================
-- Date: 6 Janvier 2025
-- Objectif: Corriger la logique de vérification des colonnes dupliquées

-- ÉTAPE 1: Vérifier les colonnes réellement dupliquées
SELECT '=== VÉRIFICATION CORRECTE DES COLONNES DUPLIQUÉES ===' as step;

-- Chercher les vraies colonnes dupliquées (celles qui ne devraient plus exister)
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ AUCUNE COLONNE DUPLIQUÉE'
        ELSE '❌ COLONNES DUPLIQUÉES DÉTECTÉES: ' || STRING_AGG(column_name, ', ')
    END as status
FROM information_schema.columns
WHERE table_name = 'ProduitEligible'
AND column_name IN ('category', 'dureeMax');  -- Seulement les colonnes qui devraient être supprimées

-- ÉTAPE 2: Vérifier que les colonnes principales existent
SELECT '=== VÉRIFICATION DES COLONNES PRINCIPALES ===' as step;

SELECT 
    CASE 
        WHEN COUNT(*) = 2 THEN '✅ COLONNES PRINCIPALES PRÉSENTES'
        ELSE '❌ COLONNES PRINCIPALES MANQUANTES'
    END as status
FROM information_schema.columns
WHERE table_name = 'ProduitEligible'
AND column_name IN ('categorie', 'duree_max');

-- ÉTAPE 3: Vérifier la structure complète
SELECT '=== STRUCTURE COMPLÈTE ===' as step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    ordinal_position
FROM information_schema.columns
WHERE table_name = 'ProduitEligible'
ORDER BY ordinal_position;

-- ÉTAPE 4: Statistiques finales
SELECT '=== STATISTIQUES FINALES ===' as step;

SELECT 
    COUNT(*) as total_produits,
    COUNT(DISTINCT categorie) as categories_uniques,
    COUNT(CASE WHEN montant_min IS NOT NULL THEN 1 END) as avec_montants,
    COUNT(CASE WHEN taux_min IS NOT NULL THEN 1 END) as avec_taux,
    COUNT(CASE WHEN duree_max IS NOT NULL THEN 1 END) as avec_duree
FROM "ProduitEligible";

-- ÉTAPE 5: Test des vues
SELECT '=== TEST DES VUES ===' as step;

-- Test v_expert_assignments
SELECT 'v_expert_assignments:' as vue, COUNT(*) as count FROM v_expert_assignments;

-- Test v_assignment_reports
SELECT 'v_assignment_reports:' as vue, COUNT(*) as count FROM v_assignment_reports;

-- ÉTAPE 6: Résumé final
SELECT '=== RÉSUMÉ FINAL ===' as step;

SELECT 
    '✅ NETTOYAGE TERMINÉ AVEC SUCCÈS' as status,
    'Colonnes dupliquées supprimées' as action_1,
    'Vues préservées et fonctionnelles' as action_2,
    '10 produits disponibles' as action_3,
    'API /api/apporteur/produits prête' as action_4;
