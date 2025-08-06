-- ============================================================================
-- CRÉATION DES TABLES DE BASE MANQUANTES
-- ============================================================================

-- Table Client (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS "Client" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_id UUID UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    company_name VARCHAR(255),
    phone_number VARCHAR(20),
    city VARCHAR(100),
    secteur_activite VARCHAR(100),
    nombre_employes INTEGER,
    revenu_annuel DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Expert (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS "Expert" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_id UUID UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    company_name VARCHAR(255),
    phone_number VARCHAR(20),
    specializations TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Admin (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS "Admin" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_id UUID UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table ProduitEligible (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS "ProduitEligible" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    categorie VARCHAR(100),
    montant_min DECIMAL(15,2),
    montant_max DECIMAL(15,2),
    taux_min DECIMAL(5,4),
    taux_max DECIMAL(5,4),
    duree_min INTEGER,
    duree_max INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table ClientProduitEligible (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS "ClientProduitEligible" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES "Client"(id) ON DELETE CASCADE,
    produit_eligible_id UUID REFERENCES "ProduitEligible"(id) ON DELETE CASCADE,
    expert_id UUID REFERENCES "Expert"(id) ON DELETE SET NULL,
    validation_state VARCHAR(50) DEFAULT 'pending',
    montant_final DECIMAL(15,2),
    taux_final DECIMAL(5,4),
    duree_finale INTEGER,
    current_step INTEGER DEFAULT 1,
    progress INTEGER DEFAULT 0,
    simulation_id INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    priorite VARCHAR(20) DEFAULT 'medium',
    date_eligibilite DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_client_auth_id ON "Client"(auth_id);
CREATE INDEX IF NOT EXISTS idx_client_email ON "Client"(email);
CREATE INDEX IF NOT EXISTS idx_expert_auth_id ON "Expert"(auth_id);
CREATE INDEX IF NOT EXISTS idx_expert_email ON "Expert"(email);
CREATE INDEX IF NOT EXISTS idx_admin_auth_id ON "Admin"(auth_id);
CREATE INDEX IF NOT EXISTS idx_admin_email ON "Admin"(email);
CREATE INDEX IF NOT EXISTS idx_client_produit_eligible_client_id ON "ClientProduitEligible"(client_id);
CREATE INDEX IF NOT EXISTS idx_client_produit_eligible_produit_id ON "ClientProduitEligible"(produit_eligible_id);
CREATE INDEX IF NOT EXISTS idx_client_produit_eligible_expert_id ON "ClientProduitEligible"(expert_id);

-- RLS pour Client
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own client data" ON "Client"
    FOR SELECT USING (auth.uid()::text = auth_id::text);

CREATE POLICY "Users can update their own client data" ON "Client"
    FOR UPDATE USING (auth.uid()::text = auth_id::text);

-- RLS pour Expert
ALTER TABLE "Expert" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Experts can view their own data" ON "Expert"
    FOR SELECT USING (auth.uid()::text = auth_id::text);

CREATE POLICY "Experts can update their own data" ON "Expert"
    FOR UPDATE USING (auth.uid()::text = auth_id::text);

-- RLS pour Admin
ALTER TABLE "Admin" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their own data" ON "Admin"
    FOR SELECT USING (auth.uid()::text = auth_id::text);

CREATE POLICY "Admins can update their own data" ON "Admin"
    FOR UPDATE USING (auth.uid()::text = auth_id::text);

-- RLS pour ClientProduitEligible
ALTER TABLE "ClientProduitEligible" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own dossiers" ON "ClientProduitEligible"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "Client" c 
            WHERE c.id = "ClientProduitEligible".client_id 
            AND c.auth_id = auth.uid()::text
        )
    );

CREATE POLICY "Experts can view assigned dossiers" ON "ClientProduitEligible"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "Expert" e 
            WHERE e.id = "ClientProduitEligible".expert_id 
            AND e.auth_id = auth.uid()::text
        )
    );

-- Triggers pour updated_at
CREATE TRIGGER update_client_updated_at BEFORE UPDATE ON "Client"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expert_updated_at BEFORE UPDATE ON "Expert"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_updated_at BEFORE UPDATE ON "Admin"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produit_eligible_updated_at BEFORE UPDATE ON "ProduitEligible"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_produit_eligible_updated_at BEFORE UPDATE ON "ClientProduitEligible"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires
COMMENT ON TABLE "Client" IS 'Table des clients';
COMMENT ON TABLE "Expert" IS 'Table des experts';
COMMENT ON TABLE "Admin" IS 'Table des administrateurs';
COMMENT ON TABLE "ProduitEligible" IS 'Table des produits éligibles';
COMMENT ON TABLE "ClientProduitEligible" IS 'Table de liaison client-produit éligible'; 