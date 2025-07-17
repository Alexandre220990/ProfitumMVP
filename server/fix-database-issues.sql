-- Script de correction des problèmes de base de données
-- Date: 2025-01-03
-- Description: Correction des tables et colonnes manquantes

-- 1. Créer la table ExpertNotifications
CREATE TABLE IF NOT EXISTS "ExpertNotifications" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expert_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('preselection', 'message', 'assignment', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Créer la table ExpertAssignment si elle n'existe pas
CREATE TABLE IF NOT EXISTS "ExpertAssignment" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES "Client"(id),
    expert_id UUID NOT NULL REFERENCES "Expert"(id),
    produit_id UUID NOT NULL REFERENCES "ProduitEligible"(id),
    statut VARCHAR(50) DEFAULT 'pending' CHECK (statut IN ('pending', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
    expert_rating INTEGER CHECK (expert_rating >= 1 AND expert_rating <= 5),
    notes TEXT
);

-- 3. Ajouter la colonne category à ProduitEligible si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ProduitEligible' AND column_name = 'category') THEN
        ALTER TABLE "ProduitEligible" ADD COLUMN category VARCHAR(100);
    END IF;
END $$;

-- 4. Ajouter la colonne timestamp à message si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'message' AND column_name = 'timestamp') THEN
        ALTER TABLE "message" ADD COLUMN timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 5. Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_expert_notifications_expert_id 
ON "ExpertNotifications" (expert_id);

CREATE INDEX IF NOT EXISTS idx_expert_notifications_type 
ON "ExpertNotifications" (type);

CREATE INDEX IF NOT EXISTS idx_expert_notifications_read 
ON "ExpertNotifications" (read);

CREATE INDEX IF NOT EXISTS idx_expert_notifications_created_at 
ON "ExpertNotifications" (created_at);

CREATE INDEX IF NOT EXISTS idx_expert_assignment_client_id 
ON "ExpertAssignment" (client_id);

CREATE INDEX IF NOT EXISTS idx_expert_assignment_expert_id 
ON "ExpertAssignment" (expert_id);

CREATE INDEX IF NOT EXISTS idx_expert_assignment_statut 
ON "ExpertAssignment" (statut);

CREATE INDEX IF NOT EXISTS idx_message_timestamp 
ON "message" (timestamp);

CREATE INDEX IF NOT EXISTS idx_message_sender_id 
ON "message" (sender_id);

CREATE INDEX IF NOT EXISTS idx_produit_eligible_category 
ON "ProduitEligible" (category);

-- 6. Insérer des données de test pour les produits éligibles
INSERT INTO "ProduitEligible" (id, nom, description, category) VALUES
    (gen_random_uuid(), 'Remboursement TICPE', 'Remboursement de la Taxe Intérieure de Consommation sur les Produits Énergétiques', 'Transport'),
    (gen_random_uuid(), 'Optimisation URSSAF', 'Optimisation des cotisations URSSAF et réduction des charges sociales', 'Social'),
    (gen_random_uuid(), 'Certificats d\'Économies d\'Énergie', 'CEE pour la rénovation énergétique', 'Énergie'),
    (gen_random_uuid(), 'Défiscalisation Foncière', 'Optimisation fiscale pour l\'immobilier', 'Immobilier'),
    (gen_random_uuid(), 'DFS - Dispositif de Financement Solidaire', 'Financement solidaire pour les entreprises', 'Finance')
ON CONFLICT (nom) DO NOTHING;

-- 7. Mettre à jour les colonnes timestamp existantes si elles sont NULL
UPDATE "message" SET timestamp = created_at WHERE timestamp IS NULL;

-- 8. Créer les politiques RLS pour ExpertNotifications
ALTER TABLE "ExpertNotifications" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Experts can view their own notifications" ON "ExpertNotifications"
    FOR SELECT USING (expert_id = auth.uid());

CREATE POLICY "Experts can update their own notifications" ON "ExpertNotifications"
    FOR UPDATE USING (expert_id = auth.uid());

CREATE POLICY "System can insert notifications" ON "ExpertNotifications"
    FOR INSERT WITH CHECK (true);

-- 9. Créer les politiques RLS pour ExpertAssignment
ALTER TABLE "ExpertAssignment" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assignments" ON "ExpertAssignment"
    FOR SELECT USING (client_id = auth.uid() OR expert_id = auth.uid());

CREATE POLICY "Users can update their own assignments" ON "ExpertAssignment"
    FOR UPDATE USING (client_id = auth.uid() OR expert_id = auth.uid());

CREATE POLICY "System can insert assignments" ON "ExpertAssignment"
    FOR INSERT WITH CHECK (true);

-- 10. Créer une fonction pour notifier automatiquement les experts
CREATE OR REPLACE FUNCTION notify_expert_preselection()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expert_id IS NOT NULL AND OLD.expert_id IS NULL THEN
        INSERT INTO "ExpertNotifications" (
            expert_id,
            type,
            title,
            message,
            data
        ) VALUES (
            NEW.expert_id,
            'preselection',
            'Nouvelle pré-sélection',
            'Vous avez été pré-sélectionné pour un nouveau dossier.',
            jsonb_build_object(
                'assignment_id', NEW.id,
                'client_id', NEW.client_id,
                'produit_id', NEW.produit_id
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Créer le trigger pour les notifications automatiques
DROP TRIGGER IF EXISTS trigger_notify_expert_preselection ON "ExpertAssignment";
CREATE TRIGGER trigger_notify_expert_preselection
    AFTER UPDATE ON "ExpertAssignment"
    FOR EACH ROW
    EXECUTE FUNCTION notify_expert_preselection();

-- 12. Créer une fonction pour les notifications de messages
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
    assignment_record RECORD;
    recipient_id UUID;
BEGIN
    -- Récupérer les détails de l'assignation
    SELECT client_id, expert_id INTO assignment_record
    FROM "ExpertAssignment"
    WHERE id = NEW.assignment_id;
    
    -- Déterminer le destinataire
    IF NEW.sender_type = 'client' THEN
        recipient_id := assignment_record.expert_id;
    ELSE
        recipient_id := assignment_record.client_id;
    END IF;
    
    -- Créer la notification
    INSERT INTO "ExpertNotifications" (
        expert_id,
        type,
        title,
        message,
        data
    ) VALUES (
        recipient_id,
        'message',
        'Nouveau message',
        'Vous avez reçu un nouveau message dans votre dossier.',
        jsonb_build_object(
            'message_id', NEW.id,
            'assignment_id', NEW.assignment_id,
            'sender_id', NEW.sender_id
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Créer le trigger pour les notifications de messages
DROP TRIGGER IF EXISTS trigger_notify_new_message ON "message";
CREATE TRIGGER trigger_notify_new_message
    AFTER INSERT ON "message"
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_message();

-- 14. Vérifier et corriger les données existantes
UPDATE "ProduitEligible" SET category = 'Transport' WHERE nom LIKE '%TICPE%';
UPDATE "ProduitEligible" SET category = 'Social' WHERE nom LIKE '%URSSAF%';
UPDATE "ProduitEligible" SET category = 'Énergie' WHERE nom LIKE '%CEE%' OR nom LIKE '%Économies%';
UPDATE "ProduitEligible" SET category = 'Immobilier' WHERE nom LIKE '%Foncier%' OR nom LIKE '%Immobilier%';
UPDATE "ProduitEligible" SET category = 'Finance' WHERE nom LIKE '%DFS%' OR nom LIKE '%Financement%';

-- 15. Créer des vues pour faciliter les requêtes
CREATE OR REPLACE VIEW "ExpertMarketplaceView" AS
SELECT 
    e.id,
    e.name,
    e.company_name,
    e.specializations,
    e.experience,
    e.location,
    e.rating,
    e.description,
    e.status,
    e.disponibilites,
    e.certifications,
    e.compensation,
    e.created_at,
    COUNT(ea.id) as total_assignments,
    COUNT(CASE WHEN ea.statut = 'completed' THEN 1 END) as completed_assignments,
    AVG(CASE WHEN ea.statut = 'completed' THEN ea.client_rating END) as avg_rating
FROM "Expert" e
LEFT JOIN "ExpertAssignment" ea ON e.id = ea.expert_id
WHERE e.status = 'active' AND e.approval_status = 'approved'
GROUP BY e.id, e.name, e.company_name, e.specializations, e.experience, 
         e.location, e.rating, e.description, e.status, e.disponibilites, 
         e.certifications, e.compensation, e.created_at;

-- 16. Créer une vue pour les statistiques des assignations
CREATE OR REPLACE VIEW "AssignmentStatsView" AS
SELECT 
    ea.id,
    ea.client_id,
    ea.expert_id,
    ea.produit_id,
    ea.statut,
    ea.created_at,
    c.company_name as client_name,
    e.name as expert_name,
    pe.nom as produit_name,
    pe.category as produit_category,
    COUNT(m.id) as message_count,
    MAX(m.timestamp) as last_message_at
FROM "ExpertAssignment" ea
LEFT JOIN "Client" c ON ea.client_id = c.id
LEFT JOIN "Expert" e ON ea.expert_id = e.id
LEFT JOIN "ProduitEligible" pe ON ea.produit_id = pe.id
LEFT JOIN "message" m ON ea.id = m.assignment_id
GROUP BY ea.id, ea.client_id, ea.expert_id, ea.produit_id, ea.statut, 
         ea.created_at, c.company_name, e.name, pe.nom, pe.category;

-- 17. Créer des index composites pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_expert_assignment_composite 
ON "ExpertAssignment" (client_id, expert_id, statut);

CREATE INDEX IF NOT EXISTS idx_message_composite 
ON "message" (assignment_id, sender_type, timestamp);

CREATE INDEX IF NOT EXISTS idx_notifications_composite 
ON "ExpertNotifications" (expert_id, type, read, created_at);

-- 18. Ajouter des contraintes de validation
ALTER TABLE "ExpertNotifications" 
ADD CONSTRAINT check_notification_type 
CHECK (type IN ('preselection', 'message', 'assignment', 'system'));

ALTER TABLE "ExpertAssignment" 
ADD CONSTRAINT check_assignment_status 
CHECK (statut IN ('pending', 'active', 'completed', 'cancelled'));

-- 19. Créer des fonctions utilitaires
CREATE OR REPLACE FUNCTION get_expert_notifications(p_expert_id UUID)
RETURNS TABLE (
    id UUID,
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    read BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        en.id,
        en.type,
        en.title,
        en.message,
        en.read,
        en.created_at
    FROM "ExpertNotifications" en
    WHERE en.expert_id = p_expert_id
    ORDER BY en.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 20. Créer une fonction pour les statistiques expert
CREATE OR REPLACE FUNCTION get_expert_stats(p_expert_id UUID)
RETURNS TABLE (
    total_assignments BIGINT,
    completed_assignments BIGINT,
    avg_rating NUMERIC,
    success_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(ea.id)::BIGINT as total_assignments,
        COUNT(CASE WHEN ea.statut = 'completed' THEN 1 END)::BIGINT as completed_assignments,
        ROUND(AVG(CASE WHEN ea.statut = 'completed' THEN ea.client_rating END), 2) as avg_rating,
        ROUND(
            (COUNT(CASE WHEN ea.statut = 'completed' THEN 1 END)::NUMERIC / 
             NULLIF(COUNT(ea.id), 0)) * 100, 2
        ) as success_rate
    FROM "ExpertAssignment" ea
    WHERE ea.expert_id = p_expert_id;
END;
$$ LANGUAGE plpgsql;

-- 21. Finaliser les corrections
COMMENT ON TABLE "ExpertNotifications" IS 'Table pour gérer les notifications des experts';
COMMENT ON TABLE "ExpertAssignment" IS 'Table pour gérer les assignations client-expert';
COMMENT ON VIEW "ExpertMarketplaceView" IS 'Vue optimisée pour la marketplace des experts';
COMMENT ON VIEW "AssignmentStatsView" IS 'Vue pour les statistiques des assignations';

-- 22. Vérifier que tout est en place
SELECT 'Database corrections completed successfully' as status; 