-- =====================================================
-- ANALYSE DE LA STRUCTURE DES TABLES DE CONVERSATION
-- Date : 2025-01-05
-- Objectif : Analyser la structure exacte des tables Conversation et conversations
-- =====================================================

-- ===== 1. ANALYSE DE LA TABLE Conversation =====
SELECT 
    'Conversation' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Conversation'
ORDER BY ordinal_position;

-- ===== 2. ANALYSE DE LA TABLE conversations =====
SELECT 
    'conversations' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'conversations'
ORDER BY ordinal_position;

-- ===== 3. COMPARAISON DES STRUCTURES =====
SELECT 
    'Conversation' as source_table,
    column_name,
    data_type,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Conversation'
UNION ALL
SELECT 
    'conversations' as source_table,
    column_name,
    data_type,
    ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'conversations'
ORDER BY source_table, ordinal_position;

-- ===== 4. VÉRIFICATION DE L'EXISTENCE =====
DO $$
DECLARE
    conversation_exists BOOLEAN;
    conversations_exists BOOLEAN;
    conversation_columns INTEGER := 0;
    conversations_columns INTEGER := 0;
BEGIN
    -- Vérifier l'existence des tables
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'Conversation'
    ) INTO conversation_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'conversations'
    ) INTO conversations_exists;
    
    -- Compter les colonnes
    IF conversation_exists THEN
        SELECT COUNT(*) INTO conversation_columns 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Conversation';
    END IF;
    
    IF conversations_exists THEN
        SELECT COUNT(*) INTO conversations_columns 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'conversations';
    END IF;
    
    RAISE NOTICE '=== ANALYSE DES TABLES DE CONVERSATION ===';
    RAISE NOTICE 'Conversation existe: %, colonnes: %', conversation_exists, conversation_columns;
    RAISE NOTICE 'conversations existe: %, colonnes: %', conversations_exists, conversations_columns;
END $$; 