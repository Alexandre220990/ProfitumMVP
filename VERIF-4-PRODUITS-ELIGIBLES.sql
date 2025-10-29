-- ============================================================================
-- VÉRIFICATION 4 : Produits éligibles existants
-- ============================================================================

-- Lister tous les produits éligibles
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
  statut
FROM "ProduitEligible"
ORDER BY created_at DESC
LIMIT 15;

-- Compteur par catégorie
SELECT 
  categorie,
  COUNT(*) as nombre_produits,
  COUNT(CASE WHEN statut = 'actif' THEN 1 END) as actifs
FROM "ProduitEligible"
GROUP BY categorie
ORDER BY nombre_produits DESC;

-- Total
SELECT 
  COUNT(*) as total_produits,
  COUNT(CASE WHEN statut = 'actif' THEN 1 END) as produits_actifs
FROM "ProduitEligible";

