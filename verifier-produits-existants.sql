-- =====================================================
-- VÉRIFIER PRODUITS EXISTANTS VS RÈGLES
-- =====================================================

-- 1. Lister tous les produits dans ProduitEligible
SELECT 
    id,
    nom,
    categorie,
    active
FROM "ProduitEligible"
ORDER BY nom;

-- 2. Comparer les produits dans règles vs table ProduitEligible
SELECT 
    er.produit_nom as produit_dans_regle,
    pe.nom as produit_existe,
    CASE 
        WHEN pe.nom IS NULL THEN '❌ MANQUANT'
        ELSE '✅ EXISTS'
    END as status
FROM "EligibilityRules" er
LEFT JOIN "ProduitEligible" pe ON er.produit_nom = pe.nom
GROUP BY er.produit_nom, pe.nom
ORDER BY status, er.produit_nom;

-- 3. Identifier les règles orphelines (sans produit)
SELECT 
    produit_nom,
    COUNT(*) as nb_regles
FROM "EligibilityRules"
WHERE produit_nom NOT IN (
    SELECT nom FROM "ProduitEligible"
)
GROUP BY produit_nom;

