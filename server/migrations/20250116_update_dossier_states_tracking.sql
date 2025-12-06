-- ============================================================================
-- MIGRATION : Mise à jour BDD pour tracking états dossiers et documents
-- Date: 2025-01-16
-- Objectif: Ajouter les colonnes nécessaires pour tracker tous les états
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1 : Ajouter colonnes à ClientProduitEligible
-- ============================================================================

-- Colonnes pour tracking documents
ALTER TABLE "ClientProduitEligible"
  ADD COLUMN IF NOT EXISTS has_documents BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS documents_pending_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS documents_validated_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS documents_total_count INTEGER DEFAULT 0;

-- Colonnes pour tracking audit
ALTER TABLE "ClientProduitEligible"
  ADD COLUMN IF NOT EXISTS audit_status VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS audit_started_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS audit_completed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS audit_report_available BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS audit_id UUID;

-- Ajouter la contrainte de clé étrangère seulement si la table Audit existe
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'Audit'
  ) THEN
    ALTER TABLE "ClientProduitEligible"
      ADD CONSTRAINT fk_cpe_audit_id 
      FOREIGN KEY (audit_id) REFERENCES "Audit"(id);
  END IF;
END $$;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_cpe_has_documents 
  ON "ClientProduitEligible"(has_documents) 
  WHERE has_documents = TRUE;

CREATE INDEX IF NOT EXISTS idx_cpe_documents_pending 
  ON "ClientProduitEligible"(documents_pending_count) 
  WHERE documents_pending_count > 0;

CREATE INDEX IF NOT EXISTS idx_cpe_expert_validation_pending 
  ON "ClientProduitEligible"(expert_validation_status) 
  WHERE expert_validation_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_cpe_audit_status 
  ON "ClientProduitEligible"(audit_status);

CREATE INDEX IF NOT EXISTS idx_cpe_audit_report_available 
  ON "ClientProduitEligible"(audit_report_available) 
  WHERE audit_report_available = TRUE;

-- Commentaires
COMMENT ON COLUMN "ClientProduitEligible".has_documents IS 
  'Indique si le dossier a au moins un document';

COMMENT ON COLUMN "ClientProduitEligible".documents_pending_count IS 
  'Nombre de documents en attente de validation';

COMMENT ON COLUMN "ClientProduitEligible".documents_validated_count IS 
  'Nombre de documents validés par l''expert';

COMMENT ON COLUMN "ClientProduitEligible".documents_total_count IS 
  'Nombre total de documents du dossier';

COMMENT ON COLUMN "ClientProduitEligible".audit_status IS 
  'Statut de l''audit : null/pending/in_progress/completed';

COMMENT ON COLUMN "ClientProduitEligible".audit_report_available IS 
  'Indique si le rapport d''audit est disponible pour visualisation';

-- ============================================================================
-- ÉTAPE 2 : Vérifier et ajouter colonnes à ClientProcessDocument
-- ============================================================================
-- NOTE: La table principale pour les documents est ClientProcessDocument, pas Document

