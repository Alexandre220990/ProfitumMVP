-- ===== TABLES POUR WORKFLOW DOCUMENTAIRE BUSINESS =====

-- Table des demandes de documents
CREATE TABLE IF NOT EXISTS DocumentRequest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES Client(id) ON DELETE CASCADE,
    expert_id UUID REFERENCES Expert(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'charte_profitum', 'charte_produit', 'facture', 'document_administratif',
        'document_eligibilite', 'rapport_audit', 'rapport_simulation',
        'document_comptable', 'document_fiscal', 'document_legal', 'autre'
    )),
    description TEXT NOT NULL,
    required BOOLEAN DEFAULT true,
    deadline TIMESTAMP WITH TIME ZONE,
    workflow VARCHAR(50) NOT NULL CHECK (workflow IN (
        'uploaded', 'profitum_review', 'eligibility_confirmed', 'expert_assigned',
        'expert_review', 'final_report', 'completed', 'rejected'
    )),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table des étapes du workflow
CREATE TABLE IF NOT EXISTS WorkflowStep (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_request_id UUID NOT NULL REFERENCES DocumentRequest(id) ON DELETE CASCADE,
    workflow VARCHAR(50) NOT NULL CHECK (workflow IN (
        'uploaded', 'profitum_review', 'eligibility_confirmed', 'expert_assigned',
        'expert_review', 'final_report', 'completed', 'rejected'
    )),
    assigned_to VARCHAR(20) NOT NULL CHECK (assigned_to IN ('client', 'expert', 'admin', 'profitum')),
    assigned_to_id UUID, -- ID de l'utilisateur assigné (client, expert, etc.)
    required BOOLEAN DEFAULT true,
    deadline TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL, -- Peut être client, expert, admin
    type_notification VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des validations de documents
CREATE TABLE IF NOT EXISTS DocumentValidation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_file_id UUID NOT NULL REFERENCES DocumentFile(id) ON DELETE CASCADE,
    validator_id UUID NOT NULL, -- ID de l'utilisateur qui valide
    validator_role VARCHAR(20) NOT NULL CHECK (validator_role IN ('client', 'expert', 'admin', 'profitum')),
    validation_type VARCHAR(50) NOT NULL CHECK (validation_type IN (
        'eligibility_check', 'completeness_check', 'accuracy_check', 'compliance_check'
    )),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'requires_changes')),
    comments TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des partages de documents
CREATE TABLE IF NOT EXISTS DocumentShare (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_file_id UUID NOT NULL REFERENCES DocumentFile(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL, -- ID de l'utilisateur qui partage
    shared_with UUID NOT NULL, -- ID de l'utilisateur avec qui on partage
    share_type VARCHAR(20) NOT NULL CHECK (share_type IN ('view', 'download', 'edit', 'admin')),
    expires_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des accès aux documents (audit trail)
CREATE TABLE IF NOT EXISTS DocumentAccessLog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_file_id UUID NOT NULL REFERENCES DocumentFile(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('client', 'expert', 'admin', 'profitum')),
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'view', 'download', 'upload', 'delete', 'share', 'validate', 'reject'
    )),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== INDEX POUR PERFORMANCE =====

-- Index pour DocumentRequest
CREATE INDEX IF NOT EXISTS idx_document_request_client_id ON DocumentRequest(client_id);
CREATE INDEX IF NOT EXISTS idx_document_request_expert_id ON DocumentRequest(expert_id);
CREATE INDEX IF NOT EXISTS idx_document_request_status ON DocumentRequest(status);
CREATE INDEX IF NOT EXISTS idx_document_request_workflow ON DocumentRequest(workflow);
CREATE INDEX IF NOT EXISTS idx_document_request_category ON DocumentRequest(category);
CREATE INDEX IF NOT EXISTS idx_document_request_deadline ON DocumentRequest(deadline);

