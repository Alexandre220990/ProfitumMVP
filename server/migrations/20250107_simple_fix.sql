-- =====================================================
-- CORRECTION SIMPLIFIÉE
-- Date: 2025-01-07
-- =====================================================

-- 1. Supprimer la contrainte problématique sur phase
ALTER TABLE "public"."QuestionnaireQuestion" 
DROP CONSTRAINT IF EXISTS "QuestionnaireQuestion_phase_check";

-- 2. Nettoyer les anciennes questions
DELETE FROM "public"."QuestionnaireQuestion";

-- 3. Insérer les questions optimisées

-- SECTION "PRÉSENTATION GÉNÉRALE" (Questions communes à tous les produits)
INSERT INTO "public"."QuestionnaireQuestion" (
    question_id, question_order, question_text, question_type, 
    options, validation_rules, importance, conditions, 
    produits_cibles, phase, section
) VALUES 
-- Question 1: Secteur d'activité
('GENERAL_001', 1, 'Dans quel secteur d''activité exercez-vous principalement ?', 'choix_unique',
 '{"choix": [
    "Transport routier de marchandises",
    "Transport routier de voyageurs", 
    "Transport maritime",
    "Transport aérien",
    "Taxi / VTC",
    "BTP / Travaux publics",
    "Terrassement",
    "Assainissement",
    "Secteur Agricole",
    "Commerce",
    "Industrie",
    "Services",
    "Construction",
    "Autre"
  ]}',
 '{"required": true, "min_choices": 1, "max_choices": 1}',
 5, '{}', 
 ARRAY['TICPE', 'URSSAF', 'DFS', 'FONCIER', 'ENERGIE', 'CEE'], 
 1, 'presentation_generale'),

-- Question 2: Chiffre d'affaires
('GENERAL_002', 2, 'Quel est votre chiffre d''affaires annuel ?', 'choix_unique',
 '{"choix": [
    "Moins de 100 000€",
    "100 000€ - 500 000€", 
    "500 000€ - 1 000 000€",
    "1 000 000€ - 5 000 000€",
    "Plus de 5 000 000€"
  ]}',
 '{"required": true, "min_choices": 1, "max_choices": 1}',
 4, '{}',
 ARRAY['TICPE', 'URSSAF', 'DFS', 'FONCIER', 'ENERGIE', 'CEE'],
 1, 'presentation_generale'),

-- Question 3: Nombre d'employés
('GENERAL_003', 3, 'Combien d''employés avez-vous ?', 'choix_unique',
 '{"choix": [
    "Aucun",
    "1 à 5", 
    "6 à 20",
    "21 à 50",
    "Plus de 50"
  ]}',
 '{"required": true, "min_choices": 1, "max_choices": 1}',
 4, '{}',
 ARRAY['URSSAF', 'DFS'],
 1, 'presentation_generale'),

-- Question 4: Locaux professionnels
('GENERAL_004', 4, 'Êtes-vous propriétaire de vos locaux professionnels ?', 'choix_unique',
 '{"choix": [
    "Oui",
    "Non", 
    "Je ne sais pas"
  ]}',
 '{"required": true, "min_choices": 1, "max_choices": 1}',
 3, '{}',
 ARRAY['FONCIER'],
 1, 'presentation_generale'),

-- Question 5: Contrats énergie
('GENERAL_005', 5, 'Avez-vous des contrats d''électricité et/ou de gaz pour vos locaux ?', 'choix_unique',
 '{"choix": [
    "Oui",
    "Non"
  ]}',
 '{"required": true, "min_choices": 1, "max_choices": 1}',
 2, '{}',
 ARRAY['ENERGIE', 'CEE'],
 1, 'presentation_generale'),

-- Question finale: Objectifs prioritaires
('GENERAL_999', 99, 'Quels sont vos objectifs prioritaires en matière d''optimisation ?', 'choix_multiple',
 '{"choix": [
    "Réduire les coûts",
    "Améliorer mon fonctionnement global", 
    "Optimiser la fiscalité",
    "Gain de temps administratif",
    "Conformité réglementaire",
    "Autre"
  ]}',
 '{"required": false, "min_choices": 0, "max_choices": 6}',
 2, '{}',
 ARRAY['TICPE', 'URSSAF', 'DFS', 'FONCIER', 'ENERGIE', 'CEE'],
 6, 'objectifs_finaux');

-- SECTION "TICPE SPÉCIFIQUE" (Questions conditionnelles)
INSERT INTO "public"."QuestionnaireQuestion" (
    question_id, question_order, question_text, question_type,
    options, validation_rules, importance, conditions,
    produits_cibles, phase, section
) VALUES 
-- Question clé TICPE: Véhicules professionnels
('TICPE_001', 10, 'Possédez-vous des véhicules professionnels ?', 'choix_unique',
 '{"choix": ["Oui", "Non"]}',
 '{"required": true, "min_choices": 1, "max_choices": 1}',
 5, '{}',
 ARRAY['TICPE'], 1, 'ticpe_specifique'),

