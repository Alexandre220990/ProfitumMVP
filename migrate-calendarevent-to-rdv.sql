-- ============================================================================
-- MIGRATION COMPLÈTE : CalendarEvent → RDV (SYSTÈME UNIFIÉ)
-- ============================================================================
-- Date : 22 octobre 2025
-- Objectif : Un seul système d'agenda (RDV) pour simplifier

-- ⚠️ CE SCRIPT EST IRRÉVERSIBLE !
-- Recommandation : Tester en local d'abord

BEGIN;

-- ============================================================================
-- ÉTAPE 1 : AJOUTER LES COLONNES MANQUANTES À RDV
-- ============================================================================

SELECT '📊 ÉTAPE 1 : Ajout colonnes manquantes à RDV' as info;

-- Colonnes de CalendarEvent qui n'existent pas dans RDV
-- PostgreSQL ne supporte pas ADD COLUMN IF NOT EXISTS avec DEFAULT dans une seule commande
DO $$ 
BEGIN
    -- description
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'RDV' AND column_name = 'description') THEN
        ALTER TABLE "RDV" ADD COLUMN description text;
    END IF;
    
    -- type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'RDV' AND column_name = 'type') THEN
        ALTER TABLE "RDV" ADD COLUMN type character varying DEFAULT 'meeting';
    END IF;
    
    -- phone_number
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'RDV' AND column_name = 'phone_number') THEN
        ALTER TABLE "RDV" ADD COLUMN phone_number character varying;
    END IF;
    
    -- color
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'RDV' AND column_name = 'color') THEN
        ALTER TABLE "RDV" ADD COLUMN color character varying DEFAULT '#3B82F6';
    END IF;
    
    -- is_recurring
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'RDV' AND column_name = 'is_recurring') THEN
        ALTER TABLE "RDV" ADD COLUMN is_recurring boolean DEFAULT false;
    END IF;
    
    -- recurrence_rule
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'RDV' AND column_name = 'recurrence_rule') THEN
        ALTER TABLE "RDV" ADD COLUMN recurrence_rule text;
    END IF;
    
    -- dossier_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'RDV' AND column_name = 'dossier_id') THEN
        ALTER TABLE "RDV" ADD COLUMN dossier_id uuid;
    END IF;
    
    -- dossier_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'RDV' AND column_name = 'dossier_name') THEN
        ALTER TABLE "RDV" ADD COLUMN dossier_name character varying;
    END IF;
END $$;

-- Vérifier l'ajout
SELECT 
    '✅ Colonnes ajoutées' as statut,
    COUNT(*) as nb_nouvelles_colonnes
FROM information_schema.columns 
WHERE table_name = 'RDV' 
AND column_name IN (
    'description', 'type', 'phone_number', 'color', 
    'is_recurring', 'recurrence_rule', 'dossier_id', 'dossier_name'
);

-- ============================================================================
-- ÉTAPE 2 : CRÉER TABLE DE PARTICIPANTS RDV (remplace CalendarEventParticipant)
-- ============================================================================

SELECT '📊 ÉTAPE 2 : Création table RDV_Participants' as info;

CREATE TABLE IF NOT EXISTS "RDV_Participants" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rdv_id uuid NOT NULL REFERENCES "RDV"(id) ON DELETE CASCADE,
    user_id uuid,
    user_type character varying NOT NULL, -- 'client', 'expert', 'apporteur', 'admin'
    user_email character varying,
    user_name character varying,
    status character varying NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    response_date timestamp with time zone,
    notified_at timestamp with time zone,
    reminder_sent boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_rdv_participants_rdv_id ON "RDV_Participants"(rdv_id);
CREATE INDEX IF NOT EXISTS idx_rdv_participants_user_id ON "RDV_Participants"(user_id);
CREATE INDEX IF NOT EXISTS idx_rdv_participants_status ON "RDV_Participants"(status);

SELECT '✅ Table RDV_Participants créée' as statut;

-- ============================================================================
-- ÉTAPE 3 : CRÉER TABLE DE RAPPELS RDV (remplace CalendarEventReminder)
-- ============================================================================

SELECT '📊 ÉTAPE 3 : Création table RDV_Reminders' as info;

CREATE TABLE IF NOT EXISTS "RDV_Reminders" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rdv_id uuid NOT NULL REFERENCES "RDV"(id) ON DELETE CASCADE,
    reminder_type character varying NOT NULL, -- 'email', 'push', 'sms'
    minutes_before integer NOT NULL, -- Nombre de minutes avant le RDV
    sent_at timestamp with time zone,
    status character varying DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    created_at timestamp with time zone DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_rdv_reminders_rdv_id ON "RDV_Reminders"(rdv_id);