-- Index pour WorkflowStep
CREATE INDEX IF NOT EXISTS idx_workflow_step_request_id ON WorkflowStep(document_request_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_assigned_to ON WorkflowStep(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflow_step_assigned_to_id ON WorkflowStep(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_completed ON WorkflowStep(completed);
CREATE INDEX IF NOT EXISTS idx_workflow_step_deadline ON WorkflowStep(deadline);

-- Index pour notification
CREATE INDEX IF NOT EXISTS idx_notification_recipient_id ON notification(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_read ON notification(read);
CREATE INDEX IF NOT EXISTS idx_notification_type ON notification(type_notification);

-- Index pour DocumentValidation
CREATE INDEX IF NOT EXISTS idx_document_validation_file_id ON DocumentValidation(document_file_id);
CREATE INDEX IF NOT EXISTS idx_document_validation_validator_id ON DocumentValidation(validator_id);
CREATE INDEX IF NOT EXISTS idx_document_validation_status ON DocumentValidation(status);

-- Index pour DocumentShare
CREATE INDEX IF NOT EXISTS idx_document_share_file_id ON DocumentShare(document_file_id);
CREATE INDEX IF NOT EXISTS idx_document_share_shared_with ON DocumentShare(shared_with);
CREATE INDEX IF NOT EXISTS idx_document_share_active ON DocumentShare(active);

-- Index pour DocumentAccessLog
CREATE INDEX IF NOT EXISTS idx_document_access_log_file_id ON DocumentAccessLog(document_file_id);
CREATE INDEX IF NOT EXISTS idx_document_access_log_user_id ON DocumentAccessLog(user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_log_action ON DocumentAccessLog(action);
CREATE INDEX IF NOT EXISTS idx_document_access_log_created_at ON DocumentAccessLog(created_at);

-- ===== POLITIQUES RLS =====

-- Politiques pour DocumentRequest
ALTER TABLE DocumentRequest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own document requests" ON DocumentRequest
    FOR SELECT USING (auth.uid()::text = client_id::text);

CREATE POLICY "Experts can view assigned document requests" ON DocumentRequest
    FOR SELECT USING (auth.uid()::text = expert_id::text);

CREATE POLICY "Admins can view all document requests" ON DocumentRequest
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Profitum can view all document requests" ON DocumentRequest
    FOR ALL USING (auth.jwt() ->> 'role' = 'profitum');

-- Politiques pour WorkflowStep
ALTER TABLE WorkflowStep ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workflow steps they are assigned to" ON WorkflowStep
    FOR SELECT USING (
        auth.uid()::text = assigned_to_id::text OR
        (assigned_to = 'client' AND EXISTS (
            SELECT 1 FROM DocumentRequest dr 
            WHERE dr.id = WorkflowStep.document_request_id 
            AND dr.client_id::text = auth.uid()::text
        ))
    );

CREATE POLICY "Admins can view all workflow steps" ON WorkflowStep
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Profitum can view all workflow steps" ON WorkflowStep
    FOR ALL USING (auth.jwt() ->> 'role' = 'profitum');

-- Politiques pour notification
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notification
    FOR SELECT USING (auth.uid()::text = recipient_id::text);

CREATE POLICY "Users can update their own notifications" ON notification
    FOR UPDATE USING (auth.uid()::text = recipient_id::text);

-- Politiques pour DocumentValidation
ALTER TABLE DocumentValidation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view validations for their documents" ON DocumentValidation
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM DocumentFile df 
            WHERE df.id = DocumentValidation.document_file_id 
            AND df.client_id::text = auth.uid()::text
        ) OR
        auth.uid()::text = validator_id::text
    );

CREATE POLICY "Admins can view all validations" ON DocumentValidation
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Politiques pour DocumentShare
ALTER TABLE DocumentShare ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shares they are involved in" ON DocumentShare
    FOR SELECT USING (
        auth.uid()::text = shared_by::text OR
        auth.uid()::text = shared_with::text
    );

CREATE POLICY "Users can create shares for their documents" ON DocumentShare
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM DocumentFile df 
            WHERE df.id = DocumentShare.document_file_id 
            AND df.client_id::text = auth.uid()::text
        )
    );

-- Politiques pour DocumentAccessLog
ALTER TABLE DocumentAccessLog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own access logs" ON DocumentAccessLog
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all access logs" ON DocumentAccessLog
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ===== TRIGGERS POUR AUDIT =====

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_request_updated_at 
    BEFORE UPDATE ON DocumentRequest 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_step_updated_at 
    BEFORE UPDATE ON WorkflowStep 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_validation_updated_at 
    BEFORE UPDATE ON DocumentValidation 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== FONCTIONS UTILITAIRES =====

-- Fonction pour obtenir le workflow d'un client
CREATE OR REPLACE FUNCTION get_client_workflow(client_uuid UUID)
RETURNS TABLE (
    request_id UUID,
    category VARCHAR(50),
    description TEXT,
    status VARCHAR(20),
    workflow VARCHAR(50),
    steps JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dr.id as request_id,
        dr.category,
        dr.description,
        dr.status,
        dr.workflow,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', ws.id,
                    'workflow', ws.workflow,
                    'assigned_to', ws.assigned_to,
                    'assigned_to_id', ws.assigned_to_id,
                    'completed', ws.completed,
                    'deadline', ws.deadline
                ) ORDER BY ws.created_at
            ) FILTER (WHERE ws.id IS NOT NULL),
            '[]'::jsonb
        ) as steps
    FROM DocumentRequest dr
    LEFT JOIN WorkflowStep ws ON dr.id = ws.document_request_id
    WHERE dr.client_id = client_uuid
    GROUP BY dr.id, dr.category, dr.description, dr.status, dr.workflow
    ORDER BY dr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les documents en attente d'un utilisateur