-- Questions conditionnelles (si véhicules)
('TICPE_002', 11, 'Combien de véhicules utilisez-vous pour votre activité ?', 'choix_unique',
 '{"choix": [
    "1 à 3 véhicules",
    "4 à 10 véhicules", 
    "11 à 25 véhicules",
    "Plus de 25 véhicules"
  ]}',
 '{"required": true, "min_choices": 1, "max_choices": 1, "depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 4, '{"depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 ARRAY['TICPE'], 2, 'ticpe_specifique'),

('TICPE_003', 12, 'Quels types de véhicules utilisez-vous ?', 'choix_multiple',
 '{"choix": [
    "Camions de plus de 7,5 tonnes",
    "Camions de 3,5 à 7,5 tonnes",
    "Véhicules utilitaires légers",
    "Engins de chantier",
    "Véhicules de service",
    "Véhicules de fonction",
    "Tracteurs agricoles",
    "Autre"
  ]}',
 '{"required": true, "min_choices": 1, "max_choices": 8, "depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 4, '{"depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 ARRAY['TICPE'], 2, 'ticpe_specifique'),

('TICPE_004', 13, 'Vos véhicules sont-ils équipés de chronotachygraphe ?', 'choix_unique',
 '{"choix": [
    "Oui, tous",
    "Oui, certains",
    "Non"
  ]}',
 '{"required": true, "min_choices": 1, "max_choices": 1, "depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 3, '{"depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 ARRAY['TICPE'], 2, 'ticpe_specifique'),

('TICPE_005', 14, 'Quelle est votre consommation annuelle de carburant ?', 'choix_unique',
 '{"choix": [
    "Moins de 5 000 litres",
    "5 000 à 15 000 litres",
    "15 000 à 50 000 litres",
    "Plus de 50 000 litres"
  ]}',
 '{"required": true, "min_choices": 1, "max_choices": 1, "depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 4, '{"depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 ARRAY['TICPE'], 3, 'ticpe_specifique'),

('TICPE_006', 15, 'Quels types de carburant utilisez-vous ?', 'choix_multiple',
 '{"choix": [
    "Gazole professionnel",
    "Gazole Non Routier (GNR)",
    "Essence",
    "GPL",
    "Électricité",
    "Autre"
  ]}',
 '{"required": true, "min_choices": 1, "max_choices": 6, "depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 3, '{"depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 ARRAY['TICPE'], 3, 'ticpe_specifique'),

('TICPE_007', 16, 'Avez-vous conservé vos factures de carburant des 3 dernières années ?', 'choix_unique',
 '{"choix": [
    "Oui, 3 dernières années complètes",
    "Oui, 2 dernières années",
    "Oui, 1 dernière année",
    "Partiellement",
    "Non"
  ]}',
 '{"required": true, "min_choices": 1, "max_choices": 1, "depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 3, '{"depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 ARRAY['TICPE'], 3, 'ticpe_specifique'),

('TICPE_008', 17, 'Quel est le pourcentage d''usage professionnel de vos véhicules ?', 'choix_unique',
 '{"choix": [
    "100% professionnel",
    "80-99% professionnel",
    "60-79% professionnel",
    "Moins de 60% professionnel"
  ]}',
 '{"required": true, "min_choices": 1, "max_choices": 1, "depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 4, '{"depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 ARRAY['TICPE'], 4, 'ticpe_specifique'),

('TICPE_009', 18, 'Quel est le kilométrage annuel moyen par véhicule ?', 'choix_unique',
 '{"choix": [
    "Moins de 10 000 km",
    "10 000 à 30 000 km",
    "30 000 à 60 000 km",
    "Plus de 60 000 km"
  ]}',
 '{"required": true, "min_choices": 1, "max_choices": 1, "depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 3, '{"depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 ARRAY['TICPE'], 4, 'ticpe_specifique'),

('TICPE_010', 19, 'Disposez-vous de cartes carburant professionnelles ?', 'choix_unique',
 '{"choix": [
    "Oui, toutes les stations",
    "Oui, partiellement",
    "Non"
  ]}',
 '{"required": true, "min_choices": 1, "max_choices": 1, "depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 3, '{"depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 ARRAY['TICPE'], 5, 'ticpe_specifique'),

('TICPE_011', 20, 'Conservez-vous les factures nominatives avec numéro d''immatriculation ?', 'choix_unique',
 '{"choix": [
    "Oui, systématiquement",
    "Oui, partiellement",
    "Non"
  ]}',
 '{"required": true, "min_choices": 1, "max_choices": 1, "depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 3, '{"depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 ARRAY['TICPE'], 5, 'ticpe_specifique'),

('TICPE_012', 21, 'Vos véhicules sont-ils tous immatriculés au nom de la société ?', 'choix_unique',
 '{"choix": [
    "Oui, 100%",
    "Oui, majoritairement",
    "Non"
  ]}',
 '{"required": true, "min_choices": 1, "max_choices": 1, "depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 3, '{"depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 ARRAY['TICPE'], 5, 'ticpe_specifique'),

('TICPE_013', 22, 'Faites-vous déjà une déclaration semestrielle ou annuelle de TICPE ?', 'choix_unique',
 '{"choix": [
    "Oui, régulièrement",
    "Oui, occasionnellement",
    "Non"
  ]}',
 '{"required": true, "min_choices": 1, "max_choices": 1, "depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 3, '{"depends_on": {"question_id": "TICPE_001", "answer": "Oui"}}',
 ARRAY['TICPE'], 5, 'ticpe_specifique'),

-- Question finale TICPE: Projets d'optimisation
('TICPE_014', 25, 'Avez-vous des projets d''optimisation fiscale en cours ?', 'choix_multiple',
 '{"choix": [
    "CIR (Crédit d''Impôt Recherche)",
    "CICE (Crédit d''Impôt Compétitivité Emploi)", 
    "Optimisation URSSAF",
    "Audit énergétique",
    "Aucun",
    "Autre"
  ]}',
 '{"required": false, "min_choices": 0, "max_choices": 6}',
 2, '{}',
 ARRAY['TICPE'], 6, 'ticpe_specifique');

-- 4. Vérifier l'insertion
SELECT 
    question_id,
    question_text,
    section,
    phase,
    produits_cibles
FROM "public"."QuestionnaireQuestion"
ORDER BY question_order; 