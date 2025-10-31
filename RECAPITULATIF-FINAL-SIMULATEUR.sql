-- =====================================================
-- RÉCAPITULATIF FINAL - CONFIGURATION SIMULATEUR
-- =====================================================
-- Vue d'ensemble complète de toutes les questions,
-- règles d'éligibilité et formules de calcul
-- =====================================================

-- ============================================================================
-- PARTIE 1: LISTE DES 12 QUESTIONS AVEC CONDITIONS
-- ============================================================================

SELECT '═══════════════════════════════════════════════════════════════' as ligne;
SELECT '📋 PARTIE 1: LES 12 QUESTIONS DU SIMULATEUR' as titre;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;

SELECT 
    qq.question_order as ordre,
    qq.question_id as code,
    LEFT(qq.question_text, 50) as question,
    qq.question_type as type,
    qq.section,
    CASE 
        WHEN qq.conditions IS NULL OR qq.conditions = '{}'::jsonb THEN '✅ Toujours visible'
        ELSE '🔀 SI ' || dep.question_id || ' = "' || (qq.conditions->>'value') || '"'
    END as condition_affichage,
    CASE 
        WHEN qq.question_type = 'choix_unique' THEN jsonb_array_length(qq.options->'choix')::text || ' choix'
        WHEN qq.question_type = 'choix_multiple' THEN jsonb_array_length(qq.options->'choix')::text || ' choix (multi)'
        WHEN qq.question_type = 'nombre' THEN 'Saisie numérique'
        ELSE qq.question_type
    END as format_reponse
FROM "QuestionnaireQuestion" qq
LEFT JOIN "QuestionnaireQuestion" dep ON dep.id::text = qq.conditions->>'depends_on'
ORDER BY qq.question_order;

-- ============================================================================
-- PARTIE 2: RÈGLES D'ÉLIGIBILITÉ PAR PRODUIT
-- ============================================================================

SELECT '' as ligne;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;
SELECT '🎯 PARTIE 2: RÈGLES D''ÉLIGIBILITÉ PAR PRODUIT' as titre;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;

SELECT 
    er.produit_nom as produit,
    pe.type_produit as type,
    er.rule_type,
    CASE 
        WHEN er.rule_type = 'simple' THEN 
            'SI ' || (er.conditions->>'question_id') || ' ' || 
            COALESCE(er.conditions->>'operator', 'equals') || ' "' || 
            (er.conditions->>'value') || '"'
        WHEN er.rule_type = 'combined' THEN
            'COMBINÉ (' || (er.conditions->>'operator') || '): ' ||
            (SELECT STRING_AGG(
                'SI ' || (r->>'question_id') || ' ' || COALESCE(r->>'operator', 'equals') || ' "' || COALESCE(r->>'value', '') || '"',
                ' ET '
            )
            FROM jsonb_array_elements(er.conditions->'rules') AS r)
        ELSE 'Type inconnu'
    END as regle_complete
FROM "EligibilityRules" er
INNER JOIN "ProduitEligible" pe ON pe.nom = er.produit_nom
WHERE er.is_active = true
  AND pe.active = true
ORDER BY er.produit_nom;

-- ============================================================================
-- PARTIE 3: FORMULES DE CALCUL PAR PRODUIT
-- ============================================================================

SELECT '' as ligne;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;
SELECT '🧮 PARTIE 3: FORMULES DE CALCUL' as titre;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;

SELECT 
    pe.nom as produit,
    pe.type_produit as type,
    pe.notes_affichage as notes,
    pe.formule_calcul->>'formula_display' as formule,
    CASE 
        WHEN pe.type_produit = 'qualitatif' THEN 
            'Avantages: ' || jsonb_array_length(pe.formule_calcul->'benefits')::text || ' bénéfices'
        ELSE 
            'Paramètres: ' || pe.parametres_requis::text
    END as details
FROM "ProduitEligible" pe
WHERE pe.active = true
ORDER BY 
    CASE WHEN pe.type_produit = 'financier' THEN 1 ELSE 2 END,
    pe.nom;

-- ============================================================================
-- PARTIE 4: MAPPING QUESTIONS → PRODUITS IMPACTÉS
-- ============================================================================

SELECT '' as ligne;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;
SELECT '🔗 PARTIE 4: QUELLES QUESTIONS INFLUENCENT QUELS PRODUITS' as titre;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;

