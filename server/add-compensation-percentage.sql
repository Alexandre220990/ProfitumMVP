-- Ajout de la colonne compensation_percentage à la table expertassignment
ALTER TABLE "expertassignment" 
ADD COLUMN IF NOT EXISTS compensation_percentage DECIMAL(5,2);

-- Ajout d'un commentaire pour documenter la colonne
COMMENT ON COLUMN "expertassignment".compensation_percentage IS 'Pourcentage de commission de l''expert (ex: 15.00 pour 15%)';

-- Mise à jour des enregistrements existants avec une valeur par défaut si nécessaire
UPDATE "expertassignment" 
SET compensation_percentage = 15.00 
WHERE compensation_percentage IS NULL;

-- Ajout d'une contrainte de validation pour s'assurer que le pourcentage est entre 0 et 100
ALTER TABLE "expertassignment" 
ADD CONSTRAINT check_compensation_percentage 
CHECK (compensation_percentage >= 0 AND compensation_percentage <= 100);

-- Index pour améliorer les performances des requêtes par compensation
CREATE INDEX IF NOT EXISTS idx_expertassignment_compensation_percentage 
ON "expertassignment"(compensation_percentage);

-- Vérification que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'expertassignment' 
AND column_name = 'compensation_percentage'; 