DO $$ 
BEGIN
  -- Vérifier si ClientProcessDocument existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ClientProcessDocument'
  ) THEN
    -- Ajouter référence au dossier si elle n'existe pas déjà (peut être client_produit_id)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ClientProcessDocument' AND column_name = 'client_produit_eligible_id'
    ) THEN
      ALTER TABLE "ClientProcessDocument"
        ADD COLUMN client_produit_eligible_id UUID REFERENCES "ClientProduitEligible"(id) ON DELETE SET NULL;
    END IF;

    -- Vérifier et ajouter colonnes pour validation expert (peuvent déjà exister)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ClientProcessDocument' AND column_name = 'validated_by_expert_id'
    ) THEN
      ALTER TABLE "ClientProcessDocument"
        ADD COLUMN validated_by_expert_id UUID REFERENCES "Expert"(id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ClientProcessDocument' AND column_name = 'validated_at'
    ) THEN
      ALTER TABLE "ClientProcessDocument"
        ADD COLUMN validated_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ClientProcessDocument' AND column_name = 'rejected_at'
    ) THEN
      ALTER TABLE "ClientProcessDocument"
        ADD COLUMN rejected_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Créer index
    CREATE INDEX IF NOT EXISTS idx_cpd_client_produit_eligible_id 
      ON "ClientProcessDocument"(client_produit_eligible_id) 
      WHERE client_produit_eligible_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_cpd_validation_status_pending 
      ON "ClientProcessDocument"(validation_status) 
      WHERE validation_status = 'pending';

    CREATE INDEX IF NOT EXISTS idx_cpd_validated_by_expert 
      ON "ClientProcessDocument"(validated_by_expert_id) 
      WHERE validated_by_expert_id IS NOT NULL;

    -- Commentaires
    COMMENT ON COLUMN "ClientProcessDocument".client_produit_eligible_id IS 
      'Référence au dossier (ClientProduitEligible) - CRITIQUE pour requêtes admin';

    COMMENT ON COLUMN "ClientProcessDocument".validated_by_expert_id IS 
      'ID de l''expert qui a validé le document';

    COMMENT ON COLUMN "ClientProcessDocument".validated_at IS 
      'Date de validation du document par l''expert';
      
    RAISE NOTICE 'Colonnes ajoutées à ClientProcessDocument';
  ELSE
    RAISE NOTICE 'Table ClientProcessDocument n''existe pas';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 3 : Ajouter colonnes à Audit (si la table existe)
-- ============================================================================
-- NOTE: Les audits sont principalement trackés via le statut du dossier
-- (audit_en_cours, audit_termine) et la table audit_documents pour les rapports

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'Audit'
  ) THEN
    -- Ajouter référence au dossier (CRITIQUE)
    ALTER TABLE "Audit"
      ADD COLUMN IF NOT EXISTS client_produit_eligible_id UUID REFERENCES "ClientProduitEligible"(id) ON DELETE SET NULL;

    -- Ajouter colonnes pour tracking audit
    ALTER TABLE "Audit"
      ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS report_available BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS report_url TEXT;

    -- Créer index
    CREATE INDEX IF NOT EXISTS idx_audit_client_produit_eligible_id 
      ON "Audit"(client_produit_eligible_id) 
      WHERE client_produit_eligible_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_audit_status 
      ON "Audit"(status);

    CREATE INDEX IF NOT EXISTS idx_audit_report_available 
      ON "Audit"(report_available) 
      WHERE report_available = TRUE;

    -- Commentaires
    COMMENT ON COLUMN "Audit".client_produit_eligible_id IS 
      'Référence au dossier (ClientProduitEligible) - CRITIQUE pour requêtes admin';

    COMMENT ON COLUMN "Audit".started_at IS 
      'Date de lancement de l''audit par l''expert';

    COMMENT ON COLUMN "Audit".completed_at IS 
      'Date de fin de l''audit';

    COMMENT ON COLUMN "Audit".report_available IS 
      'Indique si le rapport d''audit est disponible pour visualisation';
    
    RAISE NOTICE 'Colonnes ajoutées à la table Audit';
  ELSE
    RAISE NOTICE 'Table Audit n''existe pas - utilisation du statut du dossier (audit_en_cours, audit_termine) pour tracking audit';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 4 : Migrer les données existantes
-- ============================================================================

