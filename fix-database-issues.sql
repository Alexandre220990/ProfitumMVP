-- ============================================================================
-- SCRIPT DE CORRECTION DES PROBLÈMES DE BASE DE DONNÉES
-- ============================================================================
-- À copier-coller dans Supabase SQL Editor
-- Date : 1er octobre 2025
-- Objectif : Créer les tables manquantes et corriger les incohérences
-- ============================================================================

-- ============================================================================
-- 1. CRÉER LA TABLE ApporteurAffaires SI ELLE N'EXISTE PAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ApporteurAffaires" (
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
-- 2. CRÉER LA TABLE Prospect SI ELLE N'EXISTE PAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Prospect" (
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
    expert_note TEXT,
    expert_contacted_at TIMESTAMPTZ,
    expert_response_at TIMESTAMPTZ,
    expert_response VARCHAR(20) CHECK (expert_response IN ('accepted', 'declined', 'pending')) DEFAULT 'pending',
    
    -- Statut du prospect
    status VARCHAR(20) CHECK (status IN (
        'qualified',
        'expert_assigned',
        'meeting_scheduled',
        'meeting_completed',
        'converted',
        'lost',
        'expert_declined'
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
-- 3. CRÉER LA TABLE ExpertNotification SI ELLE N'EXISTE PAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ExpertNotification" (
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
-- 4. CRÉER LA TABLE ProspectMeeting SI ELLE N'EXISTE PAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ProspectMeeting" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID REFERENCES "Prospect"(id) ON DELETE CASCADE,
    expert_id UUID REFERENCES "Expert"(id),
    apporteur_id UUID REFERENCES "ApporteurAffaires"(id),
    
    -- Détails du RDV
    meeting_type VARCHAR(20) CHECK (meeting_type IN ('phone', 'video', 'in_person')) DEFAULT 'video',
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60 CHECK (duration_minutes > 0),
    location TEXT,
    
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
-- 5. CRÉER LA TABLE ApporteurCommission SI ELLE N'EXISTE PAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ApporteurCommission" (
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
-- 6. CRÉER LA TABLE ProspectConversion SI ELLE N'EXISTE PAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ProspectConversion" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID REFERENCES "Prospect"(id),
    client_id UUID REFERENCES "Client"(id),
    converted_at TIMESTAMPTZ DEFAULT NOW(),
    conversion_notes TEXT,
    conversion_data JSONB
);

-- ============================================================================
-- 7. CRÉER LES INDEX DE PERFORMANCE
-- ============================================================================

-- Index ApporteurAffaires
CREATE INDEX IF NOT EXISTS idx_apporteur_auth_id ON "ApporteurAffaires"(auth_id);
CREATE INDEX IF NOT EXISTS idx_apporteur_status ON "ApporteurAffaires"(status);
CREATE INDEX IF NOT EXISTS idx_apporteur_company_type ON "ApporteurAffaires"(company_type);
CREATE INDEX IF NOT EXISTS idx_apporteur_created_at ON "ApporteurAffaires"(created_at);

-- Index Prospect
CREATE INDEX IF NOT EXISTS idx_prospect_apporteur_status ON "Prospect"(apporteur_id, status);
CREATE INDEX IF NOT EXISTS idx_prospect_expert ON "Prospect"(preselected_expert_id, expert_response);
CREATE INDEX IF NOT EXISTS idx_prospect_created_at ON "Prospect"(created_at);
CREATE INDEX IF NOT EXISTS idx_prospect_qualification ON "Prospect"(qualification_score, interest_level);
CREATE INDEX IF NOT EXISTS idx_prospect_decision_maker_email ON "Prospect"(decision_maker_email);

-- Index ExpertNotification
CREATE INDEX IF NOT EXISTS idx_expert_notification_expert_status ON "ExpertNotification"(expert_id, status);
CREATE INDEX IF NOT EXISTS idx_expert_notification_created_at ON "ExpertNotification"(created_at);
CREATE INDEX IF NOT EXISTS idx_expert_notification_type ON "ExpertNotification"(notification_type);

-- Index ProspectMeeting
CREATE INDEX IF NOT EXISTS idx_prospect_meeting_prospect ON "ProspectMeeting"(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_meeting_expert ON "ProspectMeeting"(expert_id);
CREATE INDEX IF NOT EXISTS idx_prospect_meeting_scheduled ON "ProspectMeeting"(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_prospect_meeting_status ON "ProspectMeeting"(status);

-- Index ApporteurCommission
CREATE INDEX IF NOT EXISTS idx_commission_apporteur_status ON "ApporteurCommission"(apporteur_id, status);
CREATE INDEX IF NOT EXISTS idx_commission_payment_date ON "ApporteurCommission"(payment_date);
CREATE INDEX IF NOT EXISTS idx_commission_calculation_date ON "ApporteurCommission"(calculation_date);

-- ============================================================================
-- 8. ACTIVER RLS (ROW LEVEL SECURITY)
-- ============================================================================

ALTER TABLE "ApporteurAffaires" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Prospect" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExpertNotification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProspectMeeting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApporteurCommission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProspectConversion" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. CRÉER LES POLITIQUES RLS
-- ============================================================================

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "apporteur_own_data" ON "ApporteurAffaires";
DROP POLICY IF EXISTS "apporteur_own_prospects" ON "Prospect";
DROP POLICY IF EXISTS "expert_own_notifications" ON "ExpertNotification";
DROP POLICY IF EXISTS "meeting_participants" ON "ProspectMeeting";
DROP POLICY IF EXISTS "apporteur_own_commissions" ON "ApporteurCommission";
DROP POLICY IF EXISTS "admin_full_access_apporteur" ON "ApporteurAffaires";
DROP POLICY IF EXISTS "admin_full_access_prospect" ON "Prospect";
DROP POLICY IF EXISTS "admin_full_access_expert_notification" ON "ExpertNotification";
DROP POLICY IF EXISTS "admin_full_access_prospect_meeting" ON "ProspectMeeting";
DROP POLICY IF EXISTS "admin_full_access_commission" ON "ApporteurCommission";

-- Politiques pour ApporteurAffaires
CREATE POLICY "apporteur_own_data" ON "ApporteurAffaires"
    FOR ALL USING (auth.uid() = auth_id);

CREATE POLICY "admin_full_access_apporteur" ON "ApporteurAffaires"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE auth_id = auth.uid()
        )
    );

-- Politiques pour Prospect
CREATE POLICY "apporteur_own_prospects" ON "Prospect"
    FOR ALL USING (
        apporteur_id IN (
            SELECT id FROM "ApporteurAffaires" 
            WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "admin_full_access_prospect" ON "Prospect"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE auth_id = auth.uid()
        )
    );

-- Politiques pour ExpertNotification
CREATE POLICY "expert_own_notifications" ON "ExpertNotification"
    FOR ALL USING (
        expert_id IN (
            SELECT id FROM "Expert" 
            WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "admin_full_access_expert_notification" ON "ExpertNotification"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE auth_id = auth.uid()
        )
    );

-- Politiques pour ProspectMeeting
CREATE POLICY "meeting_participants" ON "ProspectMeeting"
    FOR ALL USING (
        expert_id IN (SELECT id FROM "Expert" WHERE auth_id = auth.uid()) OR
        apporteur_id IN (SELECT id FROM "ApporteurAffaires" WHERE auth_id = auth.uid())
    );

CREATE POLICY "admin_full_access_prospect_meeting" ON "ProspectMeeting"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE auth_id = auth.uid()
        )
    );

