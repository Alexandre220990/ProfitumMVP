-- Création de la table ValidationState
CREATE TABLE IF NOT EXISTS "ValidationState" (
  simulation_id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  phase TEXT NOT NULL,
  profile_data JSONB NOT NULL,
  products JSONB NOT NULL,
  current_product_index INTEGER NOT NULL,
  conversation_history JSONB NOT NULL,
  last_interaction TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_validation_state_client_id ON "ValidationState" (client_id);
CREATE INDEX IF NOT EXISTS idx_validation_state_phase ON "ValidationState" (phase);
CREATE INDEX IF NOT EXISTS idx_validation_state_last_interaction ON "ValidationState" (last_interaction);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_validation_state_updated_at
  BEFORE UPDATE ON "ValidationState"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 