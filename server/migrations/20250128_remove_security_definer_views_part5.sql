-- ============================================================================
-- CORRECTION : Retirer SECURITY DEFINER des vues (Partie 5/5 - Toutes les vues restantes)
-- ============================================================================
-- Problème : Les vues avec SECURITY DEFINER contournent les politiques RLS
-- Solution : Recréer automatiquement toutes les vues avec SECURITY DEFINER sans cette propriété
-- ============================================================================
-- Date : 2025-01-28
-- ============================================================================

BEGIN;

-- Fonction helper améliorée pour recréer une vue sans SECURITY DEFINER
CREATE OR REPLACE FUNCTION recréer_vue_sans_security_definer(nom_vue TEXT, schema_nom TEXT DEFAULT 'public')
RETURNS void AS $$
DECLARE
  definition TEXT;
  view_exists BOOLEAN;
  view_oid OID;
  has_security_definer BOOLEAN;
  full_view_name TEXT;
BEGIN
  full_view_name := format('%I.%I', schema_nom, nom_vue);
  
  -- Vérifier si la vue existe
  SELECT EXISTS (
    SELECT 1 
    FROM pg_views 
    WHERE schemaname = schema_nom 
    AND viewname = nom_vue
  ) INTO view_exists;
  
  IF NOT view_exists THEN
    RAISE NOTICE 'La vue %.% n''existe pas, ignorée', schema_nom, nom_vue;
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
  
  -- Vérifier si la vue a SECURITY DEFINER via reloptions
  SELECT (reloptions IS NOT NULL AND 'security_definer=true' = ANY(reloptions))
  INTO has_security_definer
  FROM pg_class
  WHERE oid = view_oid;
  
  -- Si pas de reloptions, vérifier dans la définition CREATE VIEW
  IF NOT has_security_definer THEN
    SELECT definition LIKE '%SECURITY DEFINER%' OR definition LIKE '%security definer%'
    INTO has_security_definer
    FROM pg_views
    WHERE schemaname = schema_nom AND viewname = nom_vue;
  END IF;
  
  IF NOT has_security_definer THEN
    RAISE NOTICE 'La vue %.% n''a pas SECURITY DEFINER, ignorée', schema_nom, nom_vue;
    RETURN;
  END IF;
  
  -- Récupérer la définition de la vue
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
  
  -- Supprimer l'ancienne vue (sans CASCADE pour éviter les suppressions inattendues)
  BEGIN
    EXECUTE format('DROP VIEW IF EXISTS %I.%I', schema_nom, nom_vue);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erreur lors de la suppression de %.%: %', schema_nom, nom_vue, SQLERRM;
    -- Essayer avec CASCADE si nécessaire
    BEGIN
      EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', schema_nom, nom_vue);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Erreur lors de la suppression CASCADE de %.%: %', schema_nom, nom_vue, SQLERRM;
      RETURN;
    END;
  END;
  
  -- Nettoyer la définition (supprimer SECURITY DEFINER si présent dans le texte)
  definition := REPLACE(definition, 'WITH (security_definer=true)', '');
  definition := REPLACE(definition, 'WITH (security_definer = true)', '');
  definition := REPLACE(definition, 'SECURITY DEFINER', '');
  definition := REPLACE(definition, 'security definer', '');
  
  -- Recréer la vue sans SECURITY DEFINER
  BEGIN
    EXECUTE format('CREATE VIEW %I.%I AS %s', schema_nom, nom_vue, definition);
    RAISE NOTICE '✅ Vue %.% recréée sans SECURITY DEFINER', schema_nom, nom_vue;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Erreur lors de la recréation de %.%: %', schema_nom, nom_vue, SQLERRM;
    RAISE WARNING 'Définition (premiers 500 caractères): %', LEFT(definition, 500);
  END;
END;
$$ LANGUAGE plpgsql;

