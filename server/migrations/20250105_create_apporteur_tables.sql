-- ============================================================================
-- CRÉATION DES TABLES POUR LE DASHBOARD APPORTEUR D'AFFAIRES
-- ============================================================================

-- Table ProspectExpert (liaison prospect/expert)
CREATE TABLE IF NOT EXISTS "ProspectExpert" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prospect_id UUID NOT NULL REFERENCES "Prospect"(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES "Expert"(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID NOT NULL REFERENCES "ApporteurAffaires"(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, refused, expired
    expert_response VARCHAR(50), -- accept, propose_alternative, call, refuse
    expert_response_at TIMESTAMP WITH TIME ZONE,
    expert_notes TEXT,
    refusal_reason TEXT,
    alternative_date TIMESTAMP WITH TIME ZONE,
    alternative_time VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(prospect_id, expert_id)
);

-- Table ProspectProduit (liaison prospect/produits éligibles)
CREATE TABLE IF NOT EXISTS "ProspectProduit" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prospect_id UUID NOT NULL REFERENCES "Prospect"(id) ON DELETE CASCADE,
    produit_eligible_id UUID NOT NULL REFERENCES "ProduitEligible"(id) ON DELETE CASCADE,
    selected BOOLEAN DEFAULT false,
    notes TEXT,
    priority VARCHAR(20) DEFAULT 'medium', -- high, medium, low
    estimated_amount DECIMAL(15,2),
    success_probability INTEGER CHECK (success_probability >= 0 AND success_probability <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(prospect_id, produit_eligible_id)
);

-- Table ProspectRDV (gestion des rendez-vous)
CREATE TABLE IF NOT EXISTS "ProspectRDV" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prospect_id UUID NOT NULL REFERENCES "Prospect"(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES "Expert"(id) ON DELETE CASCADE,
    apporteur_id UUID NOT NULL REFERENCES "ApporteurAffaires"(id) ON DELETE CASCADE,
    meeting_type VARCHAR(20) NOT NULL, -- physical, video, phone
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    location TEXT,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled, no_show, rescheduled
    expert_response VARCHAR(50), -- accept, propose_alternative, call, refuse
    expert_response_at TIMESTAMP WITH TIME ZONE,
    expert_notes TEXT,
    refusal_reason TEXT,
    alternative_date DATE,
    alternative_time TIME,
    completed_at TIMESTAMP WITH TIME ZONE,
    outcome VARCHAR(50), -- positive, negative, follow_up_needed, converted
    notes TEXT,
    next_steps TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table ProspectStatut (suivi des statuts détaillés)
CREATE TABLE IF NOT EXISTS "ProspectStatut" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prospect_id UUID NOT NULL REFERENCES "Prospect"(id) ON DELETE CASCADE,
    statut VARCHAR(50) NOT NULL, -- nouveau, qualifie, rdv_negocie, expert_valide, meeting_fait, expert_etudie, proposition_preparee, proposition_envoyee, client_etudie, client_decide, signe, refuse
    previous_statut VARCHAR(50),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by UUID REFERENCES "ApporteurAffaires"(id) ON DELETE SET NULL,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table ProspectConversion (suivi des conversions)
CREATE TABLE IF NOT EXISTS "ProspectConversion" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prospect_id UUID NOT NULL REFERENCES "Prospect"(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
    converted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    conversion_notes TEXT,
    conversion_value DECIMAL(15,2),
    commission_rate DECIMAL(5,4),
    commission_amount DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table ExpertNotification (notifications pour les experts)
CREATE TABLE IF NOT EXISTS "ExpertNotification" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expert_id UUID NOT NULL REFERENCES "Expert"(id) ON DELETE CASCADE,
    prospect_id UUID REFERENCES "Prospect"(id) ON DELETE CASCADE,
    apporteur_id UUID REFERENCES "ApporteurAffaires"(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- prospect_preselected, rdv_request, rdv_confirmed, rdv_cancelled, deadline_approaching
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    status VARCHAR(20) DEFAULT 'unread', -- unread, read, archived
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_prospect_expert_prospect_id ON "ProspectExpert"(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_expert_expert_id ON "ProspectExpert"(expert_id);
CREATE INDEX IF NOT EXISTS idx_prospect_expert_status ON "ProspectExpert"(status);
CREATE INDEX IF NOT EXISTS idx_prospect_produit_prospect_id ON "ProspectProduit"(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_produit_produit_id ON "ProspectProduit"(produit_eligible_id);
CREATE INDEX IF NOT EXISTS idx_prospect_rdv_prospect_id ON "ProspectRDV"(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_rdv_expert_id ON "ProspectRDV"(expert_id);
CREATE INDEX IF NOT EXISTS idx_prospect_rdv_status ON "ProspectRDV"(status);
CREATE INDEX IF NOT EXISTS idx_prospect_statut_prospect_id ON "ProspectStatut"(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_statut_statut ON "ProspectStatut"(statut);
CREATE INDEX IF NOT EXISTS idx_prospect_conversion_prospect_id ON "ProspectConversion"(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_conversion_client_id ON "ProspectConversion"(client_id);
CREATE INDEX IF NOT EXISTS idx_expert_notification_expert_id ON "ExpertNotification"(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_notification_status ON "ExpertNotification"(status);

-- RLS pour ProspectExpert
ALTER TABLE "ProspectExpert" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apporteurs can view their prospect expert assignments" ON "ProspectExpert"
    FOR SELECT USING (
        assigned_by IN (
            SELECT id FROM "ApporteurAffaires" WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Experts can view their assignments" ON "ProspectExpert"
    FOR SELECT USING (
        expert_id IN (
            SELECT id FROM "Expert" WHERE auth_id = auth.uid()
        )
    );

-- RLS pour ProspectProduit
ALTER TABLE "ProspectProduit" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apporteurs can manage their prospect products" ON "ProspectProduit"
    FOR ALL USING (
        prospect_id IN (
            SELECT id FROM "Prospect" WHERE apporteur_id IN (
                SELECT id FROM "ApporteurAffaires" WHERE auth_id = auth.uid()
            )
        )
    );

-- RLS pour ProspectRDV
ALTER TABLE "ProspectRDV" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apporteurs can manage their prospect meetings" ON "ProspectRDV"
    FOR ALL USING (
        apporteur_id IN (
            SELECT id FROM "ApporteurAffaires" WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Experts can view their meetings" ON "ProspectRDV"
    FOR SELECT USING (
        expert_id IN (
            SELECT id FROM "Expert" WHERE auth_id = auth.uid()
        )
    );

-- RLS pour ProspectStatut
ALTER TABLE "ProspectStatut" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apporteurs can view their prospect statuses" ON "ProspectStatut"
    FOR SELECT USING (
        prospect_id IN (
            SELECT id FROM "Prospect" WHERE apporteur_id IN (
                SELECT id FROM "ApporteurAffaires" WHERE auth_id = auth.uid()
            )
        )
    );

-- RLS pour ExpertNotification
ALTER TABLE "ExpertNotification" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Experts can view their notifications" ON "ExpertNotification"
    FOR SELECT USING (
        expert_id IN (
            SELECT id FROM "Expert" WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Apporteurs can view their sent notifications" ON "ExpertNotification"
    FOR SELECT USING (
        apporteur_id IN (
            SELECT id FROM "ApporteurAffaires" WHERE auth_id = auth.uid()
        )
    );