CREATE INDEX IF NOT EXISTS idx_rdv_reminders_status ON "RDV_Reminders"(status);

SELECT '✅ Table RDV_Reminders créée' as statut;

-- ============================================================================
-- ÉTAPE 4 : CRÉER TABLE D'INVITATIONS RDV (remplace EventInvitation)
-- ============================================================================

SELECT '📊 ÉTAPE 4 : Création table RDV_Invitations' as info;

CREATE TABLE IF NOT EXISTS "RDV_Invitations" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rdv_id uuid NOT NULL REFERENCES "RDV"(id) ON DELETE CASCADE,
    invitee_email character varying NOT NULL,
    invitee_name character varying,
    token character varying UNIQUE,
    status character varying DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    sent_at timestamp with time zone,
    responded_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_rdv_invitations_rdv_id ON "RDV_Invitations"(rdv_id);
CREATE INDEX IF NOT EXISTS idx_rdv_invitations_status ON "RDV_Invitations"(status);
CREATE INDEX IF NOT EXISTS idx_rdv_invitations_token ON "RDV_Invitations"(token);

SELECT '✅ Table RDV_Invitations créée' as statut;

-- ============================================================================
-- ÉTAPE 5 : MIGRER LES DONNÉES CalendarEvent → RDV
-- ============================================================================

SELECT '📊 ÉTAPE 5 : Migration des données CalendarEvent → RDV' as info;

-- Compter les événements à migrer
SELECT 
    'Événements à migrer' as info,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE client_id IS NOT NULL) as avec_client,
    COUNT(*) FILTER (WHERE client_id IS NULL) as sans_client_skip
FROM "CalendarEvent";

-- Migrer les événements
INSERT INTO "RDV" (
    id,
    client_id,
    expert_id,
    apporteur_id,
    meeting_type,
    scheduled_date,
    scheduled_time,
    duration_minutes,
    location,
    meeting_url,
    title,
    description,
    status,
    type,
    category,
    priority,
    phone_number,
    color,
    is_recurring,
    recurrence_rule,
    dossier_id,
    dossier_name,
    created_by,
    created_at,
    updated_at,
    metadata
)
SELECT 
    ce.id,
    ce.client_id,
    ce.expert_id,
    ce.created_by as apporteur_id, -- Créateur = apporteur
    CASE 
        WHEN ce.is_online = true THEN 'video'
        WHEN ce.phone_number IS NOT NULL THEN 'phone'
        ELSE 'physical'
    END as meeting_type,
    ce.start_date::date as scheduled_date,
    ce.start_date::time as scheduled_time,
    EXTRACT(EPOCH FROM (ce.end_date - ce.start_date)) / 60 as duration_minutes,
    ce.location,
    ce.meeting_url,
    ce.title,
    ce.description,
    ce.status,
    ce.type,
    ce.category,
    CASE ce.priority
        WHEN 'critical' THEN 4
        WHEN 'high' THEN 3
        WHEN 'medium' THEN 2
        ELSE 1
    END as priority,
    ce.phone_number,
    ce.color,
    ce.is_recurring,
    ce.recurrence_rule,
    ce.dossier_id,
    ce.dossier_name,
    ce.created_by,
    ce.created_at,
    ce.updated_at,
    ce.metadata
FROM "CalendarEvent" ce
WHERE ce.client_id IS NOT NULL  -- ✅ Skip les événements sans client
AND NOT EXISTS (
    SELECT 1 FROM "RDV" WHERE id = ce.id
);

-- Vérifier la migration
SELECT 
    '✅ Événements migrés' as statut,
    COUNT(*) as nombre_migre
FROM "RDV"
WHERE created_at IN (SELECT created_at FROM "CalendarEvent");

-- ============================================================================
-- ÉTAPE 6 : MIGRER LES PARTICIPANTS
-- ============================================================================

SELECT '📊 ÉTAPE 6 : Migration des participants' as info;

INSERT INTO "RDV_Participants" (
    id,
    rdv_id,
    user_id,
    user_type,
    user_email,
    user_name,
    status,
    response_date,
    notified_at,
    reminder_sent,
    created_at
)
SELECT 
    cep.id,
    cep.event_id as rdv_id,
    cep.user_id,
    cep.user_type,
    cep.user_email,
    cep.user_name,
    cep.status,
    cep.response_date,
    cep.notified_at,
    cep.reminder_sent,
    cep.created_at
FROM "CalendarEventParticipant" cep
WHERE EXISTS (
    SELECT 1 FROM "RDV" WHERE id = cep.event_id
)
AND NOT EXISTS (
    SELECT 1 FROM "RDV_Participants" WHERE id = cep.id
);

SELECT 
    '✅ Participants migrés' as statut,
    COUNT(*) as nombre_migre
FROM "RDV_Participants";

