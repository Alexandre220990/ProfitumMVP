-- ============================================================================
-- MIGRATION : CRÉATION TABLE EVENT INVITATION MANQUANTE
-- ============================================================================

-- Créer la table EventInvitation si elle n'existe pas
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

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_event_invitation_event_id ON "EventInvitation"(event_id);
CREATE INDEX IF NOT EXISTS idx_event_invitation_user_id ON "EventInvitation"(user_id);
CREATE INDEX IF NOT EXISTS idx_event_invitation_status ON "EventInvitation"(status);
CREATE INDEX IF NOT EXISTS idx_event_invitation_email ON "EventInvitation"(email);

-- Trigger pour mise à jour automatique
CREATE TRIGGER update_event_invitation_updated_at 
  BEFORE UPDATE ON "EventInvitation" 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Commentaire
COMMENT ON TABLE "EventInvitation" IS 'Event invitations sent to participants'; 