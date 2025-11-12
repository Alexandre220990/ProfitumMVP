-- =====================================================================
-- Mise à jour des questions Énergie : séparation gaz / électricité
-- =====================================================================
-- Objectifs :
--  1. Supprimer l'ancien couple de questions (GENERAL_005, CALCUL_ENERGIE_FACTURES)
--  2. Créer deux questions Oui/Non (gaz / électricité)
--  3. Créer deux questions conditionnelles pour les montants mensuels associés
--  4. Assurer un ordre cohérent et des règles de validation explicites
--
-- NOTE : les conditions utilisent les UUID générés pour les nouvelles questions.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Nettoyage des anciennes questions
-- ---------------------------------------------------------------------
DELETE FROM "QuestionnaireQuestion"
WHERE question_id IN ('GENERAL_005', 'CALCUL_ENERGIE_FACTURES');

-- ---------------------------------------------------------------------
-- 2. Question Gaz : Avez-vous des factures ?
-- ---------------------------------------------------------------------
WITH gaz_question AS (
  INSERT INTO "QuestionnaireQuestion" (
    question_id,
    question_text,
    question_type,
    question_order,
    section,
    options,
    validation_rules,
    importance,
    produits_cibles
  )
  VALUES (
    'ENERGIE_GAZ_FACTURES',
    'Avez-vous des factures de gaz ?',
    'choix_unique',
    6,
    'energie',
    jsonb_build_object(
      'choix', ARRAY['Oui', 'Non'],
      'placeholder', 'Sélectionnez une réponse'
    ),
    jsonb_build_object('required', true),
    2,
    ARRAY['optimisation_fournisseur_gaz']::text[]
  )
  RETURNING id
),

-- ---------------------------------------------------------------------
-- 3. Question Gaz : Montant mensuel conditionnel
-- ---------------------------------------------------------------------
gaz_amount AS (
  INSERT INTO "QuestionnaireQuestion" (
    question_id,
    question_text,
    question_type,
    question_order,
    section,
    options,
    validation_rules,
    importance,
    produits_cibles
  )
  VALUES (
    'ENERGIE_GAZ_MONTANT',
    'Quel est le montant payé chaque mois pour votre fournisseur de gaz actuel ?',
    'nombre',
    7,
    'energie',
    jsonb_build_object(
      'min', 0,
      'max', 1000000,
      'step', 50,
      'unite', '€',
      'placeholder', 'Ex: 1500'
    ),
    jsonb_build_object(
      'required', true,
      'min', 0
    ),
    2,
    ARRAY['optimisation_fournisseur_gaz']::text[]
  )
  RETURNING id
)
UPDATE "QuestionnaireQuestion"
SET conditions = jsonb_build_object(
    'depends_on', (SELECT id::text FROM gaz_question),
    'operator', 'equals',
    'value', 'Oui'
  )
WHERE id IN (SELECT id FROM gaz_amount);

-- ---------------------------------------------------------------------
-- 4. Question Électricité : Avez-vous des factures ?
-- ---------------------------------------------------------------------
WITH elec_question AS (
  INSERT INTO "QuestionnaireQuestion" (
    question_id,
    question_text,
    question_type,
    question_order,
    section,
    options,
    validation_rules,
    importance,
    produits_cibles
  )
  VALUES (
    'ENERGIE_ELEC_FACTURES',
    'Avez-vous des factures d''électricité ?',
    'choix_unique',
    8,
    'energie',
    jsonb_build_object(
      'choix', ARRAY['Oui', 'Non'],
      'placeholder', 'Sélectionnez une réponse'
    ),
    jsonb_build_object('required', true),
    2,
    ARRAY['optimisation_fournisseur_electricite']::text[]
  )
  RETURNING id
),

-- ---------------------------------------------------------------------
-- 5. Question Électricité : Montant mensuel conditionnel
-- ---------------------------------------------------------------------
elec_amount AS (
  INSERT INTO "QuestionnaireQuestion" (
    question_id,
    question_text,
    question_type,
    question_order,
    section,
    options,
    validation_rules,
    importance,
    produits_cibles
  )
  VALUES (
    'ENERGIE_ELEC_MONTANT',
    'Quel est le montant payé chaque mois pour votre fournisseur d''électricité actuel ?',
    'nombre',
    9,
    'energie',
    jsonb_build_object(
      'min', 0,
      'max', 1000000,
      'step', 50,
      'unite', '€',
      'placeholder', 'Ex: 2200'
    ),
    jsonb_build_object(
      'required', true,
      'min', 0
    ),
    2,
    ARRAY['optimisation_fournisseur_electricite']::text[]
  )
  RETURNING id
)
UPDATE "QuestionnaireQuestion"
SET conditions = jsonb_build_object(
    'depends_on', (SELECT id::text FROM elec_question),
    'operator', 'equals',
    'value', 'Oui'
  )
WHERE id IN (SELECT id FROM elec_amount);

COMMIT;

-- =====================================================================
-- FIN DU SCRIPT
-- =====================================================================

