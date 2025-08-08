-- ============================================================================
-- MIGRATION DES DOCUMENTS EXISTANTS VERS LES NOUVELLES SECTIONS
-- Basé sur le schéma réel : GEDDocument avec created_by (UUID)
-- ============================================================================

-- 1. Analyser les documents existants dans GEDDocument
SELECT 
    'EXISTING_DOCUMENTS_ANALYSIS' as check_type,
    category,
    COUNT(*) as total_documents,
    COUNT(DISTINCT created_by) as unique_creators,
    MIN(created_at) as oldest_document,
    MAX(created_at) as newest_document
FROM "GEDDocument"
WHERE is_active = true
GROUP BY category
ORDER BY total_documents DESC;

-- 2. Analyser les données existantes dans DocumentActivity
SELECT 
    'DOCUMENT_ACTIVITY_DATA' as check_type,
    COUNT(*) as total_activities,
    COUNT(DISTINCT action) as unique_actions,
    COUNT(DISTINCT user_id) as unique_users
FROM "DocumentActivity";

-- 3. Mapping des catégories existantes vers les nouvelles sections
-- Formation (guides) -> category = 'technical' (pour les guides techniques)
UPDATE "GEDDocument"
SET category = 'technical'
WHERE category IN ('formation', 'guide', 'tutorial', 'manual', 'technical')
AND is_active = true;

-- Mes documents (autres) -> category = 'business' (pour les documents métier)
UPDATE "GEDDocument"
SET category = 'business'
WHERE category IN ('document', 'business', 'personal', 'private', 'autre')
AND is_active = true;

-- Mes rapports (rapports) -> category = 'business' (pour les rapports métier)
UPDATE "GEDDocument"
SET category = 'business'
WHERE category IN ('rapport', 'report', 'audit', 'analysis', 'business')
AND is_active = true;

-- Mes factures (factures) -> category = 'business' (pour les documents comptables)
UPDATE "GEDDocument"
SET category = 'business'
WHERE category IN ('facture', 'invoice', 'bill', 'payment', 'comptable')
AND is_active = true;

-- 4. Vérifier la migration
SELECT 
    'MIGRATION_VERIFICATION' as check_type,
    category,
    COUNT(*) as total_documents,
    COUNT(DISTINCT created_by) as unique_creators
FROM "GEDDocument"
WHERE is_active = true
GROUP BY category
ORDER BY total_documents DESC;

-- 5. Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_geddocument_category ON "GEDDocument"(category);
CREATE INDEX IF NOT EXISTS idx_geddocument_created_by ON "GEDDocument"(created_by);
CREATE INDEX IF NOT EXISTS idx_geddocument_category_created_by ON "GEDDocument"(category, created_by);
CREATE INDEX IF NOT EXISTS idx_geddocument_is_active ON "GEDDocument"(is_active);
CREATE INDEX IF NOT EXISTS idx_geddocument_created_at ON "GEDDocument"(created_at);

-- 6. Vérifier les index créés
SELECT 
    'INDEX_VERIFICATION' as check_type,
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename = 'GEDDocument'
ORDER BY indexname;

-- 7. Statistiques finales
SELECT 
    'FINAL_STATISTICS' as check_type,
    'GEDDocument' as table_name,
    COUNT(*) as total_documents,
    COUNT(DISTINCT created_by) as unique_creators,
    COUNT(DISTINCT category) as unique_categories,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_documents,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_documents
FROM "GEDDocument"

UNION ALL

SELECT 
    'FINAL_STATISTICS' as check_type,
    'document_sections' as table_name,
    COUNT(*) as total_sections,
    NULL as unique_creators,
    NULL as unique_categories,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_sections,
    NULL as inactive_documents
FROM document_sections;
