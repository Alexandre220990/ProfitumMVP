-- ============================================================================
-- CRÉATION DES QUESTIONS DE CALCUL MANQUANTES
-- ============================================================================

-- Questions pour les calculs numériques (litres, montants, etc.)

-- 1. Litres de carburant (TICPE)
INSERT INTO "Question" (code, texte, type, categorie, ordre, options, validation, description) VALUES
('CALCUL_TICPE_LITRES', 'Combien de litres de carburant consommez-vous par mois ?', 'nombre', 'ticpe', 10, 
 '{"min":0,"max":1000000,"unite":"litres"}'::jsonb, 
 '{"required":true,"min":0}'::jsonb,
 'Consommation mensuelle moyenne en litres')
ON CONFLICT (code) DO UPDATE SET
  texte = EXCLUDED.texte,
  options = EXCLUDED.options;

-- 2. Nombre de chauffeurs (DFS)
INSERT INTO "Question" (code, texte, type, categorie, ordre, options, validation, description) VALUES
('CALCUL_DFS_CHAUFFEURS', 'Combien de chauffeurs employez-vous ?', 'nombre', 'transport', 11, 
 '{"min":0,"max":1000,"unite":"chauffeurs"}'::jsonb, 
 '{"required":true,"min":1}'::jsonb,
 'Nombre total de chauffeurs salariés')
ON CONFLICT (code) DO UPDATE SET
  texte = EXCLUDED.texte,
  options = EXCLUDED.options;

-- 3. Montant taxe foncière (FONCIER)
INSERT INTO "Question" (code, texte, type, categorie, ordre, options, validation, description) VALUES
('CALCUL_FONCIER_MONTANT', 'Quel est le montant annuel de votre taxe foncière ?', 'nombre', 'foncier', 12, 
 '{"min":0,"max":10000000,"unite":"€"}'::jsonb, 
 '{"required":true,"min":1}'::jsonb,
 'Montant annuel total de la taxe foncière professionnelle')
ON CONFLICT (code) DO UPDATE SET
  texte = EXCLUDED.texte,
  options = EXCLUDED.options;

-- 4. Factures énergie (OPTIMISATION ÉNERGIE)
INSERT INTO "Question" (code, texte, type, categorie, ordre, options, validation, description) VALUES
('CALCUL_ENERGIE_FACTURES', 'Quel est le montant mensuel de vos factures d''énergie ?', 'nombre', 'energie', 13, 
 '{"min":0,"max":1000000,"unite":"€"}'::jsonb, 
 '{"required":true,"min":1}'::jsonb,
 'Montant mensuel moyen des factures d''électricité et gaz')
ON CONFLICT (code) DO UPDATE SET
  texte = EXCLUDED.texte,
  options = EXCLUDED.options;

-- 5. Nombre d'employés (URSSAF) - déjà créé comme GENERAL_003, on ajoute une version tranche
-- Cette question existe déjà, on la met juste à jour avec le code

-- Vérification : afficher toutes les questions avec codes
SELECT code, texte, type, categorie, ordre
FROM "Question"
WHERE code IS NOT NULL
ORDER BY code;

