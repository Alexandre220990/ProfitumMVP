-- =====================================================
-- VÉRIFIER FORMULES DE CALCUL DES PRODUITS
-- =====================================================

-- 1. Afficher les formules de calcul de tous les produits actifs
SELECT 
    nom,
    type_produit,
    formule_calcul,
    parametres_requis,
    CASE 
        WHEN formule_calcul IS NULL THEN '❌ MANQUANT'
        ELSE '✅ OK'
    END as status
FROM "ProduitEligible"
WHERE active = true
ORDER BY nom;

-- 2. Vérifier les colonnes disponibles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ProduitEligible'
  AND column_name IN ('formule_calcul', 'parametres_requis', 'type_produit')
ORDER BY column_name;

