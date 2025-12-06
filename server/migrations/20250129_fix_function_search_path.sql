-- ============================================================================
-- CORRECTION : Fixer le search_path pour toutes les fonctions
-- ============================================================================
-- Problème : Les fonctions avec search_path mutable peuvent être vulnérables
--            aux attaques de type "search_path hijacking"
-- Solution : Définir explicitement search_path = '' pour toutes les fonctions
--            listées par le linter Supabase
-- ============================================================================
-- Date : 2025-01-29
-- NOTE : Cette version nécessite que toutes les fonctions existent exactement
--        avec les signatures indiquées. Si certaines fonctions n'existent pas,
--        utilisez plutôt 20250129_fix_function_search_path_safe.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- CORRECTION DES FONCTIONS : Définir search_path = ''
-- ============================================================================
-- Note: SET search_path = '' force PostgreSQL à utiliser uniquement
--       les schémas explicitement qualifiés, ce qui est plus sécurisé
-- ATTENTION : Si vous obtenez des erreurs "function does not exist",
--             utilisez la version "safe" qui vérifie l'existence avant modification

-- Fonctions de mise à jour de timestamps
ALTER FUNCTION public.update_document_file_permission_updated_at() SET search_path = '';
ALTER FUNCTION public.update_calendar_updated_at() SET search_path = '';
ALTER FUNCTION public.update_import_mapping_config_updated_at() SET search_path = '';
ALTER FUNCTION public.update_import_templates_updated_at() SET search_path = '';
ALTER FUNCTION public.update_expert_client_emails_timestamp() SET search_path = '';
ALTER FUNCTION public.update_expert_client_emails_received_timestamp() SET search_path = '';
ALTER FUNCTION public.update_expert_client_email_sequences_timestamp() SET search_path = '';
ALTER FUNCTION public.update_expert_client_email_scheduled_timestamp() SET search_path = '';
ALTER FUNCTION public.update_reminder_updated_at() SET search_path = '';
ALTER FUNCTION public.update_ged_document_last_modified() SET search_path = '';
ALTER FUNCTION public.update_ged_document_permission_updated_at() SET search_path = '';
ALTER FUNCTION public.update_audit_documents_updated_at() SET search_path = '';
ALTER FUNCTION public.update_document_file_updated_at() SET search_path = '';
ALTER FUNCTION public.update_prospect_email_received_timestamp() SET search_path = '';
ALTER FUNCTION public.update_prospect_reports_timestamp() SET search_path = '';
ALTER FUNCTION public.update_prospects_updated_at() SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.update_prospect_emailing_status() SET search_path = '';
ALTER FUNCTION public.update_expert_campaign_updated_at() SET search_path = '';
ALTER FUNCTION public.update_documentation_updated_at() SET search_path = '';
ALTER FUNCTION public.update_documentation_items_updated_at() SET search_path = '';
ALTER FUNCTION public.update_notification_final_updated_at() SET search_path = '';
ALTER FUNCTION public.update_notification_updated_at() SET search_path = '';
ALTER FUNCTION public.update_admin_notification_updated_at() SET search_path = '';
ALTER FUNCTION public.update_rdv_updated_at() SET search_path = '';
ALTER FUNCTION public.update_message_updated_at() SET search_path = '';
ALTER FUNCTION public.update_email_tracking_timestamp() SET search_path = '';
ALTER FUNCTION public.update_simulation_history_updated_at() SET search_path = '';
ALTER FUNCTION public.update_expert_criteria_updated_at() SET search_path = '';
ALTER FUNCTION public.update_expert_assignment_updated_at() SET search_path = '';
ALTER FUNCTION public.update_chatbot_log_updated_at() SET search_path = '';
ALTER FUNCTION public.update_eligibility_changes_updated_at() SET search_path = '';
ALTER FUNCTION public.update_shared_document_timestamp() SET search_path = '';
ALTER FUNCTION public.update_document_request_updated_at() SET search_path = '';
ALTER FUNCTION public.update_contact_messages_updated_at() SET search_path = '';
ALTER FUNCTION public.update_apporteur_updated_at() SET search_path = '';
ALTER FUNCTION public.update_client_process_document_updated_at() SET search_path = '';
ALTER FUNCTION public.update_dossier_timeline_updated_at() SET search_path = '';
ALTER FUNCTION public.update_apporteur_notification_updated_at() SET search_path = '';
ALTER FUNCTION public.update_client_notification_updated_at() SET search_path = '';
ALTER FUNCTION public.update_client_charte_signature_updated_at() SET search_path = '';
ALTER FUNCTION public.update_promotion_banner_updated_at() SET search_path = '';

