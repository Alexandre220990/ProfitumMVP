-- =====================================================
-- LISTE COMPLÈTE: QUESTIONS → RÈGLES → PRODUITS
-- =====================================================

-- ============================================================================
-- PARTIE 1: TOUTES LES QUESTIONS AVEC LEURS CONDITIONS
-- ============================================================================

SELECT 
    '═══════════════════════════════════════════════════════════════' as separator,
    'PARTIE 1: QUESTIONS DU SIMULATEUR' as titre
UNION ALL
SELECT '═══════════════════════════════════════════════════════════════', '';

SELECT 
    qq.question_order as "#",
    qq.question_id as "Code",
    qq.question_text as "Texte de la question",
    qq.question_type as "Type",
    qq.section as "Section",
    qq.options->'choix' as "Choix disponibles",
    CASE 
        WHEN qq.conditions IS NULL OR qq.conditions = '{}'::jsonb THEN '✅ Toujours visible'
        ELSE '🔀 Conditionnelle: ' || 
             'SI ' || dep.question_id || 
             ' ' || (qq.conditions->>'operator') ||
             ' "' || (qq.conditions->>'value') || '"'
    END as "Condition d'affichage"
FROM "QuestionnaireQuestion" qq
LEFT JOIN "QuestionnaireQuestion" dep ON dep.id = (qq.conditions->>'depends_on')::uuid
ORDER BY qq.question_order;

-- ============================================================================
-- PARTIE 2: TOUS LES PRODUITS AVEC LEURS RÈGLES
-- ============================================================================

SELECT 
    '' as separator,
    '═══════════════════════════════════════════════════════════════' as titre
UNION ALL
SELECT 'PARTIE 2: PRODUITS ET RÈGLES D''ÉLIGIBILITÉ', '';

SELECT 
    pe.nom as "Produit",
    pe.type_produit as "Type",
    pe.active as "Actif",
    COUNT(er.id) as "Nb règles",
    STRING_AGG(
        CASE 
            WHEN er.rule_type = 'simple' THEN 
                '✓ ' || er.conditions->>'question_id' || 
                ' ' || COALESCE(er.conditions->>'operator', 'equals') || 
                ' "' || COALESCE(er.conditions->>'value', '') || '"'
            WHEN er.rule_type = 'combined' THEN
                '✓ Règle combinée (' || (er.conditions->>'operator') || '): ' ||
                (SELECT STRING_AGG(
                    r->>'question_id' || ' ' || COALESCE(r->>'operator', 'equals') || ' "' || COALESCE(r->>'value', '') || '"',
                    ' + '
                )
                FROM jsonb_array_elements(er.conditions->'rules') AS r)
            ELSE '? Type inconnu'
        END,
        ' ET '
        ORDER BY er.priority
    ) as "Règles d'éligibilité"
FROM "ProduitEligible" pe
LEFT JOIN "EligibilityRules" er ON pe.nom = er.produit_nom AND er.is_active = true
WHERE pe.active = true
GROUP BY pe.nom, pe.type_produit, pe.active
ORDER BY pe.nom;

-- ============================================================================
-- PARTIE 3: MAPPING QUESTIONS → PRODUITS ÉLIGIBLES
-- ============================================================================

SELECT 
    '' as separator,
    '═══════════════════════════════════════════════════════════════' as titre
UNION ALL
SELECT 'PARTIE 3: QUELLES QUESTIONS INFLUENCENT QUELS PRODUITS ?', '';

WITH question_produits AS (
    -- Questions dans les règles simples
    SELECT DISTINCT
        er.conditions->>'question_id' as qid,
        er.produit_nom
    FROM "EligibilityRules" er
    WHERE er.rule_type = 'simple' 
      AND er.is_active = true
      AND er.conditions->>'question_id' IS NOT NULL
    
    UNION
    
    -- Questions dans les règles combinées
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
    qq.question_id as "Question",
    qq.question_text as "Texte",
    STRING_AGG(qp.produit_nom, ', ' ORDER BY qp.produit_nom) as "Produits influencés"
FROM "QuestionnaireQuestion" qq
LEFT JOIN question_produits qp ON qq.question_id = qp.qid
GROUP BY qq.question_id, qq.question_text, qq.question_order
ORDER BY qq.question_order;

-- ============================================================================
-- PARTIE 4: FORMULES DE CALCUL PAR PRODUIT
-- ============================================================================

SELECT 
    '' as separator,
    '═══════════════════════════════════════════════════════════════' as titre
UNION ALL
SELECT 'PARTIE 4: FORMULES DE CALCUL ET PARAMÈTRES', '';

SELECT 
    pe.nom as "Produit",
    pe.type_produit as "Type",
    pe.notes_affichage as "Notes affichage",
    pe.formule_calcul->>'formula_display' as "Formule affichée",
    pe.parametres_requis as "Paramètres requis",
    CASE 
        WHEN pe.formule_calcul IS NULL THEN '❌ Pas de formule'
        WHEN pe.parametres_requis IS NULL THEN '⚠️ Pas de paramètres'
        ELSE '✅ Complet'
    END as "Statut formule"
FROM "ProduitEligible" pe
WHERE pe.active = true
ORDER BY pe.nom;

-- ============================================================================
-- PARTIE 5: VALIDATION CROISÉE - QUESTIONS REQUISES VS QUESTIONS EXISTANTES
-- ============================================================================

SELECT 
    '' as separator,
    '═══════════════════════════════════════════════════════════════' as titre
UNION ALL
SELECT 'PARTIE 5: VALIDATION - RÈGLES RÉFÉRENÇANT DES QUESTIONS INVALIDES', '';

WITH all_questions_in_rules AS (
    -- Questions dans règles simples
    SELECT DISTINCT
        er.produit_nom,
        er.conditions->>'question_id' as question_id_reference
    FROM "EligibilityRules" er
    WHERE er.rule_type = 'simple' 
      AND er.is_active = true
      AND er.conditions->>'question_id' IS NOT NULL
    
    UNION
    
    -- Questions dans règles combinées
    SELECT DISTINCT
        er.produit_nom,
        r->>'question_id' as question_id_reference
    FROM "EligibilityRules" er,
         jsonb_array_elements(er.conditions->'rules') AS r
    WHERE er.rule_type = 'combined'
      AND er.is_active = true
      AND r->>'question_id' IS NOT NULL
)
SELECT 
    aqr.produit_nom as "Produit",
    aqr.question_id_reference as "Question référencée",
    CASE 
        WHEN qq.question_id IS NULL THEN '❌ QUESTION INEXISTANTE'
        ELSE '✅ OK'
    END as "Statut"
FROM all_questions_in_rules aqr
LEFT JOIN "QuestionnaireQuestion" qq ON qq.question_id = aqr.question_id_reference
WHERE qq.question_id IS NULL
ORDER BY aqr.produit_nom;

-- Si vide, afficher un message de succès
SELECT 
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 
            FROM all_questions_in_rules aqr
            LEFT JOIN "QuestionnaireQuestion" qq ON qq.question_id = aqr.question_id_reference
            WHERE qq.question_id IS NULL
        ) THEN '✅ Toutes les règles référencent des questions valides'
        ELSE ''
    END as "Résultat validation";