-- Politiques pour ApporteurCommission
CREATE POLICY "apporteur_own_commissions" ON "ApporteurCommission"
    FOR ALL USING (
        apporteur_id IN (
            SELECT id FROM "ApporteurAffaires" 
            WHERE auth_id = auth.uid()
        )
    );

CREATE POLICY "admin_full_access_commission" ON "ApporteurCommission"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE auth_id = auth.uid()
        )
    );

-- ============================================================================
-- 10. CRÉER LES TRIGGERS DE MISE À JOUR
-- ============================================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer les triggers existants si ils existent
DROP TRIGGER IF EXISTS update_apporteur_updated_at ON "ApporteurAffaires";
DROP TRIGGER IF EXISTS update_prospect_updated_at ON "Prospect";
DROP TRIGGER IF EXISTS update_meeting_updated_at ON "ProspectMeeting";

-- Créer les triggers
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
-- 11. VÉRIFICATION FINALE
-- ============================================================================

-- Afficher les tables créées
SELECT 
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_name = t.table_name) as column_count
FROM 
    information_schema.tables t
WHERE 
    table_schema = 'public'
    AND table_name IN (
        'ApporteurAffaires',
        'Prospect',
        'ExpertNotification',
        'ProspectMeeting',
        'ApporteurCommission',
        'ProspectConversion'
    )
ORDER BY 
    table_name;

-- ============================================================================
-- SCRIPT TERMINÉ AVEC SUCCÈS
-- ============================================================================

