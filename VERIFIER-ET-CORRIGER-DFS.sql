-- =====================================================
-- VÉRIFIER ET CORRIGER DFS
-- =====================================================

-- VÉRIFICATION ACTUELLE
SELECT '═══ CONFIGURATION ACTUELLE DFS ═══' as titre;

-- Voir la règle actuelle
SELECT 
    produit_nom,
    rule_type,
    conditions,
    CASE 
        WHEN rule_type = 'simple' THEN 
            'SI ' || (conditions->>'question_id') || ' ' || (conditions->>'operator') || ' "' || (conditions->>'value') || '"'
        WHEN rule_type = 'combined' THEN
            'COMBINÉ (' || (conditions->>'operator') || '): ' ||
            (SELECT STRING_AGG(
                'SI ' || (r->>'question_id') || ' ' || COALESCE(r->>'operator', 'equals') || ' "' || COALESCE(r->>'value', '') || '"',
                ' ET '
            )
            FROM jsonb_array_elements(conditions->'rules') AS r)
        ELSE 'Type inconnu'
    END as regle_lisible
FROM "EligibilityRules"
WHERE produit_nom = 'DFS';

-- Voir la formule actuelle
SELECT 
    nom,
    notes_affichage,
    formule_calcul,
    formule_calcul->>'formula_display' as formule_affichee,
    parametres_requis
FROM "ProduitEligible"
WHERE nom = 'DFS';

-- =====================================================
-- CORRECTION
-- =====================================================

BEGIN;

-- ÉTAPE 1: Supprimer l'ancienne règle
DELETE FROM "EligibilityRules"
WHERE produit_nom = 'DFS';

-- ÉTAPE 2: Créer la nouvelle règle SIMPLE
-- DFS éligible SI secteur = "Transport et Logistique"
-- PAS de condition sur les contentieux
INSERT INTO "EligibilityRules" (
    id,
    produit_id,
    produit_nom,
    rule_type,
    conditions,
    priority,
    is_active,
    created_at,
    updated_at
)
SELECT
    gen_random_uuid(),
    pe.id,
    'DFS',
    'simple',
    jsonb_build_object(
        'question_id', 'GENERAL_001',
        'value', 'Transport et Logistique',
        'operator', 'equals'
    ),
    1,
    true,
    NOW(),
    NOW()
FROM "ProduitEligible" pe
WHERE pe.nom = 'DFS';

-- ÉTAPE 3: Corriger la formule de calcul
-- 150€ × nb_chauffeurs × 12 (annualisé)
UPDATE "ProduitEligible"
SET 
    notes_affichage = '150€ par chauffeur par mois (1 800€/an)',
    formule_calcul = jsonb_build_object(
        'type', 'multiplication_sequence',
        'operations', jsonb_build_array(
            jsonb_build_object(
                'var', 'nb_chauffeurs',
                'multiply', 150
            ),
            jsonb_build_object(
                'result', 'montant_mensuel',
                'multiply', 12
            )
        ),
        'formula_display', 'nb_chauffeurs × 150€ × 12 mois'
    ),
    parametres_requis = '["secteur", "nb_chauffeurs"]'::jsonb
WHERE nom = 'DFS';

COMMIT;

-- =====================================================
-- VÉRIFICATION APRÈS CORRECTION
-- =====================================================

SELECT '═══ CONFIGURATION CORRIGÉE DFS ═══' as titre;

-- Voir la nouvelle règle
SELECT 
    produit_nom,
    rule_type,
    conditions->>'question_id' as question,
    conditions->>'value' as valeur_requise,
    conditions->>'operator' as operateur,
    CASE 
        WHEN rule_type = 'simple' 
         AND conditions->>'question_id' = 'GENERAL_001'
         AND conditions->>'value' = 'Transport et Logistique'
        THEN '✅ Règle correcte (Transport uniquement, pas de contentieux)'
        ELSE '❌ Règle incorrecte'
    END as statut
FROM "EligibilityRules"
WHERE produit_nom = 'DFS';

-- Voir la nouvelle formule
SELECT 
    nom,
    notes_affichage,
    formule_calcul->>'formula_display' as formule,
    parametres_requis,
    CASE 
        WHEN formule_calcul->>'formula_display' = 'nb_chauffeurs × 150€ × 12 mois'
        THEN '✅ Formule correcte (150€ × 12 mois par chauffeur)'
        ELSE '❌ Formule incorrecte'
    END as statut
FROM "ProduitEligible"
WHERE nom = 'DFS';

-- Comparer avec la question DFS_001
SELECT 
    '═══ QUESTION DFS_001 (NB CHAUFFEURS) ═══' as titre;

SELECT 
    question_id,
    question_text,
    question_type,
    question_order,
    conditions,
    CASE 
        WHEN conditions->>'depends_on' IS NOT NULL 
        THEN 'Conditionnelle'
        ELSE 'Toujours affichée'
    END as affichage
FROM "QuestionnaireQuestion"
WHERE question_id = 'DFS_001';

-- =====================================================
-- RÉSUMÉ
-- =====================================================
/*
AVANT:
- Règle: Transport ET pas de contentieux (COMBINÉE)
- Formule: nb_chauffeurs × 150€ × 12

APRÈS:
- Règle: Transport uniquement (SIMPLE)
- Formule: nb_chauffeurs × 150€ × 12 (gardé l'annualisation)
- Notes: "150€ par chauffeur par mois (1 800€/an)"

CORRECTIONS:
✅ Suppression de la condition "pas de contentieux"
✅ Règle simplifiée: secteur Transport uniquement
✅ Formule gardée avec annualisation (× 12)

EXEMPLE:
- 5 chauffeurs → 5 × 150€ × 12 = 9 000€/an
- 10 chauffeurs → 10 × 150€ × 12 = 18 000€/an
*/

