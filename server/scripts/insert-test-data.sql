-- =====================================================
-- INSERTION DES DONNÉES DE TEST POUR LE SIMULATEUR
-- =====================================================

-- Insertion de données de test pour les analytics
INSERT INTO "public"."SimulatorAnalytics" (session_token, event_type, event_data) 
VALUES 
('test-session-1', 'session_start', '{"timestamp": "2024-01-15T10:00:00Z"}'),
('test-session-1', 'question_answered', '{"question_id": "q1", "response": "Transport"}'),
('test-session-2', 'session_start', '{"timestamp": "2024-01-15T11:00:00Z"}'),
('test-session-2', 'conversion_click', '{"products_count": 3, "total_savings": 25000}');

-- Mise à jour de quelques sessions de test
UPDATE "public"."TemporarySession" 
SET completed = true, 
    migrated_to_account = true,
    migrated_at = NOW()
WHERE session_token IN ('test-session-1', 'test-session-2');

-- Affichage des statistiques de test
SELECT 'Statistiques générales' as type, * FROM "public"."SimulatorStats" LIMIT 3;

SELECT 'Statistiques par produit' as type, * FROM "public"."SimulatorProductStats" LIMIT 5; 