-- Script SQL pour analyser les tables principales de Profitum
-- À exécuter dans l'interface SQL de Supabase
-- Focus sur les tables essentielles pour nos use cases

-- =====================================================
-- 1. TABLES PRINCIPALES - UTILISATEURS
-- =====================================================

-- === CLIENT ===
SELECT 'CLIENT' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Client'
ORDER BY ordinal_position;

-- === EXPERT ===
SELECT 'EXPERT' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Expert'
ORDER BY ordinal_position;

-- === ADMIN ===
SELECT 'ADMIN' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Admin'
ORDER BY ordinal_position;

-- =====================================================
-- 2. TABLES PRINCIPALES - PRODUITS & SERVICES
-- =====================================================

-- === PRODUITELIGIBLE ===
SELECT 'PRODUITELIGIBLE' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'ProduitEligible'
ORDER BY ordinal_position;

-- === CLIENTPRODUITELIGIBLE ===
SELECT 'CLIENTPRODUITELIGIBLE' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'ClientProduitEligible'
ORDER BY ordinal_position;

-- === CHARTESPRODUITS ===
SELECT 'CHARTESPRODUITS' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'ChartesProduits'
ORDER BY ordinal_position;

-- === CLIENT_CHARTE_SIGNATURE ===
SELECT 'CLIENT_CHARTE_SIGNATURE' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'client_charte_signature'
ORDER BY ordinal_position;

-- =====================================================
-- 3. TABLES PRINCIPALES - ASSIGNATIONS & RELATIONS
-- =====================================================

-- === EXPERTASSIGNMENT ===
SELECT 'EXPERTASSIGNMENT' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'expertassignment'
ORDER BY ordinal_position;

-- === EXPERTSPECIALIZATION ===
SELECT 'EXPERTSPECIALIZATION' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'ExpertSpecialization'
ORDER BY ordinal_position;

-- === SPECIALIZATION ===
SELECT 'SPECIALIZATION' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Specialization'
ORDER BY ordinal_position;

-- === EXPERTCATEGORY ===
SELECT 'EXPERTCATEGORY' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'ExpertCategory'
ORDER BY ordinal_position;

-- === EXPERTCRITERIA ===
SELECT 'EXPERTCRITERIA' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'expertcriteria'
ORDER BY ordinal_position;

-- =====================================================
-- 4. TABLES PRINCIPALES - COMMUNICATION
-- =====================================================

-- === MESSAGE ===
SELECT 'MESSAGE' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'message'
ORDER BY ordinal_position;

-- === NOTIFICATION ===
SELECT 'NOTIFICATION' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'notification'
ORDER BY ordinal_position;

-- === APPOINTMENT ===
SELECT 'APPOINTMENT' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Appointment'
ORDER BY ordinal_position;

-- =====================================================
-- 5. TABLES PRINCIPALES - AUDIT & SUIVI
-- =====================================================

-- === AUDIT ===
SELECT 'AUDIT' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Audit'
ORDER BY ordinal_position;

-- === VALIDATIONSTATE ===
SELECT 'VALIDATIONSTATE' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'ValidationState'
ORDER BY ordinal_position;

-- === ACCESS_LOGS ===
SELECT 'ACCESS_LOGS' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'access_logs'
ORDER BY ordinal_position;

-- === AUDIT_LOGS ===
SELECT 'AUDIT_LOGS' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'audit_logs'
ORDER BY ordinal_position;

-- === ADMINAUDITLOG ===
SELECT 'ADMINAUDITLOG' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'AdminAuditLog'
ORDER BY ordinal_position;

-- === EXPERTACCESSLOG ===
SELECT 'EXPERTACCESSLOG' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'expertaccesslog'
ORDER BY ordinal_position;

-- =====================================================
-- 6. TABLES PRINCIPALES - SIMULATIONS
-- =====================================================

-- === SIMULATION ===
SELECT 'SIMULATION' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'Simulation'
ORDER BY ordinal_position;

-- === SIMULATIONPROCESSED ===
SELECT 'SIMULATIONPROCESSED' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'SimulationProcessed'
ORDER BY ordinal_position;

-- === SIMULATIONRESULT ===
SELECT 'SIMULATIONRESULT' as table_name, column_name, data_type, is_nullable, column_default, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'SimulationResult'
ORDER BY ordinal_position;

-- =====================================================
-- 7. RELATIONS ET CLÉS ÉTRANGÈRES
-- =====================================================

-- Toutes les relations entre les tables principales
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN (
        'Client', 'Expert', 'Admin', 'ProduitEligible', 'ClientProduitEligible',
        'ChartesProduits', 'client_charte_signature', 'expertassignment',
        'ExpertSpecialization', 'Specialization', 'ExpertCategory', 'expertcriteria',
        'message', 'notification', 'Appointment', 'Audit', 'ValidationState',
        'Simulation', 'SimulationProcessed', 'SimulationResult'
    )
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- 8. STATISTIQUES DES TABLES PRINCIPALES
-- =====================================================

-- Nombre de lignes et taille des tables principales
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND tablename IN (
        'Client', 'Expert', 'Admin', 'ProduitEligible', 'ClientProduitEligible',
        'ChartesProduits', 'client_charte_signature', 'expertassignment',
        'ExpertSpecialization', 'Specialization', 'ExpertCategory', 'expertcriteria',
        'message', 'notification', 'Appointment', 'Audit', 'ValidationState',
        'Simulation', 'SimulationProcessed', 'SimulationResult'
    )
ORDER BY n_live_tup DESC;

-- =====================================================
-- 9. INDEX DES TABLES PRINCIPALES
-- =====================================================

-- Index des tables principales
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN (
        'Client', 'Expert', 'Admin', 'ProduitEligible', 'ClientProduitEligible',
        'ChartesProduits', 'client_charte_signature', 'expertassignment',
        'ExpertSpecialization', 'Specialization', 'ExpertCategory', 'expertcriteria',
        'message', 'notification', 'Appointment', 'Audit', 'ValidationState',
        'Simulation', 'SimulationProcessed', 'SimulationResult'
    )
ORDER BY tablename, indexname;

-- =====================================================
-- 10. POLITIQUES RLS DES TABLES PRINCIPALES
-- =====================================================

-- Politiques RLS des tables principales
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN (
        'Client', 'Expert', 'Admin', 'ProduitEligible', 'ClientProduitEligible',
        'ChartesProduits', 'client_charte_signature', 'expertassignment',
        'ExpertSpecialization', 'Specialization', 'ExpertCategory', 'expertcriteria',
        'message', 'notification', 'Appointment', 'Audit', 'ValidationState',
        'Simulation', 'SimulationProcessed', 'SimulationResult'
    )
ORDER BY tablename, policyname;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================

/*
INSTRUCTIONS D'EXÉCUTION :

1. Copiez ce script dans l'éditeur SQL de Supabase
2. Exécutez-le section par section (chaque section est séparée par des commentaires)
3. Sauvegardez les résultats de chaque section
4. Envoyez-moi les résultats pour que je mette à jour la documentation

SECTIONS PRIORITAIRES :
- Sections 1-4 : Tables principales (Client, Expert, ProduitEligible, etc.)
- Section 7 : Relations entre tables
- Section 8 : Statistiques

Une fois que j'aurai ces informations, je pourrai :
✅ Créer la documentation complète de la base de données
✅ Identifier les tables obsolètes ou redondantes
✅ Optimiser les requêtes et les relations
✅ Créer les migrations manquantes
✅ Améliorer la structure pour nos use cases
*/ 