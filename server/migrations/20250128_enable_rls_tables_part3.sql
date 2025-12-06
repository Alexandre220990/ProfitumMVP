-- ============================================================================
-- CORRECTION : Activer RLS sur les tables publiques (Partie 3/3)
-- ============================================================================
-- Problème : Les tables publiques n'ont pas RLS activé
-- Solution : Activer RLS et créer des politiques par défaut restrictives
-- ============================================================================
-- Date : 2025-01-28
-- ============================================================================

BEGIN;

-- Activer RLS sur les dernières tables
ALTER TABLE IF EXISTS public."GoogleCalendarIntegration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."GoogleCalendarSyncLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."RDV_Reminders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."CabinetTeamStat" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."import_mapping_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."import_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."DossierHistorique" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."notification_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."prospect_email_sequence_steps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."prospect_email_sequences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."EventInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."RDV_Invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."ClientProduitEligibleShare" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."prospect_email_scheduled" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."RDV_Timeline" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."ExpertProduitEligible" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."SharedClientDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."RDV_Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."UserMessagingPreferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."lead_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Cabinet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."document_request" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."CabinetMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."client_timeline" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."report_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."AdminNotification" ENABLE ROW LEVEL SECURITY;

-- Créer des politiques RLS restrictives par défaut

-- GoogleCalendarIntegration : Les utilisateurs peuvent voir leurs propres intégrations
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'GoogleCalendarIntegration' 
    AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "GoogleCalendarIntegration_select" ON public."GoogleCalendarIntegration";
    EXECUTE 'CREATE POLICY "GoogleCalendarIntegration_select" ON public."GoogleCalendarIntegration"
      FOR SELECT USING (
        user_id IN (
          SELECT id FROM public."Expert" WHERE auth_user_id = auth.uid()
          UNION
          SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
        )
      )';
  END IF;
END $$;

-- GoogleCalendarSyncLog : Les utilisateurs peuvent voir leurs propres logs
DROP POLICY IF EXISTS "GoogleCalendarSyncLog_select" ON public."GoogleCalendarSyncLog";
CREATE POLICY "GoogleCalendarSyncLog_select" ON public."GoogleCalendarSyncLog"
  FOR SELECT USING (
    integration_id IN (
      SELECT id FROM public."GoogleCalendarIntegration" gci
      WHERE gci.user_id IN (
        SELECT id FROM public."Expert" WHERE auth_user_id = auth.uid()
        UNION
        SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
      )
    )
  );

-- RDV_Reminders : Les utilisateurs peuvent voir leurs propres rappels via rdv_id
DROP POLICY IF EXISTS "RDV_Reminders_select" ON public."RDV_Reminders";
CREATE POLICY "RDV_Reminders_select" ON public."RDV_Reminders"
  FOR SELECT USING (
    rdv_id IN (
      SELECT id FROM public."RDV" r
      WHERE r.client_id IN (
        SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
      )
      OR r.expert_id IN (
        SELECT id FROM public."Expert" WHERE auth_user_id = auth.uid()
      )
    )
  );

-- CabinetTeamStat : Les membres du cabinet peuvent voir les stats
DROP POLICY IF EXISTS "CabinetTeamStat_select" ON public."CabinetTeamStat";
CREATE POLICY "CabinetTeamStat_select" ON public."CabinetTeamStat"
  FOR SELECT USING (
    cabinet_id IN (
      SELECT cabinet_id FROM public."CabinetMember" cm
      WHERE cm.member_id IN (
        SELECT id FROM public."Expert" WHERE auth_user_id = auth.uid()
      )
    )
  );

-- import_mapping_config : Seuls les admins peuvent voir
DROP POLICY IF EXISTS "import_mapping_config_select" ON public."import_mapping_config";
CREATE POLICY "import_mapping_config_select" ON public."import_mapping_config"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."Admin" 
      WHERE auth_user_id = auth.uid()
    )
  );

-- import_templates : Seuls les admins peuvent voir
DROP POLICY IF EXISTS "import_templates_select" ON public."import_templates";
CREATE POLICY "import_templates_select" ON public."import_templates"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."Admin" 
      WHERE auth_user_id = auth.uid()
    )
  );

-- DossierHistorique : Les clients peuvent voir leur historique
DROP POLICY IF EXISTS "DossierHistorique_select" ON public."DossierHistorique";
CREATE POLICY "DossierHistorique_select" ON public."DossierHistorique"
  FOR SELECT USING (
    dossier_id IN (
      SELECT id FROM public."ClientProduitEligible" cpe
      WHERE cpe."clientId" IN (
        SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
      )
    )
  );

