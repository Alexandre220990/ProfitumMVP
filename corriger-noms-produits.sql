-- =====================================================
-- CORRECTION NOMS PRODUITS POUR MATCHING
-- =====================================================

-- 1. Renommer "Foncier" → "FONCIER" pour matcher avec les règles
UPDATE "ProduitEligible"
SET nom = 'FONCIER'
WHERE nom = 'Foncier';

-- 2. ACTIVER tous les produits que tu veux garder
UPDATE "ProduitEligible"
SET active = true
WHERE nom IN ('CEE', 'MSA', 'Chronotachygraphes digitaux', 'Optimisation Énergie', 
              'DFS', 'FONCIER', 'Recouvrement', 'TICPE', 'URSSAF');

-- 3. Désactiver uniquement TVA
UPDATE "ProduitEligible"
SET active = false
WHERE nom = 'TVA';

-- 4. VÉRIFICATION FINALE : Produits actifs vs règles
SELECT 
    pe.nom as produit,
    pe.active,
    COUNT(er.id) as nb_regles,
    CASE 
        WHEN COUNT(er.id) = 0 THEN '⚠️ Aucune règle'
        WHEN pe.active = false THEN '⚠️ Inactif'
        ELSE '✅ OK'
    END as status
FROM "ProduitEligible" pe
LEFT JOIN "EligibilityRules" er ON pe.nom = er.produit_nom
GROUP BY pe.nom, pe.active
ORDER BY status, pe.nom;

-- 5. Liste des produits actifs avec règles
SELECT 
    pe.nom,
    pe.categorie,
    COUNT(er.id) as nb_regles
FROM "ProduitEligible" pe
INNER JOIN "EligibilityRules" er ON pe.nom = er.produit_nom
WHERE pe.active = true
GROUP BY pe.nom, pe.categorie
ORDER BY pe.nom;

