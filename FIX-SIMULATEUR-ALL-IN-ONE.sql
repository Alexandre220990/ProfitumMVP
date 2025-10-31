-- =====================================================
-- FIX SIMULATEUR - TOUT EN UN (ALL-IN-ONE)
-- =====================================================
-- Ce script corrige tous les problèmes dans le bon ordre :
-- 1. Nettoie les conditions incorrectes
-- 2. Ajoute les nouvelles conditions avec UUID
-- 3. Ajoute règle et formule pour Logiciel Solid
-- 4. Vérifie que tout est correct
-- =====================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1: NETTOYER LES CONDITIONS INCORRECTES (avec question_id au lieu d'UUID)
-- ============================================================================

SELECT '🧹 ÉTAPE 1: Nettoyage des conditions incorrectes...' as etape;

UPDATE "QuestionnaireQuestion"
SET conditions = NULL
WHERE question_id IN ('TICPE_002', 'DFS_001', 'FONCIER_001', 'ENERGIE_001');

-- ============================================================================
-- ÉTAPE 2: AJOUTER LES NOUVELLES CONDITIONS AVEC UUID
-- ============================================================================

SELECT '✏️ ÉTAPE 2: Ajout des conditions avec UUID...' as etape;

-- TICPE_002 (litres carburant) - Afficher SI TICPE_001 = "Oui"
UPDATE "QuestionnaireQuestion"
SET conditions = jsonb_build_object(
    'depends_on', (SELECT id::text FROM "QuestionnaireQuestion" WHERE question_id = 'TICPE_001'),
    'value', 'Oui',
    'operator', 'equals'
)
WHERE question_id = 'TICPE_002';

-- DFS_001 (nb chauffeurs) - Afficher SI GENERAL_001 = "Transport et Logistique"
UPDATE "QuestionnaireQuestion"
SET conditions = jsonb_build_object(
    'depends_on', (SELECT id::text FROM "QuestionnaireQuestion" WHERE question_id = 'GENERAL_001'),
    'value', 'Transport et Logistique',
    'operator', 'equals'
)
WHERE question_id = 'DFS_001';

-- FONCIER_001 (taxe foncière) - Afficher SI GENERAL_004 = "Oui"
UPDATE "QuestionnaireQuestion"
SET conditions = jsonb_build_object(
    'depends_on', (SELECT id::text FROM "QuestionnaireQuestion" WHERE question_id = 'GENERAL_004'),
    'value', 'Oui',
    'operator', 'equals'
)
WHERE question_id = 'FONCIER_001';

-- ENERGIE_001 (factures énergie) - Afficher SI GENERAL_005 = "Oui"
UPDATE "QuestionnaireQuestion"
SET conditions = jsonb_build_object(
    'depends_on', (SELECT id::text FROM "QuestionnaireQuestion" WHERE question_id = 'GENERAL_005'),
    'value', 'Oui',
    'operator', 'equals'
)
WHERE question_id = 'ENERGIE_001';

-- ============================================================================
-- ÉTAPE 3: CONFIGURER LOGICIEL SOLID - PRODUIT QUALITATIF TRANSPORT
-- ============================================================================

SELECT '📋 ÉTAPE 3: Configuration Logiciel Solid (qualitatif Transport)...' as etape;

-- Supprimer l'ancienne règle si elle existe
DELETE FROM "EligibilityRules"
WHERE produit_nom = 'Logiciel Solid';

-- Logiciel Solid : Éligible uniquement pour secteur Transport et Logistique
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
        'question_id', 'GENERAL_001',
        'value', 'Transport et Logistique',
        'operator', 'equals'
    ),
    1,
    true,
    NOW(),
    NOW()
FROM "ProduitEligible" pe
WHERE pe.nom = 'Logiciel Solid';

-- Transformer en produit qualitatif avec avantages
UPDATE "ProduitEligible"
SET 
    type_produit = 'qualitatif',
    notes_affichage = 'Prix sur demande - Logiciel utilisé par l''inspection du travail',
    formule_calcul = jsonb_build_object(
        'type', 'qualitatif',
        'benefits', jsonb_build_array(
            '⚖️ Logiciel utilisé et validé par l''inspection du travail',
            '⏱️ Gain de temps considérable dans la gestion administrative',
            '✅ Conformité réglementaire garantie',
            '📊 Suivi en temps réel de vos obligations légales',
            '🔒 Sécurité juridique renforcée',
            '📑 Génération automatique des documents obligatoires'
        ),
        'formula_display', 'Prix sur demande'
    ),
    parametres_requis = '["secteur"]'::jsonb
WHERE nom = 'Logiciel Solid';

-- ============================================================================
-- VÉRIFICATIONS
-- ============================================================================

SELECT '' as separator, '═══════════════════════════════════════════════════════════════' as titre
UNION ALL
SELECT 'VÉRIFICATION 1: CONDITIONS DES QUESTIONS 9-12 (AVEC UUID)', '';

SELECT 
    qq.question_id,
    qq.question_order,
    LEFT(qq.question_text, 40) || '...' as question_text,
    qq.conditions->>'depends_on' as uuid_depends_on,
    dep.question_id as question_parente,
    qq.conditions->>'value' as valeur_requise,
    CASE 
        WHEN qq.conditions IS NULL THEN '❌ NULL'
        WHEN LENGTH(qq.conditions->>'depends_on') < 30 THEN '❌ Pas un UUID'
        WHEN dep.id IS NULL THEN '❌ UUID invalide'
        ELSE '✅ OK'
    END as statut
