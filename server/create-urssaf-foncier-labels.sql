-- =====================================================
-- CRÉATION DES LABELS ET CATÉGORIES URSSAF ET FONCIER
-- =====================================================

-- 1. CRÉATION DES LABELS URSSAF
-- =====================================================

-- Label KBIS (commun à tous les produits)
INSERT INTO "GEDDocumentLabel" (id, name, color, description, created_at)
SELECT 
    gen_random_uuid(),
    'kbis',
    '#10B981', -- Vert
    'Extrait Kbis de votre entreprise (moins de 3 mois)',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "GEDDocumentLabel" WHERE name = 'kbis'
);

-- Label Fiches de paie (spécifique URSSAF)
INSERT INTO "GEDDocumentLabel" (id, name, color, description, created_at)
SELECT 
    gen_random_uuid(),
    'fiche_paie',
    '#8B5CF6', -- Violet
    'Fiches de paie des employés (3 derniers mois)',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "GEDDocumentLabel" WHERE name = 'fiche_paie'
);

-- =====================================================
-- 2. CRÉATION DES LABELS FONCIER
-- =====================================================

-- Label Fiche imposition foncier professionnel (spécifique Foncier)
INSERT INTO "GEDDocumentLabel" (id, name, color, description, created_at)
SELECT 
    gen_random_uuid(),
    'fiche_imposition_foncier',
    '#F59E0B', -- Orange
    'Fiche d''imposition foncier professionnel (année en cours)',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "GEDDocumentLabel" WHERE name = 'fiche_imposition_foncier'
);

-- =====================================================
-- 3. VÉRIFICATION DES LABELS CRÉÉS
-- =====================================================

SELECT 'Labels URSSAF et Foncier créés:' as info;
SELECT 
    id, 
    name, 
    description, 
    color,
    created_at 
FROM "GEDDocumentLabel" 
WHERE name IN ('kbis', 'fiche_paie', 'fiche_imposition_foncier')
ORDER BY name;

-- =====================================================
-- 4. CRÉATION DES CATÉGORIES DE DOCUMENTS
-- =====================================================

-- Vérifier que les catégories n'existent pas déjà
SELECT 'Catégories existantes:' as info;
SELECT DISTINCT category 
FROM "GEDDocument" 
WHERE category IN ('eligibilite_urssaf', 'eligibilite_foncier')
ORDER BY category;

-- Note: Les catégories seront créées automatiquement lors du premier upload
-- car elles sont définies dans le code comme 'eligibilite_urssaf' et 'eligibilite_foncier'

-- =====================================================
-- 5. VÉRIFICATION FINALE
-- =====================================================

SELECT 
    'RÉSUMÉ CONFIGURATION' as check_type,
    COUNT(*) as nombre_labels_crees,
    'kbis, fiche_paie, fiche_imposition_foncier' as labels_disponibles,
    'eligibilite_urssaf, eligibilite_foncier' as categories_attendues
FROM "GEDDocumentLabel" 
WHERE name IN ('kbis', 'fiche_paie', 'fiche_imposition_foncier');

-- =====================================================
-- 6. DOCUMENTATION DES TYPES DE DOCUMENTS
-- =====================================================

-- URSSAF Documents
SELECT 
    'URSSAF' as produit,
    'kbis' as document_type,
    'Extrait KBIS' as label,
    'Obligatoire - Extrait Kbis de moins de 3 mois' as description,
    'Commun avec autres produits' as note
UNION ALL
SELECT 
    'URSSAF',
    'fiche_paie',
    'Fiches de paie',
    'Obligatoire - Fiches de paie des 3 derniers mois',
    'Spécifique URSSAF';

-- Foncier Documents
SELECT 
    'FONCIER' as produit,
    'kbis' as document_type,
    'Extrait KBIS' as label,
    'Obligatoire - Extrait Kbis de moins de 3 mois' as description,
    'Commun avec autres produits' as note
UNION ALL
SELECT 
    'FONCIER',
    'fiche_imposition_foncier',
    'Fiche imposition foncier',
    'Obligatoire - Fiche imposition foncier professionnel année en cours',
    'Spécifique Foncier';
