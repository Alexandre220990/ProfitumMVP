-- =====================================================
-- CRÉATION DES LABELS TICPE MANQUANTS
-- =====================================================

-- Vérifier les labels existants
SELECT 'Labels existants:' as info;
SELECT id, name, description, created_at 
FROM "GEDDocumentLabel" 
WHERE name IN ('kbis', 'immatriculation', 'facture_carburant')
   OR name ILIKE '%ticpe%';

-- Créer les labels TICPE s'ils n'existent pas
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

INSERT INTO "GEDDocumentLabel" (id, name, color, description, created_at)
SELECT 
    gen_random_uuid(),
    'immatriculation',
    '#3B82F6', -- Bleu
    'Certificat d''immatriculation de moins de 6 mois d''au moins 1 véhicule',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "GEDDocumentLabel" WHERE name = 'immatriculation'
);

INSERT INTO "GEDDocumentLabel" (id, name, color, description, created_at)
SELECT 
    gen_random_uuid(),
    'facture_carburant',
    '#F59E0B', -- Orange
    'Facture de carburant trimestrielle ou annuelle',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "GEDDocumentLabel" WHERE name = 'facture_carburant'
);

-- Vérifier que les labels ont été créés
SELECT 'Labels après création:' as info;
SELECT id, name, description, created_at 
FROM "GEDDocumentLabel" 
WHERE name IN ('kbis', 'immatriculation', 'facture_carburant')
ORDER BY name;
