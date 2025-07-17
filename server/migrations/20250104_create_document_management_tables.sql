-- ===== TABLES DE GESTION DOCUMENTAIRE =====

-- Table principale des fichiers documentaires
CREATE TABLE IF NOT EXISTS DocumentFile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    document_category VARCHAR(50) NOT NULL CHECK (document_category IN (
        'charte_profitum', 'document_fiscal', 'document_comptable', 'document_juridique',
        'rapport_audit', 'document_eligibilite', 'facture', 'autre'
    )),
    document_type VARCHAR(100),
    client_id UUID NOT NULL,
    expert_id UUID,
    uploaded_by UUID NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    is_encrypted BOOLEAN DEFAULT false,
    encryption_level VARCHAR(20) DEFAULT 'standard' CHECK (encryption_level IN ('standard', 'high', 'maximum')),
    retention_period INTEGER DEFAULT 10, -- en années
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des versions de fichiers
CREATE TABLE IF NOT EXISTS DocumentFileVersion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES DocumentFile(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    uploaded_by UUID NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    change_description TEXT,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des logs d'accès aux documents
CREATE TABLE IF NOT EXISTS DocumentFileAccessLog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES DocumentFile(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('view', 'download', 'edit', 'delete')),
    ip_address INET NOT NULL,
    user_agent TEXT,
    access_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des permissions sur les documents
CREATE TABLE IF NOT EXISTS DocumentFilePermission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES DocumentFile(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('client', 'expert', 'admin', 'profitum')),
    permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('view', 'download', 'edit', 'delete', 'share')),
    granted_by UUID NOT NULL,
    granted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des partages de documents
