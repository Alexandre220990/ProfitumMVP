-- Script de suppression sécurisée de la table Audit
-- À exécuter dans Supabase SQL Editor

-- 1. Vérifier que la table Audit est vide (sécurité)
SELECT COUNT(*) as nombre_audits FROM "Audit";

-- 2. Supprimer la contrainte de clé étrangère dans Appointment
ALTER TABLE "Appointment" 
DROP CONSTRAINT IF EXISTS "Appointment_auditId_fkey";

-- 3. Supprimer la colonne auditId de Appointment (optionnel)
-- Décommentez si vous voulez aussi supprimer cette colonne
-- ALTER TABLE "Appointment" DROP COLUMN IF EXISTS "auditId";

-- 4. Supprimer les contraintes de clé étrangère dans Audit
ALTER TABLE "Audit" 
DROP CONSTRAINT IF EXISTS "Audit_assigned_by_admin_fkey";

ALTER TABLE "Audit" 
DROP CONSTRAINT IF EXISTS "Audit_clientId_fkey";

ALTER TABLE "Audit" 
DROP CONSTRAINT IF EXISTS "Audit_expertId_fkey";

-- 5. Supprimer la table Audit
DROP TABLE IF EXISTS "Audit";

-- 6. Vérifier que la suppression a réussi
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'Audit' 
    AND table_schema = 'public';

-- 7. Vérifier qu'il n'y a plus de références à Audit
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND (ccu.table_name = 'Audit' OR tc.table_name = 'Audit')
    AND tc.table_schema = 'public';
