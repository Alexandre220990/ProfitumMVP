-- Script pour corriger la situation admin
-- Remplacez 'votre-email@profitum.app' par votre email réel

-- 1. Vérifier où se trouve l'admin
DO $$
DECLARE
    admin_email TEXT := 'votre-email@profitum.app'; -- REMPLACEZ PAR VOTRE EMAIL
    client_exists BOOLEAN := FALSE;
    expert_exists BOOLEAN := FALSE;
    admin_exists BOOLEAN := FALSE;
    client_record RECORD;
    expert_record RECORD;
BEGIN
    -- Vérifier si l'admin existe dans chaque table
    SELECT EXISTS(SELECT 1 FROM "Client" WHERE email = admin_email) INTO client_exists;
    SELECT EXISTS(SELECT 1 FROM "Expert" WHERE email = admin_email) INTO expert_exists;
    SELECT EXISTS(SELECT 1 FROM "Admin" WHERE email = admin_email) INTO admin_exists;
    
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Existe dans Client: %', client_exists;
    RAISE NOTICE 'Existe dans Expert: %', expert_exists;
    RAISE NOTICE 'Existe dans Admin: %', admin_exists;
    
    -- Si l'admin existe déjà dans la table Admin, ne rien faire
    IF admin_exists THEN
        RAISE NOTICE 'Admin existe déjà dans la table Admin';
        RETURN;
    END IF;
    
    -- Si l'admin existe dans Client, le déplacer vers Admin
    IF client_exists THEN
        SELECT * INTO client_record FROM "Client" WHERE email = admin_email;
        
        INSERT INTO "Admin" (email, name, created_at, updated_at)
        VALUES (client_record.email, client_record.name, client_record.created_at, NOW());
        
        RAISE NOTICE 'Admin déplacé de Client vers Admin: %', client_record.email;
    END IF;
    
    -- Si l'admin existe dans Expert, le déplacer vers Admin
    IF expert_exists THEN
        SELECT * INTO expert_record FROM "Expert" WHERE email = admin_email;
        
        INSERT INTO "Admin" (email, name, created_at, updated_at)
        VALUES (expert_record.email, expert_record.name, expert_record.created_at, NOW());
        
        RAISE NOTICE 'Admin déplacé de Expert vers Admin: %', expert_record.email;
    END IF;
    
    -- Si l'admin n'existe nulle part, le créer
    IF NOT client_exists AND NOT expert_exists AND NOT admin_exists THEN
        INSERT INTO "Admin" (email, name, created_at, updated_at)
        VALUES (admin_email, 'Admin', NOW(), NOW());
        
        RAISE NOTICE 'Admin créé: %', admin_email;
    END IF;
    
END $$;

-- 2. Vérifier le résultat
SELECT 
    'Admin' as table_name,
    id,
    email,
    name,
    created_at
FROM "Admin"
WHERE email = 'votre-email@profitum.app' -- REMPLACEZ PAR VOTRE EMAIL
ORDER BY created_at DESC;

-- 3. Nettoyer les doublons (optionnel - à utiliser avec précaution)
-- DELETE FROM "Client" WHERE email = 'votre-email@profitum.app';
-- DELETE FROM "Expert" WHERE email = 'votre-email@profitum.app';
