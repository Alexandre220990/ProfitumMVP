-- ============================================================================
-- SCRIPT SIMPLE POUR AJOUTER LA COLONNE SECTOR
-- ============================================================================
-- Ce script ajoute uniquement la colonne sector manquante

-- Ajouter la colonne sector si elle n'existe pas
ALTER TABLE "ApporteurAffaires" 
ADD COLUMN IF NOT EXISTS sector VARCHAR(100);

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ApporteurAffaires' 
AND column_name = 'sector';

-- Afficher la structure de la table
\d "ApporteurAffaires"
