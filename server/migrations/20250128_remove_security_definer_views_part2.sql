-- ============================================================================
-- CORRECTION : Retirer SECURITY DEFINER des vues (Partie 2/3)
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

-- Liste des vues à corriger (partie 2)
DO $$
DECLARE
  vue TEXT;
  vues TEXT[] := ARRAY[
    'vue_sessions_actives_globale',
    'vue_metriques_systeme_globale',
    'vue_analytics_admin_metrics',
    'vue_apporteur_produits',
    'vue_analytics_expert_analyse_temporelle',
    'vue_apporteur_notifications',
    'vue_apporteur_sources_prospects',
    'vue_apporteur_experts',
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
    'vue_apporteur_dashboard_principal'
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
