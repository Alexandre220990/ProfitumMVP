-- =====================================================
-- CORRIGER FORMULE MSA - MAPPING DES TRANCHES CA
-- =====================================================
-- MSA calcule 6,5% du CA, mais GENERAL_002 retourne une tranche
-- Il faut mapper les tranches vers des valeurs moyennes
-- =====================================================

BEGIN;

-- Afficher la formule actuelle
SELECT '═══ FORMULE MSA ACTUELLE ═══' as titre;

SELECT 
    nom,
    notes_affichage,
    formule_calcul,
    formule_calcul->>'formula_display' as formule_affichee,
    parametres_requis
FROM "ProduitEligible"
WHERE nom = 'MSA';

-- ============================================================================
-- CORRECTION: AJOUTER LE MAPPING DES TRANCHES
-- ============================================================================

UPDATE "ProduitEligible"
SET 
    notes_affichage = 'Réduction de 6,5% du chiffre d''affaires annuel',
    formule_calcul = jsonb_build_object(
        'type', 'percentage',
        'rate', 0.065,
        'base_var', 'ca_tranche',
        'mapping_tranches', jsonb_build_object(
            'Moins de 100 000€', 50000,
            '100 000€ - 500 000€', 300000,
            '500 000€ - 1 000 000€', 750000,
            '1 000 000€ - 5 000 000€', 3000000,
            'Plus de 5 000 000€', 7500000
        ),
        'formula_display', 'CA × 6,5%'
    ),
    parametres_requis = '["secteur", "ca_tranche"]'::jsonb
WHERE nom = 'MSA';

-- ============================================================================
-- VÉRIFICATION APRÈS CORRECTION
-- ============================================================================

SELECT '═══ FORMULE MSA CORRIGÉE ═══' as titre;

SELECT 
    nom,
    notes_affichage,
    formule_calcul->>'type' as type_formule,
    formule_calcul->>'rate' as taux,
    formule_calcul->>'base_var' as variable_base,
    formule_calcul->'mapping_tranches' as tranches,
    formule_calcul->>'formula_display' as formule_affichee,
    parametres_requis,
    CASE 
        WHEN formule_calcul->>'type' = 'percentage'
         AND formule_calcul->>'base_var' = 'ca_tranche'
         AND formule_calcul->'mapping_tranches' IS NOT NULL
        THEN '✅ Formule avec mapping tranches OK'
        ELSE '❌ Formule incorrecte'
    END as statut
FROM "ProduitEligible"
WHERE nom = 'MSA';

-- Comparer avec Recouvrement (qui a aussi un mapping)
SELECT '═══ COMPARAISON: PRODUITS AVEC MAPPING TRANCHES ═══' as titre;

SELECT 
    nom as produit,
    formule_calcul->>'base_var' as variable,
    formule_calcul->'mapping_tranches' as tranches,
    CASE 
        WHEN formule_calcul->'mapping_tranches' IS NOT NULL
        THEN '✅ A un mapping'
        ELSE '❌ Pas de mapping'
    END as statut
FROM "ProduitEligible"
WHERE nom IN ('MSA', 'Recouvrement')
ORDER BY nom;

COMMIT;

-- ============================================================================
-- EXEMPLES DE CALCUL
-- ============================================================================
/*
EXEMPLES DE CALCUL MSA:

Tranche CA                    | Valeur moyenne | Calcul 6,5%      | Montant MSA
------------------------------|----------------|------------------|-------------
Moins de 100 000€             | 50 000€        | 50 000 × 6,5%    | 3 250€
100 000€ - 500 000€           | 300 000€       | 300 000 × 6,5%   | 19 500€
500 000€ - 1 000 000€         | 750 000€       | 750 000 × 6,5%   | 48 750€
1 000 000€ - 5 000 000€       | 3 000 000€     | 3 000 000 × 6,5% | 195 000€
Plus de 5 000 000€            | 7 500 000€     | 7 500 000 × 6,5% | 487 500€

RÈGLE D'ÉLIGIBILITÉ:
- Secteur = "Agriculture et Agroalimentaire"
- (Pas de condition sur le montant du CA)

FORMULE APPLIQUÉE:
1. Récupérer la réponse à GENERAL_002 (ex: "500 000€ - 1 000 000€")
2. Mapper vers valeur moyenne (ex: 750 000€)
3. Calculer 6,5% (ex: 750 000 × 0.065 = 48 750€)
*/

