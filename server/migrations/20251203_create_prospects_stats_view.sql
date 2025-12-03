-- ==============================================================================
-- MIGRATION : Création de la vue prospects_stats
-- ==============================================================================
-- Cette vue calcule les statistiques de prospection incluant le taux de réponse
-- ==============================================================================

-- Supprimer la vue si elle existe déjà
DROP VIEW IF EXISTS prospects_stats;

-- Créer la vue prospects_stats
CREATE VIEW prospects_stats AS
SELECT
  -- Total prospects
  (SELECT COUNT(*) FROM prospects) AS total_prospects,
  
  -- Prospects enrichis (enrichment_status = 'completed')
  (SELECT COUNT(*) FROM prospects WHERE enrichment_status = 'completed') AS enriched_count,
  
  -- Prospects traités par l'IA (ai_status = 'completed')
  (SELECT COUNT(*) FROM prospects WHERE ai_status = 'completed') AS ai_processed_count,
  
  -- Emails envoyés (emails avec sent_at non null)
  (SELECT COUNT(*) FROM prospects_emails WHERE sent_at IS NOT NULL) AS emails_sent_count,
  
  -- Emails ouverts (opened = true)
  (SELECT COUNT(*) FROM prospects_emails WHERE opened = true) AS emails_opened_count,
  
  -- Emails avec réponse (replied = true OU présence dans prospect_email_received)
  (
    SELECT COUNT(DISTINCT pe.prospect_id) 
    FROM prospects_emails pe
    WHERE pe.replied = true
       OR EXISTS (
         SELECT 1 FROM prospect_email_received per 
         WHERE per.prospect_id = pe.prospect_id
       )
  ) AS emails_replied_count,
  
  -- Taux d'ouverture (en %)
  CASE 
    WHEN (SELECT COUNT(*) FROM prospects_emails WHERE sent_at IS NOT NULL) > 0
    THEN ROUND(
      (SELECT COUNT(*) FROM prospects_emails WHERE opened = true)::NUMERIC * 100.0 / 
      (SELECT COUNT(*) FROM prospects_emails WHERE sent_at IS NOT NULL)::NUMERIC
    , 2)
    ELSE 0
  END AS open_rate,
  
  -- Taux de réponse (en %)
  CASE 
    WHEN (SELECT COUNT(*) FROM prospects_emails WHERE sent_at IS NOT NULL) > 0
    THEN ROUND(
      (
        SELECT COUNT(DISTINCT pe.prospect_id) 
        FROM prospects_emails pe
        WHERE pe.replied = true
           OR EXISTS (
             SELECT 1 FROM prospect_email_received per 
             WHERE per.prospect_id = pe.prospect_id
           )
      )::NUMERIC * 100.0 / 
      (SELECT COUNT(*) FROM prospects_emails WHERE sent_at IS NOT NULL)::NUMERIC
    , 2)
    ELSE 0
  END AS reply_rate;

-- Commentaire sur la vue
COMMENT ON VIEW prospects_stats IS 'Vue calculant les statistiques de prospection (prospects, enrichissement, IA, emails envoyés, taux ouverture/réponse)';

-- ==============================================================================
-- FIN DE LA MIGRATION
-- ==============================================================================

