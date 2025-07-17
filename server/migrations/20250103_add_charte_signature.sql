-- Migration pour ajouter les colonnes de signature de charte
-- Date: 2025-01-03
-- Description: Ajoute les colonnes nécessaires pour la signature de charte par produit

-- Ajouter les colonnes de signature de charte à ClientProduitEligible
ALTER TABLE "ClientProduitEligible" 
ADD COLUMN IF NOT EXISTS charte_signed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS charte_signed_at TIMESTAMP WITH TIME ZONE;

-- Créer un index pour optimiser les requêtes sur la signature de charte
CREATE INDEX IF NOT EXISTS idx_client_produit_charte_signed 
ON "ClientProduitEligible" (charte_signed, client_id);

-- Créer un index pour optimiser les requêtes sur la date de signature
CREATE INDEX IF NOT EXISTS idx_client_produit_charte_signed_at 
ON "ClientProduitEligible" (charte_signed_at);

-- Mettre à jour les commentaires des colonnes
COMMENT ON COLUMN "ClientProduitEligible".charte_signed IS 'Indique si la charte a été signée pour ce produit';
COMMENT ON COLUMN "ClientProduitEligible".charte_signed_at IS 'Date et heure de signature de la charte';

-- Créer une table pour les chartes par produit (optionnel, pour une gestion avancée)
CREATE TABLE IF NOT EXISTS "ChartesProduits" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produit_id UUID REFERENCES "ProduitEligible"(id) ON DELETE CASCADE,
    nom_charte VARCHAR(255) NOT NULL,
    contenu_charte TEXT NOT NULL,
    version VARCHAR(10) DEFAULT '1.0',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour la table ChartesProduits
CREATE INDEX IF NOT EXISTS idx_chartes_produits_produit_id 
ON "ChartesProduits" (produit_id);

CREATE INDEX IF NOT EXISTS idx_chartes_produits_active 
ON "ChartesProduits" (active);

-- Commentaires pour la table ChartesProduits
COMMENT ON TABLE "ChartesProduits" IS 'Table des chartes spécifiques par produit';
COMMENT ON COLUMN "ChartesProduits".produit_id IS 'ID du produit éligible associé';
COMMENT ON COLUMN "ChartesProduits".nom_charte IS 'Nom de la charte';
COMMENT ON COLUMN "ChartesProduits".contenu_charte IS 'Contenu de la charte en format texte';
COMMENT ON COLUMN "ChartesProduits".version IS 'Version de la charte';
COMMENT ON COLUMN "ChartesProduits".active IS 'Indique si la charte est active';

-- RLS (Row Level Security) pour ChartesProduits
ALTER TABLE "ChartesProduits" ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour ChartesProduits (lecture publique des chartes actives)
CREATE POLICY "Chartes actives visibles par tous" ON "ChartesProduits"
    FOR SELECT USING (active = TRUE);

-- Politique RLS pour ChartesProduits (modification par admin seulement)
CREATE POLICY "Modification chartes par admin" ON "ChartesProduits"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "profiles" 
            WHERE "profiles".id = auth.uid() 
            AND "profiles".role = 'admin'
        )
    ); 