WITH question_produits AS (
    -- Questions dans règles simples
    SELECT DISTINCT
        er.conditions->>'question_id' as qid,
        er.produit_nom
    FROM "EligibilityRules" er
    WHERE er.rule_type = 'simple' 
      AND er.is_active = true
      AND er.conditions->>'question_id' IS NOT NULL
    
    UNION
    
    -- Questions dans règles combinées
    SELECT DISTINCT
        r->>'question_id' as qid,
        er.produit_nom
    FROM "EligibilityRules" er,
         jsonb_array_elements(er.conditions->'rules') AS r
    WHERE er.rule_type = 'combined'
      AND er.is_active = true
      AND r->>'question_id' IS NOT NULL
)
SELECT 
    qq.question_id as question,
    LEFT(qq.question_text, 45) as texte,
    COALESCE(STRING_AGG(qp.produit_nom, ', ' ORDER BY qp.produit_nom), '(Aucun produit)') as produits_impactes
FROM "QuestionnaireQuestion" qq
LEFT JOIN question_produits qp ON qq.question_id = qp.qid
GROUP BY qq.question_id, qq.question_text, qq.question_order
ORDER BY qq.question_order;

-- ============================================================================
-- PARTIE 5: QUESTIONS CONDITIONNELLES ET LEURS DÉPENDANCES
-- ============================================================================

SELECT '' as ligne;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;
SELECT '🔀 PARTIE 5: QUESTIONS CONDITIONNELLES (9-12)' as titre;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;

SELECT 
    qq.question_order as ordre,
    qq.question_id as code,
    LEFT(qq.question_text, 40) as question,
    dep.question_id as depend_de,
    qq.conditions->>'value' as valeur_requise,
    CASE 
        WHEN qq.conditions IS NULL THEN '❌ Pas de condition'
        WHEN dep.id IS NULL THEN '❌ UUID invalide'
        ELSE '✅ Condition OK'
    END as statut
FROM "QuestionnaireQuestion" qq
LEFT JOIN "QuestionnaireQuestion" dep ON dep.id::text = qq.conditions->>'depends_on'
WHERE qq.question_order >= 9
ORDER BY qq.question_order;

-- ============================================================================
-- PARTIE 6: RÉSUMÉ STATISTIQUES
-- ============================================================================

SELECT '' as ligne;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;
SELECT '📊 PARTIE 6: STATISTIQUES FINALES' as titre;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;

SELECT 
    'Questions totales' as metrique,
    COUNT(*)::text as valeur
FROM "QuestionnaireQuestion"
UNION ALL
SELECT 
    'Questions conditionnelles',
    COUNT(*)::text
FROM "QuestionnaireQuestion"
WHERE conditions IS NOT NULL AND conditions != '{}'::jsonb
UNION ALL
SELECT 
    'Produits actifs',
    COUNT(*)::text
FROM "ProduitEligible"
WHERE active = true
UNION ALL
SELECT 
    'Produits financiers',
    COUNT(*)::text
FROM "ProduitEligible"
WHERE active = true AND type_produit = 'financier'
UNION ALL
SELECT 
    'Produits qualitatifs',
    COUNT(*)::text
FROM "ProduitEligible"
WHERE active = true AND type_produit = 'qualitatif'
UNION ALL
SELECT 
    'Règles d''éligibilité actives',
    COUNT(*)::text
FROM "EligibilityRules"
WHERE is_active = true
UNION ALL
SELECT 
    '✅ Produits avec règles',
    COUNT(DISTINCT produit_nom)::text
FROM "EligibilityRules"
WHERE is_active = true
UNION ALL
SELECT 
    '⚠️ Produits SANS règles',
    COUNT(*)::text
FROM "ProduitEligible" pe
WHERE pe.active = true 
  AND NOT EXISTS (
      SELECT 1 FROM "EligibilityRules" er 
      WHERE er.produit_nom = pe.nom AND er.is_active = true
  );

-- ============================================================================
-- PARTIE 7: VALIDATION FINALE - TOUT EST OK ?
-- ============================================================================

SELECT '' as ligne;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;
SELECT '✅ PARTIE 7: VALIDATION FINALE' as titre;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;

SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM "QuestionnaireQuestion") = 12 
        THEN '✅ 12 questions configurées'
        ELSE '❌ Nombre de questions incorrect: ' || (SELECT COUNT(*) FROM "QuestionnaireQuestion")::text
    END as check_questions
UNION ALL
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM "QuestionnaireQuestion" 
              WHERE question_order >= 9 
              AND (conditions IS NULL OR conditions = '{}'::jsonb)) = 0
        THEN '✅ Questions 9-12 ont toutes des conditions'
        ELSE '❌ Certaines questions 9-12 n''ont pas de conditions'
    END
UNION ALL
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM "ProduitEligible" pe 
              WHERE pe.active = true 
              AND NOT EXISTS (
                  SELECT 1 FROM "EligibilityRules" er 
                  WHERE er.produit_nom = pe.nom AND er.is_active = true
              )) = 0
        THEN '✅ Tous les produits actifs ont des règles'
        ELSE '❌ ' || (SELECT COUNT(*) FROM "ProduitEligible" pe 
              WHERE pe.active = true 
              AND NOT EXISTS (
                  SELECT 1 FROM "EligibilityRules" er 
                  WHERE er.produit_nom = pe.nom AND er.is_active = true
              ))::text || ' produit(s) sans règles'
    END
UNION ALL
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM "EligibilityRules" 
              WHERE produit_nom = 'DFS' AND rule_type = 'simple') = 1
        THEN '✅ DFS a une règle simple (Transport uniquement)'
        ELSE '❌ DFS a une règle incorrecte'
    END
UNION ALL
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM "EligibilityRules" 
              WHERE produit_nom = 'Logiciel Solid') = 1
        THEN '✅ Logiciel Solid a 1 règle (pas de doublon)'
        ELSE '❌ Logiciel Solid: ' || (SELECT COUNT(*) FROM "EligibilityRules" 
              WHERE produit_nom = 'Logiciel Solid')::text || ' règle(s)'
    END
UNION ALL
SELECT 
    CASE 
        WHEN (SELECT type_produit FROM "ProduitEligible" WHERE nom = 'Logiciel Solid') = 'qualitatif'
        THEN '✅ Logiciel Solid est qualitatif'
        ELSE '❌ Logiciel Solid n''est pas qualitatif'
    END;

-- ============================================================================
-- CONCLUSION
-- ============================================================================

SELECT '' as ligne;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;
SELECT '🎉 CONCLUSION' as titre;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;

SELECT 
    CASE 
        WHEN (
            SELECT COUNT(*) FROM (
                SELECT 1 WHERE (SELECT COUNT(*) FROM "QuestionnaireQuestion") != 12
                UNION ALL
                SELECT 1 WHERE EXISTS (
                    SELECT 1 FROM "QuestionnaireQuestion" 
                    WHERE question_order >= 9 
                    AND (conditions IS NULL OR conditions = '{}'::jsonb)
                )
                UNION ALL
                SELECT 1 WHERE EXISTS (
                    SELECT 1 FROM "ProduitEligible" pe 
                    WHERE pe.active = true 
                    AND NOT EXISTS (
                        SELECT 1 FROM "EligibilityRules" er 
                        WHERE er.produit_nom = pe.nom AND er.is_active = true
                    )
                )
            ) AS checks
        ) = 0
        THEN '✅✅✅ TOUT EST CORRECT - PRÊT À TESTER ✅✅✅'
        ELSE '⚠️ Il reste des problèmes à corriger'
    END as statut_final;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
/*
Si toutes les validations affichent ✅, alors:

1. 🔄 Redémarrer le serveur backend
   cd /Users/alex/Desktop/FinancialTracker/server
   npm run dev

2. 🧪 Tester le simulateur en navigation privée
   - Secteur: Transport et Logistique
   - Vérifier que les 12 questions s'affichent
   - Vérifier que les montants sont calculés

3. ✅ Vérifier les résultats attendus:
   PRODUITS FINANCIERS:
   - DFS: nb_chauffeurs × 150€ × 12
   - TICPE: litres × 0,20€ × 12
   - FONCIER: taxe × 20%
   - Optimisation Énergie: factures × 12 × 30%
   - URSSAF: employés × 35 000€ × 10%
   
   PRODUITS QUALITATIFS:
   - Logiciel Solid: Prix sur demande + 6 avantages
   - Chronotachygraphes: Avantages conformité
*/