-- Fonctions de gestion de fichiers et documents
ALTER FUNCTION public.increment_document_file_download_count() SET search_path = '';
ALTER FUNCTION public.get_client_files() SET search_path = '';
ALTER FUNCTION public.get_client_file_stats() SET search_path = '';
ALTER FUNCTION public.cleanup_expired_files() SET search_path = '';
ALTER FUNCTION public.get_ged_document_permissions() SET search_path = '';
ALTER FUNCTION public.get_ged_user_documents() SET search_path = '';
ALTER FUNCTION public.get_documents_stats() SET search_path = '';
ALTER FUNCTION public.get_user_document_stats() SET search_path = '';
ALTER FUNCTION public.get_expired_documents() SET search_path = '';
ALTER FUNCTION public.get_document_stats() SET search_path = '';
ALTER FUNCTION public.get_client_document_size() SET search_path = '';
ALTER FUNCTION public.create_document_version() SET search_path = '';
ALTER FUNCTION public.update_document_version() SET search_path = '';
ALTER FUNCTION public.increment_download_count() SET search_path = '';

-- Fonctions de nettoyage et maintenance
ALTER FUNCTION public.trigger_cleanup_expired_sessions() SET search_path = '';
ALTER FUNCTION public.cleanup_expired_shares() SET search_path = '';
ALTER FUNCTION public.cleanup_old_typing_indicators() SET search_path = '';
ALTER FUNCTION public.cleanup_expired_temporary_data() SET search_path = '';
ALTER FUNCTION public.cleanup_expired_simulator_sessions() SET search_path = '';
ALTER FUNCTION public.cleanup_expired_notifications() SET search_path = '';
ALTER FUNCTION public.cleanup_old_notifications() SET search_path = '';
ALTER FUNCTION public.cleanup_old_admin_notifications() SET search_path = '';
ALTER FUNCTION public.cleanup_old_apporteur_notifications() SET search_path = '';
ALTER FUNCTION public.cleanup_old_client_notifications() SET search_path = '';
ALTER FUNCTION public.cleanup_old_historique() SET search_path = '';
ALTER FUNCTION public.cleanup_old_candidatures() SET search_path = '';
ALTER FUNCTION public.cleanup_old_access_logs() SET search_path = '';
ALTER FUNCTION public.cleanup_inactive_fcm_tokens() SET search_path = '';
ALTER FUNCTION public.clean_expired_sessions() SET search_path = '';
ALTER FUNCTION public.clean_old_email_trackings() SET search_path = '';

-- Fonctions de notifications
ALTER FUNCTION public.mark_notification_unread() SET search_path = '';
ALTER FUNCTION public.create_notification_status_for_all_admins() SET search_path = '';
ALTER FUNCTION public.set_notification_expiration() SET search_path = '';
ALTER FUNCTION public.mark_notification_as_read() SET search_path = '';
ALTER FUNCTION public.mark_notification_as_dismissed() SET search_path = '';
ALTER FUNCTION public.get_notification_stats() SET search_path = '';
ALTER FUNCTION public.mark_notification_read() SET search_path = '';
ALTER FUNCTION public.archive_notification() SET search_path = '';
ALTER FUNCTION public.initialize_admin_notification_status() SET search_path = '';
ALTER FUNCTION public.mark_admin_notification_read() SET search_path = '';
ALTER FUNCTION public.archive_admin_notification() SET search_path = '';
ALTER FUNCTION public.validate_admin_notification_data() SET search_path = '';
ALTER FUNCTION public.validate_notification_data() SET search_path = '';
ALTER FUNCTION public.auto_archive_expired_notifications() SET search_path = '';
ALTER FUNCTION public.initialize_apporteur_notification_status() SET search_path = '';
ALTER FUNCTION public.validate_apporteur_notification_data() SET search_path = '';
ALTER FUNCTION public.mark_apporteur_notification_read() SET search_path = '';
ALTER FUNCTION public.archive_apporteur_notification() SET search_path = '';
ALTER FUNCTION public.sync_apporteur_notification_is_read() SET search_path = '';
ALTER FUNCTION public.initialize_client_notification_status() SET search_path = '';
ALTER FUNCTION public.validate_client_notification_data() SET search_path = '';
ALTER FUNCTION public.mark_client_notification_read() SET search_path = '';
ALTER FUNCTION public.archive_client_notification() SET search_path = '';
ALTER FUNCTION public.sync_client_notification_is_read() SET search_path = '';

