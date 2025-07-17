-- Migration pour créer la table ExpertAccessLog (Audit et sécurité)
-- Date: 2025-01-03

-- Création de la table ExpertAccessLog
CREATE TABLE IF NOT EXISTS public.ExpertAccessLog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expert_id UUID REFERENCES public."Expert"(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('profile', 'assignment', 'message', 'campaign', 'payment', 'document')),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    location_data JSONB DEFAULT '{}'::jsonb,
    device_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_expert_access_log_expert_id ON public.ExpertAccessLog(expert_id);
CREATE INDEX IF NOT EXISTS idx_expert_access_log_user_id ON public.ExpertAccessLog(user_id);
CREATE INDEX IF NOT EXISTS idx_expert_access_log_action ON public.ExpertAccessLog(action);
CREATE INDEX IF NOT EXISTS idx_expert_access_log_resource_type ON public.ExpertAccessLog(resource_type);
CREATE INDEX IF NOT EXISTS idx_expert_access_log_created_at ON public.ExpertAccessLog(created_at);
CREATE INDEX IF NOT EXISTS idx_expert_access_log_success ON public.ExpertAccessLog(success);
CREATE INDEX IF NOT EXISTS idx_expert_access_log_risk_level ON public.ExpertAccessLog(risk_level);
CREATE INDEX IF NOT EXISTS idx_expert_access_log_ip_address ON public.ExpertAccessLog(ip_address);
CREATE INDEX IF NOT EXISTS idx_expert_access_log_session_id ON public.ExpertAccessLog(session_id);

-- Politique RLS
ALTER TABLE public.ExpertAccessLog ENABLE ROW LEVEL SECURITY;

-- Experts peuvent voir leurs propres logs
CREATE POLICY "Experts can view their own access logs" ON public.ExpertAccessLog
    FOR SELECT USING (
        expert_id IN (
            SELECT id FROM public."Expert" 
            WHERE auth_id = auth.uid()
        )
    );

-- Admins peuvent voir tous les logs
CREATE POLICY "Admins can view all access logs" ON public.ExpertAccessLog
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public."Admin" 
            WHERE "Admin".email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Système peut insérer des logs
CREATE POLICY "System can insert access logs" ON public.ExpertAccessLog
    FOR INSERT WITH CHECK (true);

-- Fonction pour détecter les activités suspectes
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TRIGGER AS $$
DECLARE
    recent_failures INTEGER;
    recent_actions INTEGER;
BEGIN
    -- Compter les échecs récents pour cet expert
    SELECT COUNT(*) INTO recent_failures
    FROM public.ExpertAccessLog
    WHERE expert_id = NEW.expert_id 
    AND success = false 
    AND created_at > NOW() - INTERVAL '1 hour';
    
    -- Compter les actions récentes pour cet expert
    SELECT COUNT(*) INTO recent_actions
    FROM public.ExpertAccessLog
    WHERE expert_id = NEW.expert_id 
    AND created_at > NOW() - INTERVAL '1 hour';
    
    -- Marquer comme suspect si trop d'échecs ou trop d'actions
    IF recent_failures >= 5 THEN
        NEW.risk_level = 'high';
    ELSIF recent_actions >= 100 THEN
        NEW.risk_level = 'medium';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_detect_suspicious_activity
    BEFORE INSERT ON public.ExpertAccessLog
    FOR EACH ROW
    EXECUTE FUNCTION detect_suspicious_activity();

-- Fonction pour nettoyer les anciens logs
CREATE OR REPLACE FUNCTION cleanup_old_access_logs()
RETURNS void AS $$
BEGIN
    -- Supprimer les logs de plus de 90 jours
    DELETE FROM public.ExpertAccessLog 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Commentaire sur la table
COMMENT ON TABLE public.ExpertAccessLog IS 'Logs d''accès et d''activité des experts pour audit et sécurité'; 