-- =====================================================
-- ANALYSE DE L'ARCHITECTURE IDÉALE DU SIMULATEUR
-- Date: 2025-01-30
-- Objectif: Définir la meilleure architecture pour le simulateur
-- =====================================================

-- ANALYSE DES BESOINS DU SIMULATEUR

-- 1. Flux typique d'un utilisateur
/*
ÉTAPE 1: Utilisateur anonyme accède au simulateur
ÉTAPE 2: Création d'une session temporaire
ÉTAPE 3: Réponses au questionnaire
ÉTAPE 4: Calcul d'éligibilité en temps réel
ÉTAPE 5: Affichage des résultats
ÉTAPE 6: Option 1: Utilisateur reste anonyme (données temporaires)
ÉTAPE 6: Option 2: Utilisateur s'inscrit (migration vers ClientProduitEligible)
*/

-- 2. ANALYSE DES OPTIONS D'ARCHITECTURE

-- OPTION A: Tables dédiées au simulateur (RECOMMANDÉE)
/*
AVANTAGES:
- Séparation claire des responsabilités
- Pas de pollution de ClientProduitEligible
- Migration propre et contrôlée
- Facilité de nettoyage des données temporaires
- Performance optimisée pour le simulateur

INCONVÉNIENTS:
- Plus de tables à gérer
- Nécessite une logique de migration
*/

-- OPTION B: Utilisation directe de ClientProduitEligible avec sessionId
/*
AVANTAGES:
- Moins de tables
- Données centralisées

INCONVÉNIENTS:
- Mélange des responsabilités
- Complexité de gestion des sessions
- Risque de pollution des données clients
- Difficulté de nettoyage
*/

-- 3. RECOMMANDATION: ARCHITECTURE DÉDIÉE

-- Structure recommandée pour le simulateur
CREATE TABLE IF NOT EXISTS "SimulatorSession" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "session_token" text UNIQUE NOT NULL,
    "ip_address" text,
    "user_agent" text,
    "status" text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'migrated')),
    "current_step" integer DEFAULT 1,
    "total_steps" integer DEFAULT 10,
    "started_at" timestamp with time zone DEFAULT now(),
    "completed_at" timestamp with time zone,
    "expires_at" timestamp with time zone DEFAULT (now() + interval '24 hours'),
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "SimulatorResponse" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "session_id" uuid NOT NULL REFERENCES "SimulatorSession"(id) ON DELETE CASCADE,
    "question_id" text NOT NULL,
    "response_value" jsonb NOT NULL,
    "response_time" integer, -- en secondes
    "created_at" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "SimulatorEligibility" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "session_id" uuid NOT NULL REFERENCES "SimulatorSession"(id) ON DELETE CASCADE,
    "produit_id" text NOT NULL,
    "eligibility_score" integer NOT NULL CHECK (eligibility_score >= 0 AND eligibility_score <= 100),
    "estimated_savings" numeric(10,2) DEFAULT 0,
    "confidence_level" text CHECK (confidence_level IN ('low', 'medium', 'high')),
    "calculation_details" jsonb DEFAULT '{}'::jsonb,
    "recommendations" text[] DEFAULT '{}',
    "risk_factors" text[] DEFAULT '{}',
    "created_at" timestamp with time zone DEFAULT now()
);

-- 4. FONCTIONS DE MIGRATION PROPRE

-- Fonction pour migrer une session vers un client
CREATE OR REPLACE FUNCTION migrate_simulator_to_client(
    p_session_token text,
    p_client_id uuid
)
RETURNS json AS $$
DECLARE
    session_record RECORD;
    eligibility_record RECORD;
    migration_result json;
    migrated_count integer := 0;
