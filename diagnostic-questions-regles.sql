-- =====================================================
-- DIAGNOSTIC COMPLET: QUESTIONS ET RÈGLES D'ÉLIGIBILITÉ
-- =====================================================

-- 1. LISTER TOUTES LES QUESTIONS ACTUELLES
SELECT 
    '=== QUESTIONS ACTUELLES ===' as section;

SELECT 
    id as uuid,
    question_id,
    question_text,
    question_order,
    section,
    question_type,
    options->'choix' as choix_disponibles
FROM "QuestionnaireQuestion"
ORDER BY question_order;

-- 2. LISTER TOUTES LES RÈGLES D'ÉLIGIBILITÉ
SELECT 
    '=== RÈGLES D''ÉLIGIBILITÉ ===' as section;

SELECT 
    produit_nom,
    rule_type,
    conditions,
    conditions->>'question_id' as question_id_reference,
    priority,
    is_active
FROM "EligibilityRules"
ORDER BY produit_nom, priority;

-- 3. VÉRIFIER L'ALIGNEMENT: RÈGLES QUI RÉFÉRENCENT DES QUESTIONS INEXISTANTES
SELECT 
    '=== ❌ RÈGLES AVEC QUESTION_ID INVALIDE ===' as section;

SELECT 
    er.produit_nom,
    er.conditions->>'question_id' as question_id_reference,
    er.conditions->>'value' as valeur_attendue,
    CASE 
        WHEN qq.question_id IS NULL THEN '❌ QUESTION INEXISTANTE'
        ELSE '✅ OK'
    END as status
FROM "EligibilityRules" er
LEFT JOIN "QuestionnaireQuestion" qq 
    ON er.conditions->>'question_id' = qq.question_id
WHERE er.conditions->>'question_id' IS NOT NULL
  AND qq.question_id IS NULL
ORDER BY er.produit_nom;

-- 4. VÉRIFIER QUE LES VALEURS ATTENDUES EXISTENT DANS LES CHOIX
SELECT 
    '=== ⚠️ RÈGLES AVEC VALEUR INEXISTANTE DANS LES CHOIX ===' as section;

SELECT 
    er.produit_nom,
    er.conditions->>'question_id' as question_id,
    er.conditions->>'value' as valeur_attendue,
    qq.options->'choix' as choix_disponibles,
    CASE 
        WHEN er.conditions->>'operator' = 'equals' THEN
            CASE 
                WHEN qq.options->'choix' @> to_jsonb(ARRAY[er.conditions->>'value']) THEN '✅ OK'
                ELSE '❌ VALEUR INEXISTANTE'
            END
        WHEN er.conditions->>'operator' = 'includes' THEN '🔍 A vérifier manuellement (choix multiple)'
        ELSE '⚠️ Opérateur inconnu'
    END as status
FROM "EligibilityRules" er
INNER JOIN "QuestionnaireQuestion" qq 
    ON er.conditions->>'question_id' = qq.question_id
WHERE er.conditions->>'question_id' IS NOT NULL
ORDER BY er.produit_nom;

-- 5. LISTER LES PRODUITS ET LEURS FORMULES DE CALCUL
SELECT 
    '=== PRODUITS ET FORMULES ===' as section;

SELECT 
    nom,
    type_produit,
    notes_affichage,
    formule_calcul,
    parametres_requis,
    active
FROM "ProduitEligible"
WHERE active = true
ORDER BY nom;

-- 6. COMPTER LES RÈGLES PAR PRODUIT
SELECT 
    '=== NOMBRE DE RÈGLES PAR PRODUIT ===' as section;

SELECT 
    pe.nom as produit,
    COUNT(er.id) as nb_regles,
    CASE 
        WHEN COUNT(er.id) = 0 THEN '❌ Aucune règle'
        WHEN COUNT(er.id) = 1 THEN '✅ 1 règle'
        ELSE '📊 ' || COUNT(er.id) || ' règles'
    END as status
FROM "ProduitEligible" pe
LEFT JOIN "EligibilityRules" er ON pe.nom = er.produit_nom
WHERE pe.active = true
GROUP BY pe.nom
ORDER BY pe.nom;

-- 7. DÉTAILS DES RÈGLES COMPLEXES (ET/OU)
SELECT 
    '=== RÈGLES COMPLEXES (ET/OU) ===' as section;

SELECT 
    produit_nom,
    rule_type,
    conditions->'rules' as sous_regles,
    jsonb_array_length(conditions->'rules') as nb_sous_regles
FROM "EligibilityRules"
WHERE rule_type IN ('AND', 'OR')
ORDER BY produit_nom;