CREATE TABLE IF NOT EXISTS DocumentFileShare (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES DocumentFile(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL,
    shared_with_email VARCHAR(255) NOT NULL,
    shared_with_name VARCHAR(255),
    share_type VARCHAR(20) NOT NULL CHECK (share_type IN ('view', 'download', 'edit')),
    share_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des clients (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS Client (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(10),
    country VARCHAR(100) DEFAULT 'France',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des experts (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS Expert (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(255),
    expertise_areas TEXT[],
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(10),
    country VARCHAR(100) DEFAULT 'France',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    hourly_rate DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des factures (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS Invoice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES Client(id),
    expert_id UUID REFERENCES Expert(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    paid_date TIMESTAMP WITH TIME ZONE,
    description TEXT,
    items JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== INDEX POUR PERFORMANCE =====

-- Index pour DocumentFile
CREATE INDEX IF NOT EXISTS idx_document_file_client_id ON DocumentFile(client_id);
CREATE INDEX IF NOT EXISTS idx_document_file_expert_id ON DocumentFile(expert_id);
CREATE INDEX IF NOT EXISTS idx_document_file_category ON DocumentFile(document_category);
CREATE INDEX IF NOT EXISTS idx_document_file_status ON DocumentFile(status);
CREATE INDEX IF NOT EXISTS idx_document_file_upload_date ON DocumentFile(upload_date);
CREATE INDEX IF NOT EXISTS idx_document_file_hash ON DocumentFile(file_hash);

-- Index pour DocumentFileVersion
CREATE INDEX IF NOT EXISTS idx_document_version_document_id ON DocumentFileVersion(document_id);
CREATE INDEX IF NOT EXISTS idx_document_version_current ON DocumentFileVersion(is_current);
CREATE INDEX IF NOT EXISTS idx_document_version_number ON DocumentFileVersion(version_number);

-- Index pour DocumentFileAccessLog
CREATE INDEX IF NOT EXISTS idx_access_log_document_id ON DocumentFileAccessLog(document_id);
CREATE INDEX IF NOT EXISTS idx_access_log_user_id ON DocumentFileAccessLog(user_id);
CREATE INDEX IF NOT EXISTS idx_access_log_access_date ON DocumentFileAccessLog(access_date);
CREATE INDEX IF NOT EXISTS idx_access_log_access_type ON DocumentFileAccessLog(access_type);

-- Index pour DocumentFilePermission
CREATE INDEX IF NOT EXISTS idx_permission_document_id ON DocumentFilePermission(document_id);
CREATE INDEX IF NOT EXISTS idx_permission_user_id ON DocumentFilePermission(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_active ON DocumentFilePermission(is_active);
CREATE INDEX IF NOT EXISTS idx_permission_expires ON DocumentFilePermission(expires_at);

-- Index pour DocumentFileShare
CREATE INDEX IF NOT EXISTS idx_share_document_id ON DocumentFileShare(document_id);
CREATE INDEX IF NOT EXISTS idx_share_token ON DocumentFileShare(share_token);
CREATE INDEX IF NOT EXISTS idx_share_active ON DocumentFileShare(is_active);
CREATE INDEX IF NOT EXISTS idx_share_expires ON DocumentFileShare(expires_at);

-- Index pour Client
CREATE INDEX IF NOT EXISTS idx_client_email ON Client(email);
CREATE INDEX IF NOT EXISTS idx_client_status ON Client(status);
CREATE INDEX IF NOT EXISTS idx_client_company ON Client(company_name);

-- Index pour Expert
CREATE INDEX IF NOT EXISTS idx_expert_email ON Expert(email);
CREATE INDEX IF NOT EXISTS idx_expert_status ON Expert(status);
CREATE INDEX IF NOT EXISTS idx_expert_expertise ON Expert USING GIN(expertise_areas);

-- Index pour Invoice
CREATE INDEX IF NOT EXISTS idx_invoice_client_id ON Invoice(client_id);
CREATE INDEX IF NOT EXISTS idx_invoice_expert_id ON Invoice(expert_id);
CREATE INDEX IF NOT EXISTS idx_invoice_number ON Invoice(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON Invoice(status);
CREATE INDEX IF NOT EXISTS idx_invoice_due_date ON Invoice(due_date);

-- ===== POLITIQUES RLS =====

-- Politiques pour DocumentFile
ALTER TABLE DocumentFile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents" ON DocumentFile
    FOR SELECT USING (
        auth.uid()::text = client_id::text OR
        auth.uid()::text = expert_id::text OR
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Users can upload documents" ON DocumentFile
    FOR INSERT WITH CHECK (
        auth.uid()::text = uploaded_by::text OR
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Users can update their own documents" ON DocumentFile
    FOR UPDATE USING (
        auth.uid()::text = uploaded_by::text OR
        auth.jwt() ->> 'role' = 'admin'
    );

-- Politiques pour DocumentFileVersion
ALTER TABLE DocumentFileVersion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view document versions" ON DocumentFileVersion
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM DocumentFile df 
            WHERE df.id = DocumentFileVersion.document_id 
            AND (df.client_id::text = auth.uid()::text OR df.expert_id::text = auth.uid()::text)
        ) OR
        auth.jwt() ->> 'role' = 'admin'
    );

-- Politiques pour DocumentFileAccessLog
ALTER TABLE DocumentFileAccessLog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own access logs" ON DocumentFileAccessLog
    FOR SELECT USING (
        auth.uid()::text = user_id::text OR
        auth.jwt() ->> 'role' = 'admin'
    );

-- Politiques pour DocumentFilePermission
ALTER TABLE DocumentFilePermission ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their permissions" ON DocumentFilePermission
    FOR SELECT USING (
        auth.uid()::text = user_id::text OR
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Admins can manage permissions" ON DocumentFilePermission
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour DocumentFileShare
ALTER TABLE DocumentFileShare ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their shares" ON DocumentFileShare
    FOR SELECT USING (
        auth.uid()::text = shared_by::text OR
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Users can create shares" ON DocumentFileShare
    FOR INSERT WITH CHECK (
        auth.uid()::text = shared_by::text OR
        auth.jwt() ->> 'role' = 'admin'
    );

-- Politiques pour Client
ALTER TABLE Client ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own client data" ON Client
    FOR SELECT USING (
        auth.uid()::text = id::text OR
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Admins can manage clients" ON Client
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour Expert
ALTER TABLE Expert ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expert data" ON Expert
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage experts" ON Expert
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour Invoice
ALTER TABLE Invoice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their invoices" ON Invoice
    FOR SELECT USING (
        auth.uid()::text = client_id::text OR
        auth.uid()::text = expert_id::text OR
        auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Admins can manage invoices" ON Invoice
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
CREATE TRIGGER update_document_file_updated_at 
    BEFORE UPDATE ON DocumentFile 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_updated_at 
    BEFORE UPDATE ON Client 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expert_updated_at 
    BEFORE UPDATE ON Expert 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_updated_at 
    BEFORE UPDATE ON Invoice 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour gérer les versions de documents
CREATE OR REPLACE FUNCTION create_document_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Désactiver l'ancienne version courante
    UPDATE DocumentFileVersion 
    SET is_current = false 
    WHERE document_id = NEW.id AND is_current = true;
    
    -- Créer une nouvelle version
    INSERT INTO DocumentFileVersion (
        document_id, version_number, filename, file_path, file_size, 
        file_hash, uploaded_by, is_current
    )
    SELECT 
        NEW.id,
        COALESCE((SELECT MAX(version_number) FROM DocumentFileVersion WHERE document_id = NEW.id), 0) + 1,
        NEW.filename,
        NEW.file_path,
        NEW.file_size,
        NEW.file_hash,
        NEW.uploaded_by,
        true;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_create_document_version
    AFTER INSERT ON DocumentFile
    FOR EACH ROW EXECUTE FUNCTION create_document_version();

-- ===== FONCTIONS UTILITAIRES =====

-- Fonction pour calculer la taille totale des documents d'un client
CREATE OR REPLACE FUNCTION get_client_document_size(client_uuid UUID)
RETURNS BIGINT AS $$
DECLARE
    total_size BIGINT;
BEGIN
    SELECT COALESCE(SUM(file_size), 0) INTO total_size
    FROM DocumentFile
    WHERE client_id = client_uuid AND status = 'active';
    
    RETURN total_size;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les documents expirés
CREATE OR REPLACE FUNCTION get_expired_documents()
RETURNS TABLE (
    document_id UUID,
    filename VARCHAR(255),
    client_id UUID,
    retention_period INTEGER,
    days_overdue INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        df.id,
        df.filename,
        df.client_id,
        df.retention_period,
        EXTRACT(DAYS FROM (NOW() - df.upload_date))::INTEGER - (df.retention_period * 365) as days_overdue
    FROM DocumentFile df
    WHERE df.status = 'active'
    AND EXTRACT(DAYS FROM (NOW() - df.upload_date)) > (df.retention_period * 365);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques de documents
CREATE OR REPLACE FUNCTION get_document_stats()
RETURNS TABLE (
    total_documents BIGINT,
    total_size BIGINT,
    documents_by_category JSONB,
    recent_uploads BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_documents,
        COALESCE(SUM(file_size), 0) as total_size,
        jsonb_object_agg(document_category, count) as documents_by_category,
        COUNT(*) FILTER (WHERE upload_date >= NOW() - INTERVAL '7 days') as recent_uploads
    FROM (
        SELECT document_category, COUNT(*) as count
        FROM DocumentFile
        WHERE status = 'active'
        GROUP BY document_category
    ) categories
    CROSS JOIN (
        SELECT COUNT(*) as total_count, SUM(file_size) as total_size
        FROM DocumentFile
        WHERE status = 'active'
    ) totals;
END;
$$ LANGUAGE plpgsql;

-- ===== DONNÉES DE TEST =====

-- Insérer des clients de test
INSERT INTO Client (id, email, first_name, last_name, company_name, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'client@test.com', 'Jean', 'Dupont', 'Entreprise Test', 'active'),
('550e8400-e29b-41d4-a716-446655440002', 'client2@test.com', 'Marie', 'Martin', 'Société Test', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insérer des experts de test
INSERT INTO Expert (id, email, first_name, last_name, company_name, expertise_areas, status) VALUES
('550e8400-e29b-41d4-a716-446655440003', 'expert@test.com', 'Pierre', 'Expert', 'Cabinet Expert', ARRAY['fiscal', 'comptable'], 'active'),
('550e8400-e29b-41d4-a716-446655440004', 'expert2@test.com', 'Sophie', 'Conseil', 'Conseil Test', ARRAY['juridique'], 'active')
ON CONFLICT (id) DO NOTHING;

-- Insérer des documents de test
INSERT INTO DocumentFile (id, filename, original_filename, file_path, file_size, mime_type, file_hash, document_category, client_id, uploaded_by, status) VALUES
('550e8400-e29b-41d4-a716-446655440005', 'test-doc.pdf', 'test-doc.pdf', '/documents/test-doc.pdf', 1024000, 'application/pdf', 'abc123hash', 'document_fiscal', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'active'),
('550e8400-e29b-41d4-a716-446655440006', 'test-doc-1.pdf', 'test-doc-1.pdf', '/documents/test-doc-1.pdf', 2048000, 'application/pdf', 'def456hash', 'charte_profitum', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insérer des factures de test
INSERT INTO Invoice (id, invoice_number, client_id, expert_id, amount, status, description) VALUES
('550e8400-e29b-41d4-a716-446655440007', 'INV-2024-001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 1500.00, 'draft', 'Facture de test')
ON CONFLICT (id) DO NOTHING;

-- ===== COMMENTAIRES =====

COMMENT ON TABLE DocumentFile IS 'Fichiers documentaires stockés dans le système';
COMMENT ON TABLE DocumentFileVersion IS 'Versions des fichiers documentaires';
COMMENT ON TABLE DocumentFileAccessLog IS 'Journal d''accès aux documents';
COMMENT ON TABLE DocumentFilePermission IS 'Permissions d''accès aux documents';
COMMENT ON TABLE DocumentFileShare IS 'Partages de documents via liens';
COMMENT ON TABLE Client IS 'Clients du système';
COMMENT ON TABLE Expert IS 'Experts consultants';
COMMENT ON TABLE Invoice IS 'Factures générées';

COMMENT ON COLUMN DocumentFile.retention_period IS 'Période de rétention en années';
COMMENT ON COLUMN DocumentFile.encryption_level IS 'Niveau de chiffrement du fichier';
COMMENT ON COLUMN DocumentFileVersion.is_current IS 'Indique si c''est la version actuelle';
COMMENT ON COLUMN DocumentFileShare.share_token IS 'Token unique pour accéder au partage';
COMMENT ON COLUMN Expert.expertise_areas IS 'Domaines d''expertise de l''expert'; 