-- Fonctions de calendrier et événements
ALTER FUNCTION public.create_recurring_events() SET search_path = '';
ALTER FUNCTION public.get_rdv_end_datetime() SET search_path = '';
ALTER FUNCTION public.get_rdv_status_label() SET search_path = '';
ALTER FUNCTION public.get_rdv_stats() SET search_path = '';
ALTER FUNCTION public.get_overdue_controls() SET search_path = '';

-- Fonctions de messagerie
ALTER FUNCTION public.create_admin_conversation() SET search_path = '';
ALTER FUNCTION public.update_conversation_last_message() SET search_path = '';
ALTER FUNCTION public.create_client_admin_conversation() SET search_path = '';
ALTER FUNCTION public.create_expert_admin_conversation() SET search_path = '';
ALTER FUNCTION public.create_conversation_direct() SET search_path = '';
ALTER FUNCTION public.generate_message_thread_id() SET search_path = '';

-- Fonctions de calcul et statistiques
ALTER FUNCTION public.calculer_montant_produit() SET search_path = '';
ALTER FUNCTION public.calculer_tous_produits() SET search_path = '';
ALTER FUNCTION public.calculer_multiplication_sequence() SET search_path = '';
ALTER FUNCTION public.calculer_percentage() SET search_path = '';
ALTER FUNCTION public.get_actions_by_type() SET search_path = '';
ALTER FUNCTION public.get_apporteur_kpis() SET search_path = '';
ALTER FUNCTION public.get_top_experts() SET search_path = '';
ALTER FUNCTION public.get_expert_global_stats() SET search_path = '';
ALTER FUNCTION public.get_expert_assignments_by_status() SET search_path = '';
ALTER FUNCTION public.get_assignment_statistics() SET search_path = '';
ALTER FUNCTION public.get_simulation_results() SET search_path = '';
ALTER FUNCTION public.get_recent_security_incidents() SET search_path = '';
ALTER FUNCTION public.get_admin_audit_history() SET search_path = '';
ALTER FUNCTION public.calculate_eligibility() SET search_path = '';
ALTER FUNCTION public.calculate_expert_stats() SET search_path = '';
ALTER FUNCTION public.update_all_expert_stats() SET search_path = '';
ALTER FUNCTION public.test_expert_global_stats() SET search_path = '';

-- Fonctions de gestion de clients et experts
ALTER FUNCTION public.create_client() SET search_path = '';
ALTER FUNCTION public.generate_client_id() SET search_path = '';
ALTER FUNCTION public.generate_expert_id() SET search_path = '';
ALTER FUNCTION public.get_user_details() SET search_path = '';
ALTER FUNCTION public.get_user_type() SET search_path = '';
ALTER FUNCTION public.create_temporary_client() SET search_path = '';
ALTER FUNCTION public.migrate_temporary_client() SET search_path = '';
ALTER FUNCTION public.archive_orphan_parents() SET search_path = '';
ALTER FUNCTION public.update_parent_children_count() SET search_path = '';
ALTER FUNCTION public.manage_parent_child_relationships() SET search_path = '';

-- Fonctions de gestion de prospects
ALTER FUNCTION public.save_prospect_report_version() SET search_path = '';
ALTER FUNCTION public.notify_prospect_reply() SET search_path = '';
ALTER FUNCTION public.notify_prospect_reply_enhanced() SET search_path = '';
ALTER FUNCTION public.stop_prospect_sequences_on_reply() SET search_path = '';
ALTER FUNCTION public.check_prospect_email_match() SET search_path = '';
ALTER FUNCTION public.create_hot_prospect() SET search_path = '';
ALTER FUNCTION public.convert_prospect_to_client() SET search_path = '';

-- Fonctions de simulateur
ALTER FUNCTION public.create_simulator_session_with_client_data() SET search_path = '';
ALTER FUNCTION public.insert_ticpe_questions_transaction() SET search_path = '';
ALTER FUNCTION public.save_simulator_responses() SET search_path = '';
ALTER FUNCTION public.calculate_simulator_eligibility() SET search_path = '';
ALTER FUNCTION public.create_simulation_with_temporary_client() SET search_path = '';
ALTER FUNCTION public.migrate_simulator_to_client() SET search_path = '';
ALTER FUNCTION public.migrate_simulator_to_existing_client() SET search_path = '';
ALTER FUNCTION public.migrate_session_manually() SET search_path = '';
ALTER FUNCTION public.migrate_session_manually_corrected() SET search_path = '';
ALTER FUNCTION public.mark_session_completed() SET search_path = '';
ALTER FUNCTION public.update_session_activity() SET search_path = '';
ALTER FUNCTION public.duplicate_completed_simulation() SET search_path = '';
ALTER FUNCTION public.mapper_reponses_vers_variables() SET search_path = '';
ALTER FUNCTION public.evaluer_eligibilite_avec_calcul() SET search_path = '';

