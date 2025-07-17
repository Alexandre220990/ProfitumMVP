-- ===== TABLES POUR WORKFLOW PERSONNALISABLE =====

-- Table des templates de workflow
CREATE TABLE IF NOT EXISTS WorkflowTemplate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    document_category VARCHAR(50) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    estimated_total_duration INTEGER NOT NULL, -- en heures
    sla_hours INTEGER NOT NULL, -- Service Level Agreement
    auto_start BOOLEAN DEFAULT false,
    requires_expert BOOLEAN DEFAULT false,
    requires_signature BOOLEAN DEFAULT false,
    compliance_requirements TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des étapes de workflow
CREATE TABLE IF NOT EXISTS WorkflowStep (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES WorkflowTemplate(id) ON DELETE CASCADE,
    step_type VARCHAR(50) NOT NULL CHECK (step_type IN (
        'upload', 'validation', 'approval', 'signature', 'notification', 'archive', 'share', 'custom'
    )),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL,
    assigned_role VARCHAR(20) NOT NULL CHECK (assigned_role IN ('client', 'expert', 'admin', 'profitum')),
    assigned_to VARCHAR(100), -- ID spécifique ou 'auto'
    required BOOLEAN DEFAULT true,
    estimated_duration INTEGER NOT NULL, -- en heures
    conditions VARCHAR(50)[],
    condition_params JSONB DEFAULT '{}',
    actions VARCHAR(50)[],
    action_params JSONB DEFAULT '{}',
    notifications JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des instances de workflow
CREATE TABLE IF NOT EXISTS WorkflowInstance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES WorkflowTemplate(id),
    document_id UUID NOT NULL REFERENCES DocumentFile(id),
    client_id UUID NOT NULL REFERENCES Client(id),
    expert_id UUID REFERENCES Expert(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    current_step INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    sla_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== TABLES POUR INTÉGRATIONS EXTERNES =====

-- Table des demandes de signature
CREATE TABLE IF NOT EXISTS SignatureRequest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES DocumentFile(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('docusign', 'hellosign', 'adobe_sign', 'sign_now')),
    external_id VARCHAR(100),
    signers JSONB NOT NULL,
    subject VARCHAR(200) NOT NULL,
    message TEXT,
    expires_in_days INTEGER DEFAULT 7,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'signed', 'completed', 'expired', 'cancelled')),
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des demandes de paiement
CREATE TABLE IF NOT EXISTS PaymentRequest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES Invoice(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('stripe', 'paypal', 'adyen', 'square')),
    external_id VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    description TEXT NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    transaction_id VARCHAR(100),
    amount_paid DECIMAL(10,2),
    paid_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des notifications push
CREATE TABLE IF NOT EXISTS PushNotification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('firebase', 'onesignal', 'pushy', 'airship')),
    external_id VARCHAR(100),
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    image_url VARCHAR(500),
    action_url VARCHAR(500),
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('normal', 'high')),
    ttl INTEGER, -- Time to live en secondes
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'opened')),
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== TABLES POUR CONFORMITÉ =====

