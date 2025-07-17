-- =====================================================
-- CORRECTION DES QUESTIONS DU SIMULATEUR D'ÉLIGIBILITÉ
-- Date: 2025-01-07
-- =====================================================

-- Nettoyer les questions existantes
DELETE FROM "public"."QuestionnaireQuestion";

-- Insérer les questions corrigées
INSERT INTO "public"."QuestionnaireQuestion" (
    question_order,
    question_text,
    question_type,
    options,
    validation_rules,
    importance,
    conditions,
    produits_cibles,
    phase
) VALUES 
-- Question 1: Secteur d'activité
(1, 'Dans quel secteur d''activité exercez-vous principalement ?', 'choix_unique', 
 '{"choix": ["Transport routier", "Transport maritime", "Transport aérien", "Commerce", "Industrie", "Services", "Construction", "Agriculture", "Autre"]}',
 '{}', 5, '{}', ARRAY['TICPE', 'URSSAF', 'DFS'], 1),

-- Question 2: Chiffre d'affaires
(2, 'Quel est votre chiffre d''affaires annuel ?', 'choix_unique',
 '{"choix": ["Moins de 100 000€", "100 000€ - 500 000€", "500 000€ - 1 000 000€", "1 000 000€ - 5 000 000€", "Plus de 5 000 000€"]}',
 '{}', 4, '{}', ARRAY['TICPE', 'URSSAF', 'DFS', 'FONCIER'], 1),

-- Question 3: Nombre d'employés
(3, 'Combien d''employés avez-vous ?', 'choix_unique',
 '{"choix": ["Aucun", "1 à 5", "6 à 20", "21 à 50", "Plus de 50"]}',
 '{}', 4, '{}', ARRAY['URSSAF', 'DFS'], 1),

-- Question 4: Véhicules professionnels
(4, 'Possédez-vous des véhicules professionnels ?', 'choix_unique',
 '{"choix": ["Oui", "Non"]}',
 '{}', 3, '{}', ARRAY['TICPE'], 1),

-- Question 5: Nombre de véhicules (si oui à la question 4)
(5, 'Combien de véhicules utilisez-vous pour votre activité ?', 'nombre',
 '{"placeholder": "Nombre de véhicules", "min": 0, "max": 1000, "unite": "véhicules"}',
 '{}', 3, '{"depends_on": {"question_id": 4, "answer": "Oui"}}', ARRAY['TICPE'], 1),

-- Question 6: Poids lourds
(6, 'Avez-vous des véhicules de plus de 3,5 tonnes ?', 'choix_unique',
 '{"choix": ["Oui", "Non"]}',
 '{}', 3, '{"depends_on": {"question_id": 4, "answer": "Oui"}}', ARRAY['TICPE'], 1),

-- Question 7: Consommation carburant
(7, 'Quelle est votre consommation annuelle de carburant (en litres) ?', 'nombre',
 '{"placeholder": "Consommation en litres", "min": 0, "max": 1000000, "unite": "litres"}',
 '{}', 3, '{"depends_on": {"question_id": 4, "answer": "Oui"}}', ARRAY['TICPE'], 1),

-- Question 8: Factures carburant
(8, 'Avez-vous conservé vos factures de carburant des 3 dernières années ?', 'choix_unique',
 '{"choix": ["Oui, toutes", "Oui, partiellement", "Non"]}',
 '{}', 2, '{"depends_on": {"question_id": 4, "answer": "Oui"}}', ARRAY['TICPE'], 1),

-- Question 9: Locaux professionnels
(9, 'Êtes-vous propriétaire de vos locaux professionnels ?', 'choix_unique',
 '{"choix": ["Oui", "Non", "Je ne sais pas"]}',
 '{}', 3, '{}', ARRAY['FONCIER'], 1),

-- Question 10: Taxe foncière
(10, 'Payez-vous une taxe foncière sur vos locaux ?', 'choix_unique',
 '{"choix": ["Oui", "Non", "Je ne sais pas"]}',
 '{}', 3, '{"depends_on": {"question_id": 9, "answer": "Oui"}}', ARRAY['FONCIER'], 1),

-- Question 11: Montant taxe foncière
(11, 'Quel est le montant annuel de votre taxe foncière (en euros) ?', 'nombre',
 '{"placeholder": "Montant en euros", "min": 0, "max": 100000, "unite": "€"}',
 '{}', 2, '{"depends_on": {"question_id": 10, "answer": "Oui"}}', ARRAY['FONCIER'], 1),

