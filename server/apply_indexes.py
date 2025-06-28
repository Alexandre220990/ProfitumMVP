#!/usr/bin/env python3
import sys
import os
from pathlib import Path

# Ajouter le répertoire parent au chemin Python
parent_dir = str(Path(__file__).parent.parent.absolute())
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from connect_pooler import init_pooler_connection, execute_query

def apply_indexes():
    """Applique les index optimisés à la base de données"""
    conn = init_pooler_connection()
    try:
        print("Connexion à la base de données établie")
        
        # Index pour la table Simulation
        execute_query(conn, 'CREATE INDEX IF NOT EXISTS idx_simulation_client ON "Simulation" ("clientId")')
        execute_query(conn, 'CREATE INDEX IF NOT EXISTS idx_simulation_statut ON "Simulation" ("statut")')
        execute_query(conn, 'CREATE INDEX IF NOT EXISTS idx_simulation_date ON "Simulation" ("createdAt")')
        print("Index pour Simulation ajoutés")
        
        # Index pour la table ClientProduitEligible
        execute_query(conn, 'CREATE INDEX IF NOT EXISTS idx_clientproduit_client ON "ClientProduitEligible" ("clientId")')
        execute_query(conn, 'CREATE INDEX IF NOT EXISTS idx_clientproduit_produit ON "ClientProduitEligible" ("produitId")')
        execute_query(conn, 'CREATE INDEX IF NOT EXISTS idx_clientproduit_statut ON "ClientProduitEligible" ("statut")')
        execute_query(conn, 'CREATE INDEX IF NOT EXISTS idx_clientproduit_client_produit ON "ClientProduitEligible" ("clientId", "produitId")')
        print("Index pour ClientProduitEligible ajoutés")
        
        # Index pour la table ProduitEligible
        execute_query(conn, 'CREATE INDEX IF NOT EXISTS idx_produit_nom ON "ProduitEligible" ("nom")')
        print("Index pour ProduitEligible ajoutés")
        
        # Index pour la table Client
        execute_query(conn, 'CREATE INDEX IF NOT EXISTS idx_client_email ON "Client" ("email")')
        print("Index pour Client ajoutés")
        
        # Index pour la table Audit
        execute_query(conn, 'CREATE INDEX IF NOT EXISTS idx_audit_client ON "Audit" ("clientId")')
        execute_query(conn, 'CREATE INDEX IF NOT EXISTS idx_audit_expert ON "Audit" ("expertId")')
        execute_query(conn, 'CREATE INDEX IF NOT EXISTS idx_audit_type ON "Audit" ("type")')
        execute_query(conn, 'CREATE INDEX IF NOT EXISTS idx_audit_status ON "Audit" ("status")')
        print("Index pour Audit ajoutés")
        
        # Analyser les tables pour mettre à jour les statistiques
        execute_query(conn, 'ANALYZE "Simulation"')
        execute_query(conn, 'ANALYZE "ClientProduitEligible"')
        execute_query(conn, 'ANALYZE "ProduitEligible"')
        execute_query(conn, 'ANALYZE "Client"')
        execute_query(conn, 'ANALYZE "Expert"')
        execute_query(conn, 'ANALYZE "Audit"')
        execute_query(conn, 'ANALYZE "SimulationResult"')
        print("Statistiques mises à jour")
        
        print("Tous les index ont été appliqués avec succès")
    except Exception as e:
        print(f"Erreur lors de l'application des index: {str(e)}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    apply_indexes() 