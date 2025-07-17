-- =====================================================
-- MIGRATION : Création des tables Marketplace Experts (CORRIGÉE)
-- Date : 2025-01-03
-- Description : Tables pour la marketplace d'experts conforme ISO
-- =====================================================

-- 1. Table ExpertAssignment (Workflow d'assignation)
CREATE TABLE IF NOT EXISTS "ExpertAssignment" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_produit_eligible_id UUID NOT NULL REFERENCES "ClientProduitEligible"(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES "Expert"(id) ON DELETE CASCADE,
    statut TEXT NOT NULL DEFAULT 'pending' CHECK (statut IN ('pending', 'accepted', 'rejected', 'expired')),
    demande_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reponse_date TIMESTAMP WITH TIME ZONE,
    raison_refus TEXT,
    compensation_finale DOUBLE PRECISION,
    montant_estime DOUBLE PRECISION,
    gain_estime_expert DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT expert_assignment_unique UNIQUE (client_produit_eligible_id, expert_id)
);

-- 2. Table ExpertAssignmentAudit (Audit trail complet)
CREATE TABLE IF NOT EXISTS "ExpertAssignmentAudit" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expert_assignment_id UUID NOT NULL REFERENCES "ExpertAssignment"(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    auth_user_id UUID, -- Utilisateur authentifié via auth.uid()
    user_type TEXT NOT NULL CHECK (user_type IN ('client', 'expert', 'admin', 'system')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT
);

-- 3. Table Message (Messagerie chiffrée)
CREATE TABLE IF NOT EXISTS "Message" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES "Client"(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES "Expert"(id) ON DELETE CASCADE,
    client_produit_eligible_id UUID REFERENCES "ClientProduitEligible"(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    content_encrypted BYTEA, -- Pour messages chiffrés
    type TEXT NOT NULL DEFAULT 'message_general' CHECK (type IN ('demande_assignation', 'message_general', 'notification')),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table ExpertCampaign (Campagnes marketing)
CREATE TABLE IF NOT EXISTS "ExpertCampaign" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expert_id UUID NOT NULL REFERENCES "Expert"(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('highlight', 'banner', 'popup', 'promotion')),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    budget DOUBLE PRECISION DEFAULT 0,
    target_audience JSONB DEFAULT '{}', -- {specialization: [], location: [], etc.}
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended', 'draft')),
    metrics JSONB DEFAULT '{"views": 0, "clicks": 0, "conversions": 0}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT expert_campaign_date_check CHECK (end_date > start_date)
);

-- 5. Table ExpertCriteria (Critères de matching)
CREATE TABLE IF NOT EXISTS "ExpertCriteria" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expert_id UUID NOT NULL REFERENCES "Expert"(id) ON DELETE CASCADE,
    localisation TEXT[],
    taille_entreprise_min INTEGER,
    taille_entreprise_max INTEGER,
    nb_employes_min INTEGER,
    nb_employes_max INTEGER,
    secteurs_activite TEXT[],
    chiffre_affaires_min NUMERIC(15,2),
    chiffre_affaires_max NUMERIC(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT expert_criteria_unique UNIQUE (expert_id)
);

-- 6. Table Notification (Centre de notifications)
CREATE TABLE IF NOT EXISTS "Notification" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID NOT NULL, -- Utilisateur authentifié via auth.uid()
    user_type TEXT NOT NULL CHECK (user_type IN ('client', 'expert', 'admin')),
    type TEXT NOT NULL CHECK (type IN ('message', 'assignment', 'reminder', 'campaign', 'system')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT, -- URL pour redirection
    priority INTEGER DEFAULT 1 CHECK (priority IN (1, 2, 3)), -- 1=normal, 2=important, 3=urgent
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Table ExpertAccessLog (Audit des accès aux dossiers)
CREATE TABLE IF NOT EXISTS "ExpertAccessLog" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expert_id UUID NOT NULL REFERENCES "Expert"(id) ON DELETE CASCADE,
    client_produit_eligible_id UUID NOT NULL REFERENCES "ClientProduitEligible"(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('view_profile', 'view_documents', 'view_chatbot', 'download_file')),
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Table PromotionBanner (Bandeau promotionnel)
CREATE TABLE IF NOT EXISTS "PromotionBanner" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    action_url TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended')),
    priority INTEGER DEFAULT 1,
    target_audience JSONB DEFAULT '{}',
    metrics JSONB DEFAULT '{"views": 0, "clicks": 0}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT promotion_banner_date_check CHECK (end_date > start_date)
);

-- =====================================================
-- INDEXES POUR PERFORMANCE
-- =====================================================

-- ExpertAssignment
CREATE INDEX IF NOT EXISTS idx_expert_assignment_status ON "ExpertAssignment"(statut);
CREATE INDEX IF NOT EXISTS idx_expert_assignment_expert ON "ExpertAssignment"(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_assignment_client_produit ON "ExpertAssignment"(client_produit_eligible_id);
CREATE INDEX IF NOT EXISTS idx_expert_assignment_date ON "ExpertAssignment"(demande_date);

-- ExpertAssignmentAudit
CREATE INDEX IF NOT EXISTS idx_expert_assignment_audit_assignment ON "ExpertAssignmentAudit"(expert_assignment_id);
CREATE INDEX IF NOT EXISTS idx_expert_assignment_audit_user ON "ExpertAssignmentAudit"(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_expert_assignment_audit_timestamp ON "ExpertAssignmentAudit"(timestamp);

-- Message
CREATE INDEX IF NOT EXISTS idx_message_client ON "Message"(client_id);
CREATE INDEX IF NOT EXISTS idx_message_expert ON "Message"(expert_id);
CREATE INDEX IF NOT EXISTS idx_message_unread ON "Message"(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_message_date ON "Message"(created_at);

-- ExpertCampaign
CREATE INDEX IF NOT EXISTS idx_expert_campaign_expert ON "ExpertCampaign"(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_campaign_status ON "ExpertCampaign"(status);
CREATE INDEX IF NOT EXISTS idx_expert_campaign_date ON "ExpertCampaign"(start_date, end_date);

-- Notification
CREATE INDEX IF NOT EXISTS idx_notification_user ON "Notification"(auth_user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_notification_unread ON "Notification"(read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notification_priority ON "Notification"(priority);

-- ExpertAccessLog
CREATE INDEX IF NOT EXISTS idx_expert_access_log_expert ON "ExpertAccessLog"(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_access_log_date ON "ExpertAccessLog"(created_at);

-- PromotionBanner
CREATE INDEX IF NOT EXISTS idx_promotion_banner_status ON "PromotionBanner"(status);
CREATE INDEX IF NOT EXISTS idx_promotion_banner_date ON "PromotionBanner"(start_date, end_date);

-- =====================================================
-- TRIGGERS POUR AUDIT AUTOMATIQUE
-- =====================================================

-- Trigger pour ExpertAssignment
CREATE OR REPLACE FUNCTION log_expert_assignment_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO "ExpertAssignmentAudit" (
            expert_assignment_id, action, auth_user_id, user_type, details
        ) VALUES (
            NEW.id, 'created', auth.uid(), 'expert', 
            jsonb_build_object('statut', NEW.statut, 'compensation', NEW.compensation_finale)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO "ExpertAssignmentAudit" (
            expert_assignment_id, action, auth_user_id, user_type, details
        ) VALUES (
            NEW.id, 'updated', auth.uid(), 'expert',
            jsonb_build_object(
                'old_statut', OLD.statut, 'new_statut', NEW.statut,
                'old_compensation', OLD.compensation_finale, 'new_compensation', NEW.compensation_finale
            )
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expert_assignment_audit
    AFTER INSERT OR UPDATE ON "ExpertAssignment"
    FOR EACH ROW EXECUTE FUNCTION log_expert_assignment_changes();

-- Trigger pour mise à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expert_assignment_updated_at
    BEFORE UPDATE ON "ExpertAssignment"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_expert_campaign_updated_at
    BEFORE UPDATE ON "ExpertCampaign"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_expert_criteria_updated_at
    BEFORE UPDATE ON "ExpertCriteria"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_promotion_banner_updated_at
    BEFORE UPDATE ON "PromotionBanner"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- POLITIQUES RLS (Row Level Security) - CORRIGÉES
-- =====================================================

-- ExpertAssignment
ALTER TABLE "ExpertAssignment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ExpertAssignment: Clients can view own assignments" ON "ExpertAssignment"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "ClientProduitEligible" cpe 
            WHERE cpe.id = "ExpertAssignment".client_produit_eligible_id 
            AND cpe."clientId"::text = auth.uid()::text
        )
    );

CREATE POLICY "ExpertAssignment: Experts can view own assignments" ON "ExpertAssignment"
    FOR SELECT USING (
        "ExpertAssignment".expert_id::text = auth.uid()::text
    );

CREATE POLICY "ExpertAssignment: Clients can create assignments" ON "ExpertAssignment"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "ClientProduitEligible" cpe 
            WHERE cpe.id = "ExpertAssignment".client_produit_eligible_id 
            AND cpe."clientId"::text = auth.uid()::text
        )
    );

CREATE POLICY "ExpertAssignment: Experts can update own assignments" ON "ExpertAssignment"
    FOR UPDATE USING (
        "ExpertAssignment".expert_id::text = auth.uid()::text
    );

-- Message
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Message: Users can view own messages" ON "Message"
    FOR SELECT USING (
        client_id::text = auth.uid()::text OR expert_id::text = auth.uid()::text
    );

CREATE POLICY "Message: Users can create messages" ON "Message"
    FOR INSERT WITH CHECK (
        client_id::text = auth.uid()::text OR expert_id::text = auth.uid()::text
    );

-- Notification
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notification: Users can view own notifications" ON "Notification"
    FOR SELECT USING (
        auth_user_id::text = auth.uid()::text
    );

CREATE POLICY "Notification: Users can update own notifications" ON "Notification"
    FOR UPDATE USING (
        auth_user_id::text = auth.uid()::text
    );

-- ExpertCampaign
ALTER TABLE "ExpertCampaign" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ExpertCampaign: Experts can manage own campaigns" ON "ExpertCampaign"
    FOR ALL USING (
        expert_id::text = auth.uid()::text
    );

CREATE POLICY "ExpertCampaign: Public can view active campaigns" ON "ExpertCampaign"
    FOR SELECT USING (
        status = 'active' AND start_date <= NOW() AND end_date >= NOW()
    );

-- ExpertCriteria
ALTER TABLE "ExpertCriteria" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ExpertCriteria: Experts can manage own criteria" ON "ExpertCriteria"
    FOR ALL USING (
        expert_id::text = auth.uid()::text
    );

-- PromotionBanner
ALTER TABLE "PromotionBanner" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PromotionBanner: Public can view active banners" ON "PromotionBanner"
    FOR SELECT USING (
        status = 'active' AND start_date <= NOW() AND end_date >= NOW()
    );

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour calculer le gain estimé expert
CREATE OR REPLACE FUNCTION calculate_expert_gain(
    p_montant_estime DOUBLE PRECISION,
    p_compensation DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
BEGIN
    RETURN p_montant_estime * (p_compensation / 100.0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour vérifier si un expert peut être assigné
CREATE OR REPLACE FUNCTION can_expert_be_assigned(
    p_expert_id UUID,
    p_client_produit_eligible_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    existing_assignment_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO existing_assignment_count
    FROM "ExpertAssignment"
    WHERE expert_id = p_expert_id 
    AND client_produit_eligible_id = p_client_produit_eligible_id
    AND statut IN ('pending', 'accepted');
    
    RETURN existing_assignment_count = 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- COMMENTAIRES POUR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE "ExpertAssignment" IS 'Gestion du workflow d''assignation client-expert avec audit trail complet';
COMMENT ON TABLE "ExpertAssignmentAudit" IS 'Audit trail de toutes les actions sur les assignations d''experts';
COMMENT ON TABLE "Message" IS 'Système de messagerie chiffrée entre clients et experts';
COMMENT ON TABLE "ExpertCampaign" IS 'Campagnes marketing des experts pour se démarquer';
COMMENT ON TABLE "ExpertCriteria" IS 'Critères de matching pour l''algorithme de recommandation';
COMMENT ON TABLE "Notification" IS 'Centre de notifications centralisé pour tous les utilisateurs';
COMMENT ON TABLE "ExpertAccessLog" IS 'Audit des accès des experts aux dossiers clients';
COMMENT ON TABLE "PromotionBanner" IS 'Bandeau promotionnel affiché sous le header client';

-- =====================================================
-- FIN DE LA MIGRATION
-- ===================================================== 