-- 1. Mettre à jour ClientProcessDocument avec client_produit_eligible_id
-- Utiliser client_produit_id si existe, sinon trouver via client_id
-- DÉSACTIVER LE TRIGGER sync_documents_sent TEMPORAIREMENT pour éviter les erreurs
DO $$ 
BEGIN
  -- Vérifier que ClientProduitEligible existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ClientProduitEligible'
  ) THEN
    RAISE EXCEPTION 'Table ClientProduitEligible n''existe pas - migration impossible';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ClientProcessDocument'
  ) THEN
    -- Désactiver le trigger sync_documents_sent s'il existe
    IF EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'trigger_sync_documents_sent'
    ) THEN
      ALTER TABLE "ClientProcessDocument" DISABLE TRIGGER trigger_sync_documents_sent;
      RAISE NOTICE 'Trigger sync_documents_sent désactivé temporairement';
    END IF;
    
    -- Si la colonne client_produit_id existe, l'utiliser
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ClientProcessDocument' AND column_name = 'client_produit_id'
    ) THEN
      -- Copier client_produit_id vers client_produit_eligible_id
      UPDATE "ClientProcessDocument"
      SET client_produit_eligible_id = client_produit_id
      WHERE client_produit_eligible_id IS NULL
      AND client_produit_id IS NOT NULL;
    END IF;
    
    -- Pour les documents sans client_produit_id, trouver via client_id
    UPDATE "ClientProcessDocument" cpd
    SET client_produit_eligible_id = (
      SELECT cpe.id 
      FROM "ClientProduitEligible" cpe
      WHERE cpe."clientId" = cpd.client_id
      ORDER BY cpe.updated_at DESC
      LIMIT 1
    )
    WHERE client_produit_eligible_id IS NULL
    AND EXISTS (SELECT 1 FROM "ClientProduitEligible" WHERE "clientId" = cpd.client_id);
    
    -- Réactiver le trigger
    IF EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'trigger_sync_documents_sent'
    ) THEN
      ALTER TABLE "ClientProcessDocument" ENABLE TRIGGER trigger_sync_documents_sent;
      RAISE NOTICE 'Trigger sync_documents_sent réactivé';
    END IF;
  END IF;
END $$;

-- 2. Mettre à jour Audit avec client_produit_eligible_id (seulement si la table existe)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'Audit'
  ) THEN
    EXECUTE '
      UPDATE "Audit" a
      SET client_produit_eligible_id = (
        SELECT cpe.id 
        FROM "ClientProduitEligible" cpe
        WHERE cpe.clientId = a.clientId
        AND (cpe.expert_id = a.expertId OR (cpe.expert_id IS NULL AND a.expertId IS NULL))
        ORDER BY cpe.updated_at DESC
        LIMIT 1
      )
      WHERE client_produit_eligible_id IS NULL
      AND EXISTS (SELECT 1 FROM "ClientProduitEligible" WHERE clientId = a.clientId);
    ';
    
    -- Mettre à jour started_at et completed_at depuis dateDebut/dateFin
    EXECUTE '
      UPDATE "Audit"
      SET 
        started_at = COALESCE(started_at, "dateDebut"),
        completed_at = CASE 
          WHEN status = ''terminé'' AND "dateFin" IS NOT NULL THEN "dateFin"
          WHEN status = ''terminé'' AND completed_at IS NULL THEN "dateDebut" + INTERVAL ''30 days''
          ELSE completed_at
        END,
        report_available = CASE 
          WHEN status = ''terminé'' THEN TRUE
          ELSE COALESCE(report_available, FALSE)
        END
      WHERE started_at IS NULL OR (status = ''terminé'' AND report_available = FALSE);
    ';
  END IF;
END $$;

-- 4. Calculer les compteurs de documents pour chaque dossier
-- Vérifier d'abord que ClientProduitEligible existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ClientProduitEligible'
  ) THEN
    RAISE EXCEPTION 'Table ClientProduitEligible n''existe pas - migration impossible';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ClientProcessDocument'
  ) THEN
    UPDATE "ClientProduitEligible" cpe
    SET 
      has_documents = EXISTS (
        SELECT 1 FROM "ClientProcessDocument" cpd 
        WHERE cpd.client_produit_eligible_id = cpe.id
           OR cpd.client_produit_id = cpe.id
      ),
      documents_total_count = (
        SELECT COUNT(*) FROM "ClientProcessDocument" cpd 
        WHERE cpd.client_produit_eligible_id = cpe.id
           OR cpd.client_produit_id = cpe.id
      ),
      documents_pending_count = (
        SELECT COUNT(*) FROM "ClientProcessDocument" cpd 
        WHERE (cpd.client_produit_eligible_id = cpe.id OR cpd.client_produit_id = cpe.id)
        AND (cpd.validation_status = 'pending' OR cpd.status = 'pending')
      ),
      documents_validated_count = (
        SELECT COUNT(*) FROM "ClientProcessDocument" cpd 
        WHERE (cpd.client_produit_eligible_id = cpe.id OR cpd.client_produit_id = cpe.id)
        AND (cpd.validation_status = 'validated' OR cpd.status = 'validated')
      )
    WHERE EXISTS (
      SELECT 1 FROM "ClientProcessDocument" cpd 
      WHERE cpd.client_produit_eligible_id = cpe.id OR cpd.client_produit_id = cpe.id
    );
  END IF;
