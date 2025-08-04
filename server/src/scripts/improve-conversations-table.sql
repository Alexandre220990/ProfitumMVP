-- Script d'amélioration de la table conversations
-- Ajout de colonnes pour la cohérence métier

-- 1. Vérifier la structure actuelle
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'conversations' 
ORDER BY ordinal_position;

-- 2. Ajouter les colonnes de relations métier
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS dossier_id UUID,
ADD COLUMN IF NOT EXISTS client_id UUID,
ADD COLUMN IF NOT EXISTS expert_id UUID,
ADD COLUMN IF NOT EXISTS produit_id UUID;

-- 3. Ajouter les colonnes de sécurité et permissions
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS access_level VARCHAR(20) DEFAULT 'private',
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- 4. Ajouter les colonnes de métadonnées métier
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 5. Ajouter les contraintes de validation
ALTER TABLE conversations 
ADD CONSTRAINT check_conversation_type 
CHECK (type IN ('expert_client', 'admin_support', 'internal', 'client_support', 'expert_internal'));

ALTER TABLE conversations 
ADD CONSTRAINT check_access_level 
CHECK (access_level IN ('public', 'private', 'restricted', 'confidential'));

ALTER TABLE conversations 
ADD CONSTRAINT check_priority 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- 6. Ajouter les index pour les performances
CREATE INDEX IF NOT EXISTS idx_conversations_dossier_id ON conversations(dossier_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_expert_id ON conversations(expert_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);

-- 7. Ajouter les clés étrangères (optionnel - décommenter si nécessaire)
-- ALTER TABLE conversations ADD CONSTRAINT fk_conversations_dossier_id FOREIGN KEY (dossier_id) REFERENCES "ClientProduitEligible"(id);
-- ALTER TABLE conversations ADD CONSTRAINT fk_conversations_client_id FOREIGN KEY (client_id) REFERENCES "Client"(id);
-- ALTER TABLE conversations ADD CONSTRAINT fk_conversations_expert_id FOREIGN KEY (expert_id) REFERENCES "Expert"(id);
-- ALTER TABLE conversations ADD CONSTRAINT fk_conversations_produit_id FOREIGN KEY (produit_id) REFERENCES "ProduitEligible"(id);

-- 8. Vérification finale
SELECT 
    COUNT(*) as total_conversations,
    COUNT(CASE WHEN dossier_id IS NOT NULL THEN 1 END) as with_dossier,
    COUNT(CASE WHEN client_id IS NOT NULL THEN 1 END) as with_client,
    COUNT(CASE WHEN expert_id IS NOT NULL THEN 1 END) as with_expert,
    COUNT(CASE WHEN created_by IS NOT NULL THEN 1 END) as with_creator
FROM conversations; 