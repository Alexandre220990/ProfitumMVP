-- ============================================================================
-- ÉTAPE 3: GESTION DES DÉPENDANCES - ProduitEligible
-- ============================================================================
-- Date: 6 Janvier 2025
-- Objectif: Gérer les dépendances avant de supprimer les colonnes dupliquées

-- ÉTAPE 3A: Identifier les dépendances
SELECT '=== IDENTIFICATION DES DÉPENDANCES ===' as step;

-- Vérifier les vues qui dépendent de la colonne category
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE definition LIKE '%category%' 
AND schemaname = 'public';

-- ÉTAPE 3B: Vérifier le contenu des vues problématiques
SELECT '=== CONTENU DES VUES PROBLÉMATIQUES ===' as step;

-- Vérifier v_expert_assignments
SELECT 'v_expert_assignments:' as vue;
SELECT * FROM v_expert_assignments LIMIT 5;

-- Vérifier v_assignment_reports  
SELECT 'v_assignment_reports:' as vue;
SELECT * FROM v_assignment_reports LIMIT 5;

-- ÉTAPE 3C: Modifier les vues pour utiliser 'categorie' au lieu de 'category'
SELECT '=== MODIFICATION DES VUES ===' as step;

-- Supprimer les vues existantes
DROP VIEW IF EXISTS v_expert_assignments CASCADE;
DROP VIEW IF EXISTS v_assignment_reports CASCADE;

-- Recréer v_expert_assignments avec 'categorie' au lieu de 'category'
CREATE VIEW v_expert_assignments AS
SELECT 
    e.id as expert_id,
    e.name as expert_name,
    e.email as expert_email,
    p.nom as product_name,
    p.categorie as product_category,  -- Utilise 'categorie' au lieu de 'category'
    p.description as product_description,
    cpe.id as assignment_id,
    cpe.status as assignment_status,
    cpe.created_at as assignment_date
FROM "Expert" e
JOIN "ClientProduitEligible" cpe ON e.id = cpe.expert_id
JOIN "ProduitEligible" p ON cpe.produit_eligible_id = p.id
WHERE cpe.status IN ('assigned', 'in_progress', 'completed');

-- Recréer v_assignment_reports avec 'categorie' au lieu de 'category'
CREATE VIEW v_assignment_reports AS
SELECT 
    p.categorie as product_category,  -- Utilise 'categorie' au lieu de 'category'
    COUNT(*) as total_assignments,
    COUNT(CASE WHEN cpe.status = 'completed' THEN 1 END) as completed_assignments,
    COUNT(CASE WHEN cpe.status = 'in_progress' THEN 1 END) as in_progress_assignments,
    COUNT(CASE WHEN cpe.status = 'assigned' THEN 1 END) as assigned_assignments
FROM "ProduitEligible" p
LEFT JOIN "ClientProduitEligible" cpe ON p.id = cpe.produit_eligible_id
GROUP BY p.categorie
ORDER BY total_assignments DESC;

-- ÉTAPE 3D: Vérifier que les vues fonctionnent
SELECT '=== VÉRIFICATION DES VUES MODIFIÉES ===' as step;

-- Tester v_expert_assignments
SELECT 'v_expert_assignments (premiers résultats):' as test;
SELECT * FROM v_expert_assignments LIMIT 3;

-- Tester v_assignment_reports
SELECT 'v_assignment_reports (premiers résultats):' as test;
SELECT * FROM v_assignment_reports LIMIT 3;

-- ÉTAPE 3E: Maintenant supprimer les colonnes dupliquées
SELECT '=== SUPPRESSION DES COLONNES DUPLIQUÉES ===' as step;

-- Supprimer la colonne 'category' (maintenant sans dépendances)
ALTER TABLE "ProduitEligible" DROP COLUMN IF EXISTS category;

-- Supprimer la colonne 'dureeMax' (garder 'duree_max')
ALTER TABLE "ProduitEligible" DROP COLUMN IF EXISTS "dureeMax";

-- ÉTAPE 3F: Vérification finale
SELECT '=== VÉRIFICATION FINALE ===' as step;

-- Vérifier que les colonnes dupliquées sont supprimées
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'ProduitEligible'
AND column_name IN ('categorie', 'category', 'duree_max', 'dureeMax')
ORDER BY column_name;

-- Statistiques finales
SELECT 
    COUNT(*) as total_produits,
    COUNT(DISTINCT categorie) as categories_uniques,
    COUNT(CASE WHEN montant_min IS NOT NULL THEN 1 END) as avec_montants,
    COUNT(CASE WHEN taux_min IS NOT NULL THEN 1 END) as avec_taux,
    COUNT(CASE WHEN duree_max IS NOT NULL THEN 1 END) as avec_duree
FROM "ProduitEligible";
