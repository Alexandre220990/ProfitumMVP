-- =====================================================
-- CORRECTION CLIENT ISSUE - wamuchacha@gmail.com
-- Date: 2025-01-30
-- =====================================================

-- 1. VÉRIFIER ET CORRIGER LE TYPE D'UTILISATEUR
DO $$
DECLARE
    user_record RECORD;
    client_record RECORD;
    admin_record RECORD;
BEGIN
    -- Vérifier l'utilisateur auth
    SELECT * INTO user_record 
    FROM auth.users 
    WHERE email = 'wamuchacha@gmail.com';
    
    IF FOUND THEN
        RAISE NOTICE 'Utilisateur auth trouvé: %', user_record.id;
        
        -- Vérifier s'il existe dans Client
        SELECT * INTO client_record 
        FROM "Client" 
        WHERE email = 'wamuchacha@gmail.com';
        
        -- Vérifier s'il existe dans Admin
        SELECT * INTO admin_record 
        FROM "Admin" 
        WHERE email = 'wamuchacha@gmail.com';
        
        -- Si l'utilisateur est admin ET client, supprimer l'entrée admin
        IF admin_record.id IS NOT NULL AND client_record.id IS NOT NULL THEN
            RAISE NOTICE 'Conflit détecté: utilisateur est admin ET client. Suppression de l''entrée admin.';
            DELETE FROM "Admin" WHERE email = 'wamuchacha@gmail.com';
        END IF;
        
        -- Si l'utilisateur n'existe pas dans Client, le créer
        IF client_record.id IS NULL THEN
            RAISE NOTICE 'Création de l''entrée Client pour wamuchacha@gmail.com';
            INSERT INTO "Client" (
                id,
                email,
                auth_id,
                name,
                company_name,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                'wamuchacha@gmail.com',
                user_record.id,
                'Client Test',
                'Entreprise Test',
                NOW(),
                NOW()
            );
        END IF;
        
    ELSE
        RAISE NOTICE 'Utilisateur auth non trouvé pour wamuchacha@gmail.com';
    END IF;
END $$;

-- 2. CRÉER DES PRODUITS ÉLIGIBLES DE TEST SI AUCUN N'EXISTE
DO $$
DECLARE
    client_id UUID;
    produit_count INTEGER;
BEGIN
    -- Récupérer l'ID du client
    SELECT id INTO client_id 
    FROM "Client" 
    WHERE email = 'wamuchacha@gmail.com';
    
    IF client_id IS NOT NULL THEN
        -- Compter les produits éligibles existants
        SELECT COUNT(*) INTO produit_count 
        FROM "ClientProduitEligible" 
        WHERE "clientId" = client_id;
        
        RAISE NOTICE 'Client trouvé: %. Produits éligibles existants: %', client_id, produit_count;
        
        -- Si aucun produit éligible, en créer de test
        IF produit_count = 0 THEN
            RAISE NOTICE 'Création de produits éligibles de test...';
            
            -- TICPE
            INSERT INTO "ClientProduitEligible" (
                "clientId",
                "produitId",
                statut,
                "tauxFinal",
                "montantFinal",
                "dureeFinale",
                metadata,
                notes,
                priorite,
                created_at,
                updated_at
            ) VALUES (
                client_id,
                'TICPE',
                'eligible',
                85,
                7500.00,
                12,
                '{"source": "test_creation", "confidence_level": "high"}'::jsonb,
                'Produit éligible créé pour test',
                1,
                NOW(),
                NOW()
            );
            
            -- URSSAF
            INSERT INTO "ClientProduitEligible" (
                "clientId",
                "produitId",
                statut,
                "tauxFinal",
                "montantFinal",
                "dureeFinale",
                metadata,
                notes,
                priorite,
                created_at,
                updated_at
            ) VALUES (
                client_id,
                'URSSAF',
                'eligible',
                70,
                4500.00,
                12,
                '{"source": "test_creation", "confidence_level": "medium"}'::jsonb,
                'Produit éligible créé pour test',
                2,
                NOW(),
                NOW()
            );
            
            -- DFS
            INSERT INTO "ClientProduitEligible" (
                "clientId",
                "produitId",
                statut,
                "tauxFinal",
                "montantFinal",
                "dureeFinale",
                metadata,
                notes,
                priorite,
                dateEligibilite,
                created_at,
                updated_at
            ) VALUES (
                client_id,
                'DFS',
                'en_cours',
                55,
                3000.00,
                12,
                '{"source": "test_creation", "confidence_level": "medium"}'::jsonb,
                'Produit en cours créé pour test',
                3,
                NOW(),
                NOW(),
                NOW()
            );
            
            RAISE NOTICE '3 produits éligibles de test créés avec succès';
        ELSE
            RAISE NOTICE 'Produits éligibles déjà existants, pas de création nécessaire';
        END IF;
    ELSE
        RAISE NOTICE 'Client non trouvé, impossible de créer des produits éligibles';
    END IF;
END $$;

-- 3. VÉRIFICATION FINALE
SELECT 
    'VERIFICATION_FINALE' as section,
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'wamuchacha@gmail.com') THEN '✅ Utilisateur auth OK'
        ELSE '❌ Utilisateur auth manquant'
    END as auth_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM "Client" WHERE email = 'wamuchacha@gmail.com') THEN '✅ Client OK'
        ELSE '❌ Client manquant'
    END as client_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM "Admin" WHERE email = 'wamuchacha@gmail.com') THEN '⚠️ CONFLIT ADMIN!'
        ELSE '✅ Pas de conflit admin'
    END as admin_conflict,
    CASE 
        WHEN EXISTS(SELECT 1 FROM "ClientProduitEligible" cpe JOIN "Client" c ON cpe."clientId" = c.id WHERE c.email = 'wamuchacha@gmail.com') THEN '✅ Produits éligibles OK'
        ELSE '❌ Aucun produit éligible'
    END as produits_status;

-- 4. AFFICHER LES PRODUITS ÉLIGIBLES CRÉÉS
SELECT 
    'PRODUITS_ELIGIBLES_FINAUX' as section,
    cpe.id,
    cpe."produitId",
    cpe.statut,
    cpe."tauxFinal",
    cpe."montantFinal",
    cpe.created_at
FROM "ClientProduitEligible" cpe
JOIN "Client" c ON cpe."clientId" = c.id
WHERE c.email = 'wamuchacha@gmail.com'
ORDER BY cpe.created_at DESC; 