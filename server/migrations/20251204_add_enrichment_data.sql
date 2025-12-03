-- ============================================================================
-- Migration : Ajout de la colonne enrichment_data pour stocker les résultats
-- Date: 2025-12-04
-- Description: Stocke les données d'enrichissement IA pour chaque prospect
-- ============================================================================

-- Ajouter la colonne enrichment_data (JSONB pour flexibilité)
ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS enrichment_data JSONB DEFAULT NULL;

-- Ajouter un index GIN pour permettre des requêtes rapides sur le JSON
CREATE INDEX IF NOT EXISTS idx_prospects_enrichment_data 
ON prospects USING GIN (enrichment_data);

-- Ajouter un index sur enrichment_status pour les filtres
CREATE INDEX IF NOT EXISTS idx_prospects_enrichment_status 
ON prospects(enrichment_status);

-- Commentaire pour documentation
COMMENT ON COLUMN prospects.enrichment_data IS 'Données d''enrichissement obtenues via analyse IA : secteur, actualités, signaux opérationnels, éligibilité produits. Structure JSON complète.';

-- Ajouter une colonne pour tracker la date d'enrichissement
ALTER TABLE prospects 
ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN prospects.enriched_at IS 'Date et heure du dernier enrichissement réussi du prospect.';