CREATE OR REPLACE FUNCTION get_pending_documents(user_uuid UUID, user_role VARCHAR(20))
RETURNS TABLE (
    request_id UUID,
    category VARCHAR(50),
    description TEXT,
    workflow VARCHAR(50),
    deadline TIMESTAMP WITH TIME ZONE,
    client_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dr.id as request_id,
        dr.category,
        dr.description,
        ws.workflow,
        ws.deadline,
        c.nom as client_name
    FROM WorkflowStep ws
    JOIN DocumentRequest dr ON ws.document_request_id = dr.id
    JOIN Client c ON dr.client_id = c.id
    WHERE ws.completed = false
    AND (
        (user_role = 'client' AND ws.assigned_to = 'client' AND dr.client_id = user_uuid) OR
        (user_role = 'expert' AND ws.assigned_to = 'expert' AND ws.assigned_to_id = user_uuid) OR
        (user_role = 'profitum' AND ws.assigned_to = 'profitum') OR
        (user_role = 'admin')
    )
    ORDER BY ws.deadline ASC NULLS LAST, dr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== COMMENTAIRES =====

COMMENT ON TABLE DocumentRequest IS 'Demandes de documents avec workflow business';
COMMENT ON TABLE WorkflowStep IS 'Étapes du workflow pour chaque demande de document';
COMMENT ON TABLE notification IS 'Notifications système pour les utilisateurs';
COMMENT ON TABLE DocumentValidation IS 'Validations de documents par les différents acteurs';
COMMENT ON TABLE DocumentShare IS 'Partage de documents entre utilisateurs';
COMMENT ON TABLE DocumentAccessLog IS 'Journal d''accès aux documents pour audit';

COMMENT ON COLUMN DocumentRequest.category IS 'Catégorie du document (charte, facture, etc.)';
COMMENT ON COLUMN DocumentRequest.workflow IS 'Type de workflow à suivre';
COMMENT ON COLUMN DocumentRequest.priority IS 'Priorité 1-5 (1=très haute, 5=très basse)';
COMMENT ON COLUMN WorkflowStep.assigned_to IS 'Rôle de l''utilisateur assigné à cette étape';
COMMENT ON COLUMN WorkflowStep.assigned_to_id IS 'ID spécifique de l''utilisateur assigné';
COMMENT ON COLUMN DocumentValidation.validation_type IS 'Type de validation effectuée';
COMMENT ON COLUMN DocumentShare.share_type IS 'Type de partage (view, download, edit, admin)'; 