END $$;

-- 5. Mettre à jour audit_status et audit_report_available depuis le statut du dossier
-- Utiliser le statut du dossier (audit_en_cours, audit_termine) et audit_documents pour les rapports
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ClientProduitEligible'
  ) THEN
    RAISE EXCEPTION 'Table ClientProduitEligible n''existe pas - migration impossible';
  END IF;
  
  UPDATE "ClientProduitEligible"
  SET 
    audit_status = CASE 
      WHEN statut = 'audit_en_cours' THEN 'in_progress'
      WHEN statut = 'audit_termine' THEN 'completed'
      WHEN statut IN ('pending_expert_validation', 'documents_completes') THEN 'pending'
      ELSE NULL
    END,
    audit_started_at = CASE 
      WHEN statut = 'audit_en_cours' AND updated_at IS NOT NULL THEN updated_at
      ELSE NULL
    END,
    audit_completed_at = CASE 
      WHEN statut = 'audit_termine' AND updated_at IS NOT NULL THEN updated_at
      ELSE NULL
    END,
    audit_report_available = CASE 
      WHEN statut = 'audit_termine' AND EXISTS (
        SELECT 1 FROM "audit_documents" ad 
        WHERE ad.client_produit_eligible_id = "ClientProduitEligible".id
      ) THEN TRUE
      ELSE FALSE
    END
  WHERE statut IN ('audit_en_cours', 'audit_termine', 'pending_expert_validation', 'documents_completes')
    AND audit_status IS NULL;
END $$;

-- ============================================================================
-- ÉTAPE 5 : Créer des fonctions de mise à jour automatique
-- ============================================================================

-- Fonction pour mettre à jour les compteurs de documents d'un dossier
-- Utilise ClientProcessDocument au lieu de Document
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ClientProcessDocument'
  ) THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION update_dossier_document_counts()
      RETURNS TRIGGER AS $func$
      DECLARE
        dossier_id_val UUID;
      BEGIN
        -- Déterminer l''ID du dossier
        IF TG_OP = ''DELETE'' THEN
          dossier_id_val = COALESCE(OLD.client_produit_eligible_id, OLD.client_produit_id);
        ELSE
          dossier_id_val = COALESCE(NEW.client_produit_eligible_id, NEW.client_produit_id);
        END IF;
        
        IF dossier_id_val IS NOT NULL THEN
          UPDATE "ClientProduitEligible"
          SET 
            has_documents = EXISTS (
              SELECT 1 FROM "ClientProcessDocument" cpd 
              WHERE (cpd.client_produit_eligible_id = dossier_id_val OR cpd.client_produit_id = dossier_id_val)
            ),
            documents_total_count = (
              SELECT COUNT(*) FROM "ClientProcessDocument" cpd 
              WHERE (cpd.client_produit_eligible_id = dossier_id_val OR cpd.client_produit_id = dossier_id_val)
            ),
            documents_pending_count = (
              SELECT COUNT(*) FROM "ClientProcessDocument" cpd 
              WHERE (cpd.client_produit_eligible_id = dossier_id_val OR cpd.client_produit_id = dossier_id_val)
              AND (cpd.validation_status = ''pending'' OR cpd.status = ''pending'')
            ),
            documents_validated_count = (
              SELECT COUNT(*) FROM "ClientProcessDocument" cpd 
              WHERE (cpd.client_produit_eligible_id = dossier_id_val OR cpd.client_produit_id = dossier_id_val)
              AND (cpd.validation_status = ''validated'' OR cpd.status = ''validated'')
            ),
            updated_at = NOW()
          WHERE id = dossier_id_val;
        END IF;
        
        IF TG_OP = ''DELETE'' THEN
          RETURN OLD;
        ELSE
          RETURN NEW;
        END IF;
      END;
      $func$ LANGUAGE plpgsql;
    ';

    -- Trigger sur ClientProcessDocument
    DROP TRIGGER IF EXISTS trigger_update_dossier_document_counts ON "ClientProcessDocument";
    EXECUTE '
      CREATE TRIGGER trigger_update_dossier_document_counts
        AFTER INSERT OR UPDATE OR DELETE ON "ClientProcessDocument"
        FOR EACH ROW
        EXECUTE FUNCTION update_dossier_document_counts();
    ';
  END IF;
