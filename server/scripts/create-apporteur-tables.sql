-- ============================================================================
-- CRÉATION DES TABLES APPORTEURS D'AFFAIRES - FINANCIALTRACKER
-- ============================================================================
-- Date : 25 septembre 2025
-- Objectif : Créer l'architecture complète pour les apporteurs d'affaires

-- ============================================================================
-- 1. TABLE APPORTEUR D'AFFAIRES
-- ============================================================================

CREATE TABLE "ApporteurAffaires" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informations personnelles
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    
    -- Informations entreprise
    company_name VARCHAR(255),
    company_type VARCHAR(50) CHECK (company_type IN ('independant', 'salarie', 'partenaire', 'agence', 'call_center')),
    siren VARCHAR(9),
    
    -- Configuration commission
    commission_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),
    target_monthly DECIMAL(10,2) DEFAULT 0.00,
    
    -- Statut et dates
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'suspended', 'pending_approval')) DEFAULT 'pending_approval',
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES "Admin"(id),
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT apporteur_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT apporteur_phone_format CHECK (phone IS NULL OR phone ~* '^[0-9+\-\s()]+$')
);

-- ============================================================================
-- 2. TABLE PROSPECT
-- ============================================================================

CREATE TABLE "Prospect" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apporteur_id UUID REFERENCES "ApporteurAffaires"(id) ON DELETE CASCADE,
    
    -- Informations entreprise
    company_name VARCHAR(255) NOT NULL,
    siren VARCHAR(9),
    address TEXT,
    website VARCHAR(255),
    
    -- Décisionnaire
    decision_maker_first_name VARCHAR(100) NOT NULL,
    decision_maker_last_name VARCHAR(100) NOT NULL,
    decision_maker_email VARCHAR(255) NOT NULL,
    decision_maker_phone VARCHAR(20) NOT NULL,
    decision_maker_position VARCHAR(100),
    
    -- Qualification (prospect chaud)
    qualification_score INTEGER CHECK (qualification_score BETWEEN 1 AND 10) DEFAULT 8,
    interest_level VARCHAR(20) CHECK (interest_level IN ('high', 'medium', 'low')) DEFAULT 'high',
    budget_range VARCHAR(20) CHECK (budget_range IN ('0-10k', '10k-50k', '50k-100k', '100k+')) DEFAULT '10k-50k',
    timeline VARCHAR(20) CHECK (timeline IN ('immediate', '1-3months', '3-6months', '6months+')) DEFAULT '1-3months',
    
    -- Présélection expert
    preselected_expert_id UUID REFERENCES "Expert"(id),
    expert_selection_reason TEXT,
    expert_note TEXT, -- Note à l'attention de l'expert
    expert_contacted_at TIMESTAMPTZ,
    expert_response_at TIMESTAMPTZ,
    expert_response VARCHAR(20) CHECK (expert_response IN ('accepted', 'declined', 'pending')) DEFAULT 'pending',
    
    -- Statut du prospect
    status VARCHAR(20) CHECK (status IN (
        'qualified',           -- Prospect chaud créé
        'expert_assigned',     -- Expert assigné
        'meeting_scheduled',   -- RDV planifié
        'meeting_completed',   -- RDV terminé
        'converted',           -- Devenu client
        'lost',               -- Perdu
        'expert_declined'      -- Expert a décliné
    )) DEFAULT 'qualified',
    
    -- Métadonnées
    source VARCHAR(50) CHECK (source IN ('cold_call', 'referral', 'website', 'social_media', 'event', 'other')) DEFAULT 'cold_call',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT prospect_email_format CHECK (decision_maker_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT prospect_phone_format CHECK (decision_maker_phone ~* '^[0-9+\-\s()]+$'),
    CONSTRAINT prospect_siren_format CHECK (siren IS NULL OR siren ~ '^[0-9]{9}$')
);

