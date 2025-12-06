-- ============================================================================
-- CORRECTION : Retirer SECURITY DEFINER des vues (Partie 4/4)
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
  view_exists BOOLEAN;
  view_oid OID;
  has_security_definer BOOLEAN;
BEGIN
  -- Vérifier si la vue existe
  SELECT EXISTS (
    SELECT 1 
    FROM pg_views 
    WHERE schemaname = schema_nom 
    AND viewname = nom_vue
  ) INTO view_exists;
  
  IF NOT view_exists THEN
    RAISE WARNING 'La vue %.% n''existe pas, ignorée', schema_nom, nom_vue;
    RETURN;
  END IF;
  
  -- Obtenir l'OID de la vue
  SELECT c.oid INTO view_oid
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = schema_nom
    AND c.relname = nom_vue
    AND c.relkind = 'v';
  
  IF view_oid IS NULL THEN
    RAISE WARNING 'Impossible de trouver l''OID de la vue %.%', schema_nom, nom_vue;
    RETURN;
  END IF;
  
  -- Vérifier si la vue a SECURITY DEFINER
  SELECT (reloptions IS NOT NULL AND 'security_definer=true' = ANY(reloptions))
  INTO has_security_definer
  FROM pg_class
  WHERE oid = view_oid;
  
  IF NOT has_security_definer THEN
    RAISE NOTICE 'La vue %.% n''a pas SECURITY DEFINER, ignorée', schema_nom, nom_vue;
    RETURN;
  END IF;
  
  -- Récupérer la définition de la vue (sans les options)
  BEGIN
    SELECT pg_get_viewdef(view_oid, true)
    INTO definition;
    
    IF definition IS NULL OR definition = '' THEN
      RAISE WARNING 'Impossible de récupérer la définition de la vue %.%', schema_nom, nom_vue;
      RETURN;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erreur lors de la récupération de la définition de %.%: %', schema_nom, nom_vue, SQLERRM;
    RETURN;
  END;
  
  -- Supprimer l'ancienne vue
  BEGIN
    EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', schema_nom, nom_vue);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erreur lors de la suppression de %.%: %', schema_nom, nom_vue, SQLERRM;
    RETURN;
  END;
  
  -- Recréer la vue sans SECURITY DEFINER (la définition récupérée ne contient pas SECURITY DEFINER)
  BEGIN
    EXECUTE format('CREATE VIEW %I.%I AS %s', schema_nom, nom_vue, definition);
    RAISE NOTICE 'Vue %.% recréée sans SECURITY DEFINER', schema_nom, nom_vue;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erreur lors de la recréation de %.%: %', schema_nom, nom_vue, SQLERRM;
    RAISE WARNING 'Définition: %', LEFT(definition, 200);
  END;
END;
$$ LANGUAGE plpgsql;

-- Liste complète des vues à corriger (toutes les vues de la liste fournie)
DO $$
DECLARE
  vue TEXT;
  vues TEXT[] := ARRAY[
    -- Vues de la liste fournie
    'vue_apporteur_sources_prospects',
    'vue_apporteur_experts',
    'vue_sessions_actives_globale',
    'vue_metriques_systeme_globale',
    'vue_analytics_admin_metrics',
    'vue_apporteur_produits',
    'vue_analytics_expert_analyse_temporelle',
    'vue_apporteur_notifications',
    'vue_apporteur_conversations',
    'v_admin_client_process_documents',
    'vue_apporteur_commissions',
    'v_admin_documentation_app',
    'vue_apporteur_kpis_globaux',
    'v_calendar_events_with_participants',
    'v_today_events',
    'vue_apporteur_agenda',
    'vue_apporteur_rendez_vous',
    'vue_analytics_admin_produits',
    'prospects_pending_enrichment',
    'vue_apporteur_dashboard_principal',
    'vue_apporteur_prospects_detaille',
    'vue_analytics_geographique',
    'vue_apporteur_performance_produits',
    'prospects_pending_ai',
    'prospects_ready_for_emailing',
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
    'AdminNotificationActive',
    'vue_dashboard_kpis_v2',
    'vue_activite_recente_v2',
    'vue_evolution_30j_v2',
    'vue_prospects_detaille',
    'vue_admin_kpis_globaux',
    'vue_admin_alertes_globales',
    'vue_utilisation_sessions',
    'vue_admin_activite_globale',
    'vue_stats_produits_globale',
    'vue_apporteur_activite_recente'
  ];
  vue_traitee TEXT;
  total_vues INTEGER;
  vues_reussies INTEGER := 0;
  vues_echouees INTEGER := 0;
BEGIN
  total_vues := array_length(vues, 1);
  RAISE NOTICE 'Début du traitement de % vues...', total_vues;
  
  FOREACH vue IN ARRAY vues
  LOOP
    BEGIN
      PERFORM recréer_vue_sans_security_definer(vue, 'public');
      vues_reussies := vues_reussies + 1;
    EXCEPTION WHEN OTHERS THEN
      vues_echouees := vues_echouees + 1;
      RAISE WARNING 'Erreur lors du traitement de la vue %: %', vue, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Traitement terminé: % réussies, % échouées sur % total', 
    vues_reussies, vues_echouees, total_vues;
END $$;

-- Nettoyer la fonction helper
DROP FUNCTION IF EXISTS recréer_vue_sans_security_definer(TEXT, TEXT);

-- Vérification finale : compter les vues avec SECURITY DEFINER restantes
DO $$
DECLARE
  nb_vues_restantes INTEGER;
  vues_restantes TEXT;
BEGIN
  -- Compter via pg_class.reloptions (méthode fiable)
  SELECT COUNT(*)
  INTO nb_vues_restantes
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'v'
    AND c.reloptions IS NOT NULL
    AND 'security_definer=true' = ANY(c.reloptions);
  
  IF nb_vues_restantes > 0 THEN
    -- Lister les vues restantes
    SELECT string_agg(c.relname, ', ')
    INTO vues_restantes
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'v'
      AND c.reloptions IS NOT NULL
      AND 'security_definer=true' = ANY(c.reloptions);
    
    RAISE WARNING 'Il reste encore % vues avec SECURITY DEFINER: %', nb_vues_restantes, vues_restantes;
  ELSE
    RAISE NOTICE '✅ Toutes les vues ont été corrigées avec succès!';
  END IF;
END $$;

COMMIT;
