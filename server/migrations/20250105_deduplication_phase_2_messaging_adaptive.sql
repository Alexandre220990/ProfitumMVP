-- =====================================================
-- DÉDOUBLONNAGE PHASE 2 : Tables de Messagerie (ADAPTATIVE)
-- Date : 2025-01-05
-- Objectif : Fusionner les tables de messagerie avec mapping correct des colonnes
-- =====================================================

-- ===== 1. ANALYSE PRÉ-MIGRATION =====
DO $$
DECLARE
    message_exists BOOLEAN;
    messages_exists BOOLEAN;
    message_count INTEGER := 0;
    messages_count INTEGER := 0;
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
    
    -- Compter les enregistrements
    IF message_exists THEN
        SELECT COUNT(*) INTO message_count FROM message;
    END IF;
    
    IF messages_exists THEN
        SELECT COUNT(*) INTO messages_count FROM messages;
    END IF;
    
    RAISE NOTICE '=== ANALYSE PRÉ-MIGRATION MESSAGERIE ===';
    RAISE NOTICE 'message: % enregistrements', message_count;
    RAISE NOTICE 'messages: % enregistrements', messages_count;
END $$;

-- ===== 2. MIGRATION ADAPTATIVE DES MESSAGES =====
BEGIN;

-- Migrer les messages avec mapping correct des colonnes
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
        -- Migration avec mapping correct des colonnes
        INSERT INTO messages (
            id,                    -- message.id -> messages.id
            conversation_id,        -- NULL (pas de correspondance directe)
            sender_id,             -- message.sender_id -> messages.sender_id
            sender_type,           -- message.sender_type -> messages.sender_type
            sender_name,           -- NULL (pas de correspondance)
            content,               -- message.content -> messages.content
            message_type,          -- message.message_type -> messages.message_type
            metadata,              -- message.attachments -> messages.metadata
            is_read,               -- message.is_read -> messages.is_read
            read_at,               -- message.read_at -> messages.read_at
            created_at,            -- message.created_at -> messages.created_at
            updated_at             -- message.updated_at -> messages.updated_at
        )
        SELECT 
            m.id,
            NULL::uuid as conversation_id,
            m.sender_id,
            m.sender_type,
            NULL::character varying as sender_name,
            m.content,
            m.message_type,
            m.attachments as metadata,
            m.is_read,
            m.read_at,
            m.created_at,
            m.updated_at
        FROM message m
        WHERE m.id NOT IN (SELECT id FROM messages)
        ON CONFLICT (id) DO NOTHING;
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        RAISE NOTICE 'Migration message -> messages: % enregistrements migrés', migrated_count;
        
    ELSIF message_exists AND NOT messages_exists THEN
        -- Créer messages avec la structure adaptée
        CREATE TABLE messages AS 
        SELECT 
            m.id,
            NULL::uuid as conversation_id,
            m.sender_id,
            m.sender_type,
            NULL::character varying as sender_name,
            m.content,
            m.message_type,
            m.attachments as metadata,
            m.is_read,
            m.read_at,
            m.created_at,
            m.updated_at
        FROM message m;
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        RAISE NOTICE 'Création messages avec % enregistrements depuis message', migrated_count;
        
    ELSE
        RAISE NOTICE 'Aucune migration de messages nécessaire';
    END IF;
END $$;

-- ===== 3. MIGRATION DES CONVERSATIONS =====

-- Migrer les conversations (si elles existent)
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
        -- Migration avec mapping correct des colonnes
        INSERT INTO conversations (
            id,                    -- Conversation.id -> conversations.id
            type,                  -- Défaut: 'general'
            participant_ids,        -- NULL (pas de correspondance)
            title,                 -- Conversation.title -> conversations.title
            description,           -- NULL (pas de correspondance)
            status,                -- Défaut: 'active'
            last_message_at,       -- NULL (pas de correspondance)
            created_at,            -- Conversation.created_at -> conversations.created_at
            updated_at             -- Conversation.created_at -> conversations.updated_at
        )
        SELECT 
            c.id,
            'general'::character varying as type,
            NULL::uuid[] as participant_ids,
            c.title::character varying,
            NULL::text as description,
            'active'::character varying as status,
            NULL::timestamp with time zone as last_message_at,
            c.created_at,
            c.created_at as updated_at
        FROM "Conversation" c
        WHERE c.id NOT IN (SELECT id FROM conversations)
        ON CONFLICT (id) DO NOTHING;
        
        GET DIAGNOSTICS migrated_count = ROW_COUNT;
        RAISE NOTICE 'Migration Conversation -> conversations: % enregistrements migrés', migrated_count;
        
    ELSIF conversation_exists AND NOT conversations_exists THEN
        -- Créer conversations avec la structure adaptée
        CREATE TABLE conversations AS 
        SELECT 
            c.id,
            'general'::character varying as type,
            NULL::uuid[] as participant_ids,
            c.title::character varying,
            NULL::text as description,
            'active'::character varying as status,
            NULL::timestamp with time zone as last_message_at,
            c.created_at,
            c.created_at as updated_at
        FROM "Conversation" c;
        
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