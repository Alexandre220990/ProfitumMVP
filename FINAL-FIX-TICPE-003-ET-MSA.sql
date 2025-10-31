-- =====================================================
-- FIX FINAL: TICPE_003 + MSA
-- =====================================================
-- Dernières corrections avant test final :
-- 1. TICPE_003 doit être conditionnelle (SI TICPE_001 = Oui)
-- 2. MSA doit avoir le mapping des tranches CA
-- =====================================================

BEGIN;

-- ============================================================================
-- CORRECTION 1: TICPE_003 CONDITIONNELLE
-- ============================================================================

SELECT '🔧 CORRECTION 1: Ajout condition sur TICPE_003...' as etape;

UPDATE "QuestionnaireQuestion"
SET conditions = jsonb_build_object(
    'depends_on', (SELECT id::text FROM "QuestionnaireQuestion" WHERE question_id = 'TICPE_001'),
    'value', 'Oui',
    'operator', 'equals'
)
WHERE question_id = 'TICPE_003';

-- ============================================================================
-- CORRECTION 2: MSA AVEC MAPPING TRANCHES CA
-- ============================================================================

SELECT '🔧 CORRECTION 2: Formule MSA avec mapping tranches...' as etape;

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
-- VÉRIFICATIONS
-- ============================================================================

SELECT '' as ligne;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;
SELECT '✅ VÉRIFICATION 1: TICPE_003 CONDITIONNELLE' as titre;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;

SELECT 
    qq.question_id,
    LEFT(qq.question_text, 40) as question,
    dep.question_id as depend_de,
    qq.conditions->>'value' as valeur_requise,
    CASE 
        WHEN dep.question_id = 'TICPE_001' 
         AND qq.conditions->>'value' = 'Oui'
        THEN '✅ Condition OK (SI TICPE_001 = Oui)'
        ELSE '❌ Condition incorrecte'
    END as statut
FROM "QuestionnaireQuestion" qq
LEFT JOIN "QuestionnaireQuestion" dep ON dep.id::text = qq.conditions->>'depends_on'
WHERE qq.question_id = 'TICPE_003';

SELECT '' as ligne;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;
SELECT '✅ VÉRIFICATION 2: MSA AVEC MAPPING TRANCHES' as titre;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;

SELECT 
    nom,
    formule_calcul->>'type' as type_formule,
    formule_calcul->>'rate' as taux,
    formule_calcul->>'base_var' as variable,
    formule_calcul->'mapping_tranches' as tranches_definies,
    CASE 
        WHEN formule_calcul->>'type' = 'percentage'
         AND formule_calcul->>'base_var' = 'ca_tranche'
         AND formule_calcul->'mapping_tranches' IS NOT NULL
         AND jsonb_typeof(formule_calcul->'mapping_tranches') = 'object'
        THEN '✅ Mapping OK'
        ELSE '❌ Mapping manquant'
    END as statut
FROM "ProduitEligible"
WHERE nom = 'MSA';

SELECT '' as ligne;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;
SELECT '✅ VÉRIFICATION 3: COHÉRENCE QUESTIONS TICPE' as titre;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;

SELECT 
    qq.question_order as ordre,
    qq.question_id as code,
    LEFT(qq.question_text, 30) as question,
    CASE 
        WHEN qq.conditions IS NULL OR qq.conditions = '{}'::jsonb 
        THEN '✅ Toujours visible'
        ELSE '🔀 SI ' || dep.question_id || ' = "' || (qq.conditions->>'value') || '"'
    END as condition
FROM "QuestionnaireQuestion" qq
LEFT JOIN "QuestionnaireQuestion" dep ON dep.id::text = qq.conditions->>'depends_on'
WHERE qq.question_id LIKE 'TICPE%'
ORDER BY qq.question_order;

SELECT '' as ligne;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;
SELECT '📊 RÉSUMÉ FINAL' as titre;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;

SELECT 
    (SELECT COUNT(*) FROM "QuestionnaireQuestion" 
     WHERE question_order >= 7 AND question_order <= 9
     AND question_id LIKE 'TICPE%'
     AND (conditions IS NULL OR conditions = '{}'::jsonb)) as questions_ticpe_sans_condition,
    (SELECT COUNT(*) FROM "ProduitEligible" 
     WHERE nom IN ('MSA', 'Recouvrement')
     AND formule_calcul->'mapping_tranches' IS NOT NULL) as produits_avec_mapping,
    CASE 
        WHEN (SELECT COUNT(*) FROM "QuestionnaireQuestion" 
              WHERE question_id = 'TICPE_003'
              AND conditions->>'depends_on' IS NOT NULL) = 1
         AND (SELECT formule_calcul->'mapping_tranches' IS NOT NULL 
              FROM "ProduitEligible" WHERE nom = 'MSA') = true
        THEN '✅✅✅ TOUTES LES CORRECTIONS APPLIQUÉES ✅✅✅'
        ELSE '⚠️ Il reste des corrections à appliquer'
    END as statut_final;

COMMIT;

-- ============================================================================
-- INSTRUCTIONS POST-EXÉCUTION
-- ============================================================================
/*
✅ CORRECTIONS APPLIQUÉES:
1. TICPE_003 est maintenant conditionnelle (SI véhicules = Oui)
2. MSA a le mapping des tranches CA

PROCHAINES ÉTAPES:

1. 🔄 Redémarrer le serveur backend (OBLIGATOIRE - cache questions)
   cd /Users/alex/Desktop/FinancialTracker/server
   npm run dev

2. 🧪 Tester le simulateur en navigation privée
   Scénario Transport complet:
   - GENERAL_001: "Transport et Logistique"
   - GENERAL_002: "500 000€ - 1 000 000€"
   - GENERAL_003: "21 à 50"
   - GENERAL_004: "Oui"
   - GENERAL_005: "Oui"
   - TICPE_001: "Oui"
   - TICPE_003: ["Camions de plus de 7,5 tonnes"]
   - RECOUVR_001: "Non"
   - TICPE_002: 5000 (litres)
   - DFS_001: 10 (chauffeurs)
   - FONCIER_001: 10000 (taxe)
   - ENERGIE_001: 2000 (factures)

3. ✅ Vérifier les résultats attendus:
   
   PRODUITS FINANCIERS:
   - DFS: 10 × 150€ × 12 = 18 000€
   - TICPE: 5000 × 12 × 0,20€ = 12 000€
   - FONCIER: 10 000€ × 20% = 2 000€
   - Optimisation Énergie: 2000 × 12 × 30% = 7 200€
   - URSSAF: Calculé selon nb employés
   
   PRODUITS QUALITATIFS (Transport):
   - Logiciel Solid: Prix sur demande + 6 avantages
   - Chronotachygraphes digitaux: 6 bénéfices conformité

4. ✅ Vérifier le flux conditionnel:
   - Si TICPE_001 = "Non" → TICPE_003 et TICPE_002 NE s'affichent PAS
   - Si GENERAL_004 = "Non" → FONCIER_001 NE s'affiche PAS
   - Si GENERAL_005 = "Non" → ENERGIE_001 NE s'affiche PAS
   - Si secteur ≠ Transport → DFS_001 NE s'affiche PAS
*/

