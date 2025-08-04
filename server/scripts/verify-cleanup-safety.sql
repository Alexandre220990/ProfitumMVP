-- Script de vérification de sécurité avant nettoyage
-- Vérifie qu'aucune contrainte de clé étrangère ne référence les tables à supprimer

DO $$
DECLARE
    table_name text;
    constraint_count integer;
BEGIN
    -- Vérification des tables de vérification d'existence
    RAISE NOTICE '=== VÉRIFICATION DES TABLES DE VÉRIFICATION D''EXISTENCE ===';
    
    FOR table_name IN 
        SELECT unnest(ARRAY['conversation_exists', 'message_files_exists', 'messages_exists', 'typing_indicators_exists'])
    LOOP
        -- Vérifier si la table existe
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
            -- Compter les contraintes de clé étrangère qui référencent cette table
            SELECT COUNT(*) INTO constraint_count
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND ccu.table_name = table_name
            AND ccu.table_schema = 'public';
            
            RAISE NOTICE 'Table %: % contraintes de clé étrangère', table_name, constraint_count;
            
            IF constraint_count > 0 THEN
                RAISE WARNING 'ATTENTION: La table % a % contraintes de clé étrangère!', table_name, constraint_count;
            ELSE
                RAISE NOTICE '✅ Table %: Sûre à supprimer', table_name;
            END IF;
        ELSE
            RAISE NOTICE 'Table %: N''existe pas', table_name;
        END IF;
    END LOOP;
    
    -- Vérification des tables TICPE vacantes
    RAISE NOTICE '=== VÉRIFICATION DES TABLES TICPE VACANTES ===';
    
    FOR table_name IN 
        SELECT unnest(ARRAY['TICPEAdminMaturity', 'TICPEAdvancedRules', 'TICPEUsageScenarios', 'TICPESimulationResults'])
    LOOP
        -- Vérifier si la table existe
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
            -- Compter les contraintes de clé étrangère qui référencent cette table
            SELECT COUNT(*) INTO constraint_count
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND ccu.table_name = table_name
            AND ccu.table_schema = 'public';
            
            RAISE NOTICE 'Table %: % contraintes de clé étrangère', table_name, constraint_count;
            
            IF constraint_count > 0 THEN
                RAISE WARNING 'ATTENTION: La table % a % contraintes de clé étrangère!', table_name, constraint_count;
            ELSE
                RAISE NOTICE '✅ Table %: Sûre à supprimer', table_name;
            END IF;
        ELSE
            RAISE NOTICE 'Table %: N''existe pas', table_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '=== VÉRIFICATION TERMINÉE ===';
END $$; 