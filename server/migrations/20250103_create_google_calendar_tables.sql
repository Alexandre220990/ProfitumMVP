-- ============================================================================
-- MIGRATION : CRÉATION DES TABLES GOOGLE CALENDAR
-- ============================================================================

-- ============================================================================
-- TABLE GOOGLE CALENDAR INTEGRATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS "GoogleCalendarIntegration" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_id VARCHAR(255) NOT NULL DEFAULT 'primary',
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  is_primary BOOLEAN DEFAULT false,
  sync_status VARCHAR(50) DEFAULT 'idle',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE EVENT INVITATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS "EventInvitation" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES "CalendarEvent"(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'expert', 'admin')),
  email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'tentative')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  response_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ============================================================================
-- TABLE CALENDAR EVENT REMINDER
-- ============================================================================

CREATE TABLE IF NOT EXISTS "CalendarEventReminder" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES "CalendarEvent"(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'push', 'sms')),
  time_minutes INTEGER NOT NULL,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLE CALENDAR EVENT PARTICIPANT
-- ============================================================================

CREATE TABLE IF NOT EXISTS "CalendarEventParticipant" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES "CalendarEvent"(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'expert', 'admin')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'tentative')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ============================================================================
-- MODIFICATION TABLE CALENDAR EVENT
-- ============================================================================

-- Ajouter les colonnes manquantes à CalendarEvent si elles n'existent pas
DO $$ 
BEGIN
  -- Ajouter la colonne meeting_url si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'CalendarEvent' AND column_name = 'meeting_url') THEN
    ALTER TABLE "CalendarEvent" ADD COLUMN meeting_url TEXT;
  END IF;

  -- Ajouter la colonne is_online si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'CalendarEvent' AND column_name = 'is_online') THEN
    ALTER TABLE "CalendarEvent" ADD COLUMN is_online BOOLEAN DEFAULT false;
  END IF;

  -- Ajouter la colonne color si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'CalendarEvent' AND column_name = 'color') THEN
    ALTER TABLE "CalendarEvent" ADD COLUMN color VARCHAR(7) DEFAULT '#3B82F6';
  END IF;

  -- Ajouter la colonne metadata si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'CalendarEvent' AND column_name = 'metadata') THEN
    ALTER TABLE "CalendarEvent" ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- ============================================================================
-- INDEX POUR PERFORMANCE
-- ============================================================================

-- Index pour GoogleCalendarIntegration
CREATE INDEX IF NOT EXISTS idx_google_calendar_integration_user_id ON "GoogleCalendarIntegration"(user_id);
CREATE INDEX IF NOT EXISTS idx_google_calendar_integration_calendar_id ON "GoogleCalendarIntegration"(calendar_id);
CREATE INDEX IF NOT EXISTS idx_google_calendar_integration_sync_status ON "GoogleCalendarIntegration"(sync_status);

-- Index pour EventInvitation
CREATE INDEX IF NOT EXISTS idx_event_invitation_event_id ON "EventInvitation"(event_id);
CREATE INDEX IF NOT EXISTS idx_event_invitation_user_id ON "EventInvitation"(user_id);
CREATE INDEX IF NOT EXISTS idx_event_invitation_status ON "EventInvitation"(status);
CREATE INDEX IF NOT EXISTS idx_event_invitation_email ON "EventInvitation"(email);

-- Index pour CalendarEventReminder
CREATE INDEX IF NOT EXISTS idx_calendar_event_reminder_event_id ON "CalendarEventReminder"(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_reminder_user_id ON "CalendarEventReminder"(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_reminder_sent ON "CalendarEventReminder"(sent);

-- Index pour CalendarEventParticipant
CREATE INDEX IF NOT EXISTS idx_calendar_event_participant_event_id ON "CalendarEventParticipant"(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_participant_user_id ON "CalendarEventParticipant"(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_participant_status ON "CalendarEventParticipant"(status);

-- Index pour CalendarEvent
CREATE INDEX IF NOT EXISTS idx_calendar_event_client_id ON "CalendarEvent"(client_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_expert_id ON "CalendarEvent"(expert_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_category ON "CalendarEvent"(category);
CREATE INDEX IF NOT EXISTS idx_calendar_event_status ON "CalendarEvent"(status);
CREATE INDEX IF NOT EXISTS idx_calendar_event_start_date ON "CalendarEvent"(start_date);

-- ============================================================================
-- TRIGGERS POUR MISE À JOUR AUTOMATIQUE
-- ============================================================================

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger à toutes les tables
CREATE TRIGGER update_google_calendar_integration_updated_at BEFORE UPDATE ON "GoogleCalendarIntegration" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_invitation_updated_at BEFORE UPDATE ON "EventInvitation" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_event_reminder_updated_at BEFORE UPDATE ON "CalendarEventReminder" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_event_participant_updated_at BEFORE UPDATE ON "CalendarEventParticipant" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE "GoogleCalendarIntegration" IS 'Google Calendar integrations for users';
COMMENT ON TABLE "EventInvitation" IS 'Event invitations sent to participants';
COMMENT ON TABLE "CalendarEventReminder" IS 'Event reminders for participants';
COMMENT ON TABLE "CalendarEventParticipant" IS 'Participants in calendar events'; 