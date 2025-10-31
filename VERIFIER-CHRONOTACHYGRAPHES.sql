-- =====================================================
-- VÉRIFICATION COMPLÈTE: CHRONOTACHYGRAPHES DIGITAUX
-- =====================================================

-- ============================================================================
-- PARTIE 1: CONFIGURATION PRODUIT
-- ============================================================================

SELECT '═══════════════════════════════════════════════════════════════' as ligne;
SELECT '📦 PRODUIT: CHRONOTACHYGRAPHES DIGITAUX' as titre;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;

SELECT 
    nom,
    type_produit,
    active,
    notes_affichage,
    formule_calcul,
    formule_calcul->>'type' as type_formule,
    formule_calcul->>'formula_display' as formule_affichee,
    formule_calcul->'benefits' as avantages_qualitatifs,
    parametres_requis,
    CASE 
        WHEN type_produit = 'qualitatif' 
         AND formule_calcul->>'type' = 'qualitatif'
         AND formule_calcul->'benefits' IS NOT NULL
        THEN '✅ Produit qualitatif OK'
        ELSE '❌ Configuration incorrecte'
    END as statut_config
FROM "ProduitEligible"
WHERE nom = 'Chronotachygraphes digitaux';

-- ============================================================================
-- PARTIE 2: RÈGLES D'ÉLIGIBILITÉ
-- ============================================================================

SELECT '' as ligne;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;
SELECT '🎯 RÈGLES D''ÉLIGIBILITÉ' as titre;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;

SELECT 
    er.produit_nom,
    er.rule_type,
    er.conditions,
    er.conditions->>'question_id' as question_id,
    er.conditions->>'value' as valeur_requise,
    er.conditions->>'operator' as operateur,
    er.priority,
    er.is_active,
    CASE 
        WHEN er.rule_type = 'simple' THEN 
            'SI ' || (er.conditions->>'question_id') || ' ' || 
            COALESCE(er.conditions->>'operator', 'equals') || ' "' || 
            (er.conditions->>'value') || '"'
        ELSE 'Type: ' || er.rule_type
    END as regle_lisible
FROM "EligibilityRules" er
WHERE er.produit_nom = 'Chronotachygraphes digitaux'
ORDER BY er.priority;

-- ============================================================================
-- PARTIE 3: QUESTION RÉFÉRENCÉE
-- ============================================================================

SELECT '' as ligne;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;
SELECT '📋 QUESTION RÉFÉRENCÉE: TICPE_003' as titre;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;

SELECT 
    qq.question_id,
    qq.question_order,
    qq.question_text,
    qq.question_type,
    qq.section,
    qq.options->'choix' as choix_disponibles,
    qq.conditions,
    CASE 
        WHEN qq.conditions IS NULL OR qq.conditions = '{}'::jsonb 
        THEN '⚠️ Toujours visible'
        ELSE '✅ Conditionnelle: SI ' || dep.question_id || ' = "' || (qq.conditions->>'value') || '"'
    END as affichage
FROM "QuestionnaireQuestion" qq
LEFT JOIN "QuestionnaireQuestion" dep ON dep.id::text = qq.conditions->>'depends_on'
WHERE qq.question_id = 'TICPE_003';

-- ============================================================================
-- PARTIE 4: VALIDATION DE LA VALEUR DANS LA RÈGLE
-- ============================================================================

SELECT '' as ligne;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;
SELECT '✅ VALIDATION: VALEUR DANS LES CHOIX' as titre;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;

SELECT 
    er.produit_nom,
    er.conditions->>'value' as valeur_attendue,
    qq.options->'choix' as choix_disponibles,
    CASE 
        WHEN qq.options->'choix' @> to_jsonb(ARRAY[er.conditions->>'value']) 
        THEN '✅ Valeur existe dans les choix'
        ELSE '❌ Valeur inexistante dans les choix'
    END as validation
FROM "EligibilityRules" er
INNER JOIN "QuestionnaireQuestion" qq ON qq.question_id = er.conditions->>'question_id'
WHERE er.produit_nom = 'Chronotachygraphes digitaux';

-- ============================================================================
-- PARTIE 5: FLUX UTILISATEUR COMPLET
-- ============================================================================

