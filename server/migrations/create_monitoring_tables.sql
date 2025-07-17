-- Tables pour le système de monitoring et d'observabilité
-- Conformité ISO 27001 - Monitoring et surveillance

-- Table des métriques système
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metric_type VARCHAR(50) NOT NULL, -- 'cpu', 'memory', 'disk', 'network', 'response_time'
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    metric_unit VARCHAR(20), -- 'percent', 'bytes', 'ms', 'requests'
    service_name VARCHAR(100), -- 'api', 'database', 'frontend'
    environment VARCHAR(20) DEFAULT 'production', -- 'development', 'staging', 'production'
    severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des tests de santé
CREATE TABLE IF NOT EXISTS health_checks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    check_name VARCHAR(100) NOT NULL,
    check_type VARCHAR(50) NOT NULL, -- 'connectivity', 'database', 'api', 'security', 'performance'
    status VARCHAR(20) NOT NULL, -- 'pass', 'fail', 'warning'
    response_time_ms INTEGER,
    error_message TEXT,
    details JSONB DEFAULT '{}',
    environment VARCHAR(20) DEFAULT 'production',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des incidents de sécurité
CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    incident_type VARCHAR(50) NOT NULL, -- 'security_breach', 'data_leak', 'unauthorized_access', 'system_failure'
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'investigating', 'contained', 'resolved', 'closed'
    title VARCHAR(200) NOT NULL,
    description TEXT,
    affected_service VARCHAR(100),
    impact_assessment TEXT,
    mitigation_steps TEXT,
    assigned_to VARCHAR(100),
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des vulnérabilités détectées
CREATE TABLE IF NOT EXISTS security_vulnerabilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    vulnerability_type VARCHAR(50) NOT NULL, -- 'sql_injection', 'xss', 'csrf', 'authentication', 'authorization'
    severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'investigating', 'mitigated', 'resolved'
    title VARCHAR(200) NOT NULL,
    description TEXT,
    affected_component VARCHAR(100),
    cve_id VARCHAR(20),
    cvss_score DECIMAL(3,1),
    remediation_steps TEXT,
    assigned_to VARCHAR(100),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des logs d'audit
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50), -- 'user', 'audit', 'document', 'system'
    resource_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des rapports de conformité
CREATE TABLE IF NOT EXISTS compliance_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    report_type VARCHAR(50) NOT NULL, -- 'iso27001', 'gdpr', 'security_audit', 'performance'
    report_name VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'generated', -- 'generated', 'reviewed', 'approved'
    score_percentage INTEGER,
    total_checks INTEGER,
    passed_checks INTEGER,
    failed_checks INTEGER,
    warnings INTEGER,
    report_data JSONB DEFAULT '{}',
    generated_by VARCHAR(100),
    reviewed_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des alertes système
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    alert_type VARCHAR(50) NOT NULL, -- 'performance', 'security', 'availability', 'error_rate'
    severity VARCHAR(20) NOT NULL, -- 'info', 'warning', 'error', 'critical'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
    title VARCHAR(200) NOT NULL,
    message TEXT,
    affected_service VARCHAR(100),
    threshold_value DECIMAL(10,4),
    current_value DECIMAL(10,4),
    acknowledged_by VARCHAR(100),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des tests de performance
CREATE TABLE IF NOT EXISTS performance_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    test_name VARCHAR(100) NOT NULL,
    test_type VARCHAR(50) NOT NULL, -- 'load', 'stress', 'endurance', 'spike'
    endpoint VARCHAR(200),
    method VARCHAR(10),
    status VARCHAR(20) NOT NULL, -- 'pass', 'fail', 'warning'
    response_time_avg DECIMAL(10,2),
    response_time_p95 DECIMAL(10,2),
    response_time_p99 DECIMAL(10,2),
    requests_per_second DECIMAL(10,2),
    error_rate DECIMAL(5,2),
    total_requests INTEGER,
    failed_requests INTEGER,
    test_duration_seconds INTEGER,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des métriques de disponibilité
CREATE TABLE IF NOT EXISTS availability_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    service_name VARCHAR(100) NOT NULL,
    endpoint VARCHAR(200),
    status_code INTEGER,
    response_time_ms INTEGER,
    is_available BOOLEAN DEFAULT true,
    error_message TEXT,
    uptime_percentage DECIMAL(5,2),
    downtime_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_metrics_type ON system_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_health_checks_timestamp ON health_checks(timestamp);
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON health_checks(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON system_alerts(status);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);

-- RLS (Row Level Security) - Seuls les admins peuvent accéder
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_metrics ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les admins
CREATE POLICY "Admins can view all monitoring data" ON system_metrics
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all monitoring data" ON health_checks
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all monitoring data" ON security_incidents
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all monitoring data" ON security_vulnerabilities
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all monitoring data" ON audit_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all monitoring data" ON compliance_reports
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all monitoring data" ON system_alerts
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all monitoring data" ON performance_tests
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all monitoring data" ON availability_metrics
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