-- ============================================================================
-- ÉTAPE 7 : MIGRER LES RAPPELS (si table CalendarEventReminder existe)
-- ============================================================================

SELECT '📊 ÉTAPE 7 : Migration des rappels' as info;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CalendarEventReminder') THEN
        INSERT INTO "RDV_Reminders" (
            rdv_id,
            reminder_type,
            minutes_before,
            sent_at,
            status,
            created_at
        )
        SELECT 
            event_id as rdv_id,
            type as reminder_type,
            time as minutes_before,
            sent_at,
            CASE WHEN sent THEN 'sent' ELSE 'pending' END as status,
            created_at
        FROM "CalendarEventReminder"
        WHERE EXISTS (
            SELECT 1 FROM "RDV" WHERE id = event_id
        );
        
        RAISE NOTICE 'Rappels migrés';
    ELSE
        RAISE NOTICE 'Table CalendarEventReminder n''existe pas';
    END IF;
END $$;

-- ============================================================================
-- ÉTAPE 8 : MIGRER LES INVITATIONS (si table EventInvitation existe)
-- ============================================================================

SELECT '📊 ÉTAPE 8 : Migration des invitations' as info;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'EventInvitation') THEN
        INSERT INTO "RDV_Invitations" (
            rdv_id,
            invitee_email,
            invitee_name,
            token,
            status,
            sent_at,
            responded_at,
            expires_at,
            created_at
        )
        SELECT 
            event_id as rdv_id,
            invitee_email,
            invitee_name,
            token,
            status,
            sent_at,
            responded_at,
            expires_at,
            created_at
        FROM "EventInvitation"
        WHERE EXISTS (
            SELECT 1 FROM "RDV" WHERE id = event_id
        );
        
        RAISE NOTICE 'Invitations migrées';
    ELSE
        RAISE NOTICE 'Table EventInvitation n''existe pas';
    END IF;
END $$;

-- ============================================================================
-- ÉTAPE 9 : SUPPRIMER LES ANCIENNES TABLES
-- ============================================================================

SELECT '🗑️ ÉTAPE 9 : Suppression des anciennes tables' as info;

-- Supprimer les tables dépendantes en premier (CASCADE)
DROP TABLE IF EXISTS "GoogleCalendarEventMapping" CASCADE;
DROP TABLE IF EXISTS "EventInvitation" CASCADE;
DROP TABLE IF EXISTS "CalendarEventReminder" CASCADE;
DROP TABLE IF EXISTS "CalendarEventParticipant" CASCADE;
DROP TABLE IF EXISTS "CalendarEvent" CASCADE;

SELECT '✅ Anciennes tables supprimées' as statut;

-- ============================================================================
-- ÉTAPE 10 : VÉRIFICATION FINALE
-- ============================================================================

SELECT '📊 ÉTAPE 10 : Vérification finale' as info;

-- Vérifier que CalendarEvent n'existe plus
SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CalendarEvent')
        THEN '✅ CalendarEvent supprimée'
        ELSE '❌ CalendarEvent existe encore'
    END as status_calendarevent;

-- Compter les RDV
SELECT 
    'RDV' as table_name,
    COUNT(*) as nombre_lignes
FROM "RDV";

-- Compter les participants
SELECT 
    'RDV_Participants' as table_name,
    COUNT(*) as nombre_lignes
FROM "RDV_Participants";

-- Compter les reminders
SELECT 
    'RDV_Reminders' as table_name,
    COUNT(*) as nombre_lignes
FROM "RDV_Reminders";

-- Compter les invitations
SELECT 
    'RDV_Invitations' as table_name,
    COUNT(*) as nombre_lignes
FROM "RDV_Invitations";

-- ============================================================================
-- ÉTAPE 11 : RÉSUMÉ DE LA MIGRATION
-- ============================================================================

SELECT 
    '✅ MIGRATION TERMINÉE' as statut,
    'Système unifié RDV opérationnel' as resultat,
    'Mettre à jour le code backend/frontend' as prochaine_etape;

-- ============================================================================
-- COMMIT OU ROLLBACK
-- ============================================================================

-- Par défaut ROLLBACK pour tester
-- Remplacer par COMMIT quand prêt !

-- COMMIT;
ROLLBACK;

-- ============================================================================
-- INSTRUCTIONS POST-MIGRATION
-- ============================================================================

/*
APRÈS AVOIR EXÉCUTÉ CE SCRIPT AVEC COMMIT :

1. LIBÉRER L'ESPACE DISQUE
   VACUUM ANALYZE;

2. METTRE À JOUR LE CODE
   Voir fichier: CODE-MIGRATION-CALENDAREVENT-TO-RDV.md

3. TESTER
   - Création RDV
   - Affichage calendrier
   - Participants
   - Rappels
*/