END $$;

-- Fonction pour mettre à jour le statut d'audit d'un dossier (si la table Audit existe)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Audit') THEN
    -- Fonction pour mettre à jour le statut d'audit d'un dossier
    EXECUTE '
      CREATE OR REPLACE FUNCTION update_dossier_audit_status()
      RETURNS TRIGGER AS $func$
      BEGIN
        IF NEW.client_produit_eligible_id IS NOT NULL THEN
          UPDATE "ClientProduitEligible"
          SET 
            audit_id = NEW.id,
            audit_status = CASE 
              WHEN NEW.status = ''non_démarré'' THEN ''pending''
              WHEN NEW.status = ''en_cours'' THEN ''in_progress''
              WHEN NEW.status = ''terminé'' THEN ''completed''
              ELSE NULL
            END,
            audit_started_at = NEW.started_at,
            audit_completed_at = NEW.completed_at,
            audit_report_available = NEW.report_available,
            updated_at = NOW()
          WHERE id = NEW.client_produit_eligible_id;
        END IF;
        RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql;
    ';

    -- Trigger sur Audit
    DROP TRIGGER IF EXISTS trigger_update_dossier_audit_status ON "Audit";
    EXECUTE '
      CREATE TRIGGER trigger_update_dossier_audit_status
        AFTER INSERT OR UPDATE ON "Audit"
        FOR EACH ROW
        EXECUTE FUNCTION update_dossier_audit_status();
    ';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 6 : Fix notifications doublons
-- ============================================================================

DO $$ 
BEGIN
  -- Vérifier que la table notification existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notification'
  ) THEN
    -- Désactiver temporairement le trigger archive_orphan_parents s'il existe
    IF EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'trigger_archive_orphan_parents'
    ) THEN
      ALTER TABLE notification DISABLE TRIGGER trigger_archive_orphan_parents;
      RAISE NOTICE 'Trigger archive_orphan_parents désactivé temporairement';
    END IF;
    
    -- Supprimer les notifications en doublon (garder la plus récente)
    EXECUTE '
      WITH duplicates AS (
        SELECT 
          id,
          user_id,
          notification_type,
          action_data->>''dossier_id'' as dossier_id,
          created_at,
          ROW_NUMBER() OVER (
            PARTITION BY user_id, notification_type, action_data->>''dossier_id''
            ORDER BY created_at DESC
          ) as rn
        FROM notification
        WHERE notification_type IN (''admin_action_required'', ''documents_pending_validation_reminder'')
          AND user_type = ''admin''
          AND status != ''replaced''
      )
      DELETE FROM notification
      WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
      );
    ';
    
    -- Créer une contrainte unique pour éviter les futurs doublons
    DROP INDEX IF EXISTS idx_notification_unique_admin_dossier;
    EXECUTE '
      CREATE UNIQUE INDEX idx_notification_unique_admin_dossier
      ON notification(user_id, notification_type, (action_data->>''dossier_id''))
      WHERE user_type = ''admin'' 
        AND notification_type IN (''admin_action_required'', ''documents_pending_validation_reminder'')
        AND status != ''replaced'';
    ';
    
    -- Réactiver le trigger
    IF EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'trigger_archive_orphan_parents'
    ) THEN
      ALTER TABLE notification ENABLE TRIGGER trigger_archive_orphan_parents;
      RAISE NOTICE 'Trigger archive_orphan_parents réactivé';
    END IF;
  ELSE
    RAISE NOTICE 'Table notification n''existe pas - étape de fix doublons ignorée';
  END IF;