-- Table des contrôles de conformité
CREATE TABLE IF NOT EXISTS ComplianceControl (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard VARCHAR(20) NOT NULL CHECK (standard IN ('iso_27001', 'soc_2', 'rgpd', 'pci_dss', 'hipaa')),
    control_id VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('compliant', 'non_compliant', 'in_progress', 'not_applicable')),
    implementation_date TIMESTAMP WITH TIME ZONE,
    last_review_date TIMESTAMP WITH TIME ZONE,
    next_review_date TIMESTAMP WITH TIME ZONE NOT NULL,
    responsible_person VARCHAR(100) NOT NULL,
    evidence TEXT[],
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des incidents de sécurité
CREATE TABLE IF NOT EXISTS SecurityIncident (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    incident_type VARCHAR(100) NOT NULL,
    affected_systems TEXT[],
    affected_users INTEGER DEFAULT 0,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    root_cause TEXT,
    remediation_actions TEXT[],
    lessons_learned TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des demandes de personnes concernées (RGPD)
CREATE TABLE IF NOT EXISTS DataSubjectRequest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id VARCHAR(100) NOT NULL,
    request_type VARCHAR(20) NOT NULL CHECK (request_type IN (
        'access', 'rectification', 'erasure', 'portability', 'restriction', 'objection'
    )),
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    response_data JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des logs d'audit
CREATE TABLE IF NOT EXISTS AuditLog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    success BOOLEAN NOT NULL,
    details JSONB DEFAULT '{}',
    compliance_impact VARCHAR(20)[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des rapports de conformité
CREATE TABLE IF NOT EXISTS ComplianceReport (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    standard VARCHAR(20) NOT NULL CHECK (standard IN ('iso_27001', 'soc_2', 'rgpd', 'pci_dss', 'hipaa')),
    report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('assessment', 'audit', 'certification')),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    overall_status VARCHAR(20) NOT NULL CHECK (overall_status IN ('compliant', 'non_compliant', 'in_progress', 'not_applicable')),
    compliance_score INTEGER NOT NULL CHECK (compliance_score BETWEEN 0 AND 100),
    findings JSONB NOT NULL,
    recommendations TEXT[],
    auditor VARCHAR(100),
    audit_date TIMESTAMP WITH TIME ZONE NOT NULL,
    next_audit_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== INDEX POUR PERFORMANCE =====

-- Index pour WorkflowTemplate
CREATE INDEX IF NOT EXISTS idx_workflow_template_category ON WorkflowTemplate(document_category);
CREATE INDEX IF NOT EXISTS idx_workflow_template_active ON WorkflowTemplate(is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_template_type ON WorkflowTemplate(document_type);

-- Index pour WorkflowStep
CREATE INDEX IF NOT EXISTS idx_workflow_step_workflow_id ON WorkflowStep(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_order ON WorkflowStep("order");
CREATE INDEX IF NOT EXISTS idx_workflow_step_assigned_role ON WorkflowStep(assigned_role);

-- Index pour WorkflowInstance
CREATE INDEX IF NOT EXISTS idx_workflow_instance_template_id ON WorkflowInstance(template_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instance_document_id ON WorkflowInstance(document_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instance_client_id ON WorkflowInstance(client_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instance_status ON WorkflowInstance(status);
CREATE INDEX IF NOT EXISTS idx_workflow_instance_sla_deadline ON WorkflowInstance(sla_deadline);

-- Index pour SignatureRequest
CREATE INDEX IF NOT EXISTS idx_signature_request_document_id ON SignatureRequest(document_id);
CREATE INDEX IF NOT EXISTS idx_signature_request_provider ON SignatureRequest(provider);
CREATE INDEX IF NOT EXISTS idx_signature_request_status ON SignatureRequest(status);
CREATE INDEX IF NOT EXISTS idx_signature_request_external_id ON SignatureRequest(external_id);

-- Index pour PaymentRequest
CREATE INDEX IF NOT EXISTS idx_payment_request_invoice_id ON PaymentRequest(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_request_provider ON PaymentRequest(provider);
CREATE INDEX IF NOT EXISTS idx_payment_request_status ON PaymentRequest(status);
CREATE INDEX IF NOT EXISTS idx_payment_request_external_id ON PaymentRequest(external_id);

-- Index pour PushNotification
CREATE INDEX IF NOT EXISTS idx_push_notification_user_id ON PushNotification(user_id);
CREATE INDEX IF NOT EXISTS idx_push_notification_provider ON PushNotification(provider);
CREATE INDEX IF NOT EXISTS idx_push_notification_status ON PushNotification(status);
CREATE INDEX IF NOT EXISTS idx_push_notification_external_id ON PushNotification(external_id);

-- Index pour ComplianceControl
CREATE INDEX IF NOT EXISTS idx_compliance_control_standard ON ComplianceControl(standard);
CREATE INDEX IF NOT EXISTS idx_compliance_control_status ON ComplianceControl(status);
CREATE INDEX IF NOT EXISTS idx_compliance_control_risk_level ON ComplianceControl(risk_level);
CREATE INDEX IF NOT EXISTS idx_compliance_control_next_review ON ComplianceControl(next_review_date);

-- Index pour SecurityIncident
CREATE INDEX IF NOT EXISTS idx_security_incident_severity ON SecurityIncident(severity);
CREATE INDEX IF NOT EXISTS idx_security_incident_status ON SecurityIncident(status);
CREATE INDEX IF NOT EXISTS idx_security_incident_detected_at ON SecurityIncident(detected_at);
CREATE INDEX IF NOT EXISTS idx_security_incident_type ON SecurityIncident(incident_type);

-- Index pour DataSubjectRequest
CREATE INDEX IF NOT EXISTS idx_data_subject_request_subject_id ON DataSubjectRequest(subject_id);
CREATE INDEX IF NOT EXISTS idx_data_subject_request_type ON DataSubjectRequest(request_type);
CREATE INDEX IF NOT EXISTS idx_data_subject_request_status ON DataSubjectRequest(status);
CREATE INDEX IF NOT EXISTS idx_data_subject_request_submitted_at ON DataSubjectRequest(submitted_at);

-- Index pour AuditLog
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON AuditLog(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON AuditLog(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON AuditLog(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON AuditLog(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_success ON AuditLog(success);

-- Index pour ComplianceReport
CREATE INDEX IF NOT EXISTS idx_compliance_report_standard ON ComplianceReport(standard);
CREATE INDEX IF NOT EXISTS idx_compliance_report_type ON ComplianceReport(report_type);
CREATE INDEX IF NOT EXISTS idx_compliance_report_period ON ComplianceReport(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_compliance_report_status ON ComplianceReport(overall_status);

-- ===== POLITIQUES RLS =====

-- Politiques pour WorkflowTemplate
ALTER TABLE WorkflowTemplate ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage workflow templates" ON WorkflowTemplate
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view active workflow templates" ON WorkflowTemplate
    FOR SELECT USING (is_active = true);

-- Politiques pour WorkflowStep
ALTER TABLE WorkflowStep ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage workflow steps" ON WorkflowStep
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view workflow steps" ON WorkflowStep
    FOR SELECT USING (true);

-- Politiques pour WorkflowInstance
ALTER TABLE WorkflowInstance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workflow instances" ON WorkflowInstance
    FOR SELECT USING (
        auth.uid()::text = client_id::text OR
        auth.uid()::text = expert_id::text OR
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Admins can manage workflow instances" ON WorkflowInstance
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour SignatureRequest
ALTER TABLE SignatureRequest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their signature requests" ON SignatureRequest
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM DocumentFile df 
            WHERE df.id = SignatureRequest.document_id 
            AND df.client_id::text = auth.uid()::text
        ) OR
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Admins can manage signature requests" ON SignatureRequest
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour PaymentRequest
ALTER TABLE PaymentRequest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their payment requests" ON PaymentRequest
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM Invoice i 
            WHERE i.id = PaymentRequest.invoice_id 
            AND (i.client_id::text = auth.uid()::text OR i.expert_id::text = auth.uid()::text)
        ) OR
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Admins can manage payment requests" ON PaymentRequest
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour PushNotification
ALTER TABLE PushNotification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their push notifications" ON PushNotification
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can manage push notifications" ON PushNotification
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour ComplianceControl
ALTER TABLE ComplianceControl ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage compliance controls" ON ComplianceControl
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view compliance controls" ON ComplianceControl
    FOR SELECT USING (true);

-- Politiques pour SecurityIncident
ALTER TABLE SecurityIncident ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage security incidents" ON SecurityIncident
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view security incidents" ON SecurityIncident
    FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'ciso'));

-- Politiques pour DataSubjectRequest
ALTER TABLE DataSubjectRequest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their data subject requests" ON DataSubjectRequest
    FOR SELECT USING (auth.uid()::text = subject_id::text);

CREATE POLICY "Admins can manage data subject requests" ON DataSubjectRequest
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour AuditLog
ALTER TABLE AuditLog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs" ON AuditLog
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all audit logs" ON AuditLog
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour ComplianceReport
ALTER TABLE ComplianceReport ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage compliance reports" ON ComplianceReport
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view compliance reports" ON ComplianceReport
    FOR SELECT USING (true);

-- ===== TRIGGERS =====

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger aux tables appropriées
CREATE TRIGGER update_workflow_template_updated_at 
    BEFORE UPDATE ON WorkflowTemplate 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_instance_updated_at 
    BEFORE UPDATE ON WorkflowInstance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_incident_updated_at 
    BEFORE UPDATE ON SecurityIncident 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== FONCTIONS UTILITAIRES =====

-- Fonction pour calculer le score de conformité
CREATE OR REPLACE FUNCTION calculate_compliance_score(standard_name VARCHAR(20))
RETURNS INTEGER AS $$
DECLARE
    total_controls INTEGER;
    compliant_controls INTEGER;
BEGIN
    SELECT 
        COUNT(*) INTO total_controls,
        COUNT(*) FILTER (WHERE status = 'compliant') INTO compliant_controls
    FROM ComplianceControl
    WHERE standard = standard_name;
    
    IF total_controls = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN ROUND((compliant_controls::DECIMAL / total_controls) * 100);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les contrôles en retard
CREATE OR REPLACE FUNCTION get_overdue_controls()
RETURNS TABLE (
    control_id VARCHAR(50),
    title VARCHAR(200),
    standard VARCHAR(20),
    next_review_date TIMESTAMP WITH TIME ZONE,
    days_overdue INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.control_id,
        cc.title,
        cc.standard,
        cc.next_review_date,
        EXTRACT(DAYS FROM (NOW() - cc.next_review_date))::INTEGER as days_overdue
    FROM ComplianceControl cc
    WHERE cc.next_review_date < NOW()
    ORDER BY cc.next_review_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les incidents de sécurité récents
CREATE OR REPLACE FUNCTION get_recent_security_incidents(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    incident_id UUID,
    title VARCHAR(200),
    severity VARCHAR(20),
    status VARCHAR(20),
    detected_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        si.id,
        si.title,
        si.severity,
        si.status,
        si.detected_at
    FROM SecurityIncident si
    WHERE si.detected_at >= NOW() - INTERVAL '1 day' * days_back
    ORDER BY si.detected_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ===== COMMENTAIRES =====

COMMENT ON TABLE WorkflowTemplate IS 'Templates de workflow personnalisables par type de document';
COMMENT ON TABLE WorkflowStep IS 'Étapes configurables des workflows';
COMMENT ON TABLE WorkflowInstance IS 'Instances de workflow en cours d''exécution';
COMMENT ON TABLE SignatureRequest IS 'Demandes de signature électronique via services externes';
COMMENT ON TABLE PaymentRequest IS 'Demandes de paiement via services externes';
COMMENT ON TABLE PushNotification IS 'Notifications push via services externes';
COMMENT ON TABLE ComplianceControl IS 'Contrôles de conformité ISO 27001, SOC 2, RGPD';
COMMENT ON TABLE SecurityIncident IS 'Incidents de sécurité pour audit et conformité';
COMMENT ON TABLE DataSubjectRequest IS 'Demandes RGPD des personnes concernées';
COMMENT ON TABLE AuditLog IS 'Journal d''audit complet pour conformité';
COMMENT ON TABLE ComplianceReport IS 'Rapports de conformité et certifications';

COMMENT ON COLUMN WorkflowTemplate.sla_hours IS 'Service Level Agreement en heures';
COMMENT ON COLUMN WorkflowStep."order" IS 'Ordre d''exécution des étapes';
COMMENT ON COLUMN WorkflowInstance.sla_deadline IS 'Date limite SLA pour l''instance';
COMMENT ON COLUMN ComplianceControl.risk_level IS 'Niveau de risque du contrôle';
COMMENT ON COLUMN SecurityIncident.severity IS 'Sévérité de l''incident de sécurité';
COMMENT ON COLUMN DataSubjectRequest.request_type IS 'Type de demande RGPD';
COMMENT ON COLUMN AuditLog.compliance_impact IS 'Impact sur les standards de conformité'; 