-- =====================================================
-- AJOUTER FORMULE DE CALCUL POUR LOGICIEL SOLID
-- =====================================================

UPDATE "ProduitEligible"
SET 
    formule_calcul = jsonb_build_object(
        'type', 'fixed',
        'value', 1500,
        'formula_display', '1500€ par an (abonnement logiciel)'
    ),
    parametres_requis = ARRAY['nb_employes_tranche'],
    notes_affichage = '1500€ par an pour un abonnement au logiciel de gestion'
WHERE nom = 'Logiciel Solid';

-- VÉRIFICATION
SELECT 
    nom,
    type_produit,
    notes_affichage,
    formule_calcul,
    parametres_requis,
    active
FROM "ProduitEligible"
WHERE nom = 'Logiciel Solid';

