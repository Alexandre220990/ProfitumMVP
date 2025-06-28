-- Migration pour ajouter des produits réels pour le secteur transport
-- 1. Produits spécialisés transport

INSERT INTO "Produit" (nom, description, secteur_cible, montant_min, montant_max, duree_mois, taux_interet, conditions_eligibilite, avantages, created_at, updated_at) VALUES 
-- Véhicules et équipements
('Crédit-bail Véhicules Utilitaires', 'Financement de véhicules utilitaires légers et poids lourds par crédit-bail avec options d''achat', 'transport', 15000, 500000, 60, 2.5, 'Entreprise de transport, minimum 1 an d''activité, véhicules neufs ou occasion récente', 'Pas d''apport initial, déduction fiscale des loyers, option d''achat favorable', NOW(), NOW()),

('Prêt Professionnel Flotte', 'Financement traditionnel pour l''acquisition d''une flotte de véhicules professionnels', 'transport', 30000, 1000000, 84, 3.2, 'CA minimum 200k€, secteur transport, garanties personnelles ou réelles', 'Amortissement fiscal, propriété immédiate, taux préférentiel transport', NOW(), NOW()),

('Financement Équipements GPS/Télématique', 'Crédit spécialisé pour équipements de suivi et géolocalisation des flottes', 'transport', 5000, 100000, 36, 2.8, 'Entreprise de transport, équipements agréés, installation par partenaires certifiés', 'Crédit d''impôt numérique, amortissement accéléré, maintenance incluse', NOW(), NOW()),

-- Optimisation fiscale et charges
('Optimisation Charges Sociales Transport', 'Accompagnement pour réduire les charges sociales spécifiques au transport', 'transport', 0, 0, 12, 0, 'Minimum 3 salariés, secteur transport, respect convention collective', 'Réduction jusqu''à 25% des charges, accompagnement juridique, audit gratuit', NOW(), NOW()),

('Crédit d''Impôt Formation Conducteurs', 'Dispositif fiscal pour la formation des conducteurs professionnels', 'transport', 0, 50000, 12, 0, 'Salariés conducteurs, formations agréées, respect temps de conduite', 'Crédit d''impôt 50%, subventions OPCO, amélioration sécurité', NOW(), NOW()),

-- Trésorerie et financement court terme
('Affacturage Transport', 'Cession de créances clients pour améliorer la trésorerie des transporteurs', 'transport', 50000, 2000000, 12, 1.5, 'CA minimum 300k€, clients solvables, secteur transport établi', 'Trésorerie immédiate, garantie impayés, gestion administrative', NOW(), NOW()),

('Prêt Carburant Professionnel', 'Ligne de crédit dédiée aux achats de carburant avec cartes professionnelles', 'transport', 10000, 200000, 12, 4.5, 'Flotte minimum 3 véhicules, secteur transport, historique bancaire sain', 'Gestion centralisée, remises négociées, récupération TVA optimisée', NOW(), NOW()),

-- Développement et croissance
('Prêt Développement Transport', 'Financement pour extension d''activité, nouvelles lignes ou acquisition concurrents', 'transport', 100000, 2000000, 120, 3.8, 'Minimum 3 ans d''activité, business plan validé, garanties suffisantes', 'Taux préférentiel, différé de remboursement, accompagnement BPI', NOW(), NOW());

-- 2. Règles d'éligibilité dynamiques basées sur le profil client

