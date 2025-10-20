-- ============================================================================
-- MIGRATION BDD - AJOUT COLONNES ET STRUCTURE
-- ============================================================================

-- 1. AJOUTER COLONNES À ProduitEligible
-- ============================================================================

-- Colonne formule_calcul (JSON avec la logique de calcul)
ALTER TABLE "ProduitEligible" 
ADD COLUMN IF NOT EXISTS formule_calcul JSONB DEFAULT NULL;

-- Colonne notes_affichage (texte affiché aux utilisateurs)
ALTER TABLE "ProduitEligible" 
ADD COLUMN IF NOT EXISTS notes_affichage TEXT DEFAULT NULL;

-- Colonne parametres_requis (liste des paramètres nécessaires)
ALTER TABLE "ProduitEligible" 
ADD COLUMN IF NOT EXISTS parametres_requis JSONB DEFAULT NULL;

-- Colonne type_produit (financier ou qualitatif)
ALTER TABLE "ProduitEligible" 
ADD COLUMN IF NOT EXISTS type_produit VARCHAR(20) DEFAULT 'financier' CHECK (type_produit IN ('financier', 'qualitatif'));

COMMENT ON COLUMN "ProduitEligible".formule_calcul IS 'Formule de calcul en JSON : {type, operations, variables}';
COMMENT ON COLUMN "ProduitEligible".notes_affichage IS 'Notes affichées dans les résultats (ex: durée, conditions)';
COMMENT ON COLUMN "ProduitEligible".parametres_requis IS 'Liste des paramètres requis : ["ca", "nb_employes"]';
COMMENT ON COLUMN "ProduitEligible".type_produit IS 'Type de produit : financier (avec montant) ou qualitatif (bénéfices)';

-- 2. AJOUTER COLONNE CODE À Question
-- ============================================================================

-- Colonne code (identifiant textuel type GENERAL_001)
ALTER TABLE "Question" 
ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE DEFAULT NULL;

COMMENT ON COLUMN "Question".code IS 'Code unique de la question (ex: GENERAL_001, TICPE_001)';

-- Index pour recherche rapide par code
CREATE INDEX IF NOT EXISTS idx_question_code ON "Question"(code);

-- 3. VÉRIFICATION
-- ============================================================================

-- Afficher la nouvelle structure de ProduitEligible
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ProduitEligible'
ORDER BY ordinal_position;

-- Afficher la nouvelle structure de Question
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'Question'
ORDER BY ordinal_position;

