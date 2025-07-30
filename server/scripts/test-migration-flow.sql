-- =====================================================
-- SCRIPT DE TEST POUR LE FLUX DE MIGRATION
-- Date: 2025-01-30
-- =====================================================

-- 1. Vérifier que la fonction de migration existe
SELECT 
    'Fonction de migration' as section,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_name = 'migrate_simulator_to_client';

-- 2. Vérifier les sessions de simulateur disponibles
SELECT 
    'Sessions disponibles' as section,
    id,
    session_token,
    status,
    created_at,
    updated_at
FROM "SimulatorSession"
WHERE status = 'completed'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Vérifier les résultats d'éligibilité pour une session
SELECT 
    'Résultats éligibilité' as section,
    id,
    session_id,
    produit_id,
    eligibility_score,
    estimated_savings,
    confidence_level,
    created_at
FROM "SimulatorEligibility"
WHERE session_id IN (
    SELECT id FROM "SimulatorSession" 
    WHERE status = 'completed' 
    ORDER BY created_at DESC 
    LIMIT 1
);

-- 4. Vérifier les produits éligibles disponibles
SELECT 
    'Produits disponibles' as section,
    id,
    nom,
    description,
    category,
    active
FROM "ProduitEligible"
WHERE active = true
ORDER BY nom;

-- 5. Test de la fonction de migration (simulation)
-- Note: Ceci est un test de simulation, pas une vraie migration
SELECT 
    'Test migration (simulation)' as section,
    'Pour tester la migration, utilisez:' as instruction,
    'SELECT migrate_simulator_to_client(''SESSION_TOKEN'', ''{"email": "test@example.com", "name": "Test User"}''::jsonb);' as commande;

-- 6. Vérifier les permissions sur les tables
SELECT 
    'Permissions tables' as section,
    table_name,
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('Client', 'ClientProduitEligible', 'SimulatorSession', 'SimulatorEligibility')
ORDER BY table_name, grantee;

-- 7. Vérifier les politiques RLS
SELECT 
    'Politiques RLS' as section,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('Client', 'ClientProduitEligible')
ORDER BY tablename, policyname;

-- 8. Statistiques des tables
SELECT 
    'Statistiques tables' as section,
    'Client' as table_name,
    COUNT(*) as total_records
FROM "Client"
UNION ALL
SELECT 
    'ClientProduitEligible' as table_name,
    COUNT(*) as total_records
FROM "ClientProduitEligible"
UNION ALL
SELECT 
    'SimulatorSession' as table_name,
    COUNT(*) as total_records
FROM "SimulatorSession"
UNION ALL
SELECT 
    'SimulatorEligibility' as table_name,
    COUNT(*) as total_records
FROM "SimulatorEligibility"; 