BEGIN
    -- Vérifier que la session existe
    SELECT * INTO session_record 
    FROM "SimulatorSession" 
    WHERE session_token = p_session_token AND status = 'completed';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Session non trouvée ou non complétée'
        );
    END IF;
    
    -- Vérifier que le client existe
    IF NOT EXISTS (SELECT 1 FROM "Client" WHERE id = p_client_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Client non trouvé'
        );
    END IF;
    
    -- Migrer les résultats d'éligibilité vers ClientProduitEligible
    FOR eligibility_record IN 
        SELECT * FROM "SimulatorEligibility" 
        WHERE session_id = session_record.id
    LOOP
        INSERT INTO "ClientProduitEligible" (
            "clientId",
            "produitId",
            statut,
            "tauxFinal",
            "montantFinal",
            "dureeFinale",
            metadata
        ) VALUES (
            p_client_id,
            eligibility_record.produit_id,
            CASE 
                WHEN eligibility_record.eligibility_score >= 70 THEN 'eligible'
                WHEN eligibility_record.eligibility_score >= 40 THEN 'potentiellement_eligible'
                ELSE 'non_eligible'
            END,
            eligibility_record.eligibility_score,
            eligibility_record.estimated_savings,
            12, -- durée par défaut
            jsonb_build_object(
                'migrated_from_simulator', true,
                'original_session_token', p_session_token,
                'confidence_level', eligibility_record.confidence_level,
                'recommendations', eligibility_record.recommendations,
                'risk_factors', eligibility_record.risk_factors,
                'calculation_details', eligibility_record.calculation_details
            )
        );
        
        migrated_count := migrated_count + 1;
    END LOOP;
    
    -- Marquer la session comme migrée
    UPDATE "SimulatorSession" 
    SET 
        status = 'migrated',
        updated_at = now(),
        metadata = metadata || jsonb_build_object(
            'migrated_to_client', p_client_id,
            'migrated_at', now(),
            'migrated_eligibility_count', migrated_count
        )
    WHERE id = session_record.id;
    
    migration_result := jsonb_build_object(
        'success', true,
        'session_token', p_session_token,
        'client_id', p_client_id,
        'migrated_eligibility_count', migrated_count,
        'message', 'Migration réussie'
    );
    
    RETURN migration_result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FONCTIONS DE NETTOYAGE

-- Fonction pour nettoyer les sessions expirées
CREATE OR REPLACE FUNCTION cleanup_expired_simulator_sessions()
RETURNS integer AS $$
DECLARE
    deleted_count integer;
BEGIN
    -- Supprimer les sessions expirées et non migrées
    DELETE FROM "SimulatorSession" 
    WHERE expires_at < now() 
    AND status NOT IN ('migrated');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. INDEX ET POLITIQUES RLS

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS "idx_simulator_session_token" ON "SimulatorSession" (session_token);
CREATE INDEX IF NOT EXISTS "idx_simulator_session_status" ON "SimulatorSession" (status);
CREATE INDEX IF NOT EXISTS "idx_simulator_session_expires" ON "SimulatorSession" (expires_at);
CREATE INDEX IF NOT EXISTS "idx_simulator_response_session" ON "SimulatorResponse" (session_id);
CREATE INDEX IF NOT EXISTS "idx_simulator_eligibility_session" ON "SimulatorEligibility" (session_id);

-- Politiques RLS
ALTER TABLE "SimulatorSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SimulatorResponse" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SimulatorEligibility" ENABLE ROW LEVEL SECURITY;

-- Politiques permissives pour le simulateur
CREATE POLICY "simulator_session_all" ON "SimulatorSession" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "simulator_response_all" ON "SimulatorResponse" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "simulator_eligibility_all" ON "SimulatorEligibility" FOR ALL USING (true) WITH CHECK (true);

-- 7. VUES POUR L'ANALYSE

-- Vue d'ensemble des sessions
CREATE OR REPLACE VIEW "SimulatorOverview" AS
SELECT 
    ss.session_token,
    ss.status,
    ss.current_step,
    ss.total_steps,
    ss.started_at,
    ss.completed_at,
    ss.expires_at,
    COUNT(sr.id) as response_count,
    COUNT(se.id) as eligibility_count,
    COALESCE(SUM(se.estimated_savings), 0) as total_potential_savings,
    CASE 
        WHEN ss.expires_at < now() THEN 'expired'
        ELSE 'active'
    END as expiration_status
FROM "SimulatorSession" ss
LEFT JOIN "SimulatorResponse" sr ON ss.id = sr.session_id
LEFT JOIN "SimulatorEligibility" se ON ss.id = se.session_id
GROUP BY ss.id, ss.session_token, ss.status, ss.current_step, ss.total_steps, 
         ss.started_at, ss.completed_at, ss.expires_at;

-- Commentaires pour la documentation
COMMENT ON TABLE "SimulatorSession" IS 'Sessions temporaires du simulateur d''éligibilité';
COMMENT ON TABLE "SimulatorResponse" IS 'Réponses aux questions du simulateur';
COMMENT ON TABLE "SimulatorEligibility" IS 'Résultats d''éligibilité du simulateur';
COMMENT ON FUNCTION migrate_simulator_to_client(text, uuid) IS 'Migre une session simulateur vers un client identifié';
COMMENT ON FUNCTION cleanup_expired_simulator_sessions() IS 'Nettoie les sessions expirées du simulateur'; 