-- Table pour les règles d'éligibilité par produit
CREATE TABLE IF NOT EXISTS "RegleEligibiliteProduit" (
    id SERIAL PRIMARY KEY,
    produit_id INTEGER REFERENCES "Produit"(id),
    condition_type VARCHAR(50) NOT NULL, -- 'secteur', 'ca_min', 'nb_employes', 'vehicules', 'proprietaire_locaux'
    condition_operator VARCHAR(10) NOT NULL, -- '=', '>', '<', '>=', '<=', 'in', 'contains'
    condition_value TEXT NOT NULL,
    points INTEGER DEFAULT 10, -- Points d'éligibilité (cumul pour score)
    obligatoire BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_regle_eligibilite_produit_id ON "RegleEligibiliteProduit"(produit_id);
CREATE INDEX IF NOT EXISTS idx_regle_eligibilite_condition_type ON "RegleEligibiliteProduit"(condition_type);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_regle_eligibilite_produit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_regle_eligibilite_produit_updated_at ON "RegleEligibiliteProduit";
CREATE TRIGGER trigger_update_regle_eligibilite_produit_updated_at
    BEFORE UPDATE ON "RegleEligibiliteProduit"
    FOR EACH ROW
    EXECUTE FUNCTION update_regle_eligibilite_produit_updated_at();

-- 3. Règles d'éligibilité pour chaque produit

-- Crédit-bail Véhicules Utilitaires
INSERT INTO "RegleEligibiliteProduit" (produit_id, condition_type, condition_operator, condition_value, points, obligatoire) VALUES 
((SELECT id FROM "Produit" WHERE nom = 'Crédit-bail Véhicules Utilitaires'), 'secteur', '=', 'transport', 30, true),
((SELECT id FROM "Produit" WHERE nom = 'Crédit-bail Véhicules Utilitaires'), 'vehicules_professionnels', '=', 'true', 25, true),
((SELECT id FROM "Produit" WHERE nom = 'Crédit-bail Véhicules Utilitaires'), 'nb_employes', '>=', '1', 10, false),
((SELECT id FROM "Produit" WHERE nom = 'Crédit-bail Véhicules Utilitaires'), 'ca_min', '>=', '50000', 15, false);

-- Prêt Professionnel Flotte
INSERT INTO "RegleEligibiliteProduit" (produit_id, condition_type, condition_operator, condition_value, points, obligatoire) VALUES 
((SELECT id FROM "Produit" WHERE nom = 'Prêt Professionnel Flotte'), 'secteur', '=', 'transport', 30, true),
((SELECT id FROM "Produit" WHERE nom = 'Prêt Professionnel Flotte'), 'vehicules_professionnels', '=', 'true', 25, true),
((SELECT id FROM "Produit" WHERE nom = 'Prêt Professionnel Flotte'), 'ca_min', '>=', '200000', 20, true),
((SELECT id FROM "Produit" WHERE nom = 'Prêt Professionnel Flotte'), 'nb_employes', '>=', '3', 15, false);

-- Optimisation Charges Sociales Transport
INSERT INTO "RegleEligibiliteProduit" (produit_id, condition_type, condition_operator, condition_value, points, obligatoire) VALUES 
((SELECT id FROM "Produit" WHERE nom = 'Optimisation Charges Sociales Transport'), 'secteur', '=', 'transport', 30, true),
((SELECT id FROM "Produit" WHERE nom = 'Optimisation Charges Sociales Transport'), 'nb_employes', '>=', '3', 25, true),
((SELECT id FROM "Produit" WHERE nom = 'Optimisation Charges Sociales Transport'), 'besoin', 'contains', 'optimisation_charges', 20, false);

-- Crédit d'Impôt Formation Conducteurs
INSERT INTO "RegleEligibiliteProduit" (produit_id, condition_type, condition_operator, condition_value, points, obligatoire) VALUES 
((SELECT id FROM "Produit" WHERE nom = 'Crédit d''Impôt Formation Conducteurs'), 'secteur', '=', 'transport', 30, true),
((SELECT id FROM "Produit" WHERE nom = 'Crédit d''Impôt Formation Conducteurs'), 'nb_employes', '>=', '1', 20, true),
((SELECT id FROM "Produit" WHERE nom = 'Crédit d''Impôt Formation Conducteurs'), 'vehicules_professionnels', '=', 'true', 15, false);

-- Affacturage Transport
INSERT INTO "RegleEligibiliteProduit" (produit_id, condition_type, condition_operator, condition_value, points, obligatoire) VALUES 
((SELECT id FROM "Produit" WHERE nom = 'Affacturage Transport'), 'secteur', '=', 'transport', 30, true),
((SELECT id FROM "Produit" WHERE nom = 'Affacturage Transport'), 'ca_min', '>=', '300000', 25, true),
((SELECT id FROM "Produit" WHERE nom = 'Affacturage Transport'), 'besoin', 'contains', 'financement', 15, false);

-- Financement Équipements GPS/Télématique
INSERT INTO "RegleEligibiliteProduit" (produit_id, condition_type, condition_operator, condition_value, points, obligatoire) VALUES 
((SELECT id FROM "Produit" WHERE nom = 'Financement Équipements GPS/Télématique'), 'secteur', '=', 'transport', 30, true),
((SELECT id FROM "Produit" WHERE nom = 'Financement Équipements GPS/Télématique'), 'vehicules_professionnels', '=', 'true', 25, true),
((SELECT id FROM "Produit" WHERE nom = 'Financement Équipements GPS/Télématique'), 'nb_employes', '>=', '2', 10, false);

-- Prêt Carburant Professionnel
INSERT INTO "RegleEligibiliteProduit" (produit_id, condition_type, condition_operator, condition_value, points, obligatoire) VALUES 
((SELECT id FROM "Produit" WHERE nom = 'Prêt Carburant Professionnel'), 'secteur', '=', 'transport', 30, true),
((SELECT id FROM "Produit" WHERE nom = 'Prêt Carburant Professionnel'), 'vehicules_professionnels', '=', 'true', 25, true),
((SELECT id FROM "Produit" WHERE nom = 'Prêt Carburant Professionnel'), 'nb_employes', '>=', '1', 10, false);

-- Prêt Développement Transport
INSERT INTO "RegleEligibiliteProduit" (produit_id, condition_type, condition_operator, condition_value, points, obligatoire) VALUES 
((SELECT id FROM "Produit" WHERE nom = 'Prêt Développement Transport'), 'secteur', '=', 'transport', 30, true),
((SELECT id FROM "Produit" WHERE nom = 'Prêt Développement Transport'), 'ca_min', '>=', '500000', 25, true),
((SELECT id FROM "Produit" WHERE nom = 'Prêt Développement Transport'), 'nb_employes', '>=', '5', 15, false),
((SELECT id FROM "Produit" WHERE nom = 'Prêt Développement Transport'), 'besoin', 'contains', 'financement', 10, false); 