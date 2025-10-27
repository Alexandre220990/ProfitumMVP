-- ============================================================================
-- MIGRATION : SUPPORT FCM DANS UserDevices
-- ============================================================================
-- Ajoute le support Firebase Cloud Messaging dans la table UserDevices
-- Date: 27 octobre 2025
-- ============================================================================

-- Vérifier si la table UserDevices existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'UserDevices') THEN
    -- Créer la table si elle n'existe pas
    CREATE TABLE "UserDevices" (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL,
      user_type TEXT NOT NULL, -- client/expert/admin/apporteur
      
      -- Tokens de notifications
      push_token TEXT, -- Token Web Push API (browser natif)
      fcm_token TEXT,  -- Token Firebase Cloud Messaging
      device_token TEXT, -- Token device complet (JSON)
      
      -- Info appareil
      device_type TEXT NOT NULL, -- web/ios/android/desktop
      device_name TEXT,
      platform TEXT, -- windows/macos/linux/ios/android
      browser TEXT,  -- chrome/firefox/safari/edge
      os TEXT,
      app_version TEXT,
      
      -- Statut
      active BOOLEAN DEFAULT true,
      
      -- Métadonnées
      metadata JSONB DEFAULT '{}',
      
      -- Timestamps
      last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Contraintes
      CONSTRAINT unique_fcm_token UNIQUE (fcm_token),
      CONSTRAINT unique_push_token UNIQUE (push_token)
    );

    -- Index pour performance
    CREATE INDEX idx_userdevices_user_id ON "UserDevices"(user_id);
    CREATE INDEX idx_userdevices_user_type ON "UserDevices"(user_type);
    CREATE INDEX idx_userdevices_active ON "UserDevices"(active);
    CREATE INDEX idx_userdevices_fcm_token ON "UserDevices"(fcm_token) WHERE fcm_token IS NOT NULL;
    CREATE INDEX idx_userdevices_last_used ON "UserDevices"(last_used_at DESC);
    
    -- Index composite pour requêtes fréquentes
    CREATE INDEX idx_userdevices_user_active ON "UserDevices"(user_id, active);

    -- RLS Policies
    ALTER TABLE "UserDevices" ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view their own devices
    CREATE POLICY "Users can view their own devices"
      ON "UserDevices"
      FOR SELECT
      USING (auth.uid()::TEXT = user_id::TEXT);

    -- Policy: Users can insert their own devices
    CREATE POLICY "Users can insert their own devices"
      ON "UserDevices"
      FOR INSERT
      WITH CHECK (auth.uid()::TEXT = user_id::TEXT);

    -- Policy: Users can update their own devices
    CREATE POLICY "Users can update their own devices"
      ON "UserDevices"
      FOR UPDATE
      USING (auth.uid()::TEXT = user_id::TEXT);

    -- Policy: Users can delete their own devices
    CREATE POLICY "Users can delete their own devices"
      ON "UserDevices"
      FOR DELETE
      USING (auth.uid()::TEXT = user_id::TEXT);

    -- Policy: Service role has full access
    CREATE POLICY "Service role has full access to devices"
      ON "UserDevices"
      FOR ALL
      USING (auth.role() = 'service_role');

    RAISE NOTICE 'Table UserDevices créée avec succès';
  ELSE
    RAISE NOTICE 'Table UserDevices existe déjà';
  END IF;
END $$;

-- ============================================================================
-- Ajouter la colonne fcm_token si elle n'existe pas
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'UserDevices' 
    AND column_name = 'fcm_token'
  ) THEN
    ALTER TABLE "UserDevices" ADD COLUMN fcm_token TEXT;
    CREATE INDEX IF NOT EXISTS idx_userdevices_fcm_token 
      ON "UserDevices"(fcm_token) WHERE fcm_token IS NOT NULL;
    RAISE NOTICE 'Colonne fcm_token ajoutée';
  ELSE
    RAISE NOTICE 'Colonne fcm_token existe déjà';
  END IF;
END $$;

-- ============================================================================
-- Ajouter user_type si manquant
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'UserDevices' 
    AND column_name = 'user_type'
  ) THEN
    ALTER TABLE "UserDevices" ADD COLUMN user_type TEXT;
    RAISE NOTICE 'Colonne user_type ajoutée';
  ELSE
    RAISE NOTICE 'Colonne user_type existe déjà';
  END IF;
END $$;

-- ============================================================================
-- Ajouter contrainte unique sur fcm_token
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_constraint 
    WHERE conname = 'unique_fcm_token'
  ) THEN
    ALTER TABLE "UserDevices" 
      ADD CONSTRAINT unique_fcm_token UNIQUE (fcm_token);
    RAISE NOTICE 'Contrainte unique_fcm_token ajoutée';
  END IF;
END $$;

-- ============================================================================
-- Fonction de nettoyage automatique des tokens inactifs (optionnel)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_inactive_fcm_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les tokens inactifs depuis plus de 90 jours
  DELETE FROM "UserDevices"
  WHERE active = false
    AND updated_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Créer un cron job pour nettoyer automatiquement (nécessite extension pg_cron)
-- SELECT cron.schedule('cleanup-inactive-tokens', '0 3 * * 0', 'SELECT cleanup_inactive_fcm_tokens()');

-- ============================================================================
-- VÉRIFICATIONS FINALES
-- ============================================================================

-- Afficher la structure de la table UserDevices
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'UserDevices'
ORDER BY ordinal_position;

-- Compter les devices actifs
SELECT 
  'Devices actifs' as stat,
  COUNT(*) as count
FROM "UserDevices"
WHERE active = true;

-- Compter par plateforme
SELECT 
  COALESCE(platform, 'unknown') as platform,
  COUNT(*) as count
FROM "UserDevices"
WHERE active = true
GROUP BY platform
ORDER BY count DESC;

RAISE NOTICE '✅ Migration FCM terminée avec succès';

