-- ============================================================================
-- MIGRATION BDD - DONNÉES (FORMULES, QUESTIONS, RÈGLES)
-- ============================================================================

-- PARTIE 1 : AJOUTER COLONNE MANQUANTE À ClientProduitEligible
-- ============================================================================

ALTER TABLE "ClientProduitEligible" 
ADD COLUMN IF NOT EXISTS calcul_details JSONB DEFAULT NULL;

COMMENT ON COLUMN "ClientProduitEligible".calcul_details IS 'Détails du calcul : formule utilisée, inputs, valeurs intermédiaires';

-- PARTIE 2 : CRÉER/METTRE À JOUR LES QUESTIONS AVEC CODES
-- ============================================================================

-- Questions existantes : ajouter les codes
UPDATE "Question" SET code = 'GENERAL_001' WHERE id = 1; -- Secteur d'activité
UPDATE "Question" SET code = 'GENERAL_004' WHERE id = 5; -- Propriétaire locaux
UPDATE "Question" SET code = 'TICPE_001' WHERE id = 4; -- Véhicules professionnels

-- Questions manquantes à créer
INSERT INTO "Question" (code, texte, type, categorie, ordre, options, validation) VALUES
('GENERAL_002', 'Quel est votre chiffre d''affaires annuel ?', 'choix_unique', 'entreprise', 2, 
 '{"choix":["Moins de 100 000€","100 000€ - 500 000€","500 000€ - 1 000 000€","1 000 000€ - 5 000 000€","Plus de 5 000 000€"]}', 
 '{"required":true}'::jsonb),

('GENERAL_003', 'Avez-vous des contentieux en cours ?', 'choix_unique', 'entreprise', 3, 
 '{"choix":["Aucun","Contentieux mineurs","Contentieux importants"]}', 
 '{"required":true}'::jsonb),

('GENERAL_005', 'Avez-vous des contrats d''énergie ?', 'choix_unique', 'energie', 6, 
 '{"choix":["Oui","Non"]}', 
 '{"required":true}'::jsonb),

('TICPE_003', 'Quels types de véhicules possédez-vous ?', 'choix_multiple', 'ticpe', 7, 
 '{"choix":["Camions de plus de 7,5 tonnes","Camions de 3,5 à 7,5 tonnes","Engins de chantier","Tracteurs agricoles","Véhicules légers"]}', 
 '{"required":true}'::jsonb),

('RECOUVR_001', 'Avez-vous des impayés ?', 'choix_unique', 'recouvrement', 8, 
 '{"choix":["Non","Oui, montant faible (< 10 000€)","Oui, montant modéré (10 000€ - 50 000€)","Oui, montant important (> 50 000€)"]}', 
 '{"required":true}'::jsonb)

ON CONFLICT (code) DO UPDATE SET
  texte = EXCLUDED.texte,
  type = EXCLUDED.type,
  categorie = EXCLUDED.categorie,
  options = EXCLUDED.options;

-- PARTIE 3 : METTRE À JOUR LES PRODUITS AVEC FORMULES
-- ============================================================================

-- 1. TICPE
UPDATE "ProduitEligible" 
SET 
  formule_calcul = '{
    "type": "multiplication_sequence",
    "operations": [
      {"var": "litres_carburant_mois", "multiply": 12},
      {"result": "litres_annuels", "multiply": 0.20}
    ],
    "formula_display": "litres_carburant_mois × 12 × 0,20€"
  }'::jsonb,
  parametres_requis = '["secteur","possede_vehicules","types_vehicules","litres_carburant_mois"]'::jsonb,
  notes_affichage = 'Remboursement TICPE : 0,20€ par litre de carburant consommé',
  type_produit = 'financier'
WHERE nom = 'TICPE';

-- 2. URSSAF  
UPDATE "ProduitEligible"
SET 
  formule_calcul = '{
    "type": "multiplication_sequence",
    "operations": [
      {"var": "nb_employes", "multiply": 35000},
      {"result": "masse_salariale", "multiply": 0.10}
    ],
    "formula_display": "nb_employés × 35 000€ × 10%",
    "mapping_tranches": {
      "Aucun": 0,
      "1 à 5": 3,
      "6 à 20": 13,
      "21 à 50": 35,
      "Plus de 50": 75
    }
  }'::jsonb,
  parametres_requis = '["nb_employes_tranche"]'::jsonb,
  notes_affichage = 'Réduction de 10% de la masse salariale estimée',
  type_produit = 'financier'
WHERE nom = 'URSSAF';

-- 3. DFS (CORRIGÉ : × 12)
UPDATE "ProduitEligible"
SET 
  formule_calcul = '{
    "type": "multiplication_sequence",
    "operations": [
      {"var": "nb_chauffeurs", "multiply": 150},
      {"result": "montant_mensuel", "multiply": 12}
    ],
    "formula_display": "nb_chauffeurs × 150€ × 12 mois"
  }'::jsonb,
  parametres_requis = '["secteur","nb_chauffeurs"]'::jsonb,
  notes_affichage = '150€ par chauffeur par mois',
  type_produit = 'financier'
WHERE nom = 'DFS';

