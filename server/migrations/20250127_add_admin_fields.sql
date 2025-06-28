-- Migration pour ajouter les champs admin aux tables existantes
-- Date: 2025-01-27

-- 1. Modifications de la table Expert
ALTER TABLE "Expert" 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES "Admin"(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Mettre à jour les experts existants comme approuvés
UPDATE "Expert" 
SET approval_status = 'approved', 
    approved_at = created_at 
WHERE approval_status IS NULL;

-- 2. Modifications de la table Client
ALTER TABLE "Client" 
ADD COLUMN IF NOT EXISTS created_by_admin UUID REFERENCES "Admin"(id),
ADD COLUMN IF NOT EXISTS last_admin_contact TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 3. Modifications de la table Audit
ALTER TABLE "Audit" 
ADD COLUMN IF NOT EXISTS assigned_by_admin UUID REFERENCES "Admin"(id),
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS admin_assigned_at TIMESTAMP WITH TIME ZONE;

-- 4. Créer des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_expert_approval_status ON "Expert"(approval_status);
CREATE INDEX IF NOT EXISTS idx_expert_approved_by ON "Expert"(approved_by);
CREATE INDEX IF NOT EXISTS idx_client_created_by_admin ON "Client"(created_by_admin);
CREATE INDEX IF NOT EXISTS idx_audit_assigned_by_admin ON "Audit"(assigned_by_admin);

-- 5. Vérification des modifications
SELECT 
    'Expert' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Expert' 
AND column_name IN ('approved_by', 'approved_at', 'approval_status')
UNION ALL
SELECT 
    'Client' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Client' 
AND column_name IN ('created_by_admin', 'last_admin_contact', 'admin_notes')
UNION ALL
SELECT 
    'Audit' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'Audit' 
AND column_name IN ('assigned_by_admin', 'admin_notes', 'admin_assigned_at'); 