-- notification_groups : Les utilisateurs peuvent voir leurs groupes
DROP POLICY IF EXISTS "notification_groups_select" ON public."notification_groups";
CREATE POLICY "notification_groups_select" ON public."notification_groups"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."Admin" 
      WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM notification_group_members ngm
      WHERE ngm.group_id = notification_groups.id
      AND (
        ngm.user_id IN (
          SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
          UNION
          SELECT id FROM public."Expert" WHERE auth_user_id = auth.uid()
        )
      )
    )
  );

-- prospect_email_sequence_steps : Lecture publique (templates)
DROP POLICY IF EXISTS "prospect_email_sequence_steps_select" ON public."prospect_email_sequence_steps";
CREATE POLICY "prospect_email_sequence_steps_select" ON public."prospect_email_sequence_steps"
  FOR SELECT USING (true);

-- prospect_email_sequences : Templates de séquences - Lecture publique (templates partagés)
DROP POLICY IF EXISTS "prospect_email_sequences_select" ON public."prospect_email_sequences";
CREATE POLICY "prospect_email_sequences_select" ON public."prospect_email_sequences"
  FOR SELECT USING (true);

-- EventInvitation : Les utilisateurs peuvent voir leurs invitations (si la table existe)
DROP POLICY IF EXISTS "EventInvitation_select" ON public."EventInvitation";
CREATE POLICY "EventInvitation_select" ON public."EventInvitation"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."Client" WHERE auth_user_id = auth.uid() AND email = "EventInvitation".email
    )
    OR EXISTS (
      SELECT 1 FROM public."Expert" WHERE auth_user_id = auth.uid() AND email = "EventInvitation".email
    )
    OR EXISTS (
      SELECT 1 FROM public."Admin" WHERE auth_user_id = auth.uid() AND email = "EventInvitation".email
    )
  );

-- RDV_Invitations : Les utilisateurs peuvent voir leurs invitations via email
DROP POLICY IF EXISTS "RDV_Invitations_select" ON public."RDV_Invitations";
CREATE POLICY "RDV_Invitations_select" ON public."RDV_Invitations"
  FOR SELECT USING (
    invitee_email IN (
      SELECT email FROM public."Client" WHERE auth_user_id = auth.uid()
      UNION
      SELECT email FROM public."Expert" WHERE auth_user_id = auth.uid()
      UNION
      SELECT email FROM public."Admin" WHERE auth_user_id = auth.uid()
    )
  );

-- ClientProduitEligibleShare : Les clients peuvent voir leurs partages
DROP POLICY IF EXISTS "ClientProduitEligibleShare_select" ON public."ClientProduitEligibleShare";
CREATE POLICY "ClientProduitEligibleShare_select" ON public."ClientProduitEligibleShare"
  FOR SELECT USING (
    client_produit_eligible_id IN (
      SELECT id FROM public."ClientProduitEligible" cpe
      WHERE cpe."clientId" IN (
        SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
      )
    )
  );

-- prospect_email_scheduled : Les apporteurs peuvent voir leurs emails programmés
-- Note: Si la table prospects n'a pas apporteur_id, cette politique sera ajustée
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'prospects' 
    AND column_name = 'apporteur_id'
  ) THEN
    DROP POLICY IF EXISTS "prospect_email_scheduled_select" ON public."prospect_email_scheduled";
    EXECUTE 'CREATE POLICY "prospect_email_scheduled_select" ON public."prospect_email_scheduled"
      FOR SELECT USING (
        prospect_id IN (
          SELECT id FROM prospects p
          WHERE p.apporteur_id IN (
            SELECT id FROM public."ApporteurAffaires" WHERE auth_user_id = auth.uid()
          )
        )
      )';
  ELSE
    -- Si pas de colonne apporteur_id, permettre aux admins de voir tous les emails programmés
    DROP POLICY IF EXISTS "prospect_email_scheduled_select" ON public."prospect_email_scheduled";
    EXECUTE 'CREATE POLICY "prospect_email_scheduled_select" ON public."prospect_email_scheduled"
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public."Admin" 
          WHERE auth_user_id = auth.uid()
        )
      )';
  END IF;
END $$;

-- RDV_Timeline : Les utilisateurs peuvent voir leurs timelines
DROP POLICY IF EXISTS "RDV_Timeline_select" ON public."RDV_Timeline";
CREATE POLICY "RDV_Timeline_select" ON public."RDV_Timeline"
  FOR SELECT USING (
    rdv_id IN (
      SELECT id FROM public."RDV" r
      WHERE r.client_id IN (
        SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
      )
      OR r.expert_id IN (
        SELECT id FROM public."Expert" WHERE auth_user_id = auth.uid()
      )
    )
  );

