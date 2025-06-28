# -*- coding: utf-8 -*-
from database import execute_query, init_connection
from datetime import datetime
import logging

logging.basicConfig(level=logging.DEBUG, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_get_produit_eligible_details(produit_id):
    """Fonction de test pour récupérer les détails d'un produit éligible."""
    logger.info(f"Test récupération des détails du produit {produit_id}")
    
    # Mapping entre nom/identifiant de produit et son ID dans la table
    produit_mapping = {
        "ticpe": "pe_1",
        "audit_ticpe": "pe_1"
    }
    
    # Déterminer l'ID à utiliser dans la requête
    query_id = produit_id
    if produit_id.lower() in produit_mapping:
        query_id = produit_mapping[produit_id.lower()]
    
    # Si l'ID commence par pe_, supprimer ce préfixe pour la recherche
    if query_id.startswith("pe_"):
        query_id = query_id[3:]
    
    logger.info(f"Recherche du produit avec l'ID: {query_id}")
    
    try:
        conn = init_connection()
        
        # Requête pour obtenir les détails du produit
        query = """
            SELECT * FROM "ProduitEligible" WHERE id = %s;
        """
        result = execute_query(conn, query, (query_id,))
        
        if result and len(result) > 0:
            produit = result[0]
            logger.info(f"Produit trouvé: {produit}")
            
            # Si nécessaire, convertir des champs date en chaînes
            produit_format = dict(produit)
            for date_field in ['createdAt', 'updatedAt']:
                if date_field in produit_format and produit_format[date_field]:
                    if isinstance(produit_format[date_field], datetime):
                        produit_format[date_field] = produit_format[date_field].isoformat()
            
            return {
                'success': True,
                'data': produit_format
            }
        else:
            logger.warning(f"Aucun produit trouvé avec l'ID {query_id}")
            return {
                'success': False,
                'error': f"Produit avec ID {produit_id} non trouvé"
            }
            
    except Exception as e:
        logger.error(f"Erreur lors de la récupération du produit: {str(e)}", exc_info=True)
        return {
            'success': False,
            'error': f"Erreur serveur lors de la récupération du produit: {str(e)}"
        }
    finally:
        if 'conn' in locals() and conn:
            conn.close()

if __name__ == "__main__":
    # Tester avec l'ID du produit TICPE
    resultat = test_get_produit_eligible_details("pe_1")
    print("Résultat:", resultat) 