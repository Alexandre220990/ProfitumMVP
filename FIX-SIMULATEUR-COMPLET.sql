-- =====================================================
-- FIX COMPLET DU SIMULATEUR
-- =====================================================
-- Ce script corrige tous les problèmes identifiés :
-- 1. Conditions manquantes sur les questions de calcul (9-12)
-- 2. Règle d'éligibilité manquante pour Logiciel Solid
-- 3. Formule de calcul manquante pour Logiciel Solid
-- =====================================================

BEGIN;

-- ============================================================================
-- PARTIE 1: CORRIGER LES CONDITIONS DES QUESTIONS DE CALCUL
-- ============================================================================
-- Les questions de type "nombre" doivent être affichées conditionnellement

-- TICPE_002 (litres carburant) - Afficher SI véhicules professionnels = Oui
UPDATE "QuestionnaireQuestion"
SET conditions = jsonb_build_object(
    'depends_on', (SELECT id::text FROM "QuestionnaireQuestion" WHERE question_id = 'TICPE_001'),
    'value', 'Oui',
    'operator', 'equals'
)
WHERE question_id = 'TICPE_002';

-- DFS_001 (nb chauffeurs) - Afficher SI secteur = Transport et Logistique
UPDATE "QuestionnaireQuestion"
SET conditions = jsonb_build_object(
    'depends_on', (SELECT id::text FROM "QuestionnaireQuestion" WHERE question_id = 'GENERAL_001'),
    'value', 'Transport et Logistique',
    'operator', 'equals'
)
WHERE question_id = 'DFS_001';

-- FONCIER_001 (taxe foncière) - Afficher SI propriétaire locaux = Oui
UPDATE "QuestionnaireQuestion"
SET conditions = jsonb_build_object(
    'depends_on', (SELECT id::text FROM "QuestionnaireQuestion" WHERE question_id = 'GENERAL_004'),
    'value', 'Oui',
    'operator', 'equals'
)
WHERE question_id = 'FONCIER_001';

-- ENERGIE_001 (factures énergie) - Afficher SI contrats énergie = Oui
UPDATE "QuestionnaireQuestion"
SET conditions = jsonb_build_object(
    'depends_on', (SELECT id::text FROM "QuestionnaireQuestion" WHERE question_id = 'GENERAL_005'),
    'value', 'Oui',
    'operator', 'equals'
)
WHERE question_id = 'ENERGIE_001';

-- ============================================================================
-- PARTIE 2: AJOUTER RÈGLE D'ÉLIGIBILITÉ POUR LOGICIEL SOLID
-- ============================================================================

-- Logiciel Solid : Éligible si au moins 1 employé
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
    'Logiciel Solid',
    'simple',
    jsonb_build_object(
        'question_id', 'GENERAL_003',
        'value', 'Aucun',
        'operator', 'not_equals'
    ),
    1,
    true,
    NOW(),
    NOW()
FROM "ProduitEligible" pe
WHERE pe.nom = 'Logiciel Solid'
AND NOT EXISTS (
    SELECT 1 FROM "EligibilityRules" er 
    WHERE er.produit_nom = 'Logiciel Solid'
);

-- ============================================================================
-- PARTIE 3: AJOUTER FORMULE DE CALCUL POUR LOGICIEL SOLID
-- ============================================================================

UPDATE "ProduitEligible"
SET 
    formule_calcul = jsonb_build_object(
        'type', 'fixed',
        'value', 1500,
        'formula_display', '1500€ par an'
    ),
    parametres_requis = ARRAY['nb_employes_tranche'],
    notes_affichage = '1500€ par an pour un abonnement au logiciel de gestion'
WHERE nom = 'Logiciel Solid';

-- ============================================================================
-- VÉRIFICATIONS
-- ============================================================================

-- Vérifier les conditions des questions 9-12
SELECT 
    '=== VÉRIFICATION CONDITIONS QUESTIONS 9-12 ===' as section;

SELECT 
    question_id,
    question_order,
    question_text,
    dep.question_id as depend_de,
    conditions->>'value' as valeur_requise,
    CASE 
        WHEN conditions IS NULL OR conditions = '{}'::jsonb THEN '❌ Pas de conditions'
        ELSE '✅ Conditions OK'
    END as status
FROM "QuestionnaireQuestion" qq
LEFT JOIN "QuestionnaireQuestion" dep ON dep.id = (qq.conditions->>'depends_on')::uuid
WHERE qq.question_order >= 9
ORDER BY qq.question_order;

-- Vérifier que tous les produits ont des règles
SELECT 
    '=== VÉRIFICATION RÈGLES PAR PRODUIT ===' as section;

SELECT 
    pe.nom as produit,
    pe.active,
    COUNT(er.id) as nb_regles,
    CASE 
        WHEN COUNT(er.id) = 0 THEN '❌ Aucune règle'
        ELSE '✅ ' || COUNT(er.id) || ' règle(s)'
    END as status
FROM "ProduitEligible" pe
LEFT JOIN "EligibilityRules" er ON pe.nom = er.produit_nom
WHERE pe.active = true
GROUP BY pe.nom, pe.active
ORDER BY pe.nom;

-- Vérifier Logiciel Solid
SELECT 
    '=== VÉRIFICATION LOGICIEL SOLID ===' as section;

SELECT 
    nom,
    formule_calcul->>'formula_display' as formule,
    parametres_requis,
    notes_affichage
FROM "ProduitEligible"
WHERE nom = 'Logiciel Solid';

COMMIT;

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================
/*
✅ Conditions ajoutées sur questions 9-12 (affichage conditionnel)
✅ Règle d'éligibilité ajoutée pour Logiciel Solid
✅ Formule de calcul ajoutée pour Logiciel Solid

PROCHAINES ÉTAPES:
1. Exécuter ce script sur votre base de données
2. Redémarrer le serveur backend (pour vider le cache des questions)
3. Tester le simulateur en mode anonyme

Le simulateur devrait maintenant:
- Afficher les questions de calcul conditionnellement
- Calculer correctement les montants pour chaque produit
- Retourner tous les produits éligibles avec leurs montants
*/

