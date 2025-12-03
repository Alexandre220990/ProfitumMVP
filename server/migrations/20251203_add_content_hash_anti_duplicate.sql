-- ============================================================================
-- Migration : Protection anti-doublons pour séquences d'emails
-- Date: 2025-12-03
-- Description: Ajoute content_hash pour détecter et bloquer les emails en doublon
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. AJOUTER COLONNE content_hash
-- ============================================================================

-- Table prospects_emails : emails envoyés
ALTER TABLE "prospects_emails" 
ADD COLUMN IF NOT EXISTS "content_hash" VARCHAR(64);

-- Table prospect_email_scheduled : emails programmés
ALTER TABLE "prospect_email_scheduled" 
ADD COLUMN IF NOT EXISTS "content_hash" VARCHAR(64);

COMMENT ON COLUMN "prospects_emails"."content_hash" IS 'Hash SHA256 de subject|||body pour détecter les doublons';
COMMENT ON COLUMN "prospect_email_scheduled"."content_hash" IS 'Hash SHA256 de subject|||body pour détecter les doublons';

-- ============================================================================
-- 2. FONCTION POUR GÉNÉRER LE HASH
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_email_content_hash(
  p_subject TEXT, 
  p_body TEXT
)
RETURNS VARCHAR(64) AS $$
BEGIN
  -- Concaténer subject et body avec un séparateur unique
  -- Utiliser SHA256 pour un hash de 64 caractères hexadécimaux
  RETURN encode(digest(CONCAT(p_subject, '|||', p_body), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION generate_email_content_hash IS 'Génère un hash SHA256 unique pour détecter les doublons d''emails';

-- ============================================================================
-- 3. INDEX POUR RECHERCHE RAPIDE
-- ============================================================================

-- Index composite pour vérification rapide des doublons dans prospects_emails
CREATE INDEX IF NOT EXISTS idx_prospects_emails_content_hash 
  ON "prospects_emails"(prospect_id, content_hash)
  WHERE content_hash IS NOT NULL;

-- Index composite pour vérification rapide des doublons dans prospect_email_scheduled
CREATE INDEX IF NOT EXISTS idx_prospect_email_scheduled_content_hash 
  ON "prospect_email_scheduled"(prospect_id, content_hash)
  WHERE content_hash IS NOT NULL;

-- ============================================================================
-- 4. CONTRAINTE UNIQUE POUR BLOQUER LES DOUBLONS AU NIVEAU BDD
-- ============================================================================

-- ⚠️ IMPORTANT: La contrainte unique sera créée APRÈS le nettoyage des doublons
-- (voir section 7 ci-dessous)

-- ============================================================================
-- 5. REMPLIR LES HASH POUR LES EMAILS EXISTANTS
-- ============================================================================

-- Pour les emails déjà envoyés (prospects_emails)
UPDATE "prospects_emails"
SET content_hash = generate_email_content_hash(subject, body)
WHERE content_hash IS NULL 
  AND subject IS NOT NULL 
  AND body IS NOT NULL;

-- Pour les emails programmés (prospect_email_scheduled)
UPDATE "prospect_email_scheduled"
SET content_hash = generate_email_content_hash(subject, body)
WHERE content_hash IS NULL 
  AND subject IS NOT NULL 
  AND body IS NOT NULL;

-- ============================================================================
-- 5b. IDENTIFIER ET NETTOYER LES DOUBLONS EXISTANTS
-- ============================================================================

-- Créer une table temporaire pour identifier les doublons
CREATE TEMP TABLE duplicate_emails AS
SELECT 
  prospect_id,
  content_hash,
  array_agg(id ORDER BY sent_at ASC) as email_ids,
  array_agg(sent_at ORDER BY sent_at ASC) as sent_dates,
  COUNT(*) as duplicate_count
FROM "prospects_emails"
WHERE content_hash IS NOT NULL
GROUP BY prospect_id, content_hash
HAVING COUNT(*) > 1;

-- Afficher les doublons détectés
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count FROM duplicate_emails;
  IF duplicate_count > 0 THEN
    RAISE NOTICE '⚠️  % doublons détectés dans prospects_emails', duplicate_count;
    RAISE NOTICE 'Les emails les plus anciens seront conservés, les autres seront marqués.';
  ELSE
    RAISE NOTICE '✅ Aucun doublon détecté dans prospects_emails';
  END IF;
END $$;

-- Marquer les emails en doublon (garder le plus ancien, marquer les autres)
-- On ajoute une colonne metadata si elle n'existe pas déjà
ALTER TABLE "prospects_emails" 
ADD COLUMN IF NOT EXISTS "is_duplicate_archived" BOOLEAN DEFAULT FALSE;

-- Marquer les doublons (tous sauf le premier = le plus ancien)
UPDATE "prospects_emails" pe
SET is_duplicate_archived = TRUE,
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'duplicate_archived_at', NOW(),
      'duplicate_archived_reason', 'Content duplicate detected during migration',
      'kept_email_id', (
        SELECT email_ids[1] 
        FROM duplicate_emails de 
        WHERE de.prospect_id = pe.prospect_id 
          AND de.content_hash = pe.content_hash
      )
    )
WHERE id IN (
  SELECT unnest(email_ids[2:array_length(email_ids, 1)]) 
  FROM duplicate_emails
);

-- Afficher le résultat
DO $$
DECLARE
  archived_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO archived_count 
  FROM "prospects_emails" 
  WHERE is_duplicate_archived = TRUE;
  
  IF archived_count > 0 THEN
    RAISE NOTICE '✅ % email(s) en doublon marqués comme archivés', archived_count;
  END IF;
END $$;

-- ============================================================================
-- 6. TRIGGER POUR CALCULER AUTOMATIQUEMENT LE HASH (optionnel mais recommandé)
-- ============================================================================

-- Trigger pour prospects_emails
CREATE OR REPLACE FUNCTION set_email_content_hash()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer le hash automatiquement si non fourni
  IF NEW.content_hash IS NULL AND NEW.subject IS NOT NULL AND NEW.body IS NOT NULL THEN
    NEW.content_hash := generate_email_content_hash(NEW.subject, NEW.body);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_prospects_emails_hash
  BEFORE INSERT OR UPDATE ON "prospects_emails"
  FOR EACH ROW
  EXECUTE FUNCTION set_email_content_hash();

CREATE TRIGGER trigger_set_prospect_email_scheduled_hash
  BEFORE INSERT OR UPDATE ON "prospect_email_scheduled"
  FOR EACH ROW
  EXECUTE FUNCTION set_email_content_hash();

-- ============================================================================
-- 7. CONTRAINTE UNIQUE (APRÈS nettoyage des doublons)
-- ============================================================================

-- Empêcher l'envoi de 2 emails identiques au même prospect
-- Note: Index unique partiel qui exclut les emails archivés comme doublons
CREATE UNIQUE INDEX IF NOT EXISTS idx_prospects_emails_unique_content 
  ON "prospects_emails"(prospect_id, content_hash) 
  WHERE content_hash IS NOT NULL 
    AND (is_duplicate_archived IS FALSE OR is_duplicate_archived IS NULL);

COMMENT ON INDEX idx_prospects_emails_unique_content IS 'Empêche l''envoi d''emails identiques au même prospect (exclut les doublons archivés)';

-- Afficher confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Contrainte unique créée avec succès';
  RAISE NOTICE 'Les futurs doublons seront automatiquement bloqués au niveau BDD';
END $$;

-- ============================================================================
-- 8. FONCTION UTILITAIRE : Vérifier si un email a déjà été envoyé
-- ============================================================================

CREATE OR REPLACE FUNCTION is_email_already_sent(
  p_prospect_id UUID,
  p_subject TEXT,
  p_body TEXT
)
RETURNS TABLE(
  is_duplicate BOOLEAN,
  email_id UUID,
  sent_at TIMESTAMPTZ,
  existing_subject TEXT
) AS $$
DECLARE
  v_content_hash VARCHAR(64);
BEGIN
  -- Calculer le hash
  v_content_hash := generate_email_content_hash(p_subject, p_body);
  
  -- Chercher un email existant
  RETURN QUERY
  SELECT 
    TRUE as is_duplicate,
    id as email_id,
    sent_at,
    subject as existing_subject
  FROM "prospects_emails"
  WHERE prospect_id = p_prospect_id
    AND content_hash = v_content_hash
    AND (is_duplicate_archived IS FALSE OR is_duplicate_archived IS NULL)
  LIMIT 1;
  
  -- Si aucun résultat, retourner FALSE
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TIMESTAMPTZ, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_email_already_sent IS 'Vérifie si un email avec ce contenu a déjà été envoyé à ce prospect';

-- ============================================================================
-- 9. STATISTIQUES ET VÉRIFICATION
-- ============================================================================

-- Vue pour détecter les doublons potentiels
CREATE OR REPLACE VIEW "v_email_duplicates_analysis" AS
SELECT 
  p.id as prospect_id,
  p.email as prospect_email,
  p.firstname,
  p.lastname,
  pe.content_hash,
  pe.subject,
  COUNT(*) as duplicate_count,
  array_agg(pe.id ORDER BY pe.sent_at) as email_ids,
  array_agg(pe.sent_at ORDER BY pe.sent_at) as sent_dates,
  MIN(pe.sent_at) as first_sent,
  MAX(pe.sent_at) as last_sent
FROM "prospects_emails" pe
JOIN "prospects" p ON pe.prospect_id = p.id
WHERE pe.content_hash IS NOT NULL
  AND (pe.is_duplicate_archived IS FALSE OR pe.is_duplicate_archived IS NULL)
GROUP BY p.id, p.email, p.firstname, p.lastname, pe.content_hash, pe.subject
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, last_sent DESC;

COMMENT ON VIEW "v_email_duplicates_analysis" IS 'Analyse des doublons d''emails déjà envoyés (pour audit)';

COMMIT;

-- ============================================================================
-- VÉRIFICATIONS POST-MIGRATION
-- ============================================================================

-- Afficher résumé final
DO $$
DECLARE
  total_emails INTEGER;
  emails_with_hash INTEGER;
  archived_duplicates INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_emails FROM "prospects_emails";
  SELECT COUNT(*) INTO emails_with_hash FROM "prospects_emails" WHERE content_hash IS NOT NULL;
  SELECT COUNT(*) INTO archived_duplicates FROM "prospects_emails" WHERE is_duplicate_archived = TRUE;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'RÉSUMÉ DE LA MIGRATION';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total emails: %', total_emails;
  RAISE NOTICE 'Emails avec hash: %', emails_with_hash;
  RAISE NOTICE 'Doublons archivés: %', archived_duplicates;
  RAISE NOTICE 'Emails actifs uniques: %', emails_with_hash - archived_duplicates;
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- REQUÊTES DE VÉRIFICATION DÉTAILLÉES
-- ============================================================================

-- Compter les emails avec hash
SELECT 
  'prospects_emails' as table_name,
  COUNT(*) as total_emails,
  COUNT(content_hash) as emails_with_hash,
  COUNT(*) - COUNT(content_hash) as emails_without_hash
FROM "prospects_emails"
UNION ALL
SELECT 
  'prospect_email_scheduled' as table_name,
  COUNT(*) as total_emails,
  COUNT(content_hash) as emails_with_hash,
  COUNT(*) - COUNT(content_hash) as emails_without_hash
FROM "prospect_email_scheduled";

-- Afficher les doublons détectés (s'il y en a)
SELECT * FROM "v_email_duplicates_analysis" LIMIT 10;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

