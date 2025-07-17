-- =====================================================
-- CORRECTION RAPIDE DES QUESTIONS DU SIMULATEUR
-- Date: 2025-01-07
-- =====================================================

-- Nettoyer les questions existantes
DELETE FROM "public"."QuestionnaireQuestion";

-- Insérer les questions corrigées avec la syntaxe ARRAY PostgreSQL
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
(1, 'Dans quel secteur d''activité exercez-vous principalement ?', 'choix_unique', 
 '{"choix": ["Transport routier", "Transport maritime", "Transport aérien", "Commerce", "Industrie", "Services", "Construction", "Agriculture", "Autre"]}',
 '{}', 5, '{}', ARRAY['TICPE', 'URSSAF', 'DFS'], 1),

(2, 'Quel est votre chiffre d''affaires annuel ?', 'choix_unique',
 '{"choix": ["Moins de 100 000€", "100 000€ - 500 000€", "500 000€ - 1 000 000€", "1 000 000€ - 5 000 000€", "Plus de 5 000 000€"]}',
 '{}', 4, '{}', ARRAY['TICPE', 'URSSAF', 'DFS', 'FONCIER'], 1),

(3, 'Combien d''employés avez-vous ?', 'choix_unique',
 '{"choix": ["Aucun", "1 à 5", "6 à 20", "21 à 50", "Plus de 50"]}',
 '{}', 4, '{}', ARRAY['URSSAF', 'DFS'], 1),

(4, 'Possédez-vous des véhicules professionnels ?', 'choix_unique',
 '{"choix": ["Oui", "Non"]}',
 '{}', 3, '{}', ARRAY['TICPE'], 1),

(5, 'Combien de véhicules utilisez-vous pour votre activité ?', 'nombre',
 '{"placeholder": "Nombre de véhicules", "min": 0, "max": 1000, "unite": "véhicules"}',
 '{}', 3, '{}', ARRAY['TICPE'], 1),

(6, 'Avez-vous des véhicules de plus de 3,5 tonnes ?', 'choix_unique',
 '{"choix": ["Oui", "Non"]}',
 '{}', 3, '{}', ARRAY['TICPE'], 1),

(7, 'Quelle est votre consommation annuelle de carburant (en litres) ?', 'nombre',
 '{"placeholder": "Consommation en litres", "min": 0, "max": 1000000, "unite": "litres"}',
 '{}', 3, '{}', ARRAY['TICPE'], 1),

(8, 'Avez-vous conservé vos factures de carburant des 3 dernières années ?', 'choix_unique',
 '{"choix": ["Oui, toutes", "Oui, partiellement", "Non"]}',
 '{}', 2, '{}', ARRAY['TICPE'], 1),

(9, 'Êtes-vous propriétaire de vos locaux professionnels ?', 'choix_unique',
 '{"choix": ["Oui", "Non", "Je ne sais pas"]}',
 '{}', 3, '{}', ARRAY['FONCIER'], 1),

(10, 'Payez-vous une taxe foncière sur vos locaux ?', 'choix_unique',
 '{"choix": ["Oui", "Non", "Je ne sais pas"]}',
 '{}', 3, '{}', ARRAY['FONCIER'], 1),

(11, 'Quel est le montant annuel de votre taxe foncière (en euros) ?', 'nombre',
 '{"placeholder": "Montant en euros", "min": 0, "max": 100000, "unite": "€"}',
 '{}', 2, '{}', ARRAY['FONCIER'], 1),

(12, 'Quelle est la surface totale de vos locaux professionnels (en m²) ?', 'nombre',
 '{"placeholder": "Surface en m²", "min": 0, "max": 100000, "unite": "m²"}',
 '{}', 2, '{}', ARRAY['FONCIER'], 1),

(13, 'Avez-vous des employés avec des contrats spécifiques ?', 'choix_multiple',
 '{"choix": ["Heures supplémentaires", "Travail temporaire", "Intérim", "Saisonniers", "Déplacements fréquents", "Aucun"]}',
 '{}', 3, '{}', ARRAY['URSSAF', 'DFS'], 1),

(14, 'Quelle est votre masse salariale annuelle (en euros) ?', 'nombre',
 '{"placeholder": "Masse salariale en euros", "min": 0, "max": 10000000, "unite": "€"}',
 '{}', 3, '{}', ARRAY['URSSAF'], 1),

(15, 'Avez-vous accès à vos bordereaux URSSAF récents ?', 'choix_unique',
 '{"choix": ["Oui", "Non", "Partiellement"]}',
 '{}', 2, '{}', ARRAY['URSSAF'], 1),

(16, 'Dans quel secteur opèrent vos salariés ?', 'choix_multiple',
 '{"choix": ["BTP", "Transport", "Sécurité", "Spectacle", "Restauration", "Commerce", "Services", "Autre"]}',
 '{}', 3, '{}', ARRAY['DFS'], 1),

(17, 'Appliquez-vous actuellement une DFS sur vos bulletins de paie ?', 'choix_unique',
 '{"choix": ["Oui", "Non", "Je ne sais pas"]}',
 '{}', 2, '{}', ARRAY['DFS'], 1),

(18, 'Avez-vous des contrats d''électricité et/ou de gaz pour vos locaux ?', 'choix_unique',
 '{"choix": ["Oui", "Non"]}',
 '{}', 2, '{}', ARRAY['ENERGIE'], 1),

(19, 'Quelle est votre consommation annuelle d''électricité (en kWh) ?', 'nombre',
 '{"placeholder": "Consommation en kWh", "min": 0, "max": 1000000, "unite": "kWh"}',
 '{}', 2, '{}', ARRAY['ENERGIE'], 1),

(20, 'Avez-vous vos factures d''énergie récentes ?', 'choix_unique',
 '{"choix": ["Oui", "Non", "Partiellement"]}',
 '{}', 1, '{}', ARRAY['ENERGIE'], 1),

(21, 'Avez-vous des projets d''amélioration énergétique ?', 'choix_multiple',
 '{"choix": ["Isolation", "Chauffage", "Éclairage", "Climatisation", "Autre", "Aucun"]}',
 '{}', 2, '{}', ARRAY['CEE'], 1),

(22, 'Quels sont vos objectifs prioritaires en matière d''optimisation ?', 'choix_multiple',
 '{"choix": ["Réduire les coûts", "Améliorer la rentabilité", "Optimiser la fiscalité", "Bénéficier d''aides", "Conformité réglementaire", "Autre"]}',
 '{}', 1, '{}', ARRAY['TICPE', 'URSSAF', 'DFS', 'FONCIER', 'ENERGIE', 'CEE'], 1);

-- Vérifier l'insertion
SELECT COUNT(*) as questions_count FROM "public"."QuestionnaireQuestion"; 