SELECT '' as ligne;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;
SELECT '🔄 FLUX UTILISATEUR' as titre;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;

-- Questions TICPE dans l'ordre
SELECT 
    qq.question_order as ordre,
    qq.question_id as code,
    qq.question_text,
    CASE 
        WHEN qq.conditions IS NULL OR qq.conditions = '{}'::jsonb 
        THEN '1. Toujours posée'
        ELSE '2. SI ' || dep.question_id || ' = "' || (qq.conditions->>'value') || '"'
    END as quand_affichee
FROM "QuestionnaireQuestion" qq
LEFT JOIN "QuestionnaireQuestion" dep ON dep.id::text = qq.conditions->>'depends_on'
WHERE qq.question_id LIKE 'TICPE%'
ORDER BY qq.question_order;

-- ============================================================================
-- PARTIE 6: SCÉNARIO DE TEST
-- ============================================================================

SELECT '' as ligne;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;
SELECT '🧪 SCÉNARIO DE TEST' as titre;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;

SELECT 
    'POUR QUE CHRONOTACHYGRAPHES SOIT ÉLIGIBLE:' as etape
UNION ALL
SELECT ''
UNION ALL
SELECT '1. Question TICPE_001 (ordre 6): "Possédez-vous des véhicules professionnels ?"'
UNION ALL
SELECT '   → Répondre: OUI'
UNION ALL
SELECT ''
UNION ALL
SELECT '2. Question TICPE_003 (ordre 7): "Quels types de véhicules utilisez-vous ?"'
UNION ALL
SELECT '   → S''affiche car TICPE_001 = "Oui"'
UNION ALL
SELECT '   → Répondre: "Camions de plus de 7,5 tonnes" (cocher cette option)'
UNION ALL
SELECT ''
UNION ALL
SELECT '3. Règle d''éligibilité:'
UNION ALL
SELECT '   → SI TICPE_003 INCLUDES "Camions de plus de 7,5 tonnes"'
UNION ALL
SELECT '   → Produit devient ÉLIGIBLE ✅'
UNION ALL
SELECT ''
UNION ALL
SELECT '4. Type de produit: QUALITATIF'
UNION ALL
SELECT '   → Pas de montant financier'
UNION ALL
SELECT '   → Affiche 6 bénéfices qualitatifs'
UNION ALL
SELECT '   → "Bénéfices en temps et conformité"';

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

SELECT '' as ligne;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;
SELECT '📊 RÉSUMÉ CHRONOTACHYGRAPHES' as titre;
SELECT '═══════════════════════════════════════════════════════════════' as ligne;

SELECT 
    'Type produit' as critere,
    (SELECT type_produit FROM "ProduitEligible" WHERE nom = 'Chronotachygraphes digitaux') as valeur,
    CASE 
        WHEN (SELECT type_produit FROM "ProduitEligible" WHERE nom = 'Chronotachygraphes digitaux') = 'qualitatif'
        THEN '✅'
        ELSE '❌'
    END as ok
UNION ALL
SELECT 
    'Secteur cible',
    'Transport et Logistique (implicite via TICPE_003)',
    '✅'
UNION ALL
SELECT 
    'Condition',
    'Types véhicules INCLUDES "Camions de plus de 7,5 tonnes"',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM "EligibilityRules" 
            WHERE produit_nom = 'Chronotachygraphes digitaux'
              AND conditions->>'question_id' = 'TICPE_003'
              AND conditions->>'value' = 'Camions de plus de 7,5 tonnes'
              AND conditions->>'operator' = 'includes'
        ) THEN '✅'
        ELSE '❌'
    END
UNION ALL
SELECT 
    'Question TICPE_003',
    'Conditionnelle (SI véhicules = Oui)',
    CASE 
        WHEN (SELECT conditions->>'depends_on' FROM "QuestionnaireQuestion" WHERE question_id = 'TICPE_003') IS NOT NULL
        THEN '✅'
        ELSE '❌'
    END
UNION ALL
SELECT 
    'Avantages qualitatifs',
    (SELECT jsonb_array_length(formule_calcul->'benefits')::text || ' bénéfices' 
     FROM "ProduitEligible" WHERE nom = 'Chronotachygraphes digitaux'),
    '✅';

