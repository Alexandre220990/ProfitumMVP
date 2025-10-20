-- ============================================================================
-- TEST COMPLET - SIMULATION AVEC TOUTES LES RÉPONSES
-- ============================================================================

-- 1. CRÉER UNE SIMULATION TEST COMPLÈTE
-- ============================================================================

INSERT INTO simulations (client_id, session_token, status, type, answers, metadata) 
VALUES (
  'c919255f-5e8f-45a8-b48e-2a933b26e395', -- Client ID existant
  'test-complet-final-' || gen_random_uuid()::text,
  'in_progress',
  'authentifiee',
  '{
    "GENERAL_001": "Transport routier de marchandises",
    "GENERAL_002": "1 000 000€ - 5 000 000€",
    "GENERAL_003": "21 à 50",
    "GENERAL_004": "Oui",
    "GENERAL_005": "Oui",
    "TICPE_001": "Oui",
    "TICPE_003": ["Camions de plus de 7,5 tonnes"],
    "RECOUVR_001": "Oui, montant modéré (10 000€ - 50 000€)",
    "CALCUL_TICPE_LITRES": 8000,
    "CALCUL_DFS_CHAUFFEURS": 5,
    "CALCUL_FONCIER_MONTANT": 12000,
    "CALCUL_ENERGIE_FACTURES": 3000
  }'::jsonb,
  '{
    "source": "test_complet",
    "created_by": "admin",
    "test_date": "2025-10-20"
  }'::jsonb
)
RETURNING id, session_token;

-- 2. CALCULER L'ÉLIGIBILITÉ (remplacer l'ID ci-dessous)
-- ============================================================================
-- Copier l'ID retourné ci-dessus et le coller ici :
-- SELECT evaluer_eligibilite_avec_calcul('ID-RETOURNE'::uuid);

-- 3. AFFICHER LES RÉSULTATS DÉTAILLÉS
-- ============================================================================
-- Remplacer l'ID ci-dessous par celui retourné :
/*
SELECT 
  (results->'produits')::jsonb as produits_eligibles
FROM simulations
WHERE id = 'ID-RETOURNE'::uuid;
*/

-- 4. AFFICHER LES MONTANTS PAR PRODUIT
-- ============================================================================
-- Remplacer l'ID ci-dessous :
/*
SELECT 
  p->>'produit_nom' as produit,
  p->>'type_produit' as type,
  (p->>'is_eligible')::boolean as eligible,
  (p->>'montant_estime')::numeric as montant,
  p->>'notes' as notes
FROM simulations s,
LATERAL jsonb_array_elements(s.results->'produits') as p
WHERE s.id = 'ID-RETOURNE'::uuid
ORDER BY (p->>'montant_estime')::numeric DESC;
*/

-- 5. RÉSULTAT ATTENDU
-- ============================================================================
/*
TICPE : 19 200€ (8000 litres × 12 × 0,20€)
URSSAF : 122 500€ (35 employés × 35k€ × 10%)
DFS : 9 000€ (5 chauffeurs × 150€ × 12)
Optimisation Énergie : 10 800€ (3000€ × 12 × 30%)
Foncier : 2 400€ (12000€ × 20%)
Recouvrement : 30 000€ (montant modéré × 100%)
Chronotachygraphes : Qualitatif

TOTAL : ~194 000€/an + bénéfices qualitatifs
*/

