-- Création de la table ExpertAssignment
CREATE TABLE IF NOT EXISTS "ExpertAssignment" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expert_id UUID NOT NULL REFERENCES "Expert"(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
    client_produit_id UUID REFERENCES "ClientProduitEligible"(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected')),
    assignment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_date TIMESTAMP WITH TIME ZONE,
    compensation_amount DECIMAL(10,2),
    compensation_percentage DECIMAL(5,2),
    client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
    client_feedback TEXT,
    expert_rating INTEGER CHECK (expert_rating >= 1 AND expert_rating <= 5),
    expert_feedback TEXT,
    estimated_duration_days INTEGER,
    actual_duration_days INTEGER,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_expert_assignment_expert_id ON "ExpertAssignment"(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_assignment_client_id ON "ExpertAssignment"(client_id);
CREATE INDEX IF NOT EXISTS idx_expert_assignment_status ON "ExpertAssignment"(status);
CREATE INDEX IF NOT EXISTS idx_expert_assignment_date ON "ExpertAssignment"(assignment_date);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_expert_assignment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expert_assignment_updated_at
    BEFORE UPDATE ON "ExpertAssignment"
    FOR EACH ROW
    EXECUTE FUNCTION update_expert_assignment_updated_at();

-- Politiques RLS
ALTER TABLE "ExpertAssignment" ENABLE ROW LEVEL SECURITY;

-- Politique pour les experts (voient leurs assignations)
CREATE POLICY "Experts can view their own assignments" ON "ExpertAssignment"
    FOR SELECT USING (auth.uid()::text = expert_id::text);

-- Politique pour les clients (voient leurs assignations)
CREATE POLICY "Clients can view their own assignments" ON "ExpertAssignment"
    FOR SELECT USING (auth.uid()::text = client_id::text);

-- Politique pour les admins (voient toutes les assignations)
CREATE POLICY "Admins can view all assignments" ON "ExpertAssignment"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Politique pour les experts (peuvent mettre à jour leurs assignations)
CREATE POLICY "Experts can update their own assignments" ON "ExpertAssignment"
    FOR UPDATE USING (auth.uid()::text = expert_id::text);

-- Politique pour les clients (peuvent mettre à jour leurs assignations)
CREATE POLICY "Clients can update their own assignments" ON "ExpertAssignment"
    FOR UPDATE USING (auth.uid()::text = client_id::text);

-- Politique pour les admins (peuvent créer/modifier toutes les assignations)
CREATE POLICY "Admins can manage all assignments" ON "ExpertAssignment"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "User" 
            WHERE id = auth.uid()::text 
            AND role = 'admin'
        )
    ); 