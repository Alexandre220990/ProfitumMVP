-- ============================================================================
-- Migration : Système de séquences d'emails programmables pour prospects
-- Date: 2025-01-17
-- Description: Permet de programmer des séquences d'emails (funnel) avec arrêt automatique en cas de réponse
-- ============================================================================

BEGIN;

-- ============================================================================
-- TABLE: prospect_email_sequences (Templates de séquences)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "prospect_email_sequences" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE: prospect_email_sequence_steps (Étapes d'une séquence)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "prospect_email_sequence_steps" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id UUID NOT NULL REFERENCES "prospect_email_sequences"(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    delay_days INTEGER NOT NULL DEFAULT 0, -- Nombre de jours après l'étape précédente
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sequence_id, step_number)
);

-- ============================================================================
-- TABLE: prospect_email_scheduled (Emails programmés pour un prospect)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "prospect_email_scheduled" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID NOT NULL REFERENCES "prospects"(id) ON DELETE CASCADE,
    sequence_id UUID REFERENCES "prospect_email_sequences"(id) ON DELETE SET NULL,
    step_number INTEGER NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'cancelled', 'paused')),
    cancelled_reason TEXT, -- Raison de l'annulation (ex: "Réponse reçue")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    -- Lien vers l'email envoyé (si envoyé)
    prospect_email_id UUID REFERENCES "prospects_emails"(id) ON DELETE SET NULL
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_prospect_email_scheduled_prospect_id ON "prospect_email_scheduled"(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_email_scheduled_status ON "prospect_email_scheduled"(status);
CREATE INDEX IF NOT EXISTS idx_prospect_email_scheduled_scheduled_for ON "prospect_email_scheduled"(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_prospect_email_scheduled_sequence ON "prospect_email_scheduled"(sequence_id, step_number);

-- ============================================================================
-- FONCTION: Extraire le domaine d'un email
-- ============================================================================
CREATE OR REPLACE FUNCTION extract_email_domain(email_address TEXT)
RETURNS TEXT AS $$
BEGIN
    IF email_address IS NULL OR email_address = '' THEN
        RETURN NULL;
    END IF;
    
    -- Extraire la partie après @
    RETURN LOWER(SPLIT_PART(email_address, '@', 2));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FONCTION: Vérifier si un email correspond à un prospect (même email ou même domaine)
-- ============================================================================
CREATE OR REPLACE FUNCTION check_prospect_email_match(
    prospect_email TEXT,
    incoming_email TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    prospect_domain TEXT;
    incoming_domain TEXT;
BEGIN
    -- Vérifier si c'est le même email exact
    IF LOWER(prospect_email) = LOWER(incoming_email) THEN
        RETURN TRUE;
    END IF;
    
    -- Extraire les domaines
    prospect_domain := extract_email_domain(prospect_email);
    incoming_domain := extract_email_domain(incoming_email);
    
    -- Vérifier si c'est le même domaine
    IF prospect_domain IS NOT NULL AND incoming_domain IS NOT NULL THEN
        IF prospect_domain = incoming_domain THEN
            RETURN TRUE;
        END IF;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FONCTION: Arrêter automatiquement les séquences en cas de réponse
-- ============================================================================
CREATE OR REPLACE FUNCTION stop_prospect_sequences_on_reply()
RETURNS TRIGGER AS $$
DECLARE
    prospect_data RECORD;
    reply_email TEXT;
    reply_domain TEXT;
    cancelled_count INTEGER;
BEGIN
    -- Vérifier si c'est une nouvelle réponse
    IF NEW.replied = TRUE AND (OLD.replied IS NULL OR OLD.replied = FALSE) THEN
        -- Récupérer les informations du prospect
        SELECT * INTO prospect_data
        FROM prospects
        WHERE id = NEW.prospect_id;
        
        -- Extraire l'email de réponse (depuis metadata ou utiliser l'email du prospect)
        -- Pour l'instant, on utilise l'email du prospect comme référence
        reply_email := COALESCE((NEW.metadata->>'reply_from')::TEXT, prospect_data.email);
        reply_domain := extract_email_domain(reply_email);
        
        -- Annuler tous les emails programmés non envoyés pour ce prospect
        UPDATE "prospect_email_scheduled"
        SET 
            status = 'cancelled',
            cancelled_reason = format('Séquence arrêtée automatiquement : réponse reçue de %s (domaine: %s)', 
                reply_email, 
                COALESCE(reply_domain, 'inconnu')
            ),
            updated_at = NOW()
        WHERE prospect_id = NEW.prospect_id
          AND status = 'scheduled'
          AND (
            -- Même email exact
            check_prospect_email_match(prospect_data.email, reply_email) = TRUE
            OR
            -- Même domaine (si on a le domaine)
            (reply_domain IS NOT NULL AND extract_email_domain(prospect_data.email) = reply_domain)
          );
        
        GET DIAGNOSTICS cancelled_count = ROW_COUNT;
        
        -- Log pour debug
        IF cancelled_count > 0 THEN
            RAISE NOTICE 'Séquence arrêtée pour prospect %: % emails annulés', prospect_data.id, cancelled_count;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Arrêter les séquences quand un prospect répond
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_stop_sequences_on_reply ON prospects_emails;

CREATE TRIGGER trigger_stop_sequences_on_reply
  AFTER UPDATE ON prospects_emails
  FOR EACH ROW
  WHEN (NEW.replied = TRUE AND (OLD.replied IS NULL OR OLD.replied = FALSE))
  EXECUTE FUNCTION stop_prospect_sequences_on_reply();

-- ============================================================================
-- FONCTION: Améliorer la notification pour inclure l'arrêt de séquence
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_prospect_reply_enhanced()
RETURNS TRIGGER AS $$
DECLARE
    prospect_data RECORD;
    admin_ids UUID[];
    admin_id UUID;
    cancelled_count INTEGER;
    reply_email TEXT;
    reply_domain TEXT;
BEGIN
    -- Vérifier si c'est une nouvelle réponse
    IF NEW.replied = TRUE AND (OLD.replied IS NULL OR OLD.replied = FALSE) THEN
        -- Récupérer les informations du prospect
        SELECT * INTO prospect_data
        FROM prospects
        WHERE id = NEW.prospect_id;
        
        -- Compter les emails annulés
        SELECT COUNT(*) INTO cancelled_count
        FROM "prospect_email_scheduled"
        WHERE prospect_id = NEW.prospect_id
          AND status = 'cancelled'
          AND cancelled_reason LIKE '%réponse reçue%';
        
        -- Extraire l'email de réponse
        reply_email := COALESCE((NEW.metadata->>'reply_from')::TEXT, prospect_data.email);
        reply_domain := extract_email_domain(reply_email);
        
        -- Récupérer tous les admins
        SELECT ARRAY_AGG(id) INTO admin_ids
        FROM "Admin";
        
        -- Créer une notification pour chaque admin
        IF admin_ids IS NOT NULL THEN
            FOREACH admin_id IN ARRAY admin_ids
            LOOP
                INSERT INTO "AdminNotification" (
                    admin_id,
                    notification_type,
                    title,
                    message,
                    priority,
                    status,
                    action_url,
                    action_data,
                    created_at
                ) VALUES (
                    admin_id,
                    'prospect_reply_urgent',
                    '🚨 Réponse prospect - Séquence arrêtée',
                    format(
                        'Le prospect %s (%s) a répondu à l''email #%s.%s La séquence d''emails a été automatiquement arrêtée (%s emails annulés).',
                        COALESCE(prospect_data.firstname || ' ' || prospect_data.lastname, prospect_data.email),
                        COALESCE(prospect_data.company_name, 'Entreprise inconnue'),
                        NEW.step,
                        CASE 
                            WHEN cancelled_count > 0 THEN E'\n' || format('⚠️ %s email(s) programmé(s) ont été annulés.', cancelled_count)
                            ELSE ''
                        END,
                        cancelled_count
                    ),
                    'urgent', -- Priorité urgente pour les réponses
                    'unread',
                    format('/admin/prospection?prospect=%s', prospect_data.id),
                    jsonb_build_object(
                        'prospect_id', prospect_data.id,
                        'prospect_email', prospect_data.email,
                        'prospect_name', COALESCE(prospect_data.firstname || ' ' || prospect_data.lastname, prospect_data.email),
                        'company_name', prospect_data.company_name,
                        'email_id', NEW.id,
                        'email_step', NEW.step,
                        'replied_at', NEW.replied_at,
                        'reply_email', reply_email,
                        'reply_domain', reply_domain,
                        'cancelled_emails_count', cancelled_count,
                        'is_urgent', TRUE
                    ),
                    NOW()
                );
            END LOOP;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remplacer l'ancien trigger par le nouveau
DROP TRIGGER IF EXISTS trigger_notify_prospect_reply ON prospects_emails;

CREATE TRIGGER trigger_notify_prospect_reply_enhanced
  AFTER UPDATE ON prospects_emails
  FOR EACH ROW
  WHEN (NEW.replied = TRUE AND (OLD.replied IS NULL OR OLD.replied = FALSE))
  EXECUTE FUNCTION notify_prospect_reply_enhanced();

-- ============================================================================
-- VUE: Emails programmés à envoyer aujourd'hui
-- ============================================================================
CREATE OR REPLACE VIEW "prospect_emails_to_send_today" AS
SELECT 
    pes.*,
    p.email as prospect_email,
    p.firstname,
    p.lastname,
    p.company_name,
    pesq.name as sequence_name
FROM "prospect_email_scheduled" pes
JOIN "prospects" p ON pes.prospect_id = p.id
LEFT JOIN "prospect_email_sequences" pesq ON pes.sequence_id = pesq.id
WHERE pes.status = 'scheduled'
  AND pes.scheduled_for <= NOW()
  AND pes.scheduled_for >= CURRENT_DATE
ORDER BY pes.scheduled_for ASC;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================
COMMENT ON TABLE "prospect_email_sequences" IS 'Templates de séquences d''emails réutilisables';
COMMENT ON TABLE "prospect_email_sequence_steps" IS 'Étapes d''une séquence d''emails';
COMMENT ON TABLE "prospect_email_scheduled" IS 'Emails programmés pour chaque prospect';
COMMENT ON FUNCTION extract_email_domain(TEXT) IS 'Extrait le domaine d''un email (partie après @)';
COMMENT ON FUNCTION check_prospect_email_match(TEXT, TEXT) IS 'Vérifie si deux emails correspondent (même email ou même domaine)';
COMMENT ON FUNCTION stop_prospect_sequences_on_reply() IS 'Arrête automatiquement les séquences d''emails quand un prospect répond';
COMMENT ON FUNCTION notify_prospect_reply_enhanced() IS 'Crée une notification admin urgente quand un prospect répond et arrête la séquence';

COMMIT;

-- ============================================================================
-- MESSAGE DE CONFIRMATION
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Migration séquences d''emails prospects terminée avec succès';
    RAISE NOTICE '📧 Système de séquences programmables créé';
    RAISE NOTICE '🛑 Arrêt automatique des séquences en cas de réponse';
    RAISE NOTICE '🔔 Notifications urgentes pour les réponses';
END $$;

