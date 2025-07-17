-- =====================================================
-- TEST DES TABLES DU SIMULATEUR
-- =====================================================

-- Vérifier que les tables existent
SELECT 'SimulatorAnalytics' as table_name, 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'simulatoranalytics' AND table_schema = 'public') as exists;

SELECT 'SimulatorFollowUp' as table_name, 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'simulatorfollowup' AND table_schema = 'public') as exists;

-- Vérifier les colonnes de TemporarySession
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'temporarysession' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier les vues
SELECT 'SimulatorStats' as view_name, 
       EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'simulatorstats' AND table_schema = 'public') as exists;

SELECT 'SimulatorProductStats' as view_name, 
       EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'simulatorproductstats' AND table_schema = 'public') as exists;

-- Test d'insertion simple
INSERT INTO "public"."SimulatorAnalytics" (session_token, event_type, event_data) 
VALUES ('test-session-1', 'test_event', '{"test": "data"}');

-- Vérifier l'insertion
SELECT COUNT(*) as analytics_count FROM "public"."SimulatorAnalytics";

-- Nettoyer le test
DELETE FROM "public"."SimulatorAnalytics" WHERE session_token = 'test-session-1';

-- Afficher le résultat
SELECT 'Tables créées avec succès !' as status; 