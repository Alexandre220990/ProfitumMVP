-- ============================================================================
-- MODIFICATION DE LA TABLE APPORTEUR AFFAIRES POUR GÉRER LES CANDIDATURES
-- ============================================================================

-- Ajouter des colonnes pour gérer les candidatures dans la table ApporteurAffaires existante
ALTER TABLE "ApporteurAffaires" 
ADD COLUMN IF NOT EXISTS motivation_letter TEXT,
ADD COLUMN IF NOT EXISTS cv_file_path VARCHAR(500),
ADD COLUMN IF NOT EXISTS sponsor_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS sponsor_id UUID REFERENCES "ApporteurAffaires"(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS candidature_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sector VARCHAR(100);

-- Modifier le statut pour inclure les candidatures
ALTER TABLE "ApporteurAffaires" 
DROP CONSTRAINT IF EXISTS apporteur_status_check;

-- Mettre à jour les statuts existants pour qu'ils correspondent à la nouvelle contrainte
UPDATE "ApporteurAffaires" 
SET status = 'active' 
WHERE status = 'pending_approval' OR status = 'approved';

UPDATE "ApporteurAffaires" 
SET status = 'inactive' 
WHERE status = 'pending';

-- Maintenant ajouter la nouvelle contrainte
ALTER TABLE "ApporteurAffaires" 
ADD CONSTRAINT apporteur_status_check 
CHECK (status IN ('candidature', 'active', 'inactive', 'suspended', 'rejected'));

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_apporteur_candidature_status ON "ApporteurAffaires"(status);
CREATE INDEX IF NOT EXISTS idx_apporteur_candidature_created ON "ApporteurAffaires"(candidature_created_at);
CREATE INDEX IF NOT EXISTS idx_apporteur_sponsor_code ON "ApporteurAffaires"(sponsor_code);

-- Ajouter une colonne affiliation_code à la table ApporteurAffaires si elle n'existe pas
ALTER TABLE "ApporteurAffaires" 
ADD COLUMN IF NOT EXISTS affiliation_code VARCHAR(20) UNIQUE;

-- Créer un index sur affiliation_code
CREATE INDEX IF NOT EXISTS idx_apporteur_affiliation_code ON "ApporteurAffaires"(affiliation_code);

-- Générer des codes d'affiliation pour les apporteurs existants qui n'en ont pas
UPDATE "ApporteurAffaires" 
SET affiliation_code = 'AFF' || EXTRACT(EPOCH FROM created_at)::BIGINT::TEXT
WHERE affiliation_code IS NULL;

-- Trigger pour mettre à jour updated_at sur ApporteurAffaires
CREATE OR REPLACE FUNCTION update_apporteur_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger s'il n'existe pas déjà
DROP TRIGGER IF EXISTS trigger_update_apporteur_updated_at ON "ApporteurAffaires";
CREATE TRIGGER trigger_update_apporteur_updated_at
    BEFORE UPDATE ON "ApporteurAffaires"
    FOR EACH ROW
    EXECUTE FUNCTION update_apporteur_updated_at();

-- Politiques RLS pour les candidatures dans ApporteurAffaires
-- Les admins peuvent voir toutes les candidatures (statut = 'candidature')
CREATE POLICY "Admins can view candidatures" ON "ApporteurAffaires"
    FOR SELECT USING (
        status = 'candidature' AND
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE "Admin".id = auth.uid()
        )
    );

-- Les admins peuvent modifier les candidatures
CREATE POLICY "Admins can update candidatures" ON "ApporteurAffaires"
    FOR UPDATE USING (
        status = 'candidature' AND
        EXISTS (
            SELECT 1 FROM "Admin" 
            WHERE "Admin".id = auth.uid()
        )
    );

-- Les candidats peuvent voir leurs propres candidatures
CREATE POLICY "Candidates can view own candidature" ON "ApporteurAffaires"
    FOR SELECT USING (
        status = 'candidature' AND
        email = auth.jwt() ->> 'email'
    );

-- Les candidats peuvent créer leurs candidatures
CREATE POLICY "Candidates can create candidature" ON "ApporteurAffaires"
    FOR INSERT WITH CHECK (
        status = 'candidature' AND
        email = auth.jwt() ->> 'email'
    );

-- Fonction pour nettoyer les candidatures anciennes (plus de 2 ans)
CREATE OR REPLACE FUNCTION cleanup_old_candidatures()
RETURNS void AS $$
BEGIN
    -- Anonymiser les candidatures rejetées de plus de 2 ans
    UPDATE "ApporteurAffaires" 
    SET 
        first_name = 'Anonyme',
        last_name = 'Anonyme',
        email = 'anonyme_' || id || '@deleted.com',
        phone = '0000000000',
        company_name = 'Entreprise supprimée',
        motivation_letter = 'Contenu supprimé',
        cv_file_path = NULL,
        sponsor_code = NULL,
        sponsor_id = NULL
    WHERE 
        status = 'rejected' 
        AND candidature_created_at < NOW() - INTERVAL '2 years';
        
    -- Supprimer les candidatures approuvées de plus de 2 ans (gardées comme apporteurs actifs)
    UPDATE "ApporteurAffaires" 
    SET 
        motivation_letter = NULL,
        cv_file_path = NULL,
        candidature_created_at = NULL
    WHERE 
        status = 'active' 
        AND candidature_created_at < NOW() - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

-- Créer un job pour nettoyer les candidatures anciennes (à exécuter mensuellement)
-- Cette fonction peut être appelée par un cron job ou un scheduler