END $$;

-- ============================================================================
-- VÉRIFICATIONS POST-MIGRATION
-- ============================================================================

-- Compter les dossiers par état
SELECT 
  'Dossiers avec documents en attente' as categorie,
  COUNT(*) as nombre
FROM "ClientProduitEligible"
WHERE documents_pending_count > 0
  AND admin_eligibility_status = 'validated'

UNION ALL

SELECT 
  'Dossiers sans documents' as categorie,
  COUNT(*) as nombre
FROM "ClientProduitEligible"
WHERE has_documents = FALSE OR documents_total_count = 0

UNION ALL

SELECT 
  'Dossiers en attente validation expert' as categorie,
  COUNT(*) as nombre
FROM "ClientProduitEligible"
WHERE expert_validation_status = 'pending'
  AND expert_id IS NOT NULL
  AND admin_eligibility_status = 'validated'

UNION ALL

SELECT 
  'Dossiers validés par expert' as categorie,
  COUNT(*) as nombre
FROM "ClientProduitEligible"
WHERE expert_validation_status = 'validated'

UNION ALL

SELECT 
  'Dossiers refusés par expert' as categorie,
  COUNT(*) as nombre
FROM "ClientProduitEligible"
WHERE expert_validation_status = 'rejected'

UNION ALL

SELECT 
  'Audits en cours' as categorie,
  COUNT(*) as nombre
FROM "ClientProduitEligible"
WHERE audit_status = 'in_progress'

UNION ALL

SELECT 
  'Audits terminés avec rapport' as categorie,
  COUNT(*) as nombre
FROM "ClientProduitEligible"
WHERE audit_status = 'completed'
  AND audit_report_available = TRUE;

-- Vérifier les documents avec client_produit_eligible_id
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'ClientProcessDocument'
  ) THEN
    RAISE NOTICE 'Vérification ClientProcessDocument:';
    PERFORM (
      SELECT 
        COUNT(*) as total_documents,
        COUNT(COALESCE(client_produit_eligible_id, client_produit_id)) as documents_avec_dossier_id,
        COUNT(*) - COUNT(COALESCE(client_produit_eligible_id, client_produit_id)) as documents_sans_dossier_id
      FROM "ClientProcessDocument"
    );
  ELSE
    RAISE NOTICE 'Table ClientProcessDocument n''existe pas';
  END IF;
END $$;

-- Vérifier les audits via le statut du dossier
SELECT 
  'Audits trackés via statut dossier' as info,
  COUNT(*) FILTER (WHERE statut = 'audit_en_cours') as audits_en_cours,
  COUNT(*) FILTER (WHERE statut = 'audit_termine') as audits_termines,
  COUNT(*) FILTER (WHERE audit_status IS NOT NULL) as audits_avec_statut_tracke
FROM "ClientProduitEligible";

-- Vérifier les rapports d'audit disponibles
SELECT 
  'Rapports d''audit disponibles' as info,
  COUNT(DISTINCT ad.client_produit_eligible_id) as dossiers_avec_rapport
FROM "audit_documents" ad
JOIN "ClientProduitEligible" cpe ON cpe.id = ad.client_produit_eligible_id
WHERE cpe.statut = 'audit_termine';

COMMIT;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

SELECT 
  '✅ Migration terminée avec succès !' as statut,
  NOW() as horodatage;
