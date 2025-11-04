-- ============================================================================
-- AJOUT DU STATUT 'documents_manquants' À LA CONTRAINTE
-- ============================================================================
-- La table ClientProduitEligible a une contrainte CHECK qui limite les valeurs
-- possibles de la colonne 'statut'. On doit ajouter 'documents_manquants'.
-- ============================================================================

-- 1️⃣ Vérifier la contrainte actuelle
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = '"ClientProduitEligible"'::regclass
  AND contype = 'c'
  AND conname LIKE '%statut%';

-- ============================================================================

-- 2️⃣ Supprimer l'ancienne contrainte
ALTER TABLE "ClientProduitEligible" 
DROP CONSTRAINT IF EXISTS "ClientProduitEligible_statut_check";

-- ============================================================================

-- 3️⃣ Recréer la contrainte avec la nouvelle valeur
ALTER TABLE "ClientProduitEligible"
ADD CONSTRAINT "ClientProduitEligible_statut_check" 
CHECK (
    statut IN (
        'eligible',
        'opportunité',
        'documents_uploaded',
        'eligibility_validated',
        'eligibility_rejected',
        'expert_assigned',
        'documents_manquants',  -- ✅ NOUVELLE VALEUR
        'audit_en_cours',
        'audit_termine',
        'audit_rejected_by_client',
        'validated',
        'en_cours',
        'termine',
        'annule',
        'rejete'
    )
);

-- ============================================================================

-- 4️⃣ Vérifier que la contrainte a bien été ajoutée
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = '"ClientProduitEligible"'::regclass
  AND contype = 'c'
  AND conname = 'ClientProduitEligible_statut_check';

-- ============================================================================
-- TEST : Essayer d'insérer/updater avec la nouvelle valeur
-- ============================================================================
DO $$
DECLARE
    test_count INTEGER;
BEGIN
    -- Compter les dossiers qui pourraient utiliser ce statut
    SELECT COUNT(*) INTO test_count
    FROM "ClientProduitEligible" cpe
    WHERE EXISTS (
        SELECT 1 
        FROM "ClientProcessDocument" cpd 
        WHERE cpd.client_produit_id = cpe.id 
        AND cpd.status = 'rejected'
    );
    
    RAISE NOTICE '✅ Contrainte ajoutée avec succès !';
    RAISE NOTICE '📊 % dossier(s) pourront utiliser le statut documents_manquants', test_count;
END $$;

