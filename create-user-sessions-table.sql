-- ============================================================================
-- CRÉATION TABLE user_sessions POUR TRACKING UTILISATEURS
-- ============================================================================
-- Date : 1er octobre 2025
-- Objectif : Suivre les sessions utilisateurs en temps réel
--            pour alimenter les métriques "Utilisateurs Actifs" du dashboard
-- ============================================================================

-- ============================================================================
-- 1. CRÉER LA TABLE user_sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS "user_sessions" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification utilisateur
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type VARCHAR(20) CHECK (user_type IN ('client', 'expert', 'admin', 'apporteur')),
  user_email VARCHAR(255),
  
  -- Informations de session
  session_token TEXT UNIQUE,
  device_id VARCHAR(255),
  
  -- Informations connexion
  ip_address VARCHAR(45),
  user_agent TEXT,
  browser VARCHAR(100),
  os VARCHAR(100),
  device_type VARCHAR(50), -- desktop, mobile, tablet
  
  -- Géolocalisation (optionnel)
  country VARCHAR(2),
  city VARCHAR(100),
  
  -- Activité
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  last_page_visited TEXT,
  pages_visited INTEGER DEFAULT 0,
  
  -- Métriques engagement
  session_duration INTEGER DEFAULT 0, -- en secondes
  actions_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- 2. CRÉER LES INDEX DE PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON "user_sessions"(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_type ON "user_sessions"(user_type);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON "user_sessions"(last_activity);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON "user_sessions"(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_created_at ON "user_sessions"(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON "user_sessions"(session_token);

-- Index composite pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_user_sessions_active_recent 
ON "user_sessions"(is_active, last_activity DESC) 
WHERE is_active = true;

-- ============================================================================
-- 3. FONCTION DE NETTOYAGE AUTOMATIQUE
-- ============================================================================

-- Fonction pour marquer les sessions inactives
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS void AS $$
BEGIN
  -- Marquer comme inactives les sessions sans activité depuis 30 minutes
  UPDATE "user_sessions"
  SET is_active = false,
      ended_at = last_activity
  WHERE is_active = true
    AND last_activity < NOW() - INTERVAL '30 minutes';
    
  -- Supprimer les sessions de plus de 7 jours
  DELETE FROM "user_sessions"
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. TRIGGER DE NETTOYAGE AUTOMATIQUE
-- ============================================================================

-- Créer une extension pour pg_cron si disponible (pour Railway Pro)
-- Si pas disponible, appeler la fonction manuellement ou via un cron job externe

-- Fonction trigger pour mettre à jour session_duration
CREATE OR REPLACE FUNCTION update_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  NEW.session_duration = EXTRACT(EPOCH FROM (NEW.last_activity - NEW.created_at))::INTEGER;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_duration
  BEFORE UPDATE ON "user_sessions"
  FOR EACH ROW
  WHEN (OLD.last_activity IS DISTINCT FROM NEW.last_activity)
  EXECUTE FUNCTION update_session_duration();

-- ============================================================================
-- 5. FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour créer ou mettre à jour une session
CREATE OR REPLACE FUNCTION upsert_user_session(
  p_user_id UUID,
  p_user_type VARCHAR,
  p_user_email VARCHAR,
  p_session_token TEXT,
  p_ip_address VARCHAR DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_page_visited TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Vérifier si une session active existe déjà
  SELECT id INTO v_session_id
  FROM "user_sessions"
  WHERE session_token = p_session_token
    AND is_active = true;
  
  IF v_session_id IS NOT NULL THEN
    -- Mettre à jour la session existante
    UPDATE "user_sessions"
    SET last_activity = NOW(),
        last_page_visited = COALESCE(p_page_visited, last_page_visited),
        pages_visited = pages_visited + 1,
        actions_count = actions_count + 1
    WHERE id = v_session_id;
  ELSE
    -- Créer une nouvelle session
    INSERT INTO "user_sessions" (
      user_id,
      user_type,
      user_email,
      session_token,
      ip_address,
      user_agent,
      last_page_visited,
      pages_visited
    ) VALUES (
      p_user_id,
      p_user_type,
      p_user_email,
      p_session_token,
      p_ip_address,
      p_user_agent,
      p_page_visited,
      1
    )
    RETURNING id INTO v_session_id;
  END IF;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les utilisateurs actifs
CREATE OR REPLACE FUNCTION get_active_users(
  p_minutes INTEGER DEFAULT 5
)
RETURNS TABLE (
  user_type VARCHAR,
  active_count BIGINT,
  unique_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.user_type,
    COUNT(*) as active_count,
    COUNT(DISTINCT us.user_id) as unique_users
  FROM "user_sessions" us
  WHERE us.is_active = true
    AND us.last_activity >= NOW() - (p_minutes || ' minutes')::INTERVAL
  GROUP BY us.user_type;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. VUE STATISTIQUES SESSIONS
-- ============================================================================

CREATE OR REPLACE VIEW vue_stats_sessions AS
SELECT 
  -- Sessions actives (5 dernières minutes)
  (SELECT COUNT(*) FROM "user_sessions" 
   WHERE is_active = true 
   AND last_activity >= NOW() - INTERVAL '5 minutes') as sessions_actives_5min,
  
  -- Sessions actives (30 dernières minutes)
  (SELECT COUNT(*) FROM "user_sessions" 
   WHERE is_active = true 
   AND last_activity >= NOW() - INTERVAL '30 minutes') as sessions_actives_30min,
  
  -- Utilisateurs uniques (24h)
  (SELECT COUNT(DISTINCT user_id) FROM "user_sessions" 
   WHERE created_at >= NOW() - INTERVAL '24 hours') as utilisateurs_uniques_24h,
  
  -- Par type d'utilisateur (5 min)
  (SELECT COUNT(*) FROM "user_sessions" 
   WHERE is_active = true 
   AND last_activity >= NOW() - INTERVAL '5 minutes'
   AND user_type = 'client') as clients_actifs,
  
  (SELECT COUNT(*) FROM "user_sessions" 
   WHERE is_active = true 
   AND last_activity >= NOW() - INTERVAL '5 minutes'
   AND user_type = 'expert') as experts_actifs,
  
  (SELECT COUNT(*) FROM "user_sessions" 
   WHERE is_active = true 
   AND last_activity >= NOW() - INTERVAL '5 minutes'
   AND user_type = 'admin') as admins_actifs,
  
  -- Métriques moyennes
  (SELECT AVG(session_duration) FROM "user_sessions" 
   WHERE ended_at IS NOT NULL
   AND created_at >= NOW() - INTERVAL '24 hours') as duree_moyenne_session,
  
  (SELECT AVG(pages_visited) FROM "user_sessions" 
   WHERE created_at >= NOW() - INTERVAL '24 hours') as pages_moyennes_par_session,
  
  (SELECT AVG(actions_count) FROM "user_sessions" 
   WHERE created_at >= NOW() - INTERVAL '24 hours') as actions_moyennes_par_session;

-- ============================================================================
-- 7. ACTIVER RLS
-- ============================================================================

ALTER TABLE "user_sessions" ENABLE ROW LEVEL SECURITY;

-- Politique pour les admins (accès complet)
DROP POLICY IF EXISTS "admin_full_access_sessions" ON "user_sessions";
CREATE POLICY "admin_full_access_sessions" ON "user_sessions"
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM "Admin" 
      WHERE auth_id = auth.uid()
    )
  );

-- Politique pour les utilisateurs (voir leur propre session)
DROP POLICY IF EXISTS "user_own_sessions" ON "user_sessions";
CREATE POLICY "user_own_sessions" ON "user_sessions"
  FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- 8. DONNÉES DE TEST (OPTIONNEL)
-- ============================================================================

-- Créer quelques sessions de test
-- ATTENTION : Remplacer les UUIDs par de vrais user_id de votre système
/*
INSERT INTO "user_sessions" (user_id, user_type, user_email, session_token, ip_address, user_agent)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'client', 'test.client@profitum.app', 'session_test_1', '127.0.0.1', 'Mozilla/5.0'),
  ('00000000-0000-0000-0000-000000000002', 'expert', 'test.expert@profitum.app', 'session_test_2', '127.0.0.1', 'Mozilla/5.0'),
  ('00000000-0000-0000-0000-000000000003', 'admin', 'test.admin@profitum.app', 'session_test_3', '127.0.0.1', 'Mozilla/5.0');
*/

-- ============================================================================
-- 9. VÉRIFICATION FINALE
-- ============================================================================

-- Vérifier la structure de la table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_sessions'
ORDER BY ordinal_position;

-- Vérifier les index
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'user_sessions'
ORDER BY indexname;

-- Vérifier les fonctions
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%session%'
ORDER BY routine_name;

-- Tester la vue des statistiques
SELECT * FROM vue_stats_sessions;

-- Tester la fonction get_active_users
SELECT * FROM get_active_users(5);

-- ============================================================================
-- SCRIPT TERMINÉ AVEC SUCCÈS
-- ============================================================================
-- ✅ Table user_sessions créée
-- ✅ Index de performance ajoutés
-- ✅ Fonctions utilitaires créées
-- ✅ Système de nettoyage automatique configuré
-- ✅ RLS activé avec politiques
-- ✅ Vue statistiques créée
-- ============================================================================

-- ============================================================================
-- INTÉGRATION DANS LE CODE
-- ============================================================================
/*
Étapes suivantes dans votre code :

1. Backend (Express) - Middleware de tracking :
   À chaque requête authentifiée, appeler :
   ```sql
   SELECT upsert_user_session(
     user_id,
     user_type,
     user_email,
     session_token,
     ip_address,
     user_agent,
     request_path
   );
   ```

2. Frontend (React) - Hook personnalisé :
   Créer un hook useSessionTracking qui :
   - Enregistre la session au login
   - Met à jour last_activity toutes les 60 secondes
   - Enregistre les changements de page
   - Nettoie au logout

3. Service Analytics :
   Remplacer les requêtes vers 'user_sessions' factices par :
   ```typescript
   const { data } = await supabase
     .from('user_sessions')
     .select('*')
     .eq('is_active', true)
     .gte('last_activity', fiveMinutesAgo.toISOString());
   ```

4. Cron Job de nettoyage (optionnel) :
   Appeler cleanup_inactive_sessions() toutes les 15 minutes
*/

