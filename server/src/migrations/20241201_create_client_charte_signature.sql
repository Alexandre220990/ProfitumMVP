-- Création de la table ClientCharteSignature
CREATE TABLE IF NOT EXISTS client_charte_signature (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES "Client"(id),
    produit_id UUID NOT NULL REFERENCES "ProduitEligible"(id),
    client_produit_eligible_id UUID NOT NULL REFERENCES "ClientProduitEligible"(id),
    signature_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_client_charte_signature_client_id ON client_charte_signature (client_id);
CREATE INDEX IF NOT EXISTS idx_client_charte_signature_produit_id ON client_charte_signature (produit_id);
CREATE INDEX IF NOT EXISTS idx_client_charte_signature_client_produit_eligible_id ON client_charte_signature (client_produit_eligible_id);
CREATE INDEX IF NOT EXISTS idx_client_charte_signature_signature_date ON client_charte_signature (signature_date);

-- Contrainte unique pour éviter les signatures multiples
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_charte_signature_unique 
ON client_charte_signature (client_produit_eligible_id);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_client_charte_signature_updated_at
  BEFORE UPDATE ON client_charte_signature
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 