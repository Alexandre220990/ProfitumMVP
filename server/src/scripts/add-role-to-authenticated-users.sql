-- Script pour ajouter la colonne role à authenticated_users
-- Version sécurisée avec vérifications

-- 1. Vérifier la structure actuelle de authenticated_users
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'authenticated_users'
ORDER BY ordinal_position;

-- 2. Ajouter la colonne role si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'authenticated_users' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE authenticated_users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
        RAISE NOTICE 'Colonne role ajoutée à authenticated_users';
    ELSE
        RAISE NOTICE 'Colonne role existe déjà';
    END IF;
END $$;

-- 3. Vérifier que la colonne a été ajoutée
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'authenticated_users' 
AND column_name = 'role';

-- 4. Mettre à jour les utilisateurs existants avec des rôles appropriés
-- Identifier les admins potentiels (par email ou autre critère)
UPDATE authenticated_users 
SET role = 'admin' 
WHERE email LIKE '%admin%' 
   OR email LIKE '%profitum%'
   OR email IN ('admin@profitum.app', 'alex@profitum.app')
   OR id IN (
       SELECT DISTINCT created_by 
       FROM conversations 
       WHERE created_by IS NOT NULL
   );

-- 5. Vérifier la répartition des rôles
SELECT 
    role,
    COUNT(*) as count
FROM authenticated_users
GROUP BY role
ORDER BY count DESC; 