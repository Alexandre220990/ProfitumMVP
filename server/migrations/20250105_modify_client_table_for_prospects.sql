-- ============================================================================
-- MODIFICATION DE LA TABLE CLIENT POUR GÉRER PROSPECTS ET CLIENTS
-- ============================================================================

-- Ajouter colonnes manquantes à la table Client pour gérer les prospects
ALTER TABLE "Client" 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'prospect', -- prospect, client, converted, inactive
ADD COLUMN IF NOT EXISTS apporteur_id UUID REFERENCES "ApporteurAffaires"(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS qualification_score INTEGER CHECK (qualification_score >= 1 AND qualification_score <= 10),
ADD COLUMN IF NOT EXISTS interest_level VARCHAR(20) DEFAULT 'medium', -- high, medium, low
ADD COLUMN IF NOT EXISTS budget_range VARCHAR(20), -- 0-10k, 10k-50k, 50k-100k, 100k+
ADD COLUMN IF NOT EXISTS timeline VARCHAR(20), -- immediate, 1-3months, 3-6months, 6months+
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'apporteur', -- apporteur, website, referral, other
ADD COLUMN IF NOT EXISTS siren VARCHAR(9),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS decision_maker_position VARCHAR(100),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS expert_contacted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP WITH TIME ZONE;

-- Table ClientExpert (liaison client/expert pour les prospects)
CREATE TABLE IF NOT EXISTS "ClientExpert" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
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
    UNIQUE(client_id, expert_id)
);

-- Table ClientRDV (gestion des rendez-vous)
CREATE TABLE IF NOT EXISTS "ClientRDV" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
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

-- Table ClientStatut (suivi des statuts détaillés)
CREATE TABLE IF NOT EXISTS "ClientStatut" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
    statut VARCHAR(50) NOT NULL, -- nouveau, qualifie, rdv_negocie, expert_valide, meeting_fait, expert_etudie, proposition_preparee, proposition_envoyee, client_etudie, client_decide, signe, refuse
    previous_statut VARCHAR(50),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by UUID REFERENCES "ApporteurAffaires"(id) ON DELETE SET NULL,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table ExpertNotification (notifications pour les experts)
CREATE TABLE IF NOT EXISTS "ExpertNotification" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expert_id UUID NOT NULL REFERENCES "Expert"(id) ON DELETE CASCADE,
    client_id UUID REFERENCES "Client"(id) ON DELETE CASCADE,
    apporteur_id UUID REFERENCES "ApporteurAffaires"(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- client_preselected, rdv_request, rdv_confirmed, rdv_cancelled, deadline_approaching
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    status VARCHAR(20) DEFAULT 'unread', -- unread, read, archived
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_client_status ON "Client"(status);
CREATE INDEX IF NOT EXISTS idx_client_apporteur_id ON "Client"(apporteur_id);
CREATE INDEX IF NOT EXISTS idx_client_expert_client_id ON "ClientExpert"(client_id);
CREATE INDEX IF NOT EXISTS idx_client_expert_expert_id ON "ClientExpert"(expert_id);
CREATE INDEX IF NOT EXISTS idx_client_expert_status ON "ClientExpert"(status);
CREATE INDEX IF NOT EXISTS idx_client_rdv_client_id ON "ClientRDV"(client_id);
CREATE INDEX IF NOT EXISTS idx_client_rdv_expert_id ON "ClientRDV"(expert_id);
CREATE INDEX IF NOT EXISTS idx_client_rdv_status ON "ClientRDV"(status);
CREATE INDEX IF NOT EXISTS idx_client_statut_client_id ON "ClientStatut"(client_id);
CREATE INDEX IF NOT EXISTS idx_client_statut_statut ON "ClientStatut"(statut);
CREATE INDEX IF NOT EXISTS idx_expert_notification_expert_id ON "ExpertNotification"(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_notification_status ON "ExpertNotification"(status);

-- RLS pour ClientExpert
ALTER TABLE "ClientExpert" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apporteurs can view their client expert assignments" ON "ClientExpert"
    FOR SELECT USING (
        assigned_by IN (
            SELECT id FROM "ApporteurAffaires" WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Experts can view their assignments" ON "ClientExpert"
    FOR SELECT USING (
        expert_id IN (
            SELECT id FROM "Expert" WHERE auth_id = auth.uid()
        )
    );

-- RLS pour ClientRDV
ALTER TABLE "ClientRDV" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apporteurs can manage their client meetings" ON "ClientRDV"
    FOR ALL USING (
        apporteur_id IN (
            SELECT id FROM "ApporteurAffaires" WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "Experts can view their meetings" ON "ClientRDV"
    FOR SELECT USING (
        expert_id IN (
            SELECT id FROM "Expert" WHERE auth_id = auth.uid()
        )
    );

-- RLS pour ClientStatut
ALTER TABLE "ClientStatut" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apporteurs can view their client statuses" ON "ClientStatut"
    FOR SELECT USING (
        client_id IN (
            SELECT id FROM "Client" WHERE apporteur_id IN (
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