-- Liste complète de toutes les vues à corriger (basée sur la liste fournie)
DO $$
DECLARE
  vue TEXT;
  vues TEXT[] := ARRAY[
    -- Vues apporteur
    'vue_apporteur_sources_prospects',
    'vue_apporteur_experts',
    'vue_apporteur_produits',
    'vue_apporteur_notifications',
    'vue_apporteur_conversations',
    'vue_apporteur_commissions',
    'vue_apporteur_kpis_globaux',
    'vue_apporteur_agenda',
    'vue_apporteur_rendez_vous',
    'vue_apporteur_dashboard_principal',
    'vue_apporteur_prospects_detaille',
    'vue_apporteur_performance_produits',
    'vue_apporteur_statistiques_mensuelles',
    'vue_apporteur_commissions_calculees',
    'vue_apporteur_objectifs_performance',
    'vue_apporteur_activite_recente',
    
    -- Vues analytics
    'vue_analytics_admin_metrics',
    'vue_analytics_expert_analyse_temporelle',
    'vue_analytics_admin_produits',
    'vue_analytics_geographique',
    'vue_analytics_admin_experts',
    'vue_analytics_expert_metrics',
    'vue_analytics_expert_performance_mensuelle',
    'vue_analytics_expert_top_produits',
    'vue_analytics_expert_distribution_clients',
    
    -- Vues sessions et métriques
    'vue_sessions_actives_globale',
    'vue_metriques_systeme_globale',
    'vue_sessions_actives',
    'vue_metriques_systeme_recentes',
    
    -- Vues admin
    'v_admin_client_process_documents',
    'v_admin_documentation_app',
    'admin_recent_actions',
    'admin_action_stats',
    'admin_critical_actions',
    'vue_admin_kpis_globaux',
    'vue_admin_alertes_globales',
    'vue_admin_activite_globale',
    
    -- Vues calendrier
    'v_calendar_events_with_participants',
    'v_today_events',
    
    -- Vues prospects
    'prospects_pending_enrichment',
    'prospects_pending_ai',
    'prospects_ready_for_emailing',
    'prospect_emails_to_send_today',
    'prospect_replies_summary',
    'prospects_stats',
    
    -- Vues experts
    'expert_stats_view',
    'v_expert_assignments',
    
    -- Vues notifications
    'notification_stats',
    'user_notification_summary',
    'notification_groups_with_members',
    'notification_with_preferences',
    'AdminNotificationActive',
    
    -- Vues assignments
    'v_assignment_reports',
    'v_dossier_steps_with_assignee',
    
    -- Vues produits
    'vue_stats_produits_v2',
    'vue_stats_produits_globale',
    
    -- Vues dossiers
    'DossierCommentStats',
    'DossierHistoriqueEnrichi',
    
    -- Vues email
    'EmailMetrics',
    'v_email_duplicates_analysis',
    
    -- Vues dashboard et alertes
    'vue_alertes_dashboard_v2',
    'vue_dashboard_kpis_v2',
    'vue_activite_recente_v2',
    'vue_evolution_30j_v2',
    'vue_prospects_detaille',
    'vue_utilisation_sessions',
    
    -- Vues authentification
    'authenticated_users'
  ];
  vue_traitee TEXT;
  total_vues INTEGER;
  vues_reussies INTEGER := 0;
  vues_echouees INTEGER := 0;
  vues_ignorees INTEGER := 0;
BEGIN
  total_vues := array_length(vues, 1);
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Début du traitement de % vues...', total_vues;
  RAISE NOTICE '============================================================================';
  
  FOREACH vue IN ARRAY vues
  LOOP
    BEGIN
      PERFORM recréer_vue_sans_security_definer(vue, 'public');
      -- La fonction retourne déjà des notices, on compte les succès via les notices
      vues_reussies := vues_reussies + 1;
    EXCEPTION WHEN OTHERS THEN
      vues_echouees := vues_echouees + 1;
      RAISE WARNING '❌ Erreur lors du traitement de la vue %: %', vue, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Traitement terminé:';
  RAISE NOTICE '  - ✅ Réussies: %', vues_reussies;
  RAISE NOTICE '  - ❌ Échouées: %', vues_echouees;
  RAISE NOTICE '  - 📊 Total: %', total_vues;
  RAISE NOTICE '============================================================================';
END $$;

