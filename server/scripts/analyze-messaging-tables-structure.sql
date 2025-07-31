-- =====================================================
-- ANALYSE DE LA STRUCTURE DES TABLES DE MESSAGERIE
-- Date : 2025-01-05
-- Objectif : Analyser la structure exacte des tables message et messages
-- =====================================================

-- ===== 1. ANALYSE DE LA TABLE message =====
SELECT 
    'message' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'message'
ORDER BY ordinal_position;

-- ===== 2. ANALYSE DE LA TABLE messages =====
SELECT 
    'messages' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'messages'
ORDER BY ordinal_position;

-- ===== 3. COMPARAISON DES STRUCTURES =====
SELECT 
    'message' as source_table,
    column_name,
    data_type,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'message'
UNION ALL
SELECT 
    'messages' as source_table,
    column_name,
    data_type,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'messages'
ORDER BY source_table, ordinal_position;

-- ===== 4. VÉRIFICATION DE L'EXISTENCE =====
DO $$
DECLARE
    message_exists BOOLEAN;
    messages_exists BOOLEAN;
    message_columns INTEGER := 0;
    messages_columns INTEGER := 0;
BEGIN
    -- Vérifier l'existence des tables
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'message'
    ) INTO message_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'messages'
    ) INTO messages_exists;
    
    -- Compter les colonnes
    IF message_exists THEN
        SELECT COUNT(*) INTO message_columns 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'message';
    END IF;
    
    IF messages_exists THEN
        SELECT COUNT(*) INTO messages_columns 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'messages';
    END IF;
    
    RAISE NOTICE '=== ANALYSE DES TABLES DE MESSAGERIE ===';
    RAISE NOTICE 'message existe: %, colonnes: %', message_exists, message_columns;
    RAISE NOTICE 'messages existe: %, colonnes: %', messages_exists, messages_columns;
END $$; 