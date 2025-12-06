-- ============================================================================
-- CORRECTION : Retirer SECURITY DEFINER des vues (Partie 3/3)
-- ============================================================================
-- Problème : Les vues avec SECURITY DEFINER contournent les politiques RLS
-- Solution : Recréer les vues sans SECURITY DEFINER en utilisant leurs définitions
-- ============================================================================
-- Date : 2025-01-28
-- ============================================================================

BEGIN;

-- Fonction helper pour recréer une vue sans SECURITY DEFINER
CREATE OR REPLACE FUNCTION recréer_vue_sans_security_definer(nom_vue TEXT, schema_nom TEXT DEFAULT 'public')
RETURNS void AS $$
DECLARE
  definition TEXT;
BEGIN
  -- Récupérer la définition de la vue
  SELECT pg_get_viewdef(format('%I.%I', schema_nom, nom_vue)::regclass, true)
  INTO definition;
  
  -- Supprimer l'ancienne vue
  EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', schema_nom, nom_vue);
  
  -- Recréer sans SECURITY DEFINER (remplacer dans la définition)
  definition := REPLACE(definition, 'SECURITY DEFINER', '');
  definition := REPLACE(definition, 'security definer', '');
  
  -- Recréer la vue
  EXECUTE format('CREATE VIEW %I.%I AS %s', schema_nom, nom_vue, definition);
END;
$$ LANGUAGE plpgsql;

-- Liste des vues à corriger (partie 3 - dernières vues)
DO $$
DECLARE
  vue TEXT;
  vues TEXT[] := ARRAY[
    'prospects_pending_ai',
    'prospects_ready_for_emailing',
    'vue_apporteur_prospects_detaille',
    'vue_analytics_geographique',
    'vue_apporteur_performance_produits',
    'vue_analytics_admin_experts',
    'vue_apporteur_statistiques_mensuelles',
    'vue_analytics_expert_metrics',
    'vue_apporteur_commissions_calculees',
    'expert_stats_view',
    'vue_apporteur_objectifs_performance',
    'EmailMetrics',
    'v_expert_assignments',
    'notification_stats',
    'v_assignment_reports',
    'user_notification_summary',
    'vue_analytics_expert_performance_mensuelle',
    'v_dossier_steps_with_assignee',
    'vue_stats_produits_v2',
    'admin_recent_actions',
    'notification_groups_with_members',
    'vue_sessions_actives',
    'prospect_emails_to_send_today',
    'vue_analytics_expert_top_produits',
    'DossierCommentStats',
    'admin_action_stats',
    'notification_with_preferences',
    'vue_metriques_systeme_recentes',
    'v_email_duplicates_analysis',
    'admin_critical_actions',
    'vue_alertes_dashboard_v2',
    'DossierHistoriqueEnrichi',
    'vue_analytics_expert_distribution_clients',
    'prospect_replies_summary',
    'authenticated_users',
    'prospects_stats',
    'AdminNotificationActive'
  ];
BEGIN
  FOREACH vue IN ARRAY vues
  LOOP
    BEGIN
      PERFORM recréer_vue_sans_security_definer(vue, 'public');
      RAISE NOTICE 'Vue % recréée sans SECURITY DEFINER', vue;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Erreur lors de la recréation de la vue %: %', vue, SQLERRM;
    END;
  END LOOP;
END $$;

-- Nettoyer la fonction helper
DROP FUNCTION IF EXISTS recréer_vue_sans_security_definer(TEXT, TEXT);

COMMIT;
