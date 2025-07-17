-- Table pour les logs d'audit système
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'critical')),
    category TEXT NOT NULL CHECK (category IN ('security', 'performance', 'database', 'api', 'user_action', 'system')),
    message TEXT NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    ip_address INET,
    resource_type TEXT,
    resource_id TEXT,
    success BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les rapports ISO
CREATE TABLE IF NOT EXISTS iso_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    script_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'warning', 'error', 'running')),
    duration_ms INTEGER NOT NULL,
    output TEXT,
    error_output TEXT,
    exit_code INTEGER,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les logs terminal
CREATE TABLE IF NOT EXISTS terminal_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    command TEXT NOT NULL,
    output TEXT,
    error_output TEXT,
    exit_code INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL,
    username TEXT NOT NULL,
    working_directory TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_level ON audit_logs(level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_iso_reports_timestamp ON iso_reports(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_iso_reports_status ON iso_reports(status);
CREATE INDEX IF NOT EXISTS idx_iso_reports_script_name ON iso_reports(script_name);

CREATE INDEX IF NOT EXISTS idx_terminal_logs_timestamp ON terminal_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_terminal_logs_exit_code ON terminal_logs(exit_code);
CREATE INDEX IF NOT EXISTS idx_terminal_logs_username ON terminal_logs(username);

-- RLS (Row Level Security) pour les logs d'audit
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE iso_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminal_logs ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les admins
CREATE POLICY "Admins can view all audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'type' = 'admin'
        )
    );

CREATE POLICY "Admins can view all ISO reports" ON iso_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'type' = 'admin'
        )
    );

CREATE POLICY "Admins can view all terminal logs" ON terminal_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'type' = 'admin'
        )
    );

-- Politiques pour l'insertion (système)
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert ISO reports" ON iso_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert terminal logs" ON terminal_logs
    FOR INSERT WITH CHECK (true); 