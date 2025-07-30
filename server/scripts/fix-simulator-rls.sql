-- =====================================================
-- CORRECTION DES POLITIQUES RLS DU SIMULATEUR
-- Date: 2025-01-30
-- =====================================================

-- 1. Supprimer les anciennes politiques pour éviter les conflits
DROP POLICY IF EXISTS "Allow temporary session creation" ON "public"."TemporarySession";
DROP POLICY IF EXISTS "Allow session read by token" ON "public"."TemporarySession";
DROP POLICY IF EXISTS "Allow session update" ON "public"."TemporarySession";
DROP POLICY IF EXISTS "Allow session delete" ON "public"."TemporarySession";

DROP POLICY IF EXISTS "Allow temporary response creation" ON "public"."TemporaryResponse";
DROP POLICY IF EXISTS "Allow response read by session" ON "public"."TemporaryResponse";
DROP POLICY IF EXISTS "Allow response update" ON "public"."TemporaryResponse";
DROP POLICY IF EXISTS "Allow response delete" ON "public"."TemporaryResponse";

DROP POLICY IF EXISTS "Allow temporary eligibility creation" ON "public"."TemporaryEligibility";
DROP POLICY IF EXISTS "Allow eligibility read by session" ON "public"."TemporaryEligibility";
DROP POLICY IF EXISTS "Allow eligibility update" ON "public"."TemporaryEligibility";
DROP POLICY IF EXISTS "Allow eligibility delete" ON "public"."TemporaryEligibility";

DROP POLICY IF EXISTS "Allow simulator analytics creation" ON "public"."SimulatorAnalytics";
DROP POLICY IF EXISTS "Allow analytics read" ON "public"."SimulatorAnalytics";

-- 2. Créer des politiques RLS plus permissives pour le simulateur
-- Politiques pour TemporarySession
CREATE POLICY "simulator_session_all" ON "public"."TemporarySession"
    FOR ALL USING (true) WITH CHECK (true);

-- Politiques pour TemporaryResponse
CREATE POLICY "simulator_response_all" ON "public"."TemporaryResponse"
    FOR ALL USING (true) WITH CHECK (true);

-- Politiques pour TemporaryEligibility
CREATE POLICY "simulator_eligibility_all" ON "public"."TemporaryEligibility"
    FOR ALL USING (true) WITH CHECK (true);

-- Politiques pour SimulatorAnalytics
CREATE POLICY "simulator_analytics_all" ON "public"."SimulatorAnalytics"
    FOR ALL USING (true) WITH CHECK (true);

-- 3. Vérifier que les tables ont les bonnes permissions
GRANT ALL PRIVILEGES ON "public"."TemporarySession" TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON "public"."TemporaryResponse" TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON "public"."TemporaryEligibility" TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON "public"."SimulatorAnalytics" TO anon, authenticated, service_role;

-- 4. Vérifier que les séquences ont les bonnes permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 5. Vérifier que RLS est activé sur toutes les tables
ALTER TABLE "public"."TemporarySession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."TemporaryResponse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."TemporaryEligibility" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SimulatorAnalytics" ENABLE ROW LEVEL SECURITY;

-- 6. Créer une fonction de test pour vérifier l'insertion
CREATE OR REPLACE FUNCTION test_simulator_insertion()
RETURNS json AS $$
DECLARE
    session_id uuid;
    session_token text;
    test_result json;
BEGIN
    -- Tester l'insertion d'une session
    INSERT INTO "public"."TemporarySession" (
        session_token,
        ip_address,
        user_agent
    ) VALUES (
        'test-' || gen_random_uuid(),
        '127.0.0.1',
        'test-user-agent'
    ) RETURNING id, session_token INTO session_id, session_token;
    
    -- Tester l'insertion d'une réponse
    INSERT INTO "public"."TemporaryResponse" (
        session_id,
        question_id,
        response_value
    ) VALUES (
        session_id,
        gen_random_uuid(),
        '{"test": "value"}'::jsonb
    );
    
    -- Nettoyer les données de test
    DELETE FROM "public"."TemporarySession" WHERE id = session_id;
    
    test_result := json_build_object(
        'success', true,
        'session_id', session_id,
        'session_token', session_token,
        'message', 'Test d''insertion réussi'
    );
    
    RETURN test_result;
    
EXCEPTION WHEN OTHERS THEN
    test_result := json_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', SQLSTATE
    );
    
    RETURN test_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Exécuter le test
SELECT test_simulator_insertion();

-- 8. Nettoyer la fonction de test
DROP FUNCTION IF EXISTS test_simulator_insertion(); 