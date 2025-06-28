-- Création de la table des audits
CREATE TABLE IF NOT EXISTS audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id),
    expert_id UUID REFERENCES experts(id),
    audit_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'not_initiated',
    current_step INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0,
    potential_gain DECIMAL(10,2) NOT NULL,
    obtained_gain DECIMAL(10,2),
    charter_signed BOOLEAN DEFAULT false,
    appointment_datetime TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création de la table des documents d'audit
CREATE TABLE IF NOT EXISTS audit_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(id),
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création de la table des simulations
CREATE TABLE IF NOT EXISTS simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id),
    answers JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création de la table d'éligibilité des audits
CREATE TABLE IF NOT EXISTS audit_eligibility (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_type VARCHAR(50) UNIQUE NOT NULL,
    criteria JSONB NOT NULL,
    description TEXT NOT NULL,
    potential_gain DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertion des données d'éligibilité pour chaque type d'audit
INSERT INTO audit_eligibility (audit_type, criteria, description, potential_gain) VALUES
('urssaf', '{"audit": ["Oui, récemment", "Oui, il y a plus de 2 ans"]}', 'Audit des cotisations URSSAF et MSA', 15000),
('social', '{"exonérations": ["Oui (exonérations ZFU, JEI, CIR, etc.)"], "contrats": ["Oui"]}', 'Réduction des charges sociales et exonérations employeurs', 5000),
('ticpe', '{"carburant": ["Oui, véhicules lourds", "Oui, les deux"]}', 'Remboursement de la taxe intérieure sur les produits énergétiques', 12000),
('msa', '{"secteur": ["Agriculture"]}', 'Optimisation des cotisations MSA', 8000),
('foncier', '{"locaux": ["Oui", "Non, locataire"]}', 'Audit des taxes foncières et optimisation', 10000),
('audit_energetique', '{"locaux": ["Oui", "Non, locataire"]}', 'Optimisation des coûts énergétiques et éligibilité aux aides', 15000),
('dfs', '{"contrats": ["Oui"]}', 'Optimisation des cotisations pour les salariés avec statuts particuliers', 15000),
('fiscal', '{"tva": ["Oui"], "chiffre": ["Plus de 2 000 000 €"], "exonérations": ["Oui (exonérations ZFU, JEI, CIR, etc.)"]}', 'Analyse des opportunités fiscales et crédits d''impôt', 10000)
ON CONFLICT (audit_type) DO NOTHING; 