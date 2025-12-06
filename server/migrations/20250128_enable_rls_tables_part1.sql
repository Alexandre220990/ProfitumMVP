-- ============================================================================
-- CORRECTION : Activer RLS sur les tables publiques (Partie 1/3)
-- ============================================================================
-- Problème : Les tables publiques n'ont pas RLS activé
-- Solution : Activer RLS et créer des politiques par défaut restrictives
-- ============================================================================
-- Date : 2025-01-28
-- ============================================================================

BEGIN;

-- Activer RLS sur les premières tables
ALTER TABLE IF EXISTS public."AdminNotificationStatus" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Admin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."simulationhistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."RDV_Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."QuestionExploration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."ExpertCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."EligibilityRules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."ValidationState" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."Specialization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public."import_history" ENABLE ROW LEVEL SECURITY;

-- Créer des politiques RLS restrictives par défaut
-- Ces politiques peuvent être ajustées selon les besoins métier

-- AdminNotificationStatus : Seuls les admins peuvent voir/modifier
DROP POLICY IF EXISTS "AdminNotificationStatus_select" ON public."AdminNotificationStatus";
CREATE POLICY "AdminNotificationStatus_select" ON public."AdminNotificationStatus"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."Admin" 
      WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "AdminNotificationStatus_modify" ON public."AdminNotificationStatus";
CREATE POLICY "AdminNotificationStatus_modify" ON public."AdminNotificationStatus"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public."Admin" 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Admin : Seuls les admins peuvent voir/modifier
DROP POLICY IF EXISTS "Admin_select" ON public."Admin";
CREATE POLICY "Admin_select" ON public."Admin"
  FOR SELECT USING (
    auth_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public."Admin" 
      WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin_modify" ON public."Admin";
CREATE POLICY "Admin_modify" ON public."Admin"
  FOR ALL USING (
    auth_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public."Admin" 
      WHERE auth_user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- simulationhistory : Les utilisateurs peuvent voir leurs propres simulations
DROP POLICY IF EXISTS "simulationhistory_select" ON public."simulationhistory";
CREATE POLICY "simulationhistory_select" ON public."simulationhistory"
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
    )
  );

-- RDV_Task : Les utilisateurs peuvent voir leurs propres tâches
DROP POLICY IF EXISTS "RDV_Task_select" ON public."RDV_Task";
CREATE POLICY "RDV_Task_select" ON public."RDV_Task"
  FOR SELECT USING (
    expert_id IN (
      SELECT id FROM public."Expert" WHERE auth_user_id = auth.uid()
    )
    OR client_id IN (
      SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
    )
    OR apporteur_id IN (
      SELECT id FROM public."ApporteurAffaires" WHERE auth_user_id = auth.uid()
    )
    OR created_by IN (
      SELECT id FROM public."Client" WHERE auth_user_id = auth.uid()
      UNION
      SELECT id FROM public."Expert" WHERE auth_user_id = auth.uid()
      UNION
      SELECT id FROM public."ApporteurAffaires" WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public."Admin" 
      WHERE auth_user_id = auth.uid()
    )
  );

-- QuestionExploration : Lecture publique, modification admin uniquement
DROP POLICY IF EXISTS "QuestionExploration_select" ON public."QuestionExploration";
CREATE POLICY "QuestionExploration_select" ON public."QuestionExploration"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "QuestionExploration_modify" ON public."QuestionExploration";
CREATE POLICY "QuestionExploration_modify" ON public."QuestionExploration"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public."Admin" 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ExpertCategory : Lecture publique, modification admin uniquement
DROP POLICY IF EXISTS "ExpertCategory_select" ON public."ExpertCategory";
CREATE POLICY "ExpertCategory_select" ON public."ExpertCategory"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "ExpertCategory_modify" ON public."ExpertCategory";
CREATE POLICY "ExpertCategory_modify" ON public."ExpertCategory"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public."Admin" 
      WHERE auth_user_id = auth.uid()
    )
  );

-- EligibilityRules : Lecture publique, modification admin uniquement
DROP POLICY IF EXISTS "EligibilityRules_select" ON public."EligibilityRules";
CREATE POLICY "EligibilityRules_select" ON public."EligibilityRules"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "EligibilityRules_modify" ON public."EligibilityRules";
CREATE POLICY "EligibilityRules_modify" ON public."EligibilityRules"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public."Admin" 
      WHERE auth_user_id = auth.uid()
    )
  );

-- ValidationState : Lecture publique, modification admin uniquement
DROP POLICY IF EXISTS "ValidationState_select" ON public."ValidationState";
CREATE POLICY "ValidationState_select" ON public."ValidationState"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "ValidationState_modify" ON public."ValidationState";
CREATE POLICY "ValidationState_modify" ON public."ValidationState"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public."Admin" 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Specialization : Lecture publique, modification admin uniquement
DROP POLICY IF EXISTS "Specialization_select" ON public."Specialization";
CREATE POLICY "Specialization_select" ON public."Specialization"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Specialization_modify" ON public."Specialization";
CREATE POLICY "Specialization_modify" ON public."Specialization"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public."Admin" 
      WHERE auth_user_id = auth.uid()
    )
  );

-- import_history : Seuls les admins peuvent voir l'historique
DROP POLICY IF EXISTS "import_history_select" ON public."import_history";
CREATE POLICY "import_history_select" ON public."import_history"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public."Admin" 
      WHERE auth_user_id = auth.uid()
    )
  );

COMMIT;