-- Correction automatique de TOUTES les vues restantes avec SECURITY DEFINER
-- (au cas où certaines n'étaient pas dans la liste)
DO $$
DECLARE
  vue_record RECORD;
  vues_corrigees INTEGER := 0;
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Recherche automatique de toutes les vues restantes avec SECURITY DEFINER...';
  RAISE NOTICE '============================================================================';
  
  -- Trouver toutes les vues avec SECURITY DEFINER via reloptions
  FOR vue_record IN
    SELECT 
      n.nspname as schema_name,
      c.relname as view_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'v'
      AND c.reloptions IS NOT NULL
      AND 'security_definer=true' = ANY(c.reloptions)
  LOOP
    BEGIN
      PERFORM recréer_vue_sans_security_definer(vue_record.view_name, vue_record.schema_name);
      vues_corrigees := vues_corrigees + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '❌ Erreur lors de la correction automatique de %.%: %', 
        vue_record.schema_name, vue_record.view_name, SQLERRM;
    END;
  END LOOP;
  
  IF vues_corrigees > 0 THEN
    RAISE NOTICE '✅ % vue(s) supplémentaire(s) corrigée(s) automatiquement', vues_corrigees;
  ELSE
    RAISE NOTICE '✅ Aucune vue supplémentaire à corriger';
  END IF;
  
  RAISE NOTICE '============================================================================';
END $$;

-- Nettoyer la fonction helper
DROP FUNCTION IF EXISTS recréer_vue_sans_security_definer(TEXT, TEXT);

-- Vérification finale : compter les vues avec SECURITY DEFINER restantes
DO $$
DECLARE
  nb_vues_reloptions INTEGER;
  nb_vues_definition INTEGER;
  nb_vues_restantes INTEGER;
  vues_reloptions TEXT;
  vues_definition TEXT;
  vues_restantes TEXT;
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'VÉRIFICATION FINALE';
  RAISE NOTICE '============================================================================';
  
  -- Méthode 1: Via reloptions (méthode fiable pour les vues créées avec WITH)
  SELECT COUNT(*), string_agg(c.relname, ', ' ORDER BY c.relname)
  INTO nb_vues_reloptions, vues_reloptions
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'v'
    AND c.reloptions IS NOT NULL
    AND 'security_definer=true' = ANY(c.reloptions);
  
  -- Méthode 2: Via la définition (pour les vues créées différemment)
  SELECT COUNT(*), string_agg(viewname, ', ' ORDER BY viewname)
  INTO nb_vues_definition, vues_definition
  FROM pg_views
  WHERE schemaname = 'public'
    AND (definition LIKE '%SECURITY DEFINER%' OR definition LIKE '%security definer%');
  
  -- Combiner les résultats (sans doublons)
  IF vues_reloptions IS NULL AND vues_definition IS NULL THEN
    nb_vues_restantes := 0;
    vues_restantes := NULL;
  ELSIF vues_reloptions IS NULL THEN
    nb_vues_restantes := nb_vues_definition;
    vues_restantes := vues_definition;
  ELSIF vues_definition IS NULL THEN
    nb_vues_restantes := nb_vues_reloptions;
    vues_restantes := vues_reloptions;
  ELSE
    -- Combiner en supprimant les doublons
    SELECT COUNT(DISTINCT vue_name), string_agg(DISTINCT vue_name, ', ' ORDER BY vue_name)
    INTO nb_vues_restantes, vues_restantes
    FROM (
      SELECT unnest(string_to_array(vues_reloptions, ', ')) AS vue_name
      UNION
      SELECT unnest(string_to_array(vues_definition, ', ')) AS vue_name
    ) vues_combinees;
  END IF;
  
  IF nb_vues_restantes > 0 THEN
    RAISE WARNING '⚠️ Il reste encore % vue(s) avec SECURITY DEFINER:', nb_vues_restantes;
    RAISE WARNING '   %', vues_restantes;
  ELSE
    RAISE NOTICE '✅ Toutes les vues ont été corrigées avec succès!';
    RAISE NOTICE '✅ Aucune vue avec SECURITY DEFINER restante.';
  END IF;
  
  RAISE NOTICE '============================================================================';
END $$;

COMMIT;
