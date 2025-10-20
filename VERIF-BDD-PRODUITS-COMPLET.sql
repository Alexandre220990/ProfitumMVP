-- ============================================================================
-- VÉRIFICATION COMPLÈTE BDD - PRODUITS ET RÈGLES
-- ============================================================================

-- 1. STRUCTURE DE LA TABLE ProduitEligible
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'ProduitEligible'
ORDER BY ordinal_position;

-- 2. TOUS LES PRODUITS ACTUELS
-- ============================================================================
SELECT 
  id,
  nom,
  description,
  categorie,
  montant_min,
  montant_max,
  taux_min,
  taux_max,
  duree_min,
  duree_max,
  active,
  created_at
FROM "ProduitEligible"
ORDER BY nom;

-- 3. RÈGLES D'ÉLIGIBILITÉ PAR PRODUIT
-- ============================================================================
SELECT 
  er.id,
  er.produit_nom,
  er.rule_type,
  er.priority,
  er.conditions,
  er.is_active
FROM "EligibilityRules" er
ORDER BY er.produit_nom, er.priority;

-- 4. STRUCTURE DE LA TABLE Question
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'Question'
ORDER BY ordinal_position;

-- 5. QUESTIONS EXISTANTES
-- ============================================================================
SELECT 
  id,
  texte,
  type,
  categorie,
  ordre,
  options,
  conditions
FROM "Question"
ORDER BY id;

-- 6. VÉRIFIER SI COLONNES MANQUANTES DANS ProduitEligible
-- ============================================================================
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ProduitEligible' 
      AND column_name = 'formule_calcul'
    ) THEN 'OUI' 
    ELSE 'NON' 
  END as colonne_formule_calcul_existe,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ProduitEligible' 
      AND column_name = 'notes_affichage'
    ) THEN 'OUI' 
    ELSE 'NON' 
  END as colonne_notes_affichage_existe,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ProduitEligible' 
      AND column_name = 'parametres_requis'
    ) THEN 'OUI' 
    ELSE 'NON' 
  END as colonne_parametres_requis_existe;

-- 7. VÉRIFIER SI COLONNE CODE DANS Question
-- ============================================================================
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Question' 
      AND column_name = 'code'
    ) THEN 'OUI' 
    ELSE 'NON' 
  END as colonne_code_existe;

-- 8. COMPTER LES PRODUITS PAR STATUT
-- ============================================================================
SELECT 
  active,
  COUNT(*) as nombre_produits
FROM "ProduitEligible"
GROUP BY active;

-- 9. COMPTER LES RÈGLES PAR STATUT
-- ============================================================================
SELECT 
  is_active,
  COUNT(*) as nombre_regles
FROM "EligibilityRules"
GROUP BY is_active;

-- 10. PRODUITS SANS RÈGLES D'ÉLIGIBILITÉ
-- ============================================================================
SELECT 
  p.id,
  p.nom
FROM "ProduitEligible" p
LEFT JOIN "EligibilityRules" er ON p.nom = er.produit_nom
WHERE er.id IS NULL
  AND p.active = true
ORDER BY p.nom;

