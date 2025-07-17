-- ===== TABLES POUR SERVICES AVANCÉS =====

-- ===== CHIFFREMENT ET SÉCURITÉ =====

-- Table des clés de chiffrement
CREATE TABLE IF NOT EXISTS EncryptionKeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encrypted_key TEXT NOT NULL,
    iv TEXT NOT NULL,
    encryption_level VARCHAR(20) NOT NULL CHECK (encryption_level IN ('standard', 'high', 'maximum')),
    user_id UUID NOT NULL,
    document_id UUID NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des accès sécurisés
CREATE TABLE IF NOT EXISTS SecureAccessLog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    document_id UUID NOT NULL,
    access_type VARCHAR(50) NOT NULL CHECK (access_type IN ('view', 'download', 'decrypt', 'share')),
    ip_address INET NOT NULL,
    user_agent TEXT,
    location_data JSONB,
    risk_score INTEGER DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
    flagged BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== RÉTENTION LÉGALE =====

-- Table des règles de rétention
CREATE TABLE IF NOT EXISTS RetentionRules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type VARCHAR(50) NOT NULL,
    sensitive_type VARCHAR(50) NOT NULL CHECK (sensitive_type IN (
        'fiscal', 'comptable', 'juridique', 'rh', 'bancaire', 'assurance', 'autre_sensible'
    )),
    retention_period INTEGER NOT NULL, -- en années
    retention_policy VARCHAR(20) NOT NULL CHECK (retention_policy IN (
        'immediate', '1_year', '5_years', '10_years', '30_years', 'permanent'
    )),
    retention_reason VARCHAR(50) NOT NULL CHECK (retention_reason IN (
        'legal_requirement', 'business_need', 'consent', 'contract', 'vital_interest', 'public_interest'
    )),
    legal_basis TEXT[] NOT NULL,
    auto_archive BOOLEAN DEFAULT true,
    auto_delete BOOLEAN DEFAULT false,
    archive_after INTEGER DEFAULT 12, -- en mois
    delete_after INTEGER NOT NULL, -- en années
    exceptions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table d'audit de rétention
CREATE TABLE IF NOT EXISTS RetentionAudit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('apply', 'archive', 'delete', 'extend', 'exempt')),
    reason TEXT NOT NULL,
    performed_by VARCHAR(50) NOT NULL,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- ===== NOTIFICATIONS AVANCÉES =====

-- Table des préférences de notifications utilisateur
CREATE TABLE IF NOT EXISTS UserNotificationPreferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    in_app_enabled BOOLEAN DEFAULT true,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'Europe/Paris',
    language VARCHAR(10) DEFAULT 'fr',
    priority_filter VARCHAR(20)[] DEFAULT ARRAY['low', 'medium', 'high', 'urgent'],
    type_filter VARCHAR(100)[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des appareils utilisateur (pour notifications push)
CREATE TABLE IF NOT EXISTS UserDevices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    device_token VARCHAR(500) NOT NULL,
    push_token VARCHAR(500),
    device_type VARCHAR(20) CHECK (device_type IN ('web', 'ios', 'android', 'desktop')),
    device_name VARCHAR(100),
    active BOOLEAN DEFAULT true,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des rappels de paiement
CREATE TABLE IF NOT EXISTS PaymentReminder (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('7_days_before', '1_day_before', 'due_date', 'overdue')),
    sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== SYSTÈME DE FACTURATION =====

-- Table des factures
CREATE TABLE IF NOT EXISTS Invoice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES Client(id) ON DELETE CASCADE,
    expert_id UUID REFERENCES Expert(id) ON DELETE SET NULL,
    billing_type VARCHAR(50) NOT NULL CHECK (billing_type IN (
        'client_subscription', 'expert_commission', 'service_fee', 'document_processing', 'audit_service'
    )),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
        'draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'
    )),
    issue_date TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    paid_date TIMESTAMP WITH TIME ZONE,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    payment_method VARCHAR(20) CHECK (payment_method IN (
        'bank_transfer', 'credit_card', 'paypal', 'check', 'cash'
    )),
    payment_reference VARCHAR(100),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des lignes de facture
