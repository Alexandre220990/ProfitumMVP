-- =====================================================
-- CORRIGER LOGICIEL SOLID - PRODUIT QUALITATIF TRANSPORT
-- =====================================================
-- Logiciel Solid devient un produit additionnel qualitatif
-- uniquement pour le secteur Transport et Logistique
-- Comme les Chronotachygraphes digitaux
-- =====================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1: SUPPRIMER LA RÈGLE EXISTANTE (si elle existe)
-- ============================================================================

DELETE FROM "EligibilityRules"
WHERE produit_nom = 'Logiciel Solid';

-- ============================================================================
-- ÉTAPE 2: CRÉER LA NOUVELLE RÈGLE - TRANSPORT UNIQUEMENT
-- ============================================================================

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

-- ============================================================================
-- ÉTAPE 3: TRANSFORMER EN PRODUIT QUALITATIF
-- ============================================================================

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

SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT 'VÉRIFICATION: LOGICIEL SOLID' as titre;

-- Vérifier le produit
SELECT 
    nom,
    type_produit,
    notes_affichage,
    formule_calcul->'benefits' as avantages_qualitatifs,
    formule_calcul->>'formula_display' as formule_affichee,
    parametres_requis,
    active,
    CASE 
        WHEN type_produit = 'qualitatif' 
         AND formule_calcul->>'type' = 'qualitatif'
         AND formule_calcul->'benefits' IS NOT NULL 
        THEN '✅ Produit qualitatif OK'
        ELSE '❌ Configuration incorrecte'
    END as statut
FROM "ProduitEligible"
WHERE nom = 'Logiciel Solid';

-- Vérifier la règle
SELECT 
    er.produit_nom,
    er.rule_type,
    er.conditions->>'question_id' as question_id,
    er.conditions->>'value' as valeur_requise,
    er.conditions->>'operator' as operateur,
    er.is_active,
    CASE 
        WHEN er.conditions->>'question_id' = 'GENERAL_001'
         AND er.conditions->>'value' = 'Transport et Logistique'
        THEN '✅ Règle correcte (Transport uniquement)'
        ELSE '❌ Règle incorrecte'
    END as statut
FROM "EligibilityRules" er
WHERE er.produit_nom = 'Logiciel Solid';

-- Comparaison avec Chronotachygraphes (même secteur)
SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT 'COMPARAISON: PRODUITS QUALITATIFS TRANSPORT' as titre;

SELECT 
    pe.nom as produit,
    pe.type_produit,
    er.conditions->>'question_id' as question_ref,
    er.conditions->>'value' as secteur_requis,
    CASE 
        WHEN pe.type_produit = 'qualitatif' 
        THEN '✅ Qualitatif'
        ELSE '⚠️ Financier'
    END as type_ok
FROM "ProduitEligible" pe
LEFT JOIN "EligibilityRules" er ON pe.nom = er.produit_nom AND er.is_active = true
WHERE pe.nom IN ('Logiciel Solid', 'Chronotachygraphes digitaux')
ORDER BY pe.nom;

-- Tous les produits avec leur nombre de règles
SELECT '═══════════════════════════════════════════════════════════════' as separator;
SELECT 'RÉSUMÉ: TOUS LES PRODUITS ACTIFS' as titre;

SELECT 
    pe.nom as produit,
    pe.type_produit as type,
    pe.active,
    COUNT(er.id) as nb_regles,
    CASE 
        WHEN COUNT(er.id) = 0 THEN '❌ Aucune règle'
        ELSE '✅ ' || COUNT(er.id) || ' règle(s)'
    END as statut
FROM "ProduitEligible" pe
LEFT JOIN "EligibilityRules" er ON pe.nom = er.produit_nom AND er.is_active = true
WHERE pe.active = true
GROUP BY pe.nom, pe.type_produit, pe.active
ORDER BY pe.nom;

COMMIT;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
/*
✅ Logiciel Solid est maintenant:
- Type: qualitatif
- Règle: Secteur = "Transport et Logistique"
- Notes: "Prix sur demande"
- Avantages:
  * Logiciel utilisé par l'inspection du travail
  * Gain de temps considérable
  * Conformité réglementaire garantie
  * Suivi temps réel des obligations légales
  * Sécurité juridique renforcée
  * Génération auto des documents obligatoires

Similaire aux Chronotachygraphes digitaux (produit additionnel Transport)
*/

