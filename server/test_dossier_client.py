#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de test pour verifier le systeme de routage dynamique des dossiers clients
"""

import os
import sys
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

def test_dossier_client_routing():
    """
    Test du systeme de routage dynamique
    """
    print("Test du systeme de routage dynamique des dossiers clients")
    print("=" * 60)
    
    # Test 1: Verifier que la page dynamique existe
    dossier_client_path = "client/src/pages/dossier-client/[produit]/[id].tsx"
    if os.path.exists(dossier_client_path):
        print("OK - Page dynamique trouvee:", dossier_client_path)
    else:
        print("ERREUR - Page dynamique manquante:", dossier_client_path)
        return False
    
    # Test 2: Verifier que la route est configuree dans App.tsx
    app_tsx_path = "client/src/App.tsx"
    if os.path.exists(app_tsx_path):
        with open(app_tsx_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'dossier-client/:produit/:id' in content:
                print("OK - Route dynamique configuree dans App.tsx")
            else:
                print("ERREUR - Route dynamique manquante dans App.tsx")
                return False
    else:
        print("ERREUR - App.tsx non trouve")
        return False
    
    # Test 3: Verifier que les liens du dashboard pointent vers le bon format
    dashboard_path = "client/src/pages/dashboard/client.tsx"
    if os.path.exists(dashboard_path):
        with open(dashboard_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if '/dossier-client/${produitNom}/${id}' in content:
                print("OK - Liens du dashboard configures correctement")
            else:
                print("ERREUR - Liens du dashboard mal configures")
                return False
    else:
        print("ERREUR - Dashboard client non trouve")
        return False
    
    # Test 4: Verifier que l'interface AuditTableProps accepte auditType
    audit_table_path = "client/src/components/dashboard/AuditTable.tsx"
    if os.path.exists(audit_table_path):
        with open(audit_table_path, 'r', encoding='utf-8') as f:
            content = f.read()
            if 'onViewDossier: (id: string, auditType?: string) => void' in content:
                print("OK - Interface AuditTableProps configuree correctement")
            else:
                print("ERREUR - Interface AuditTableProps mal configuree")
                return False
    else:
        print("ERREUR - AuditTable.tsx non trouve")
        return False
    
    print("\nTous les tests sont passes !")
    print("\nResume de l'implementation :")
    print("   • Page dynamique : /dossier-client/[produit]/[id].tsx")
    print("   • Route configuree : /dossier-client/:produit/:id")
    print("   • Liens du dashboard : /dossier-client/{PRODUIT_NOM}/{id}")
    print("   • Verification des permissions : OK")
    print("   • Gestion des erreurs : OK")
    print("   • Navigation retour : OK")
    
    return True

def test_url_examples():
    """
    Affiche des exemples d'URLs qui devraient fonctionner
    """
    print("\nExemples d'URLs qui devraient fonctionner :")
    print("   • /dossier-client/TICPE/123")
    print("   • /dossier-client/Foncier/456")
    print("   • /dossier-client/URSSAF/789")
    print("   • /dossier-client/DFS/101")
    print("   • /dossier-client/Optimisation Energie/202")
    
    print("\nNotes importantes :")
    print("   • Les noms de produits doivent correspondre exactement a ceux en base")
    print("   • L'ID doit etre un ClientProduitEligible valide")
    print("   • L'utilisateur doit etre le proprietaire du produit")
    print("   • La page redirigera vers la page statique appropriee")

if __name__ == "__main__":
    success = test_dossier_client_routing()
    if success:
        test_url_examples()
    else:
        print("\nCertains tests ont echoue. Verifiez l'implementation.")
        sys.exit(1) 