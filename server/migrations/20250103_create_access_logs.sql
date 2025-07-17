-- Migration pour créer la table access_logs
-- Date: 2025-01-03

-- Création de la table access_logs
CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON public.access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON public.access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_action ON public.access_logs(action);

-- Politique RLS pour les admins
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all access logs" ON public.access_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin 
            WHERE admin.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert access logs" ON public.access_logs
    FOR INSERT WITH CHECK (true);

-- Commentaire sur la table
COMMENT ON TABLE public.access_logs IS 'Logs d''accès et d''actions des utilisateurs pour audit et sécurité'; 