-- ============================================================================
-- CORRECTION : Activer RLS sur les tables publiques (Partie 2/3)
-- ============================================================================
-- Problème : Les tables publiques n'ont pas RLS activé
-- Solution : Activer RLS et créer des politiques par défaut restrictives
-- ============================================================================
-- Date : 2025-01-28
-- ============================================================================

BEGIN;

-- Activer RLS sur les tables (partie 2)
ALTER TABLE IF EXISTS public."EligibilityChanges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."audit_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."client_charte_signature" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."event_count" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."RDV_Participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."DFSQuestions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."DFSRules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."ExpertAlert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."simulations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."message_files" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."TICPERates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."TICPEVehicleTypes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."TICPESectors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."TICPEAdvancedRules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."TICPESimulationResults" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."TICPEBenchmarks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."TICPEUsageScenarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."typing_indicators" ENABLE ROW LEVEL SECURITY;

-- Créer des politiques RLS restrictives par défaut

-- EligibilityChanges : Lecture publique, modification admin uniquement
DROP POLICY IF EXISTS "EligibilityChanges_select" ON public."EligibilityChanges";
CREATE POLICY "EligibilityChanges_select" ON public."EligibilityChanges"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "EligibilityChanges_modify" ON public."EligibilityChanges";
CREATE POLICY "EligibilityChanges_modify" ON public."EligibilityChanges"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public."Admin" 
      WHERE auth_user_id = auth.uid()
    )
  );

-- audit_documents : Seuls les admins peuvent voir
DROP POLICY IF EXISTS "audit_documents_select" ON public."audit_documents";
CREATE POLICY "audit_documents_select" ON public."audit_documents"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."Admin" 
      WHERE auth_user_id = auth.uid()
    )
  );

-- client_charte_signature : Les clients peuvent voir leurs propres signatures
DROP POLICY IF EXISTS "client_charte_signature_select" ON public."client_charte_signature";
CREATE POLICY "client_charte_signature_select" ON public."client_charte_signature"
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
    )
  );

-- event_count : Lecture publique
DROP POLICY IF EXISTS "event_count_select" ON public."event_count";
CREATE POLICY "event_count_select" ON public."event_count"
  FOR SELECT USING (true);

-- RDV_Participants : Les utilisateurs peuvent voir leurs propres participations
DROP POLICY IF EXISTS "RDV_Participants_select" ON public."RDV_Participants";
CREATE POLICY "RDV_Participants_select" ON public."RDV_Participants"
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
      UNION
      SELECT id FROM public."Expert" WHERE auth_user_id = auth.uid()
    )
  );

-- DFSQuestions : Lecture publique, modification admin uniquement
DROP POLICY IF EXISTS "DFSQuestions_select" ON public."DFSQuestions";
CREATE POLICY "DFSQuestions_select" ON public."DFSQuestions"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "DFSQuestions_modify" ON public."DFSQuestions";
CREATE POLICY "DFSQuestions_modify" ON public."DFSQuestions"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public."Admin" 
      WHERE auth_user_id = auth.uid()
    )
  );

-- DFSRules : Lecture publique, modification admin uniquement
DROP POLICY IF EXISTS "DFSRules_select" ON public."DFSRules";
CREATE POLICY "DFSRules_select" ON public."DFSRules"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "DFSRules_modify" ON public."DFSRules";
CREATE POLICY "DFSRules_modify" ON public."DFSRules"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public."Admin" 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ExpertAlert : Les experts peuvent voir leurs propres alertes
DROP POLICY IF EXISTS "ExpertAlert_select" ON public."ExpertAlert";
CREATE POLICY "ExpertAlert_select" ON public."ExpertAlert"
  FOR SELECT USING (
    expert_id IN (
      SELECT id FROM public."Expert" WHERE auth_user_id = auth.uid()
    )
  );

-- simulations : Les clients peuvent voir leurs propres simulations
DROP POLICY IF EXISTS "simulations_select" ON public."simulations";
CREATE POLICY "simulations_select" ON public."simulations"
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
    )
  );

-- message_files : Les utilisateurs peuvent voir les fichiers de leurs messages
DROP POLICY IF EXISTS "message_files_select" ON public."message_files";
CREATE POLICY "message_files_select" ON public."message_files"
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM public."messages" m
      WHERE m.conversation_id IN (
        SELECT id FROM public."conversations" c
        WHERE c.client_id IN (
          SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
        )
        OR c.expert_id IN (
          SELECT id FROM public."Expert" WHERE auth_user_id = auth.uid()
        )
      )
    )
  );

-- TICPE* tables : Lecture publique, modification admin uniquement
DROP POLICY IF EXISTS "TICPERates_select" ON public."TICPERates";
CREATE POLICY "TICPERates_select" ON public."TICPERates"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "TICPEVehicleTypes_select" ON public."TICPEVehicleTypes";
CREATE POLICY "TICPEVehicleTypes_select" ON public."TICPEVehicleTypes"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "TICPESectors_select" ON public."TICPESectors";
CREATE POLICY "TICPESectors_select" ON public."TICPESectors"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "TICPEAdvancedRules_select" ON public."TICPEAdvancedRules";
CREATE POLICY "TICPEAdvancedRules_select" ON public."TICPEAdvancedRules"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "TICPESimulationResults_select" ON public."TICPESimulationResults";
CREATE POLICY "TICPESimulationResults_select" ON public."TICPESimulationResults"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "TICPEBenchmarks_select" ON public."TICPEBenchmarks";
CREATE POLICY "TICPEBenchmarks_select" ON public."TICPEBenchmarks"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "TICPEUsageScenarios_select" ON public."TICPEUsageScenarios";
CREATE POLICY "TICPEUsageScenarios_select" ON public."TICPEUsageScenarios"
  FOR SELECT USING (true);

-- messages : Les utilisateurs peuvent voir leurs propres messages
DROP POLICY IF EXISTS "messages_select" ON public."messages";
CREATE POLICY "messages_select" ON public."messages"
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public."conversations" c
      WHERE c.client_id IN (
        SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
      )
      OR c.expert_id IN (
        SELECT id FROM public."Expert" WHERE auth_user_id = auth.uid()
      )
    )
  );

-- conversations : Les utilisateurs peuvent voir leurs propres conversations
DROP POLICY IF EXISTS "conversations_select" ON public."conversations";
CREATE POLICY "conversations_select" ON public."conversations"
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
    )
    OR expert_id IN (
      SELECT id FROM public."Expert" WHERE auth_user_id = auth.uid()
    )
  );

-- typing_indicators : Les utilisateurs peuvent voir les indicateurs de leurs conversations
DROP POLICY IF EXISTS "typing_indicators_select" ON public."typing_indicators";
CREATE POLICY "typing_indicators_select" ON public."typing_indicators"
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public."conversations" c
      WHERE c.client_id IN (
        SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
      )
      OR c.expert_id IN (
        SELECT id FROM public."Expert" WHERE auth_user_id = auth.uid()
      )
    )
  );

COMMIT;