-- ============================================================================
-- PARTIE 6: VALIDATION - VALEURS ATTENDUES VS CHOIX DISPONIBLES
-- ============================================================================

SELECT 
    '' as separator,
    '═══════════════════════════════════════════════════════════════' as titre
UNION ALL
SELECT 'PARTIE 6: VALIDATION - VALEURS DANS LES RÈGLES VS CHOIX DES QUESTIONS', '';

WITH rule_values AS (
    -- Valeurs dans règles simples
    SELECT DISTINCT
        er.produit_nom,
        er.conditions->>'question_id' as qid,
        er.conditions->>'value' as valeur_attendue,
        er.conditions->>'operator' as operateur
    FROM "EligibilityRules" er
    WHERE er.rule_type = 'simple' 
      AND er.is_active = true
      AND er.conditions->>'question_id' IS NOT NULL
    
    UNION
    
    -- Valeurs dans règles combinées
    SELECT DISTINCT
        er.produit_nom,
        r->>'question_id' as qid,
        r->>'value' as valeur_attendue,
        r->>'operator' as operateur
    FROM "EligibilityRules" er,
         jsonb_array_elements(er.conditions->'rules') AS r
    WHERE er.rule_type = 'combined'
      AND er.is_active = true
      AND r->>'question_id' IS NOT NULL
)
SELECT 
    rv.produit_nom as "Produit",
    rv.qid as "Question",
    rv.valeur_attendue as "Valeur attendue",
    rv.operateur as "Opérateur",
    qq.options->'choix' as "Choix disponibles",
    CASE 
        WHEN qq.question_type = 'nombre' THEN '✅ Question numérique (pas de validation)'
        WHEN qq.question_type = 'texte' THEN '✅ Question texte (pas de validation)'
        WHEN rv.operateur IN ('includes', 'not_equals') THEN '🔍 A vérifier manuellement'
        WHEN rv.operateur = 'equals' AND qq.options->'choix' @> to_jsonb(ARRAY[rv.valeur_attendue]) THEN '✅ OK'
        WHEN rv.operateur = 'equals' THEN '❌ VALEUR INEXISTANTE DANS LES CHOIX'
        ELSE '⚠️ Cas non géré'
    END as "Statut"
FROM rule_values rv
INNER JOIN "QuestionnaireQuestion" qq ON qq.question_id = rv.qid
WHERE qq.question_type IN ('choix_unique', 'choix_multiple')
ORDER BY rv.produit_nom, rv.qid;

-- ============================================================================
-- PARTIE 7: RÉSUMÉ FINAL
-- ============================================================================

SELECT 
    '' as separator,
    '═══════════════════════════════════════════════════════════════' as titre
UNION ALL
SELECT 'PARTIE 7: RÉSUMÉ FINAL', '';

SELECT 
    (SELECT COUNT(*) FROM "QuestionnaireQuestion") as "Total questions",
    (SELECT COUNT(*) FROM "QuestionnaireQuestion" WHERE conditions IS NOT NULL AND conditions != '{}'::jsonb) as "Questions conditionnelles",
    (SELECT COUNT(*) FROM "ProduitEligible" WHERE active = true) as "Produits actifs",
    (SELECT COUNT(*) FROM "EligibilityRules" WHERE is_active = true) as "Règles actives",
    (SELECT COUNT(DISTINCT produit_nom) FROM "EligibilityRules" WHERE is_active = true) as "Produits avec règles",
    (SELECT COUNT(*) FROM "ProduitEligible" pe 
     WHERE pe.active = true 
     AND NOT EXISTS (
         SELECT 1 FROM "EligibilityRules" er 
         WHERE er.produit_nom = pe.nom AND er.is_active = true
     )) as "⚠️ Produits SANS règles";

