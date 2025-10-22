-- ============================================================================
-- VÉRIFICATION DES DONNÉES APPORTEUR DANS ClientProduitEligible
-- ============================================================================
-- Vérifier si les dossiers (ClientProduitEligible) sont bien liés à l'apporteur

-- 1. Trouver l'apporteur Profitum
SELECT 
    id,
    first_name,
    last_name,
    email,
    company_name,
    commission_rate,
    status,
    created_at
FROM "ApporteurAffaires"
WHERE email ILIKE '%profitum%'
   OR company_name ILIKE '%profitum%';

-- 2. Vérifier les clients de cet apporteur
SELECT 
    c.id,
    c.company_name,
    c.email,
    c.status,
    c.apporteur_id,
    aa.company_name as apporteur_company,
    aa.email as apporteur_email,
    c.created_at
FROM "Client" c
LEFT JOIN "ApporteurAffaires" aa ON c.apporteur_id = aa.id
WHERE c.apporteur_id IN (
    SELECT id FROM "ApporteurAffaires" 
    WHERE email ILIKE '%profitum%' OR company_name ILIKE '%profitum%'
)
ORDER BY c.created_at DESC;

-- 3. Vérifier les ClientProduitEligible pour ces clients
SELECT 
    cpe.id,
    cpe."clientId",
    cpe."produitId",
    cpe.statut,
    cpe."montantFinal",
    cpe."tauxFinal",
    cpe.created_at,
    c.company_name as client_name,
    c.email as client_email,
    c.apporteur_id,
    pe.nom as produit_nom,
    aa.company_name as apporteur_company
FROM "ClientProduitEligible" cpe
INNER JOIN "Client" c ON cpe."clientId" = c.id
LEFT JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
LEFT JOIN "ApporteurAffaires" aa ON c.apporteur_id = aa.id
WHERE c.apporteur_id IN (
    SELECT id FROM "ApporteurAffaires" 
    WHERE email ILIKE '%profitum%' OR company_name ILIKE '%profitum%'
)
ORDER BY cpe.created_at DESC;

-- 4. Statistiques agrégées pour l'apporteur
SELECT 
    aa.id as apporteur_id,
    aa.company_name as apporteur_company,
    aa.email as apporteur_email,
    COUNT(DISTINCT c.id) as total_clients,
    COUNT(DISTINCT CASE WHEN c.status = 'client' THEN c.id END) as clients_actifs,
    COUNT(DISTINCT CASE WHEN c.status = 'prospect' THEN c.id END) as prospects,
    COUNT(cpe.id) as total_dossiers,
    COUNT(CASE WHEN cpe.statut = 'eligible' THEN 1 END) as dossiers_eligibles,
    COUNT(CASE WHEN cpe.statut = 'validated' THEN 1 END) as dossiers_valides,
    COALESCE(SUM(cpe."montantFinal"), 0) as montant_total,
    COALESCE(SUM(CASE WHEN cpe.statut = 'eligible' THEN cpe."montantFinal" ELSE 0 END), 0) as montant_eligible,
    COALESCE(SUM(CASE WHEN cpe.statut = 'validated' THEN cpe."montantFinal" ELSE 0 END), 0) as montant_valide
FROM "ApporteurAffaires" aa
LEFT JOIN "Client" c ON c.apporteur_id = aa.id
LEFT JOIN "ClientProduitEligible" cpe ON cpe."clientId" = c.id
WHERE aa.email ILIKE '%profitum%' OR aa.company_name ILIKE '%profitum%'
GROUP BY aa.id, aa.company_name, aa.email;

-- 5. Vérifier la structure de la requête utilisée par l'API
-- Cette requête simule ce que fait l'endpoint /api/apporteur/dossiers
WITH apporteur_clients AS (
    SELECT c.id as client_id
    FROM "Client" c
    WHERE c.apporteur_id IN (
        SELECT id FROM "ApporteurAffaires" 
        WHERE email ILIKE '%profitum%' OR company_name ILIKE '%profitum%'
    )
)
SELECT 
    cpe.id,
    cpe."clientId",
    cpe."produitId",
    cpe.statut,
    cpe."montantFinal",
    cpe."tauxFinal",
    cpe.created_at,
    json_build_object(
        'id', c.id,
        'company_name', c.company_name,
        'email', c.email,
        'status', c.status
    ) as "Client",
    json_build_object(
        'id', pe.id,
        'nom', pe.nom,
        'categorie', pe.categorie
    ) as "ProduitEligible"
FROM "ClientProduitEligible" cpe
INNER JOIN "Client" c ON cpe."clientId" = c.id
LEFT JOIN "ProduitEligible" pe ON cpe."produitId" = pe.id
WHERE c.id IN (SELECT client_id FROM apporteur_clients)
ORDER BY cpe.created_at DESC;

-- 6. Vérifier les données de la vue dashboard si elle existe
-- Note: Cette requête échouera si la vue n'existe pas, c'est normal
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'vue_apporteur_dashboard_principal'
    ) THEN
        RAISE NOTICE 'Vue vue_apporteur_dashboard_principal existe';
        PERFORM * FROM vue_apporteur_dashboard_principal 
        WHERE apporteur_id IN (
            SELECT id FROM "ApporteurAffaires" 
            WHERE email ILIKE '%profitum%' OR company_name ILIKE '%profitum%'
        );
    ELSE
        RAISE NOTICE 'Vue vue_apporteur_dashboard_principal n''existe pas';
    END IF;
END $$;

