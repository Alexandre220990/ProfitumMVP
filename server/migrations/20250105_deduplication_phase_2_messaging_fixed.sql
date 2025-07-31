-- =====================================================
-- DÉDOUBLONNAGE PHASE 2 : Tables de Messagerie (CORRIGÉ)
-- Date : 2025-01-05
-- Objectif : Fusionner les tables de messagerie avec vérification d'existence
-- =====================================================

-- ===== 1. ANALYSE PRÉ-MIGRATION =====
DO $$
DECLARE
    message_exists BOOLEAN;
    messages_exists BOOLEAN;
    conversation_exists BOOLEAN;
    conversations_exists BOOLEAN;
    message_count INTEGER := 0;
    messages_count INTEGER := 0;
    conversation_count INTEGER := 0;
    conversations_count INTEGER := 0;
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
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'Conversation'
    ) INTO conversation_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'conversations'
    ) INTO conversations_exists;
    
    -- Compter les enregistrements
    IF message_exists THEN
        SELECT COUNT(*) INTO message_count FROM message;
    END IF;
    
    IF messages_exists THEN
        SELECT COUNT(*) INTO messages_count FROM messages;
    END IF;
    
    IF conversation_exists THEN
        SELECT COUNT(*) INTO conversation_count FROM "Conversation";
    END IF;
    
    IF conversations_exists THEN
        SELECT COUNT(*) INTO conversations_count FROM conversations;
    END IF;
    
    RAISE NOTICE '=== ANALYSE PRÉ-MIGRATION MESSAGERIE ===';
    RAISE NOTICE 'message: % enregistrements', message_count;
    RAISE NOTICE 'messages: % enregistrements', messages_count;
    RAISE NOTICE 'Conversation: % enregistrements', conversation_count;
    RAISE NOTICE 'conversations: % enregistrements', conversations_count;
END $$;

-- ===== 2. MIGRATION DES MESSAGES =====
BEGIN;

-- Migrer les messages
DO $$
DECLARE
    message_exists BOOLEAN;
    messages_exists BOOLEAN;
    migrated_count INTEGER := 0;
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
    
    IF message_exists AND messages_exists THEN
        -- Migrer les données uniques de message vers messages
        INSERT INTO messages 
        SELECT * FROM message 
        WHERE id NOT IN (SELECT id FROM messages)
        ON CONFLICT (id) DO NOTHING;
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        RAISE NOTICE 'Migration message -> messages: % enregistrements migrés', migrated_count;
        
    ELSIF message_exists AND NOT messages_exists THEN
        -- Créer messages avec la même structure que message
        CREATE TABLE messages AS SELECT * FROM message;
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        RAISE NOTICE 'Création messages avec % enregistrements depuis message', migrated_count;
        
    ELSE
        RAISE NOTICE 'Aucune migration de messages nécessaire';
    END IF;
END $$;

-- ===== 3. MIGRATION DES CONVERSATIONS =====

-- Migrer les conversations
DO $$
DECLARE
    conversation_exists BOOLEAN;
    conversations_exists BOOLEAN;
    migrated_count INTEGER := 0;
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
    
    IF conversation_exists AND conversations_exists THEN
        -- Migrer les données uniques de Conversation vers conversations
        INSERT INTO conversations 
        SELECT * FROM "Conversation" 
        WHERE id NOT IN (SELECT id FROM conversations)
        ON CONFLICT (id) DO NOTHING;
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        RAISE NOTICE 'Migration Conversation -> conversations: % enregistrements migrés', migrated_count;
        
    ELSIF conversation_exists AND NOT conversations_exists THEN
        -- Créer conversations avec la même structure que Conversation
        CREATE TABLE conversations AS SELECT * FROM "Conversation";
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        RAISE NOTICE 'Création conversations avec % enregistrements depuis Conversation', migrated_count;
        
    ELSE
        RAISE NOTICE 'Aucune migration de conversations nécessaire';
    END IF;
END $$;

-- ===== 4. SUPPRESSION DES TABLES EN DOUBLON =====

-- Supprimer les tables en doublon
DO $$
DECLARE
    message_exists BOOLEAN;
    messages_exists BOOLEAN;
    conversation_exists BOOLEAN;
    conversations_exists BOOLEAN;
    message_count INTEGER := 0;
    messages_count INTEGER := 0;
    conversation_count INTEGER := 0;
    conversations_count INTEGER := 0;
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
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'Conversation'
    ) INTO conversation_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'conversations'
    ) INTO conversations_exists;
    
    -- Supprimer message si messages existe et contient les données
    IF message_exists AND messages_exists THEN
        SELECT COUNT(*) INTO message_count FROM message;
        SELECT COUNT(*) INTO messages_count FROM messages;
        
        IF messages_count >= message_count THEN
            DROP TABLE message CASCADE;
            RAISE NOTICE 'Table message supprimée (messages contient % enregistrements)', messages_count;
        ELSE
            RAISE NOTICE 'ATTENTION: messages contient moins d''enregistrements que message - suppression annulée';
        END IF;
    END IF;
    
    -- Supprimer Conversation si conversations existe et contient les données
    IF conversation_exists AND conversations_exists THEN
        SELECT COUNT(*) INTO conversation_count FROM "Conversation";
        SELECT COUNT(*) INTO conversations_count FROM conversations;
        
        IF conversations_count >= conversation_count THEN
            DROP TABLE "Conversation" CASCADE;
            RAISE NOTICE 'Table Conversation supprimée (conversations contient % enregistrements)', conversations_count;
        ELSE
            RAISE NOTICE 'ATTENTION: conversations contient moins d''enregistrements que Conversation - suppression annulée';
        END IF;
    END IF;
END $$;

-- ===== 5. VÉRIFICATION FINALE =====

-- Vérifier l'état final
DO $$
DECLARE
    messages_exists BOOLEAN;
    conversations_exists BOOLEAN;
    messages_count INTEGER := 0;
    conversations_count INTEGER := 0;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'messages'
    ) INTO messages_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'conversations'
    ) INTO conversations_exists;
    
    IF messages_exists THEN
        SELECT COUNT(*) INTO messages_count FROM messages;
        RAISE NOTICE 'messages: % enregistrements', messages_count;
    END IF;
    
    IF conversations_exists THEN
        SELECT COUNT(*) INTO conversations_count FROM conversations;
        RAISE NOTICE 'conversations: % enregistrements', conversations_count;
    END IF;
    
    RAISE NOTICE '=== RÉSULTAT FINAL MESSAGERIE ===';
    RAISE NOTICE 'Tables principales: messages, conversations';
END $$;

COMMIT; 