-- Fonctions de gestion de dossiers
ALTER FUNCTION public.trigger_update_dossier_progress() SET search_path = '';
ALTER FUNCTION public.log_dossier_change() SET search_path = '';
ALTER FUNCTION public.update_dossier_progress_from_steps() SET search_path = '';
ALTER FUNCTION public.trigger_status_change_comment() SET search_path = '';
ALTER FUNCTION public.trigger_rdv_comment() SET search_path = '';
ALTER FUNCTION public.trigger_document_comment() SET search_path = '';

-- Fonctions de gestion d'experts
ALTER FUNCTION public.trigger_log_expert_changes() SET search_path = '';
ALTER FUNCTION public.trigger_update_expert_stats() SET search_path = '';
ALTER FUNCTION public.trigger_update_expert_earnings() SET search_path = '';
ALTER FUNCTION public.get_apporteur_activite_personnelle() SET search_path = '';
ALTER FUNCTION public.get_apporteur_prospects_detaille() SET search_path = '';
ALTER FUNCTION public.get_apporteur_alertes_personnelles() SET search_path = '';
ALTER FUNCTION public.sync_documents_sent() SET search_path = '';

-- Fonctions de sécurité et audit
ALTER FUNCTION public.check_bucket_permissions() SET search_path = '';
ALTER FUNCTION public.log_bucket_access() SET search_path = '';
ALTER FUNCTION public.check_document_access() SET search_path = '';
ALTER FUNCTION public.log_admin_action() SET search_path = '';
ALTER FUNCTION public.detect_suspicious_activity() SET search_path = '';
ALTER FUNCTION public.get_auth_user_id_by_email() SET search_path = '';

-- Fonctions de gestion d'emails
ALTER FUNCTION public.generate_email_content_hash() SET search_path = '';
ALTER FUNCTION public.set_email_content_hash() SET search_path = '';
ALTER FUNCTION public.is_email_already_sent() SET search_path = '';
ALTER FUNCTION public.extract_email_domain() SET search_path = '';

-- Fonctions de gestion de cabinet
ALTER FUNCTION public.cabinet_set_updated_at() SET search_path = '';
ALTER FUNCTION public.cabinet_set_slug() SET search_path = '';
ALTER FUNCTION public.refresh_cabinet_team_stat() SET search_path = '';
ALTER FUNCTION public.cabinet_produit_set_updated_at() SET search_path = '';

-- Fonctions de gestion de produits
ALTER FUNCTION public.merge_client_products() SET search_path = '';

-- Fonctions de gestion de campagnes
ALTER FUNCTION public.check_campaign_dates() SET search_path = '';
ALTER FUNCTION public.update_campaign_active_status() SET search_path = '';

-- Fonctions de gestion de bannières
ALTER FUNCTION public.check_banner_dates() SET search_path = '';
ALTER FUNCTION public.update_banner_active_status() SET search_path = '';
ALTER FUNCTION public.increment_banner_impressions() SET search_path = '';
ALTER FUNCTION public.increment_banner_clicks() SET search_path = '';

-- Fonctions de documentation
ALTER FUNCTION public.increment_documentation_view_count() SET search_path = '';

-- Fonctions de gestion de rapports RDV
ALTER FUNCTION public.rdv_report_set_updated_at() SET search_path = '';
ALTER FUNCTION public.rdv_task_set_updated_at() SET search_path = '';

-- Fonctions de gestion de séquences d'emails
ALTER FUNCTION public.recalculate_scheduled_emails_dates() SET search_path = '';

-- Fonctions de vérification d'inactivité
ALTER FUNCTION public.check_inactivity_alerts() SET search_path = '';

-- Fonctions de commentaires système
ALTER FUNCTION public.create_system_comment() SET search_path = '';

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
-- par le linter Supabase. Cela force PostgreSQL à utiliser uniquement les
-- schémas explicitement qualifiés dans le code des fonctions, ce qui est
-- plus sécurisé et prévient les attaques de type "search_path hijacking".
--
-- Pour vérifier qu'une fonction a bien search_path défini :
-- SELECT proname, proconfig 
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public' 
-- AND proname = 'nom_de_la_fonction';
-- ============================================================================
