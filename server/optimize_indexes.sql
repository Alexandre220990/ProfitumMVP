-- Optimisation des index pour les tables fréquemment utilisées

-- Index pour la table Simulation
CREATE INDEX IF NOT EXISTS idx_simulation_client ON "Simulation" ("clientId");
CREATE INDEX IF NOT EXISTS idx_simulation_status ON "Simulation" ("status");
CREATE INDEX IF NOT EXISTS idx_simulation_date ON "Simulation" ("createdAt");

-- Index pour la table ClientProduitEligible
CREATE INDEX IF NOT EXISTS idx_clientproduit_client ON "ClientProduitEligible" ("clientId");
CREATE INDEX IF NOT EXISTS idx_clientproduit_produit ON "ClientProduitEligible" ("produitId");
CREATE INDEX IF NOT EXISTS idx_clientproduit_statut ON "ClientProduitEligible" ("statut");
CREATE INDEX IF NOT EXISTS idx_clientproduit_client_produit ON "ClientProduitEligible" ("clientId", "produitId");

-- Index pour la table ProduitEligible 
CREATE INDEX IF NOT EXISTS idx_produit_nom ON "ProduitEligible" ("nom");

-- Index pour la table Client
CREATE INDEX IF NOT EXISTS idx_client_email ON "Client" ("email");

-- Index pour la table Expert
CREATE INDEX IF NOT EXISTS idx_expert_email ON "Expert" ("email");
CREATE INDEX IF NOT EXISTS idx_expert_specialization ON "Expert" ("specializations");

-- Index pour la table Audit
CREATE INDEX IF NOT EXISTS idx_audit_client ON "Audit" ("clientId");
CREATE INDEX IF NOT EXISTS idx_audit_expert ON "Audit" ("expertId");
CREATE INDEX IF NOT EXISTS idx_audit_type ON "Audit" ("audit_type");
CREATE INDEX IF NOT EXISTS idx_audit_status ON "Audit" ("status");

-- Index pour la table SimulationResult
CREATE INDEX IF NOT EXISTS idx_simulationresult_simulation ON "SimulationResult" ("simulationId");

-- Analyser les tables pour mettre à jour les statistiques de la base de données
ANALYZE "Simulation";
ANALYZE "ClientProduitEligible";
ANALYZE "ProduitEligible";
ANALYZE "Client";
ANALYZE "Expert";
ANALYZE "Audit";
ANALYZE "SimulationResult"; 