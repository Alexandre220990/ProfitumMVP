-- ============================================================================
-- ÉTAPE 3: PRÉSERVATION DES VUES - ProduitEligible
-- ============================================================================
-- Date: 6 Janvier 2025
-- Objectif: Modifier les vues pour utiliser 'categorie' au lieu de 'category' tout en les préservant

-- ÉTAPE 3A: Sauvegarder les définitions des vues
SELECT '=== SAUVEGARDE DES VUES ===' as step;

-- Les vues identifiées :
-- 1. v_expert_assignments (utilise pe.category)
-- 2. v_assignment_reports (utilise pe.category)
-- 3. v_admin_documents_published (utilise admin_documents.category - pas concerné)
-- 4. v_calendar_events_with_participants (utilise ce.category - pas concerné)
-- 5. v_today_events (utilise ce.category - pas concerné)

-- ÉTAPE 3B: Modifier v_expert_assignments
SELECT '=== MODIFICATION v_expert_assignments ===' as step;

-- Supprimer et recréer v_expert_assignments avec 'categorie'
DROP VIEW IF EXISTS v_expert_assignments CASCADE;

CREATE VIEW v_expert_assignments AS
SELECT 
    ea.id,
    ea.expert_id,
    ea.client_produit_eligible_id,
    ea.statut,
    ea.created_at,
    ea.updated_at,
    cpe."clientId" AS client_id,
    cpe."produitId" AS produit_eligible_id,
    c.company_name AS client_name,
    pe.nom AS produit_nom,
    pe.categorie AS produit_category,  -- CHANGEMENT: category -> categorie
    e.name AS expert_name,
    e.email AS expert_email,
    e.company_name AS expert_company
FROM expertassignment ea
LEFT JOIN "ClientProduitEligible" cpe ON ea.client_produit_eligible_id = cpe.id
LEFT JOIN "Client" c ON cpe."clientId" = c.id
LEFT JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
LEFT JOIN "Expert" e ON ea.expert_id = e.id
WHERE pe.active = true;

-- ÉTAPE 3C: Modifier v_assignment_reports
SELECT '=== MODIFICATION v_assignment_reports ===' as step;

-- Supprimer et recréer v_assignment_reports avec 'categorie'
DROP VIEW IF EXISTS v_assignment_reports CASCADE;

CREATE VIEW v_assignment_reports AS
SELECT 
    date_trunc('month', ea.created_at) AS month,
    pe.categorie AS category,  -- CHANGEMENT: category -> categorie
    ea.statut,
    count(*) AS count,
    count(DISTINCT ea.expert_id) AS unique_experts,
    count(DISTINCT cpe."clientId") AS unique_clients
FROM expertassignment ea
LEFT JOIN "ClientProduitEligible" cpe ON ea.client_produit_eligible_id = cpe.id
LEFT JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
GROUP BY date_trunc('month', ea.created_at), pe.categorie, ea.statut
ORDER BY date_trunc('month', ea.created_at) DESC, pe.categorie, ea.statut;

-- ÉTAPE 3D: Vérifier que les vues modifiées fonctionnent
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

-- Vérifier que les vues fonctionnent toujours
SELECT '=== TEST FINAL DES VUES ===' as step;

-- Test final v_expert_assignments
SELECT COUNT(*) as count_expert_assignments FROM v_expert_assignments;

-- Test final v_assignment_reports
SELECT COUNT(*) as count_assignment_reports FROM v_assignment_reports;

-- Statistiques finales
SELECT 
    COUNT(*) as total_produits,
    COUNT(DISTINCT categorie) as categories_uniques,
    COUNT(CASE WHEN montant_min IS NOT NULL THEN 1 END) as avec_montants,
    COUNT(CASE WHEN taux_min IS NOT NULL THEN 1 END) as avec_taux,
    COUNT(CASE WHEN duree_max IS NOT NULL THEN 1 END) as avec_duree
FROM "ProduitEligible";
