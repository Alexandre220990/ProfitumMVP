-- ============================================================================
-- MIGRATION DES DOCUMENTS EXISTANTS VERS LES NOUVELLES SECTIONS
-- ============================================================================

-- 1. Analyser les documents existants
SELECT 
    'EXISTING_DOCUMENTS_ANALYSIS' as check_type,
    category,
    COUNT(*) as total_files,
    COUNT(DISTINCT client_id) as unique_clients,
    MIN(created_at) as oldest_file,
    MAX(created_at) as newest_file
FROM "DocumentFile"
WHERE status != 'deleted'
GROUP BY category
ORDER BY total_files DESC;

-- 2. Analyser les documents GEDDocument existants
SELECT 
    'GED_DOCUMENTS_ANALYSIS' as check_type,
    category,
    COUNT(*) as total_documents,
    COUNT(DISTINCT created_by) as unique_creators,
    MIN(created_at) as oldest_document,
    MAX(created_at) as newest_document
FROM "GEDDocument"
WHERE is_active = true
GROUP BY category
ORDER BY total_documents DESC;

-- 3. Migrer les documents existants vers les nouvelles catégories
-- Formation (guides) -> category = 'guide'
UPDATE "DocumentFile"
SET category = 'guide'
WHERE category IN ('formation', 'guide', 'tutorial', 'manual')
AND status != 'deleted';

-- Mes documents (autres) -> category = 'autre'
UPDATE "DocumentFile"
SET category = 'autre'
WHERE category IN ('document', 'autre', 'personal', 'private')
AND status != 'deleted';

-- Mes rapports (rapports) -> category = 'rapport'
UPDATE "DocumentFile"
SET category = 'rapport'
WHERE category IN ('rapport', 'report', 'audit', 'analysis')
AND status != 'deleted';

-- Mes factures (factures) -> category = 'facture'
UPDATE "DocumentFile"
SET category = 'facture'
WHERE category IN ('facture', 'invoice', 'bill', 'payment')
AND status != 'deleted';

-- 4. Migrer les documents GEDDocument vers DocumentFile si nécessaire
-- (Cette étape dépend de la structure exacte de GEDDocument)
-- À adapter selon les besoins

-- 5. Vérifier la migration
SELECT 
    'MIGRATION_VERIFICATION' as check_type,
    category,
    COUNT(*) as total_files,
    COUNT(DISTINCT client_id) as unique_clients
FROM "DocumentFile"
WHERE status != 'deleted'
GROUP BY category
ORDER BY total_files DESC;

-- 6. Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_documentfile_category ON "DocumentFile"(category);
CREATE INDEX IF NOT EXISTS idx_documentfile_client_category ON "DocumentFile"(client_id, category);
CREATE INDEX IF NOT EXISTS idx_documentfile_status ON "DocumentFile"(status);
CREATE INDEX IF NOT EXISTS idx_documentfile_created_at ON "DocumentFile"(created_at);

-- 7. Vérifier les index créés
SELECT 
    'INDEX_VERIFICATION' as check_type,
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename = 'DocumentFile'
ORDER BY indexname;

-- 8. Statistiques finales
SELECT 
    'FINAL_STATISTICS' as check_type,
    'DocumentFile' as table_name,
    COUNT(*) as total_files,
    COUNT(DISTINCT client_id) as unique_clients,
    COUNT(DISTINCT category) as unique_categories,
    COUNT(CASE WHEN status = 'validated' THEN 1 END) as validated_files,
    COUNT(CASE WHEN status = 'uploaded' THEN 1 END) as uploaded_files,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_files,
    COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived_files
FROM "DocumentFile"
WHERE status != 'deleted'

UNION ALL

SELECT 
    'FINAL_STATISTICS' as check_type,
    'document_sections' as table_name,
    COUNT(*) as total_sections,
    NULL as unique_clients,
    NULL as unique_categories,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_sections,
    NULL as uploaded_files,
    NULL as rejected_files,
    NULL as archived_files
FROM document_sections;