FROM "QuestionnaireQuestion" qq
LEFT JOIN "QuestionnaireQuestion" dep 
    ON dep.id::text = qq.conditions->>'depends_on'
WHERE qq.question_id IN ('TICPE_002', 'DFS_001', 'FONCIER_001', 'ENERGIE_001')
ORDER BY qq.question_order;

SELECT '' as separator, '═══════════════════════════════════════════════════════════════' as titre
UNION ALL
SELECT 'VÉRIFICATION 2: TOUS LES PRODUITS ACTIFS ONT DES RÈGLES', '';

SELECT 
    pe.nom as produit,
    pe.active,
    COUNT(er.id) as nb_regles,
    CASE 
        WHEN COUNT(er.id) = 0 THEN '❌ Aucune règle'
        ELSE '✅ ' || COUNT(er.id) || ' règle(s)'
    END as statut
FROM "ProduitEligible" pe
LEFT JOIN "EligibilityRules" er ON pe.nom = er.produit_nom AND er.is_active = true
WHERE pe.active = true
GROUP BY pe.nom, pe.active
ORDER BY pe.nom;

SELECT '' as separator, '═══════════════════════════════════════════════════════════════' as titre
UNION ALL
SELECT 'VÉRIFICATION 3: LOGICIEL SOLID (QUALITATIF TRANSPORT)', '';

SELECT 
    nom,
    type_produit,
    formule_calcul->>'formula_display' as formule,
    formule_calcul->'benefits' as avantages,
    notes_affichage,
    CASE 
        WHEN type_produit = 'qualitatif' 
         AND formule_calcul->>'type' = 'qualitatif'
         AND formule_calcul->'benefits' IS NOT NULL 
        THEN '✅ Produit qualitatif OK'
        ELSE '❌ Configuration incorrecte'
    END as statut
FROM "ProduitEligible"
WHERE nom = 'Logiciel Solid';

-- Vérifier la règle Transport
SELECT 
    er.produit_nom,
    er.conditions->>'question_id' as question,
    er.conditions->>'value' as secteur_requis,
    CASE 
        WHEN er.conditions->>'value' = 'Transport et Logistique'
        THEN '✅ Règle Transport OK'
        ELSE '❌ Règle incorrecte'
    END as statut_regle
FROM "EligibilityRules" er
WHERE er.produit_nom = 'Logiciel Solid';

SELECT '' as separator, '═══════════════════════════════════════════════════════════════' as titre
UNION ALL
SELECT 'RÉSUMÉ FINAL', '';

SELECT 
    (SELECT COUNT(*) FROM "QuestionnaireQuestion") as total_questions,
    (SELECT COUNT(*) FROM "QuestionnaireQuestion" 
     WHERE conditions IS NOT NULL AND conditions != '{}'::jsonb) as questions_conditionnelles,
    (SELECT COUNT(*) FROM "ProduitEligible" WHERE active = true) as produits_actifs,
    (SELECT COUNT(DISTINCT produit_nom) FROM "EligibilityRules" WHERE is_active = true) as produits_avec_regles,
    CASE 
        WHEN (SELECT COUNT(*) FROM "ProduitEligible" pe 
              WHERE pe.active = true 
              AND NOT EXISTS (
                  SELECT 1 FROM "EligibilityRules" er 
                  WHERE er.produit_nom = pe.nom AND er.is_active = true
              )) = 0 
        THEN '✅ Tous les produits ont des règles'
        ELSE '❌ ' || (SELECT COUNT(*) FROM "ProduitEligible" pe 
              WHERE pe.active = true 
              AND NOT EXISTS (
                  SELECT 1 FROM "EligibilityRules" er 
                  WHERE er.produit_nom = pe.nom AND er.is_active = true
              )) || ' produit(s) sans règles'
    END as statut_regles;

COMMIT;

-- ============================================================================
-- INSTRUCTIONS POST-EXÉCUTION
-- ============================================================================
/*
✅ Script exécuté avec succès !

PROCHAINES ÉTAPES :

1. 🔄 Redémarrer le serveur backend
   cd /Users/alex/Desktop/FinancialTracker/server
   npm run dev

2. 🧪 Tester le simulateur en mode anonyme
   - Ouvrir en navigation privée
   - Aller sur /simulateur-eligibilite
   - Répondre aux questions suivantes pour déclencher TOUTES les questions de calcul :
     * GENERAL_001: "Transport et Logistique"
     * GENERAL_002: "500 000€ - 1 000 000€"
     * GENERAL_003: "21 à 50"
     * GENERAL_004: "Oui"
     * GENERAL_005: "Oui"
     * TICPE_001: "Oui"
     * TICPE_003: ["Camions de plus de 7,5 tonnes"]
     * RECOUVR_001: "Non"
   
3. ✅ Vérifier que les questions 9-12 s'affichent :
   - TICPE_002 (litres carburant) - car TICPE_001 = "Oui"
   - DFS_001 (nb chauffeurs) - car secteur = "Transport et Logistique"
   - FONCIER_001 (taxe foncière) - car propriétaire = "Oui"
   - ENERGIE_001 (factures énergie) - car contrats = "Oui"

4. ✅ Vérifier les résultats avec montants > 0€
   - DFS: montant calculé
   - TICPE: montant calculé
   - FONCIER: montant calculé
   - Optimisation Énergie: montant calculé
   - Logiciel Solid: 1500€
*/

