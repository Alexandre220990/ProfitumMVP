-- Vérifier l'existence de la table AdminAuditLog

-- 1. Voir toutes les tables qui contiennent "audit" ou "admin"
SELECT 
    '1. TABLES AUDIT/ADMIN' as test,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name ILIKE '%audit%' 
   OR table_name ILIKE '%admin%'
ORDER BY table_name;

-- 2. Voir les tables avec des noms similaires
SELECT 
    '2. TABLES SIMILAIRES' as test,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name ILIKE '%log%'
ORDER BY table_name;

-- 3. Vérifier si AdminAuditLog existe avec différents cas
SELECT 
    '3. VÉRIFICATION ADMINAUDITLOG' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AdminAuditLog') THEN 'AdminAuditLog (PascalCase)'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'adminauditlog') THEN 'adminauditlog (lowercase)'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit_log') THEN 'admin_audit_log (snake_case)'
        ELSE 'Table AdminAuditLog non trouvée'
    END as resultat;
