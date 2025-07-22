-- ============================================================================
-- MIGRATION : ROW LEVEL SECURITY GOOGLE CALENDAR
-- ============================================================================

-- Activer RLS sur toutes les tables sensibles
ALTER TABLE "GoogleCalendarIntegration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CalendarEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CalendarEventParticipant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CalendarEventReminder" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLITIQUES GOOGLE CALENDAR INTEGRATION
-- ============================================================================

-- Politique : Un utilisateur ne peut voir que ses propres intégrations
CREATE POLICY "Users can view own Google Calendar integrations"
ON "GoogleCalendarIntegration"
FOR SELECT
USING (auth.uid() = user_id);

-- Politique : Un utilisateur ne peut créer que ses propres intégrations
CREATE POLICY "Users can create own Google Calendar integrations"
ON "GoogleCalendarIntegration"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Politique : Un utilisateur ne peut modifier que ses propres intégrations
CREATE POLICY "Users can update own Google Calendar integrations"
ON "GoogleCalendarIntegration"
FOR UPDATE
USING (auth.uid() = user_id);

-- Politique : Un utilisateur ne peut supprimer que ses propres intégrations
CREATE POLICY "Users can delete own Google Calendar integrations"
ON "GoogleCalendarIntegration"
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- POLITIQUES CALENDAR EVENT
-- ============================================================================

-- Politique : Un utilisateur peut voir les événements dont il est participant
CREATE POLICY "Users can view events they participate in"
ON "CalendarEvent"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "CalendarEventParticipant"
    WHERE event_id = "CalendarEvent".id
    AND user_id = auth.uid()
  )
  OR
  client_id = auth.uid()
  OR
  expert_id = auth.uid()
);

-- Politique : Un utilisateur peut créer des événements
CREATE POLICY "Users can create events"
ON "CalendarEvent"
FOR INSERT
WITH CHECK (
  client_id = auth.uid()
  OR
  expert_id = auth.uid()
);

-- Politique : Un utilisateur peut modifier ses propres événements
CREATE POLICY "Users can update own events"
ON "CalendarEvent"
FOR UPDATE
USING (
  client_id = auth.uid()
  OR
  expert_id = auth.uid()
);

-- Politique : Un utilisateur peut supprimer ses propres événements
CREATE POLICY "Users can delete own events"
ON "CalendarEvent"
FOR DELETE
USING (
  client_id = auth.uid()
  OR
  expert_id = auth.uid()
);

-- ============================================================================
-- POLITIQUES CALENDAR EVENT PARTICIPANT
-- ============================================================================

-- Politique : Un utilisateur peut voir les participants des événements auxquels il participe
CREATE POLICY "Users can view participants of their events"
ON "CalendarEventParticipant"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "CalendarEvent"
    WHERE id = event_id
    AND (
      client_id = auth.uid()
      OR
      expert_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM "CalendarEventParticipant" cep2
        WHERE cep2.event_id = "CalendarEvent".id
        AND cep2.user_id = auth.uid()
      )
    )
  )
);

-- Politique : Un utilisateur peut ajouter des participants à ses événements
CREATE POLICY "Users can add participants to their events"
ON "CalendarEventParticipant"
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "CalendarEvent"
    WHERE id = event_id
    AND (
      client_id = auth.uid()
      OR
      expert_id = auth.uid()
    )
  )
);

-- ============================================================================
-- POLITIQUES EVENT INVITATION
-- ============================================================================

-- Politique : Un utilisateur peut voir ses invitations
CREATE POLICY "Users can view own invitations"
ON "EventInvitation"
FOR SELECT
USING (user_id = auth.uid());

-- Politique : Un utilisateur peut répondre à ses invitations
CREATE POLICY "Users can respond to own invitations"
ON "EventInvitation"
FOR UPDATE
USING (user_id = auth.uid());

-- ============================================================================
-- POLITIQUES CALENDAR EVENT REMINDER
-- ============================================================================

-- Politique : Un utilisateur peut voir ses rappels
CREATE POLICY "Users can view own reminders"
ON "CalendarEventReminder"
FOR SELECT
USING (user_id = auth.uid());

-- Politique : Un utilisateur peut créer ses rappels
CREATE POLICY "Users can create own reminders"
ON "CalendarEventReminder"
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- INDEX POUR PERFORMANCE
-- ============================================================================

-- Index pour améliorer les performances des requêtes RLS
CREATE INDEX IF NOT EXISTS idx_google_calendar_integration_user_id ON "GoogleCalendarIntegration"(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_client_id ON "CalendarEvent"(client_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_expert_id ON "CalendarEvent"(expert_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_participant_event_id ON "CalendarEventParticipant"(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_participant_user_id ON "CalendarEventParticipant"(user_id);
CREATE INDEX IF NOT EXISTS idx_event_invitation_user_id ON "EventInvitation"(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_event_reminder_user_id ON "CalendarEventReminder"(user_id);

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE "GoogleCalendarIntegration" IS 'Google Calendar integrations - Secured with RLS';
COMMENT ON TABLE "CalendarEvent" IS 'Calendar events - Secured with RLS';
COMMENT ON TABLE "CalendarEventParticipant" IS 'Event participants - Secured with RLS';
COMMENT ON TABLE "EventInvitation" IS 'Event invitations - Secured with RLS';
COMMENT ON TABLE "CalendarEventReminder" IS 'Event reminders - Secured with RLS'; 