-- Question 12: Surface locaux
(12, 'Quelle est la surface totale de vos locaux professionnels (en m²) ?', 'nombre',
 '{"placeholder": "Surface en m²", "min": 0, "max": 100000, "unite": "m²"}',
 '{}', 2, '{"depends_on": {"question_id": 9, "answer": "Oui"}}', ARRAY['FONCIER'], 1),

-- Question 13: Contrats spécifiques
(13, 'Avez-vous des employés avec des contrats spécifiques ?', 'choix_multiple',
 '{"choix": ["Heures supplémentaires", "Travail temporaire", "Intérim", "Saisonniers", "Déplacements fréquents", "Aucun"]}',
 '{}', 3, '{"depends_on": {"question_id": 3, "answer": ["1 à 5", "6 à 20", "21 à 50", "Plus de 50"]}}', ARRAY['URSSAF', 'DFS'], 1),

-- Question 14: Masse salariale
(14, 'Quelle est votre masse salariale annuelle (en euros) ?', 'nombre',
 '{"placeholder": "Masse salariale en euros", "min": 0, "max": 10000000, "unite": "€"}',
 '{}', 3, '{"depends_on": {"question_id": 3, "answer": ["1 à 5", "6 à 20", "21 à 50", "Plus de 50"]}}', ARRAY['URSSAF'], 1),

-- Question 15: Bordereaux URSSAF
(15, 'Avez-vous accès à vos bordereaux URSSAF récents ?', 'choix_unique',
 '{"choix": ["Oui", "Non", "Partiellement"]}',
 '{}', 2, '{"depends_on": {"question_id": 3, "answer": ["1 à 5", "6 à 20", "21 à 50", "Plus de 50"]}}', ARRAY['URSSAF'], 1),

-- Question 16: Secteur DFS
(16, 'Dans quel secteur opèrent vos salariés ?', 'choix_multiple',
 '{"choix": ["BTP", "Transport", "Sécurité", "Spectacle", "Restauration", "Commerce", "Services", "Autre"]}',
 '{}', 3, '{"depends_on": {"question_id": 3, "answer": ["1 à 5", "6 à 20", "21 à 50", "Plus de 50"]}}', ARRAY['DFS'], 1),

-- Question 17: DFS actuelle
(17, 'Appliquez-vous actuellement une DFS sur vos bulletins de paie ?', 'choix_unique',
 '{"choix": ["Oui", "Non", "Je ne sais pas"]}',
 '{}', 2, '{"depends_on": {"question_id": 3, "answer": ["1 à 5", "6 à 20", "21 à 50", "Plus de 50"]}}', ARRAY['DFS'], 1),

-- Question 18: Contrats énergie
(18, 'Avez-vous des contrats d''électricité et/ou de gaz pour vos locaux ?', 'choix_unique',
 '{"choix": ["Oui", "Non"]}',
 '{}', 2, '{}', ARRAY['ENERGIE'], 1),

-- Question 19: Consommation électricité
(19, 'Quelle est votre consommation annuelle d''électricité (en kWh) ?', 'nombre',
 '{"placeholder": "Consommation en kWh", "min": 0, "max": 1000000, "unite": "kWh"}',
 '{}', 2, '{"depends_on": {"question_id": 18, "answer": "Oui"}}', ARRAY['ENERGIE'], 1),

-- Question 20: Factures énergie
(20, 'Avez-vous vos factures d''énergie récentes ?', 'choix_unique',
 '{"choix": ["Oui", "Non", "Partiellement"]}',
 '{}', 1, '{"depends_on": {"question_id": 18, "answer": "Oui"}}', ARRAY['ENERGIE'], 1),

-- Question 21: Projets énergétiques
(21, 'Avez-vous des projets d''amélioration énergétique ?', 'choix_multiple',
 '{"choix": ["Isolation", "Chauffage", "Éclairage", "Climatisation", "Autre", "Aucun"]}',
 '{}', 2, '{}', ARRAY['CEE'], 1),

-- Question 22: Objectifs prioritaires
(22, 'Quels sont vos objectifs prioritaires en matière d''optimisation ?', 'choix_multiple',
 '{"choix": ["Réduire les coûts", "Améliorer la rentabilité", "Optimiser la fiscalité", "Bénéficier d''aides", "Conformité réglementaire", "Autre"]}',
 '{}', 1, '{}', ARRAY['TICPE', 'URSSAF', 'DFS', 'FONCIER', 'ENERGIE', 'CEE'], 1);

-- Vérifier l'insertion
SELECT 
    question_order,
    question_text,
    question_type,
    produits_cibles
FROM "public"."QuestionnaireQuestion"
ORDER BY question_order; 