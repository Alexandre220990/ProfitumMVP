-- ============================================================================
-- VÉRIFICATION DES AUTRES TABLES IMPORTANTES
-- ============================================================================

-- 1. Vérifier la table ClientProduitEligible
SELECT 
    'ClientProduitEligible' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT "clientId") as unique_clients,
    COUNT(DISTINCT "produitId") as unique_products,
    COUNT(DISTINCT statut) as unique_statuses
FROM "ClientProduitEligible";

-- 2. Vérifier la table Audit
SELECT 
    'Audit' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT "clientId") as unique_clients,
    COUNT(DISTINCT "expertId") as unique_experts,
    COUNT(DISTINCT type) as unique_types,
    COUNT(DISTINCT status) as unique_statuses
FROM "Audit";

-- 3. Vérifier la table Dossier
SELECT 
    'Dossier' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT "clientId") as unique_clients,
    COUNT(DISTINCT "expertId") as unique_experts,
    COUNT(DISTINCT type) as unique_types,
    COUNT(DISTINCT status) as unique_statuses
FROM "Dossier";

-- 4. Vérifier les contraintes de clés étrangères pour ces tables
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('ClientProduitEligible', 'Audit', 'Dossier')
ORDER BY tc.table_name, kcu.column_name;

-- 5. Vérifier les valeurs uniques pour les colonnes importantes
SELECT 
    'ClientProduitEligible_statut' as check_type,
    statut as value,
    COUNT(*) as count
FROM "ClientProduitEligible" 
GROUP BY statut

UNION ALL

SELECT 
    'Audit_status' as check_type,
    status as value,
    COUNT(*) as count
FROM "Audit" 
GROUP BY status

UNION ALL

SELECT 
    'Dossier_status' as check_type,
    status as value,
    COUNT(*) as count
FROM "Dossier" 
GROUP BY status

ORDER BY check_type, count DESC; 