CREATE TABLE IF NOT EXISTS InvoiceItem (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES Invoice(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des paiements
CREATE TABLE IF NOT EXISTS Payment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES Invoice(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN (
        'bank_transfer', 'credit_card', 'paypal', 'check', 'cash'
    )),
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reference VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des paramètres de facturation
CREATE TABLE IF NOT EXISTS BillingSettings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES Client(id) ON DELETE CASCADE,
    billing_address JSONB NOT NULL,
    tax_number VARCHAR(50),
    payment_terms INTEGER DEFAULT 30, -- jours
    currency VARCHAR(3) DEFAULT 'EUR',
    auto_generate_invoices BOOLEAN DEFAULT false,
    payment_reminders BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== SYSTÈME CRM =====

-- Table des contacts
CREATE TABLE IF NOT EXISTS Contact (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('client', 'expert', 'prospect', 'partner', 'supplier')),
    status VARCHAR(20) DEFAULT 'prospect' CHECK (status IN (
        'active', 'inactive', 'prospect', 'lead', 'customer', 'churned'
    )),
    company_name VARCHAR(200),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address JSONB,
    industry VARCHAR(100),
    size VARCHAR(50),
    website VARCHAR(255),
    linkedin VARCHAR(255),
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    assigned_to UUID,
    source VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_contact_date TIMESTAMP WITH TIME ZONE
);

-- Table des interactions
CREATE TABLE IF NOT EXISTS Interaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES Contact(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN (
        'email', 'phone', 'meeting', 'document', 'note', 'task', 'opportunity'
    )),
    subject VARCHAR(200) NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER, -- en minutes
    outcome TEXT,
    next_action TEXT,
    next_action_date TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des tâches
CREATE TABLE IF NOT EXISTS Task (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES Contact(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    assigned_to UUID NOT NULL,
    created_by UUID NOT NULL,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des opportunités
CREATE TABLE IF NOT EXISTS Opportunity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES Contact(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    stage VARCHAR(20) DEFAULT 'prospecting' CHECK (stage IN (
        'prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
    )),
    value DECIMAL(12,2) NOT NULL,
    probability INTEGER DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
    expected_close_date TIMESTAMP WITH TIME ZONE,
    actual_close_date TIMESTAMP WITH TIME ZONE,
    assigned_to UUID NOT NULL,
    created_by UUID NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== INDEX POUR PERFORMANCE =====

-- Index pour EncryptionKeys
CREATE INDEX IF NOT EXISTS idx_encryption_keys_user_document ON EncryptionKeys(user_id, document_id);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_expires ON EncryptionKeys(expires_at);

-- Index pour SecureAccessLog
CREATE INDEX IF NOT EXISTS idx_secure_access_user_document ON SecureAccessLog(user_id, document_id);
CREATE INDEX IF NOT EXISTS idx_secure_access_flagged ON SecureAccessLog(flagged);
CREATE INDEX IF NOT EXISTS idx_secure_access_created_at ON SecureAccessLog(created_at);

-- Index pour RetentionRules
CREATE INDEX IF NOT EXISTS idx_retention_rules_document_type ON RetentionRules(document_type);
CREATE INDEX IF NOT EXISTS idx_retention_rules_sensitive_type ON RetentionRules(sensitive_type);

-- Index pour RetentionAudit
CREATE INDEX IF NOT EXISTS idx_retention_audit_document_id ON RetentionAudit(document_id);
CREATE INDEX IF NOT EXISTS idx_retention_audit_performed_at ON RetentionAudit(performed_at);

-- Index pour UserNotificationPreferences
CREATE INDEX IF NOT EXISTS idx_user_notification_prefs_user_id ON UserNotificationPreferences(user_id);

-- Index pour UserDevices
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON UserDevices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_active ON UserDevices(active);
CREATE INDEX IF NOT EXISTS idx_user_devices_push_token ON UserDevices(push_token);

-- Index pour PaymentReminder
CREATE INDEX IF NOT EXISTS idx_payment_reminder_invoice_id ON PaymentReminder(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminder_date ON PaymentReminder(reminder_date);
CREATE INDEX IF NOT EXISTS idx_payment_reminder_sent ON PaymentReminder(sent);

-- Index pour Invoice
CREATE INDEX IF NOT EXISTS idx_invoice_client_id ON Invoice(client_id);
CREATE INDEX IF NOT EXISTS idx_invoice_expert_id ON Invoice(expert_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON Invoice(status);
CREATE INDEX IF NOT EXISTS idx_invoice_due_date ON Invoice(due_date);
CREATE INDEX IF NOT EXISTS idx_invoice_number ON Invoice(invoice_number);

-- Index pour InvoiceItem
CREATE INDEX IF NOT EXISTS idx_invoice_item_invoice_id ON InvoiceItem(invoice_id);

-- Index pour Payment
CREATE INDEX IF NOT EXISTS idx_payment_invoice_id ON Payment(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON Payment(status);
CREATE INDEX IF NOT EXISTS idx_payment_date ON Payment(payment_date);

-- Index pour BillingSettings
CREATE INDEX IF NOT EXISTS idx_billing_settings_client_id ON BillingSettings(client_id);

-- Index pour Contact
CREATE INDEX IF NOT EXISTS idx_contact_type_status ON Contact(type, status);
CREATE INDEX IF NOT EXISTS idx_contact_assigned_to ON Contact(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contact_email ON Contact(email);
CREATE INDEX IF NOT EXISTS idx_contact_company ON Contact(company_name);
CREATE INDEX IF NOT EXISTS idx_contact_tags ON Contact USING gin(tags);

-- Index pour Interaction
CREATE INDEX IF NOT EXISTS idx_interaction_contact_id ON Interaction(contact_id);
CREATE INDEX IF NOT EXISTS idx_interaction_type ON Interaction(type);
CREATE INDEX IF NOT EXISTS idx_interaction_date ON Interaction(date);
CREATE INDEX IF NOT EXISTS idx_interaction_created_by ON Interaction(created_by);

-- Index pour Task
CREATE INDEX IF NOT EXISTS idx_task_contact_id ON Task(contact_id);
CREATE INDEX IF NOT EXISTS idx_task_assigned_to ON Task(assigned_to);
CREATE INDEX IF NOT EXISTS idx_task_status ON Task(status);
CREATE INDEX IF NOT EXISTS idx_task_due_date ON Task(due_date);
CREATE INDEX IF NOT EXISTS idx_task_priority ON Task(priority);

-- Index pour Opportunity
CREATE INDEX IF NOT EXISTS idx_opportunity_contact_id ON Opportunity(contact_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_assigned_to ON Opportunity(assigned_to);
CREATE INDEX IF NOT EXISTS idx_opportunity_stage ON Opportunity(stage);
CREATE INDEX IF NOT EXISTS idx_opportunity_value ON Opportunity(value);
CREATE INDEX IF NOT EXISTS idx_opportunity_close_date ON Opportunity(expected_close_date);

-- ===== POLITIQUES RLS =====

-- Politiques pour EncryptionKeys
ALTER TABLE EncryptionKeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own encryption keys" ON EncryptionKeys
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all encryption keys" ON EncryptionKeys
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour SecureAccessLog
ALTER TABLE SecureAccessLog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own access logs" ON SecureAccessLog
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all access logs" ON SecureAccessLog
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour RetentionRules
ALTER TABLE RetentionRules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage retention rules" ON RetentionRules
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour RetentionAudit
ALTER TABLE RetentionAudit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view retention audit" ON RetentionAudit
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour UserNotificationPreferences
ALTER TABLE UserNotificationPreferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification preferences" ON UserNotificationPreferences
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Politiques pour UserDevices
ALTER TABLE UserDevices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own devices" ON UserDevices
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Politiques pour PaymentReminder
ALTER TABLE PaymentReminder ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment reminders" ON PaymentReminder
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour Invoice
ALTER TABLE Invoice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own invoices" ON Invoice
    FOR SELECT USING (auth.uid()::text = client_id::text);

CREATE POLICY "Experts can view their own invoices" ON Invoice
    FOR SELECT USING (auth.uid()::text = expert_id::text);

CREATE POLICY "Admins can manage all invoices" ON Invoice
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour InvoiceItem
ALTER TABLE InvoiceItem ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoice items for their invoices" ON InvoiceItem
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM Invoice i 
            WHERE i.id = InvoiceItem.invoice_id 
            AND (i.client_id::text = auth.uid()::text OR i.expert_id::text = auth.uid()::text)
        )
    );

CREATE POLICY "Admins can manage invoice items" ON InvoiceItem
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour Payment
ALTER TABLE Payment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payments for their invoices" ON Payment
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM Invoice i 
            WHERE i.id = Payment.invoice_id 
            AND (i.client_id::text = auth.uid()::text OR i.expert_id::text = auth.uid()::text)
        )
    );

CREATE POLICY "Admins can manage payments" ON Payment
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour BillingSettings
ALTER TABLE BillingSettings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own billing settings" ON BillingSettings
    FOR SELECT USING (auth.uid()::text = client_id::text);

CREATE POLICY "Admins can manage billing settings" ON BillingSettings
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour Contact
ALTER TABLE Contact ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contacts assigned to them" ON Contact
    FOR SELECT USING (auth.uid()::text = assigned_to::text);

CREATE POLICY "Admins can manage all contacts" ON Contact
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour Interaction
ALTER TABLE Interaction ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view interactions for their contacts" ON Interaction
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM Contact c 
            WHERE c.id = Interaction.contact_id 
            AND c.assigned_to::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can create interactions for their contacts" ON Interaction
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM Contact c 
            WHERE c.id = Interaction.contact_id 
            AND c.assigned_to::text = auth.uid()::text
        )
    );

CREATE POLICY "Admins can manage all interactions" ON Interaction
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour Task
ALTER TABLE Task ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks assigned to them" ON Task
    FOR SELECT USING (auth.uid()::text = assigned_to::text);

CREATE POLICY "Users can manage tasks assigned to them" ON Task
    FOR ALL USING (auth.uid()::text = assigned_to::text);

CREATE POLICY "Admins can manage all tasks" ON Task
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour Opportunity
ALTER TABLE Opportunity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view opportunities assigned to them" ON Opportunity
    FOR SELECT USING (auth.uid()::text = assigned_to::text);

CREATE POLICY "Users can manage opportunities assigned to them" ON Opportunity
    FOR ALL USING (auth.uid()::text = assigned_to::text);

CREATE POLICY "Admins can manage all opportunities" ON Opportunity
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

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
CREATE TRIGGER update_retention_rules_updated_at 
    BEFORE UPDATE ON RetentionRules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_prefs_updated_at 
    BEFORE UPDATE ON UserNotificationPreferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_updated_at 
    BEFORE UPDATE ON Invoice 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_settings_updated_at 
    BEFORE UPDATE ON BillingSettings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_updated_at 
    BEFORE UPDATE ON Contact 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_updated_at 
    BEFORE UPDATE ON Task 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunity_updated_at 
    BEFORE UPDATE ON Opportunity 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== FONCTIONS UTILITAIRES =====

-- Fonction pour calculer l'âge d'un document
CREATE OR REPLACE FUNCTION calculate_document_age(document_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT EXTRACT(DAYS FROM (NOW() - created_at))
        FROM DocumentFile
        WHERE id = document_id
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier si un document doit être archivé
CREATE OR REPLACE FUNCTION should_archive_document(document_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    doc_record RECORD;
    rule_record RECORD;
BEGIN
    -- Obtenir les informations du document
    SELECT * INTO doc_record
    FROM DocumentFile
    WHERE id = document_id;

    -- Obtenir la règle de rétention
    SELECT * INTO rule_record
    FROM RetentionRules
    WHERE document_type = doc_record.category
    AND sensitive_type = doc_record.sensitive_type;

    -- Vérifier si le document doit être archivé
    RETURN (
        rule_record.auto_archive = true
        AND calculate_document_age(document_id) >= (rule_record.archive_after * 30)
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les documents à archiver
CREATE OR REPLACE FUNCTION get_documents_to_archive()
RETURNS TABLE (
    document_id UUID,
    document_name TEXT,
    client_id UUID,
    archive_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        df.id as document_id,
        df.description as document_name,
        df.client_id,
        (df.created_at + INTERVAL '1 year') as archive_date
    FROM DocumentFile df
    WHERE should_archive_document(df.id) = true
    AND df.archived = false;
END;
$$ LANGUAGE plpgsql;

-- ===== COMMENTAIRES =====

COMMENT ON TABLE EncryptionKeys IS 'Clés de chiffrement pour documents sensibles';
COMMENT ON TABLE SecureAccessLog IS 'Journal d''accès sécurisé pour audit';
COMMENT ON TABLE RetentionRules IS 'Règles de rétention légale des documents';
COMMENT ON TABLE RetentionAudit IS 'Audit des actions de rétention';
COMMENT ON TABLE UserNotificationPreferences IS 'Préférences de notifications utilisateur';
COMMENT ON TABLE UserDevices IS 'Appareils utilisateur pour notifications push';
COMMENT ON TABLE PaymentReminder IS 'Rappels de paiement automatiques';
COMMENT ON TABLE Invoice IS 'Factures clients et experts';
COMMENT ON TABLE InvoiceItem IS 'Lignes de facture';
COMMENT ON TABLE Payment IS 'Paiements reçus';
COMMENT ON TABLE BillingSettings IS 'Paramètres de facturation par client';
COMMENT ON TABLE Contact IS 'Contacts CRM (clients, experts, prospects)';
COMMENT ON TABLE Interaction IS 'Interactions avec les contacts';
COMMENT ON TABLE Task IS 'Tâches CRM';
COMMENT ON TABLE Opportunity IS 'Opportunités commerciales'; 