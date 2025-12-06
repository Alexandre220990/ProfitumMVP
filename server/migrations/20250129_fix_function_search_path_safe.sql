-- ============================================================================
-- CORRECTION SÉCURISÉE : Fixer le search_path pour toutes les fonctions
-- ============================================================================
-- Problème : Les fonctions avec search_path mutable peuvent être vulnérables
--            aux attaques de type "search_path hijacking"
-- Solution : Définir explicitement search_path = '' pour toutes les fonctions
--            listées par le linter Supabase (avec vérification d'existence)
-- ============================================================================
-- Date : 2025-01-29
-- Version : Safe (vérifie l'existence avant modification)
-- ============================================================================

BEGIN;

-- ============================================================================
-- FONCTION HELPER : Appliquer search_path de manière sécurisée
-- ============================================================================

CREATE OR REPLACE FUNCTION apply_search_path_to_function(
    func_name TEXT,
    func_signature TEXT
)
RETURNS void AS $$
DECLARE
    func_exists BOOLEAN;
    func_oid OID;
    actual_signature TEXT;
    alter_cmd TEXT;
BEGIN
    -- Vérifier si la fonction existe avec cette signature exacte
    SELECT p.oid, pg_get_function_arguments(p.oid)
    INTO func_oid, actual_signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.proname = func_name
    AND pg_get_function_arguments(p.oid) = func_signature;
    
    func_exists := (func_oid IS NOT NULL);
    
    IF func_exists THEN
        BEGIN
            -- Construire la commande ALTER FUNCTION avec la signature exacte
            IF func_signature = '' THEN
                alter_cmd := format('ALTER FUNCTION public.%I() SET search_path = ''''', func_name);
            ELSE
                alter_cmd := format('ALTER FUNCTION public.%I(%s) SET search_path = ''''', 
                                   func_name, func_signature);
            END IF;
            
            EXECUTE alter_cmd;
            RAISE NOTICE '✅ %(%) corrigé', func_name, func_signature;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING '❌ Erreur lors de la modification de %(%): %', func_name, func_signature, SQLERRM;
        END;
    ELSE
        -- Vérifier si la fonction existe avec une autre signature
        SELECT EXISTS (
            SELECT 1
            FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public'
            AND p.proname = func_name
        ) INTO func_exists;
        
        IF func_exists THEN
            RAISE NOTICE '⚠️  % existe mais avec une signature différente (attendu: %, trouvé: %)', 
                        func_name, func_signature, actual_signature;
        ELSE
            RAISE NOTICE '⚠️  %(%) n''existe pas, ignoré', func_name, func_signature;
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Erreur inattendue pour %(%): %', func_name, func_signature, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CORRECTION DES FONCTIONS : Définir search_path = ''
-- ============================================================================
-- Note: Les signatures sont générées automatiquement depuis la base de données
--       pour garantir la correspondance exacte

-- Fonctions de notifications
SELECT apply_search_path_to_function('archive_admin_notification', 'notification_id uuid');
SELECT apply_search_path_to_function('archive_apporteur_notification', 'notification_id uuid');
SELECT apply_search_path_to_function('archive_client_notification', 'notification_id uuid');
SELECT apply_search_path_to_function('archive_notification', 'notification_id uuid');
SELECT apply_search_path_to_function('auto_archive_expired_notifications', '');
SELECT apply_search_path_to_function('create_notification_status_for_all_admins', '');
SELECT apply_search_path_to_function('get_notification_stats', '');
SELECT apply_search_path_to_function('initialize_admin_notification_status', '');
SELECT apply_search_path_to_function('initialize_apporteur_notification_status', '');
SELECT apply_search_path_to_function('initialize_client_notification_status', '');
SELECT apply_search_path_to_function('mark_admin_notification_read', 'notification_id uuid');
SELECT apply_search_path_to_function('mark_apporteur_notification_read', 'notification_id uuid');
SELECT apply_search_path_to_function('mark_client_notification_read', 'notification_id uuid');
SELECT apply_search_path_to_function('mark_notification_as_dismissed', '');
SELECT apply_search_path_to_function('mark_notification_as_read', '');
SELECT apply_search_path_to_function('mark_notification_read', 'notification_id uuid');
SELECT apply_search_path_to_function('mark_notification_unread', 'notification_id uuid');
SELECT apply_search_path_to_function('set_notification_expiration', '');
SELECT apply_search_path_to_function('sync_apporteur_notification_is_read', '');
SELECT apply_search_path_to_function('sync_client_notification_is_read', '');
SELECT apply_search_path_to_function('update_admin_notification_updated_at', '');
SELECT apply_search_path_to_function('update_apporteur_notification_updated_at', '');
SELECT apply_search_path_to_function('update_client_notification_updated_at', '');
SELECT apply_search_path_to_function('update_notification_final_updated_at', '');
SELECT apply_search_path_to_function('update_notification_updated_at', '');
SELECT apply_search_path_to_function('validate_admin_notification_data', '');
SELECT apply_search_path_to_function('validate_apporteur_notification_data', '');
SELECT apply_search_path_to_function('validate_client_notification_data', '');
SELECT apply_search_path_to_function('validate_notification_data', '');
SELECT apply_search_path_to_function('cleanup_expired_notifications', '');
SELECT apply_search_path_to_function('cleanup_old_admin_notifications', '');
SELECT apply_search_path_to_function('cleanup_old_apporteur_notifications', '');
SELECT apply_search_path_to_function('cleanup_old_client_notifications', '');
SELECT apply_search_path_to_function('cleanup_old_notifications', '');

-- Fonctions de mise à jour de timestamps
SELECT apply_search_path_to_function('update_document_file_permission_updated_at', '');
SELECT apply_search_path_to_function('update_calendar_updated_at', '');
SELECT apply_search_path_to_function('update_import_mapping_config_updated_at', '');
SELECT apply_search_path_to_function('update_import_templates_updated_at', '');
SELECT apply_search_path_to_function('update_expert_client_emails_timestamp', '');
SELECT apply_search_path_to_function('update_expert_client_emails_received_timestamp', '');
SELECT apply_search_path_to_function('update_expert_client_email_sequences_timestamp', '');
SELECT apply_search_path_to_function('update_expert_client_email_scheduled_timestamp', '');
SELECT apply_search_path_to_function('update_reminder_updated_at', '');
SELECT apply_search_path_to_function('update_ged_document_last_modified', '');
SELECT apply_search_path_to_function('update_ged_document_permission_updated_at', '');
SELECT apply_search_path_to_function('update_audit_documents_updated_at', '');
SELECT apply_search_path_to_function('update_document_file_updated_at', '');
SELECT apply_search_path_to_function('update_prospect_email_received_timestamp', '');
SELECT apply_search_path_to_function('update_prospect_reports_timestamp', '');
SELECT apply_search_path_to_function('update_prospects_updated_at', '');
SELECT apply_search_path_to_function('update_updated_at_column', '');
SELECT apply_search_path_to_function('update_prospect_emailing_status', '');
SELECT apply_search_path_to_function('update_expert_campaign_updated_at', '');
SELECT apply_search_path_to_function('update_documentation_updated_at', '');
SELECT apply_search_path_to_function('update_documentation_items_updated_at', '');
SELECT apply_search_path_to_function('update_rdv_updated_at', '');
SELECT apply_search_path_to_function('update_message_updated_at', '');
SELECT apply_search_path_to_function('update_email_tracking_timestamp', '');
SELECT apply_search_path_to_function('update_simulation_history_updated_at', '');
SELECT apply_search_path_to_function('update_expert_criteria_updated_at', '');
SELECT apply_search_path_to_function('update_expert_assignment_updated_at', '');
SELECT apply_search_path_to_function('update_chatbot_log_updated_at', '');
SELECT apply_search_path_to_function('update_eligibility_changes_updated_at', '');
SELECT apply_search_path_to_function('update_shared_document_timestamp', '');
SELECT apply_search_path_to_function('update_document_request_updated_at', '');
SELECT apply_search_path_to_function('update_contact_messages_updated_at', '');
SELECT apply_search_path_to_function('update_apporteur_updated_at', '');
SELECT apply_search_path_to_function('update_client_process_document_updated_at', '');
SELECT apply_search_path_to_function('update_dossier_timeline_updated_at', '');
SELECT apply_search_path_to_function('update_client_charte_signature_updated_at', '');
SELECT apply_search_path_to_function('update_promotion_banner_updated_at', '');
SELECT apply_search_path_to_function('rdv_report_set_updated_at', '');
SELECT apply_search_path_to_function('rdv_task_set_updated_at', '');
SELECT apply_search_path_to_function('cabinet_produit_set_updated_at', '');
SELECT apply_search_path_to_function('cabinet_set_updated_at', '');

-- Fonctions de gestion de fichiers et documents
SELECT apply_search_path_to_function('increment_document_file_download_count', '');
SELECT apply_search_path_to_function('get_client_files', 'client_uuid uuid, category_filter text DEFAULT NULL::text');
SELECT apply_search_path_to_function('get_client_file_stats', 'client_uuid uuid');
SELECT apply_search_path_to_function('cleanup_expired_files', '');
SELECT apply_search_path_to_function('get_ged_document_permissions', 'document_uuid uuid, user_type_param text');
SELECT apply_search_path_to_function('get_ged_user_documents', 'user_type_param text');
SELECT apply_search_path_to_function('get_documents_stats', '');
SELECT apply_search_path_to_function('get_user_document_stats', 'user_uuid uuid');
SELECT apply_search_path_to_function('get_expired_documents', '');
SELECT apply_search_path_to_function('get_document_stats', '');
SELECT apply_search_path_to_function('get_client_document_size', 'client_uuid uuid');
SELECT apply_search_path_to_function('create_document_version', '');
SELECT apply_search_path_to_function('update_document_version', '');
SELECT apply_search_path_to_function('increment_download_count', '');

-- Fonctions de nettoyage et maintenance
SELECT apply_search_path_to_function('trigger_cleanup_expired_sessions', '');
SELECT apply_search_path_to_function('cleanup_expired_shares', '');
SELECT apply_search_path_to_function('cleanup_old_typing_indicators', '');
SELECT apply_search_path_to_function('cleanup_expired_temporary_data', '');
SELECT apply_search_path_to_function('cleanup_expired_simulator_sessions', '');
SELECT apply_search_path_to_function('cleanup_old_historique', '');
SELECT apply_search_path_to_function('cleanup_old_candidatures', '');
SELECT apply_search_path_to_function('cleanup_old_access_logs', '');
SELECT apply_search_path_to_function('cleanup_inactive_fcm_tokens', '');
SELECT apply_search_path_to_function('clean_expired_sessions', '');
SELECT apply_search_path_to_function('clean_old_email_trackings', 'days_to_keep integer DEFAULT 90');

-- Fonctions de calendrier et événements
SELECT apply_search_path_to_function('create_recurring_events', 'p_event_id uuid, p_recurrence_rule text, p_end_date timestamp with time zone');
SELECT apply_search_path_to_function('get_rdv_end_datetime', 'rdv_id uuid');
SELECT apply_search_path_to_function('get_rdv_status_label', 'rdv_status character varying');
SELECT apply_search_path_to_function('get_rdv_stats', '');
SELECT apply_search_path_to_function('get_overdue_controls', '');

-- Fonctions de messagerie
SELECT apply_search_path_to_function('create_admin_conversation', 'user_id uuid, user_type character varying');
SELECT apply_search_path_to_function('update_conversation_last_message', '');
SELECT apply_search_path_to_function('create_client_admin_conversation', '');
SELECT apply_search_path_to_function('create_expert_admin_conversation', '');
SELECT apply_search_path_to_function('create_conversation_direct', 'p_type character varying, p_participant_ids uuid[], p_title character varying, p_status character varying, p_created_by uuid');
SELECT apply_search_path_to_function('generate_message_thread_id', '');

-- Fonctions de calcul et statistiques
SELECT apply_search_path_to_function('calculer_montant_produit', 'p_produit_id uuid, p_reponses jsonb');
SELECT apply_search_path_to_function('calculer_tous_produits', 'p_reponses jsonb');
SELECT apply_search_path_to_function('calculer_multiplication_sequence', 'p_formule jsonb, p_reponses jsonb');
SELECT apply_search_path_to_function('calculer_percentage', 'p_formule jsonb, p_reponses jsonb');
SELECT apply_search_path_to_function('get_actions_by_type', 'p_action character varying, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0');
SELECT apply_search_path_to_function('get_apporteur_kpis', 'apporteur_uuid uuid');
SELECT apply_search_path_to_function('get_top_experts', 'limit_count integer DEFAULT 10');
SELECT apply_search_path_to_function('get_expert_global_stats', '');
SELECT apply_search_path_to_function('get_expert_assignments_by_status', 'status_filter character varying');
SELECT apply_search_path_to_function('get_assignment_statistics', '');
SELECT apply_search_path_to_function('get_simulation_results', 'p_session_token text');
SELECT apply_search_path_to_function('get_recent_security_incidents', 'days_back integer DEFAULT 30');
SELECT apply_search_path_to_function('calculate_eligibility', 'p_session_id uuid, p_produit_id text');
SELECT apply_search_path_to_function('calculate_expert_stats', 'expert_uuid uuid');
SELECT apply_search_path_to_function('update_all_expert_stats', '');
SELECT apply_search_path_to_function('test_expert_global_stats', '');

-- Fonctions de gestion de clients et experts
SELECT apply_search_path_to_function('create_client', 'p_email text, p_password text, p_name text, p_company_name text, p_phone_number text, p_address text, p_city text, p_postal_code text, p_siren text, p_type text, p_username text');
SELECT apply_search_path_to_function('generate_client_id', '');
SELECT apply_search_path_to_function('generate_expert_id', '');
SELECT apply_search_path_to_function('get_user_details', 'user_id uuid');
SELECT apply_search_path_to_function('get_user_type', 'user_id uuid');
SELECT apply_search_path_to_function('create_temporary_client', 'p_session_token text, p_client_data jsonb DEFAULT ''{}''::jsonb');
SELECT apply_search_path_to_function('migrate_temporary_client', 'p_temp_client_id uuid, p_real_email text, p_real_password text, p_real_data jsonb');
SELECT apply_search_path_to_function('archive_orphan_parents', '');
SELECT apply_search_path_to_function('update_parent_children_count', '');
SELECT apply_search_path_to_function('manage_parent_child_relationships', '');

-- Fonctions de gestion de prospects
SELECT apply_search_path_to_function('save_prospect_report_version', '');
SELECT apply_search_path_to_function('notify_prospect_reply', '');
SELECT apply_search_path_to_function('notify_prospect_reply_enhanced', '');
SELECT apply_search_path_to_function('stop_prospect_sequences_on_reply', '');
SELECT apply_search_path_to_function('check_prospect_email_match', 'prospect_email text, incoming_email text');
SELECT apply_search_path_to_function('create_hot_prospect', 'p_apporteur_id uuid, p_prospect_data jsonb, p_preselected_expert_id uuid DEFAULT NULL::uuid');
SELECT apply_search_path_to_function('convert_prospect_to_client', 'p_prospect_id uuid, p_apporteur_id uuid');

-- Fonctions de simulateur
SELECT apply_search_path_to_function('create_simulator_session_with_client_data', 'p_session_token text DEFAULT (gen_random_uuid())::text, p_client_data jsonb DEFAULT ''{}''::jsonb, p_expires_in_hours integer DEFAULT 24');
SELECT apply_search_path_to_function('insert_ticpe_questions_transaction', 'questions_data jsonb');
SELECT apply_search_path_to_function('save_simulator_responses', 'p_session_token text, p_responses jsonb');
SELECT apply_search_path_to_function('calculate_simulator_eligibility', 'p_session_token text');
SELECT apply_search_path_to_function('create_simulation_with_temporary_client', 'p_session_token text, p_client_data jsonb DEFAULT ''{}''::jsonb');
SELECT apply_search_path_to_function('migrate_simulator_to_client', 'p_session_token text, p_client_inscription_data jsonb');
SELECT apply_search_path_to_function('migrate_simulator_to_existing_client', 'p_session_token text, p_client_email text');
SELECT apply_search_path_to_function('migrate_session_manually', 'p_session_token text, p_client_email text');
SELECT apply_search_path_to_function('migrate_session_manually_corrected', 'p_session_token text, p_client_email text');
SELECT apply_search_path_to_function('mark_session_completed', 'session_token_param text');
SELECT apply_search_path_to_function('update_session_activity', '');
SELECT apply_search_path_to_function('duplicate_completed_simulation', 'p_client_id uuid');
SELECT apply_search_path_to_function('mapper_reponses_vers_variables', 'p_reponses jsonb');
SELECT apply_search_path_to_function('evaluer_eligibilite_avec_calcul', 'p_simulation_id uuid');

-- Fonctions de gestion de dossiers
SELECT apply_search_path_to_function('trigger_update_dossier_progress', '');
SELECT apply_search_path_to_function('log_dossier_change', '');
SELECT apply_search_path_to_function('update_dossier_progress_from_steps', '');
SELECT apply_search_path_to_function('trigger_status_change_comment', '');
SELECT apply_search_path_to_function('trigger_rdv_comment', '');
SELECT apply_search_path_to_function('trigger_document_comment', '');

-- Fonctions de gestion d'experts
SELECT apply_search_path_to_function('trigger_log_expert_changes', '');
SELECT apply_search_path_to_function('trigger_update_expert_stats', '');
SELECT apply_search_path_to_function('trigger_update_expert_earnings', '');
SELECT apply_search_path_to_function('get_apporteur_activite_personnelle', 'apporteur_uuid uuid');
SELECT apply_search_path_to_function('get_apporteur_prospects_detaille', 'apporteur_uuid uuid');
SELECT apply_search_path_to_function('get_apporteur_alertes_personnelles', 'apporteur_uuid uuid');
SELECT apply_search_path_to_function('sync_documents_sent', '');

-- Fonctions de sécurité et audit
SELECT apply_search_path_to_function('check_bucket_permissions', 'bucket_name text DEFAULT ''admin-documents''::text, user_id uuid DEFAULT auth.uid()');
SELECT apply_search_path_to_function('log_bucket_access', 'file_path text, action_type text, user_id uuid DEFAULT auth.uid()');
SELECT apply_search_path_to_function('check_document_access', 'file_path text, bucket_name text, user_id uuid, action text');
SELECT apply_search_path_to_function('log_admin_action', 'p_admin_id uuid, p_action character varying, p_table_name character varying, p_record_id uuid DEFAULT NULL::uuid, p_old_values jsonb DEFAULT ''{}''::jsonb, p_new_values jsonb DEFAULT ''{}''::jsonb, p_description text DEFAULT NULL::text, p_severity character varying DEFAULT ''info''::character varying, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_session_id text DEFAULT NULL::text');
SELECT apply_search_path_to_function('detect_suspicious_activity', '');
SELECT apply_search_path_to_function('get_auth_user_id_by_email', 'user_email text');
SELECT apply_search_path_to_function('get_admin_audit_history', 'p_admin_id uuid, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0');

-- Fonctions de gestion d'emails
SELECT apply_search_path_to_function('generate_email_content_hash', 'p_subject text, p_body text');
SELECT apply_search_path_to_function('set_email_content_hash', '');
SELECT apply_search_path_to_function('is_email_already_sent', 'p_prospect_id uuid, p_subject text, p_body text');
SELECT apply_search_path_to_function('extract_email_domain', 'email_address text');

-- Fonctions de gestion de cabinet
SELECT apply_search_path_to_function('cabinet_set_slug', '');
SELECT apply_search_path_to_function('refresh_cabinet_team_stat', '');

-- Fonctions de gestion de produits
SELECT apply_search_path_to_function('merge_client_products', 'p_client_id uuid, p_new_simulation_id uuid, p_new_products jsonb');

-- Fonctions de gestion de campagnes
SELECT apply_search_path_to_function('check_campaign_dates', '');
SELECT apply_search_path_to_function('update_campaign_active_status', '');

-- Fonctions de gestion de bannières
SELECT apply_search_path_to_function('check_banner_dates', '');
SELECT apply_search_path_to_function('update_banner_active_status', '');
SELECT apply_search_path_to_function('increment_banner_impressions', 'banner_uuid uuid');
SELECT apply_search_path_to_function('increment_banner_clicks', 'banner_uuid uuid');

-- Fonctions de documentation
SELECT apply_search_path_to_function('increment_documentation_view_count', '');

-- Fonctions de gestion de séquences d'emails
SELECT apply_search_path_to_function('recalculate_scheduled_emails_dates', 'prospect_uuid uuid');

-- Fonctions de vérification d'inactivité
SELECT apply_search_path_to_function('check_inactivity_alerts', '');

-- Fonctions de commentaires système
SELECT apply_search_path_to_function('create_system_comment', 'p_dossier_id uuid, p_category text, p_event_type text, p_content text, p_metadata jsonb DEFAULT ''{}''::jsonb, p_priority text DEFAULT NULL::text');

-- ============================================================================
-- NETTOYAGE : Supprimer la fonction helper
-- ============================================================================

DROP FUNCTION IF EXISTS apply_search_path_to_function(TEXT, TEXT);

-- ============================================================================
-- VÉRIFICATION : Afficher les fonctions corrigées
-- ============================================================================

DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.proconfig IS NOT NULL
    AND array_to_string(p.proconfig, ',') LIKE '%search_path%';
    
    RAISE NOTICE '✅ Migration terminée : % fonctions avec search_path défini', func_count;
END $$;

COMMIT;

-- ============================================================================
-- NOTES
-- ============================================================================
-- Cette migration définit search_path = '' pour toutes les fonctions listées
-- par le linter Supabase. Elle vérifie l'existence de chaque fonction avant
-- de la modifier, ce qui évite les erreurs si certaines fonctions n'existent pas.
--
-- Pour vérifier qu'une fonction a bien search_path défini :
-- SELECT proname, proconfig 
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public' 
-- AND proname = 'nom_de_la_fonction';
-- ============================================================================