-- ============================================================================
-- 3. TABLE NOTIFICATIONS EXPERT
-- ============================================================================

CREATE TABLE "ExpertNotification" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expert_id UUID REFERENCES "Expert"(id) ON DELETE CASCADE,
    prospect_id UUID REFERENCES "Prospect"(id) ON DELETE CASCADE,
    apporteur_id UUID REFERENCES "ApporteurAffaires"(id),
    
    -- Type et contenu
    notification_type VARCHAR(50) CHECK (notification_type IN (
        'new_prospect_available',
        'prospect_preselected',
        'meeting_requested',
        'prospect_converted',
        'expert_note_added'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    
    -- Statut
    status VARCHAR(20) CHECK (status IN ('unread', 'read', 'acted', 'dismissed')) DEFAULT 'unread',
    read_at TIMESTAMPTZ,
    acted_at TIMESTAMPTZ,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- ============================================================================
-- 4. TABLE RENCONTRES
-- ============================================================================

CREATE TABLE "ProspectMeeting" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID REFERENCES "Prospect"(id) ON DELETE CASCADE,
    expert_id UUID REFERENCES "Expert"(id),
    apporteur_id UUID REFERENCES "ApporteurAffaires"(id),
    
    -- Détails du RDV
    meeting_type VARCHAR(20) CHECK (meeting_type IN ('phone', 'video', 'in_person')) DEFAULT 'video',
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60 CHECK (duration_minutes > 0),
    location TEXT, -- Adresse physique ou lien visio
    
    -- Statut
    status VARCHAR(20) CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled')) DEFAULT 'scheduled',
    completed_at TIMESTAMPTZ,
    
    -- Résultats
    outcome VARCHAR(20) CHECK (outcome IN ('positive', 'negative', 'follow_up_needed', 'converted')) DEFAULT NULL,
    notes TEXT,
    next_steps TEXT,
    follow_up_date DATE,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. TABLE COMMISSIONS
-- ============================================================================

CREATE TABLE "ApporteurCommission" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    apporteur_id UUID REFERENCES "ApporteurAffaires"(id),
    prospect_id UUID REFERENCES "Prospect"(id),
    client_produit_eligible_id UUID REFERENCES "ClientProduitEligible"(id),
    
    -- Calculs de commission
    base_amount DECIMAL(10,2) NOT NULL CHECK (base_amount >= 0),
    commission_rate DECIMAL(5,2) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
    commission_amount DECIMAL(10,2) NOT NULL CHECK (commission_amount >= 0),
    
    -- Statut et paiement
    status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled')) DEFAULT 'pending',
    payment_date DATE,
    payment_reference VARCHAR(100),
    
    -- Métadonnées
    calculation_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. TABLE CONVERSION PROSPECT → CLIENT
-- ============================================================================

CREATE TABLE "ProspectConversion" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID REFERENCES "Prospect"(id),
    client_id UUID REFERENCES "Client"(id),
    converted_at TIMESTAMPTZ DEFAULT NOW(),
    conversion_notes TEXT,
    conversion_data JSONB -- Données de la conversion
);

-- ============================================================================
-- 7. INDEX DE PERFORMANCE
-- ============================================================================

-- Index ApporteurAffaires
CREATE INDEX idx_apporteur_auth_id ON "ApporteurAffaires"(auth_id);
CREATE INDEX idx_apporteur_status ON "ApporteurAffaires"(status);
CREATE INDEX idx_apporteur_company_type ON "ApporteurAffaires"(company_type);
CREATE INDEX idx_apporteur_created_at ON "ApporteurAffaires"(created_at);

-- Index Prospect
CREATE INDEX idx_prospect_apporteur_status ON "Prospect"(apporteur_id, status);
CREATE INDEX idx_prospect_expert ON "Prospect"(preselected_expert_id, expert_response);
CREATE INDEX idx_prospect_created_at ON "Prospect"(created_at);
CREATE INDEX idx_prospect_qualification ON "Prospect"(qualification_score, interest_level);
CREATE INDEX idx_prospect_decision_maker_email ON "Prospect"(decision_maker_email);

-- Index ExpertNotification
CREATE INDEX idx_expert_notification_expert_status ON "ExpertNotification"(expert_id, status);
CREATE INDEX idx_expert_notification_created_at ON "ExpertNotification"(created_at);
CREATE INDEX idx_expert_notification_type ON "ExpertNotification"(notification_type);

-- Index ProspectMeeting
CREATE INDEX idx_prospect_meeting_prospect ON "ProspectMeeting"(prospect_id);
CREATE INDEX idx_prospect_meeting_expert ON "ProspectMeeting"(expert_id);
CREATE INDEX idx_prospect_meeting_scheduled ON "ProspectMeeting"(scheduled_at);
CREATE INDEX idx_prospect_meeting_status ON "ProspectMeeting"(status);

-- Index ApporteurCommission
CREATE INDEX idx_commission_apporteur_status ON "ApporteurCommission"(apporteur_id, status);
CREATE INDEX idx_commission_payment_date ON "ApporteurCommission"(payment_date);
CREATE INDEX idx_commission_calculation_date ON "ApporteurCommission"(calculation_date);

-- ============================================================================
-- 8. RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE "ApporteurAffaires" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Prospect" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExpertNotification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProspectMeeting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApporteurCommission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProspectConversion" ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour ApporteurAffaires
CREATE POLICY "apporteur_own_data" ON "ApporteurAffaires"
    FOR ALL USING (auth.uid() = auth_id);

-- Politiques RLS pour Prospect
CREATE POLICY "apporteur_own_prospects" ON "Prospect"
    FOR ALL USING (
        apporteur_id IN (
            SELECT id FROM "ApporteurAffaires" 
            WHERE auth_id = auth.uid()
        )
    );

-- Politiques RLS pour ExpertNotification
CREATE POLICY "expert_own_notifications" ON "ExpertNotification"
    FOR ALL USING (
        expert_id IN (
            SELECT id FROM "Expert" 
            WHERE auth_id = auth.uid()
        )
    );

-- Politiques RLS pour ProspectMeeting
CREATE POLICY "meeting_participants" ON "ProspectMeeting"
    FOR ALL USING (
        expert_id IN (SELECT id FROM "Expert" WHERE auth_id = auth.uid()) OR
        apporteur_id IN (SELECT id FROM "ApporteurAffaires" WHERE auth_id = auth.uid())
    );

-- Politiques RLS pour ApporteurCommission
CREATE POLICY "apporteur_own_commissions" ON "ApporteurCommission"
    FOR ALL USING (
        apporteur_id IN (
            SELECT id FROM "ApporteurAffaires" 
            WHERE auth_id = auth.uid()
        )
    );

-- ============================================================================
-- 9. FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction de création prospect chaud
CREATE OR REPLACE FUNCTION create_hot_prospect(
    p_apporteur_id UUID,
    p_prospect_data JSONB,
    p_preselected_expert_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_prospect_id UUID;
BEGIN
    -- Créer le prospect
    INSERT INTO "Prospect" (
        apporteur_id, 
        company_name, 
        siren, 
        address, 
        website,
        decision_maker_first_name,
        decision_maker_last_name,
        decision_maker_email,
        decision_maker_phone,
        decision_maker_position,
        qualification_score,
        interest_level,
        budget_range,
        timeline,
        preselected_expert_id,
        expert_selection_reason,
        expert_note,
        source,
        notes,
        status
    ) VALUES (
        p_apporteur_id,
        p_prospect_data->>'company_name',
        p_prospect_data->>'siren',
        p_prospect_data->>'address',
        p_prospect_data->>'website',
        p_prospect_data->>'decision_maker_first_name',
        p_prospect_data->>'decision_maker_last_name',
        p_prospect_data->>'decision_maker_email',
        p_prospect_data->>'decision_maker_phone',
        p_prospect_data->>'decision_maker_position',
        COALESCE((p_prospect_data->>'qualification_score')::INTEGER, 8),
        COALESCE(p_prospect_data->>'interest_level', 'high'),
        COALESCE(p_prospect_data->>'budget_range', '10k-50k'),
        COALESCE(p_prospect_data->>'timeline', '1-3months'),
        p_preselected_expert_id,
        p_prospect_data->>'expert_selection_reason',
        p_prospect_data->>'expert_note',
        COALESCE(p_prospect_data->>'source', 'cold_call'),
        p_prospect_data->>'notes',
        'qualified'
    ) RETURNING id INTO v_prospect_id;
    
    -- Si expert présélectionné, notifier
    IF p_preselected_expert_id IS NOT NULL THEN
        INSERT INTO "ExpertNotification" (
            expert_id, 
            prospect_id, 
            apporteur_id,
            notification_type, 
            title, 
            message, 
            priority
        ) VALUES (
            p_preselected_expert_id, 
            v_prospect_id, 
            p_apporteur_id,
            'prospect_preselected',
            'Nouveau prospect présélectionné pour vous',
            'Un apporteur d''affaires vous a présélectionné pour un prospect chaud. Voulez-vous accepter ?',
            'high'
        );
        
        -- Marquer le prospect comme expert assigné
        UPDATE "Prospect" 
        SET status = 'expert_assigned', expert_contacted_at = NOW()
        WHERE id = v_prospect_id;
    END IF;
    
    RETURN v_prospect_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction de conversion prospect → client
CREATE OR REPLACE FUNCTION convert_prospect_to_client(
    p_prospect_id UUID,
    p_apporteur_id UUID
) RETURNS UUID AS $$
DECLARE
    v_client_id UUID;
    v_prospect RECORD;
BEGIN
    -- Récupérer les données du prospect
    SELECT * INTO v_prospect FROM "Prospect" WHERE id = p_prospect_id;
    
    -- Créer le client
    INSERT INTO "Client" (
        name, 
        email, 
        phone, 
        company_name, 
        siren,
        created_at, 
        updated_at
    ) VALUES (
        CONCAT(v_prospect.decision_maker_first_name, ' ', v_prospect.decision_maker_last_name),
        v_prospect.decision_maker_email,
        v_prospect.decision_maker_phone,
        v_prospect.company_name,
        v_prospect.siren,
        NOW(), 
        NOW()
    ) RETURNING id INTO v_client_id;
    
    -- Enregistrer la conversion
    INSERT INTO "ProspectConversion" (prospect_id, client_id)
    VALUES (p_prospect_id, v_client_id);
    
    -- Marquer le prospect comme converti
    UPDATE "Prospect" 
    SET status = 'converted' 
    WHERE id = p_prospect_id;
    
    RETURN v_client_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. TRIGGERS
-- ============================================================================

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur toutes les tables
CREATE TRIGGER update_apporteur_updated_at 
    BEFORE UPDATE ON "ApporteurAffaires" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prospect_updated_at 
    BEFORE UPDATE ON "Prospect" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_updated_at 
    BEFORE UPDATE ON "ProspectMeeting" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. DONNÉES DE TEST (OPTIONNEL)
-- ============================================================================

-- Insérer un apporteur d'affaires de test
INSERT INTO "ApporteurAffaires" (
    auth_id,
    first_name,
    last_name,
    email,
    phone,
    company_name,
    company_type,
    commission_rate,
    status
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- À remplacer par un vrai auth_id
    'Jean',
    'Dupont',
    'jean.dupont@example.com',
    '+33123456789',
    'Dupont Consulting',
    'independant',
    5.00,
    'active'
);

-- ============================================================================
-- SCRIPT TERMINÉ
-- ============================================================================
