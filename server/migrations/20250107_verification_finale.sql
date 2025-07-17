-- =====================================================
-- VÉRIFICATION FINALE DE LA STRUCTURE OPTIMISÉE
-- Date: 2025-01-07
-- =====================================================

-- 1. Vue d'ensemble complète
SELECT 
    'VUE D''ENSEMBLE' as info,
    COUNT(*) as total_questions,
    COUNT(DISTINCT section) as nombre_sections,
    COUNT(DISTINCT phase) as nombre_phases
FROM "public"."QuestionnaireQuestion";

-- 2. Détail par section
SELECT 
    'DÉTAIL PAR SECTION' as info,
    section,
    COUNT(*) as nombre_questions,
    MIN(question_order) as ordre_min,
    MAX(question_order) as ordre_max,
    STRING_AGG(question_id, ', ' ORDER BY question_order) as questions
FROM "public"."QuestionnaireQuestion"
GROUP BY section
ORDER BY section;

-- 3. Questions pour utilisateur SANS véhicules (5 questions)
SELECT 
    'QUESTIONS SANS VÉHICULES' as info,
    question_id,
    question_text,
    section,
    phase
FROM "public"."QuestionnaireQuestion"
WHERE question_id IN ('GENERAL_001', 'GENERAL_002', 'GENERAL_003', 'GENERAL_004', 'GENERAL_005', 'GENERAL_999')
ORDER BY question_order;

-- 4. Questions conditionnelles TICPE (si véhicules)
SELECT 
    'QUESTIONS TICPE CONDITIONNELLES' as info,
    question_id,
    question_text,
    conditions->>'depends_on' as condition_affichage,
    phase
FROM "public"."QuestionnaireQuestion"
WHERE question_id LIKE 'TICPE_%'
ORDER BY question_order;

-- 5. Vérification des objectifs prioritaires
SELECT 
    'OBJECTIFS PRIORITAIRES' as info,
    question_id,
    question_text,
    options->>'choix' as choix_disponibles
FROM "public"."QuestionnaireQuestion"
WHERE question_id = 'GENERAL_999';

-- 6. Validation des règles sectorielles
SELECT 
    'RÈGLES SECTORIELLES' as info,
    question_id,
    question_text,
    produits_cibles
FROM "public"."QuestionnaireQuestion"
WHERE question_id = 'GENERAL_001'; 