-- ExpertProduitEligible : Les experts peuvent voir leurs produits
DROP POLICY IF EXISTS "ExpertProduitEligible_select" ON public."ExpertProduitEligible";
CREATE POLICY "ExpertProduitEligible_select" ON public."ExpertProduitEligible"
  FOR SELECT USING (
    expert_id IN (
      SELECT id FROM public."Expert" WHERE auth_user_id = auth.uid()
    )
  );

-- SharedClientDocument : Les clients peuvent voir leurs documents partagés
DROP POLICY IF EXISTS "SharedClientDocument_select" ON public."SharedClientDocument";
CREATE POLICY "SharedClientDocument_select" ON public."SharedClientDocument"
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
    )
  );

-- RDV_Report : Les utilisateurs peuvent voir leurs rapports
DROP POLICY IF EXISTS "RDV_Report_select" ON public."RDV_Report";
CREATE POLICY "RDV_Report_select" ON public."RDV_Report"
  FOR SELECT USING (
    rdv_id IN (
      SELECT id FROM public."RDV" r
      WHERE r.client_id IN (
        SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
      )
      OR r.expert_id IN (
        SELECT id FROM public."Expert" WHERE auth_user_id = auth.uid()
      )
    )
  );

-- UserMessagingPreferences : Les utilisateurs peuvent voir leurs préférences
-- Note: Si la table n'existe pas ou n'a pas user_id, cette politique sera ignorée
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'UserMessagingPreferences' 
    AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "UserMessagingPreferences_select" ON public."UserMessagingPreferences";
    EXECUTE 'CREATE POLICY "UserMessagingPreferences_select" ON public."UserMessagingPreferences"
      FOR SELECT USING (
        user_id IN (
          SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
          UNION
          SELECT id FROM public."Expert" WHERE auth_user_id = auth.uid()
        )
      )';
  END IF;
END $$;

-- lead_participants : Les utilisateurs peuvent voir leurs participations
-- Note: Si la table n'existe pas ou n'a pas user_id, cette politique sera ignorée
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lead_participants' 
    AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "lead_participants_select" ON public."lead_participants";
    EXECUTE 'CREATE POLICY "lead_participants_select" ON public."lead_participants"
      FOR SELECT USING (
        user_id IN (
          SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
          UNION
          SELECT id FROM public."Expert" WHERE auth_user_id = auth.uid()
        )
      )';
  END IF;
END $$;

-- Cabinet : Les membres peuvent voir leurs cabinets
DROP POLICY IF EXISTS "Cabinet_select" ON public."Cabinet";
CREATE POLICY "Cabinet_select" ON public."Cabinet"
  FOR SELECT USING (
    id IN (
      SELECT cabinet_id FROM public."CabinetMember" cm
      WHERE cm.member_id IN (
        SELECT id FROM public."Expert" WHERE auth_user_id = auth.uid()
      )
    )
  );

-- document_request : Les clients peuvent voir leurs demandes
DROP POLICY IF EXISTS "document_request_select" ON public."document_request";
CREATE POLICY "document_request_select" ON public."document_request"
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
    )
  );

-- CabinetMember : Les membres peuvent voir leur cabinet
DROP POLICY IF EXISTS "CabinetMember_select" ON public."CabinetMember";
CREATE POLICY "CabinetMember_select" ON public."CabinetMember"
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM public."Expert" WHERE auth_user_id = auth.uid()
    )
  );

-- client_timeline : Les clients peuvent voir leur timeline
DROP POLICY IF EXISTS "client_timeline_select" ON public."client_timeline";
CREATE POLICY "client_timeline_select" ON public."client_timeline"
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
    )
  );

-- report_jobs : Seuls les admins peuvent voir
DROP POLICY IF EXISTS "report_jobs_select" ON public."report_jobs";
CREATE POLICY "report_jobs_select" ON public."report_jobs"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."Admin" 
      WHERE auth_user_id = auth.uid()
    )
  );

-- AdminNotification : Seuls les admins peuvent voir
DROP POLICY IF EXISTS "AdminNotification_select" ON public."AdminNotification";
CREATE POLICY "AdminNotification_select" ON public."AdminNotification"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."Admin" 
      WHERE auth_user_id = auth.uid()
    )
  );

COMMIT;
