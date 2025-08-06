-- ============================================================================
-- CRÉATION DES TABLES MANQUANTES
-- ============================================================================

-- Table user_sessions pour le suivi des sessions utilisateurs
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'expert', 'admin')),
    session_token VARCHAR(255) NOT NULL UNIQUE,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Table transactions pour le suivi des transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID, -- Référence à créer plus tard
    dossier_id UUID, -- Référence à créer plus tard
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'fee', 'commission')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    payment_method VARCHAR(50),
    reference VARCHAR(255),
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_dossier_id ON transactions(dossier_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Table simulations si elle n'existe pas
CREATE TABLE IF NOT EXISTS simulations (
    id SERIAL PRIMARY KEY,
    clientId UUID NOT NULL, -- Référence à créer plus tard
    type VARCHAR(50) NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    statut VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (statut IN ('pending', 'processing', 'completed', 'failed')),
    createdBy UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_simulations_client_id ON simulations(clientId);
CREATE INDEX IF NOT EXISTS idx_simulations_created_at ON simulations(created_at);
CREATE INDEX IF NOT EXISTS idx_simulations_statut ON simulations(statut);

-- Table SimulationProcessed si elle n'existe pas
CREATE TABLE IF NOT EXISTS "SimulationProcessed" (
    id SERIAL PRIMARY KEY,
    clientid UUID NOT NULL, -- Référence à créer plus tard
    type VARCHAR(50) NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    statut VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (statut IN ('pending', 'processing', 'completed', 'failed')),
    createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_simulation_processed_clientid ON "SimulationProcessed"(clientid);
CREATE INDEX IF NOT EXISTS idx_simulation_processed_createdat ON "SimulationProcessed"(createdat);
CREATE INDEX IF NOT EXISTS idx_simulation_processed_statut ON "SimulationProcessed"(statut);

-- RLS (Row Level Security) pour user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own sessions" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own sessions" ON user_sessions
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- RLS pour transactions (simplifié sans références)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid()::text = client_id::text);

-- RLS pour simulations (simplifié sans références)
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own simulations" ON simulations
    FOR SELECT USING (auth.uid()::text = createdBy::text);

CREATE POLICY "Users can insert their own simulations" ON simulations
    FOR INSERT WITH CHECK (auth.uid()::text = createdBy::text);

-- RLS pour SimulationProcessed (simplifié sans références)
ALTER TABLE "SimulationProcessed" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own processed simulations" ON "SimulationProcessed"
    FOR SELECT USING (auth.uid()::text = clientid::text);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulations_updated_at BEFORE UPDATE ON simulations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulation_processed_updated_at BEFORE UPDATE ON "SimulationProcessed"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Nettoyer les sessions expirées (fonction utilitaire)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Commentaires pour la documentation
COMMENT ON TABLE user_sessions IS 'Table pour le suivi des sessions utilisateurs';
COMMENT ON TABLE transactions IS 'Table pour le suivi des transactions financières';
COMMENT ON TABLE simulations IS 'Table pour les simulations d''éligibilité';
COMMENT ON TABLE "SimulationProcessed" IS 'Table pour les simulations traitées par l''API Python'; 