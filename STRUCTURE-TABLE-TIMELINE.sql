-- ============================================================================
-- STRUCTURE DE LA TABLE dossier_timeline
-- ============================================================================
-- Ce script documente la structure de la table dossier_timeline
-- et vérifie qu'elle contient toutes les colonnes nécessaires
-- Date : 4 novembre 2025
-- ============================================================================

-- 1️⃣ VÉRIFIER LA STRUCTURE ACTUELLE
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'dossier_timeline'
ORDER BY ordinal_position;

-- ============================================================================

-- 2️⃣ STRUCTURE ATTENDUE (selon le code TypeScript)
-- ============================================================================
/*
Colonnes utilisées dans dossier-timeline-service.ts :

✅ COLONNES PRINCIPALES :
- id                  UUID PRIMARY KEY
- dossier_id          UUID NOT NULL (référence ClientProduitEligible)
- date                TIMESTAMP WITH TIME ZONE
- type                VARCHAR (type d'événement)
- actor_type          VARCHAR (client/expert/admin/system)
- actor_id            UUID (référence à l'acteur)
- actor_name          VARCHAR (nom de l'acteur)
- title               TEXT (titre de l'événement)
- description         TEXT (description détaillée)
- metadata            JSONB (données additionnelles)
- icon                VARCHAR (icône pour l'affichage)
- color               VARCHAR (couleur pour l'affichage)
- action_url          TEXT (URL d'action)
- created_at          TIMESTAMP WITH TIME ZONE
- updated_at          TIMESTAMP WITH TIME ZONE
*/

-- ============================================================================

-- 3️⃣ CRÉER LA TABLE SI ELLE N'EXISTE PAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS dossier_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id UUID NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    type VARCHAR(100),
    actor_type VARCHAR(50),
    actor_id UUID,
    actor_name VARCHAR(255),
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    icon VARCHAR(50),
    color VARCHAR(50) DEFAULT 'blue',
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index pour les recherches
    CONSTRAINT dossier_timeline_dossier_fkey 
        FOREIGN KEY (dossier_id) 
        REFERENCES "ClientProduitEligible"(id) 
        ON DELETE CASCADE
);

-- ============================================================================

-- 4️⃣ CRÉER LES INDEX POUR LES PERFORMANCES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_dossier_timeline_dossier_id 
    ON dossier_timeline(dossier_id);

CREATE INDEX IF NOT EXISTS idx_dossier_timeline_date 
    ON dossier_timeline(date DESC);

CREATE INDEX IF NOT EXISTS idx_dossier_timeline_type 
    ON dossier_timeline(type);

CREATE INDEX IF NOT EXISTS idx_dossier_timeline_actor_type 
    ON dossier_timeline(actor_type);

-- ============================================================================

-- 5️⃣ TEST : Insérer un événement de test (optionnel)
-- ============================================================================
/*
INSERT INTO dossier_timeline (
    dossier_id,
    date,
    type,
    actor_type,
    actor_id,
    actor_name,
    title,
    description,
    icon,
    color
) VALUES (
    'ffddb8df-4182-4447-8a43-3944bb85d976',  -- Dossier DFS de test
    NOW(),
    'test',
    'system',
    NULL,
    'System',
    'Test événement timeline',
    'Vérification de la structure de la table',
    'info',
    'blue'
);
*/

-- ============================================================================

-- 6️⃣ VÉRIFIER LES ÉVÉNEMENTS EXISTANTS
-- ============================================================================
SELECT 
    COUNT(*) as nb_evenements_total,
    COUNT(DISTINCT dossier_id) as nb_dossiers_avec_timeline,
    COUNT(DISTINCT type) as nb_types_evenements,
    MIN(date) as premiere_date,
    MAX(date) as derniere_date
FROM dossier_timeline;

-- ============================================================================

-- 7️⃣ STATISTIQUES PAR TYPE D'ÉVÉNEMENT
-- ============================================================================
SELECT 
    type as type_evenement,
    actor_type as type_acteur,
    COUNT(*) as nb_occurrences,
    MIN(date) as premiere_occurrence,
    MAX(date) as derniere_occurrence
FROM dossier_timeline
GROUP BY type, actor_type
ORDER BY nb_occurrences DESC;

-- ============================================================================
-- FIN DE LA DOCUMENTATION
-- ============================================================================