-- 4. FONCIER
UPDATE "ProduitEligible"
SET 
  formule_calcul = '{
    "type": "percentage",
    "base_var": "montant_taxe_fonciere",
    "rate": 0.20,
    "formula_display": "taxe_foncière × 20%",
    "additional_info": {
      "duree_max": 6,
      "unite": "ans"
    }
  }'::jsonb,
  parametres_requis = '["proprietaire_locaux","montant_taxe_fonciere"]'::jsonb,
  notes_affichage = 'Montant récupérable jusqu''à 6 ans selon conditions',
  type_produit = 'financier'
WHERE nom = 'Foncier';

-- 5. MSA
UPDATE "ProduitEligible"
SET 
  formule_calcul = '{
    "type": "percentage",
    "base_var": "ca",
    "rate": 0.065,
    "formula_display": "CA × 6,5%",
    "mapping_tranches": {
      "Moins de 100 000€": 50000,
      "100 000€ - 500 000€": 300000,
      "500 000€ - 1 000 000€": 750000,
      "1 000 000€ - 5 000 000€": 2500000,
      "Plus de 5 000 000€": 7000000
    }
  }'::jsonb,
  parametres_requis = '["secteur","ca_tranche"]'::jsonb,
  notes_affichage = 'Réduction de 6,5% du chiffre d''affaires',
  type_produit = 'financier'
WHERE nom = 'MSA';

-- 6. OPTIMISATION ÉNERGIE
UPDATE "ProduitEligible"
SET 
  formule_calcul = '{
    "type": "multiplication_sequence",
    "operations": [
      {"var": "montant_factures_energie_mois", "multiply": 12},
      {"result": "factures_annuelles", "multiply": 0.30}
    ],
    "formula_display": "factures_mois × 12 × 30%"
  }'::jsonb,
  parametres_requis = '["contrats_energie","montant_factures_energie_mois"]'::jsonb,
  notes_affichage = 'Économies via changement de fournisseur d''énergie ou passage par un grossiste',
  type_produit = 'financier'
WHERE nom = 'Optimisation Énergie';

-- 7. RECOUVREMENT
UPDATE "ProduitEligible"
SET 
  formule_calcul = '{
    "type": "percentage",
    "base_var": "montant_impayes",
    "rate": 1.00,
    "formula_display": "montant_impayés × 100%",
    "mapping_tranches": {
      "Non": 0,
      "Oui, montant faible (< 10 000€)": 5000,
      "Oui, montant modéré (10 000€ - 50 000€)": 30000,
      "Oui, montant important (> 50 000€)": 75000
    }
  }'::jsonb,
  parametres_requis = '["niveau_impayes"]'::jsonb,
  notes_affichage = 'Récupération complète des créances impayées',
  type_produit = 'financier'
WHERE nom = 'Recouvrement';

-- 8. CHRONOTACHYGRAPHES (Qualitatif - CORRIGÉ)
UPDATE "ProduitEligible"
SET 
  formule_calcul = '{
    "type": "qualitatif",
    "benefits": [
      "⏱️ 10-15 heures/mois de gestion administrative gagnées",
      "📊 Données de conduite 100% fiables et traçables",
      "✅ Conformité réglementaire garantie",
      "🔒 Sécurité juridique renforcée",
      "📉 Réduction des pertes de données",
      "🚫 Moins de litiges lors des contrôles routiers"
    ],
    "formula_display": "Bénéfices qualitatifs uniquement"
  }'::jsonb,
  parametres_requis = '["possede_vehicules","types_vehicules"]'::jsonb,
  notes_affichage = 'Bénéfices en temps et conformité - pas de montant financier',
  type_produit = 'qualitatif'
WHERE nom = 'Chronotachygraphes digitaux';

-- 9. DÉSACTIVER TVA
UPDATE "ProduitEligible"
SET active = false
WHERE nom = 'TVA';

-- 10. DÉSACTIVER/RETIRER CEE (si vous voulez le garder, commentez cette ligne)
UPDATE "ProduitEligible"
SET active = false
WHERE nom = 'CEE';

-- PARTIE 4 : CORRIGER LES RÈGLES CHRONOTACHYGRAPHES
-- ============================================================================

-- Supprimer l'ancienne règle secteur-dépendante
DELETE FROM "EligibilityRules" 
WHERE produit_nom = 'Chronotachygraphes digitaux';

-- Créer la nouvelle règle : TOUS SECTEURS si véhicules >7,5T
INSERT INTO "EligibilityRules" (produit_id, produit_nom, rule_type, conditions, priority, is_active)
SELECT 
  id,
  'Chronotachygraphes digitaux',
  'simple',
  '{"value":"Camions de plus de 7,5 tonnes","operator":"includes","question_id":"TICPE_003"}'::jsonb,
  1,
  true
FROM "ProduitEligible"
WHERE nom = 'Chronotachygraphes digitaux';

-- PARTIE 5 : VÉRIFICATION FINALE
-- ============================================================================

-- Produits avec formules
SELECT 
  nom,
  type_produit,
  CASE WHEN formule_calcul IS NOT NULL THEN 'OUI' ELSE 'NON' END as formule_ok,
  CASE WHEN parametres_requis IS NOT NULL THEN 'OUI' ELSE 'NON' END as parametres_ok,
  notes_affichage,
  active
FROM "ProduitEligible"
ORDER BY nom;

-- Questions avec codes
SELECT code, texte, type, categorie
FROM "Question"
WHERE code IS NOT NULL
ORDER BY code;

