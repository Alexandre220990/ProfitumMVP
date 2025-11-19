-- ============================================================================
-- LISTE PRÉCISE DES 12 ÉTAPES ET EXPLICATION DU SCRIPT
-- Dossier ID: 4f14164f-d6ca-4d82-bf43-cd4953c88f2d
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : LISTE DÉTAILLÉE DES 12 ÉTAPES
-- ============================================================================
SELECT 
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as numero,
    id,
    step_name as "Nom de l'étape",
    step_type as "Type",
    status as "Statut",
    progress as "Progression (%)",
    priority as "Priorité",
    created_at as "Date de création",
    updated_at as "Dernière mise à jour"
FROM "DossierStep"
WHERE dossier_id = '4f14164f-d6ca-4d82-bf43-cd4953c88f2d'
ORDER BY created_at ASC;

-- ============================================================================
-- PARTIE 2 : GROUPEMENT PAR NOM D'ÉTAPE (pour voir les doublons)
-- ============================================================================
SELECT 
    step_name as "Nom de l'étape",
    COUNT(*) as "Nombre d'occurrences",
    STRING_AGG(status, ', ' ORDER BY created_at) as "Statuts",
    STRING_AGG(id::text, ', ' ORDER BY created_at) as "IDs",
    MIN(created_at) as "Première création",
    MAX(created_at) as "Dernière création"
FROM "DossierStep"
WHERE dossier_id = '4f14164f-d6ca-4d82-bf43-cd4953c88f2d'
GROUP BY step_name
ORDER BY MIN(created_at);

-- ============================================================================
-- PARTIE 3 : COMPARAISON AVEC LES ÉTAPES ATTENDUES (6 étapes standard)
-- ============================================================================
-- Les 6 étapes standardisées pour URSSAF selon le code :
-- 1. Confirmer l'éligibilité
-- 2. Sélection de l'expert
-- 3. Collecte des documents
-- 4. Audit technique
-- 5. Validation finale
-- 6. Demande de remboursement

WITH expected_steps AS (
    SELECT unnest(ARRAY[
        'Confirmer l''éligibilité',
        'Sélection de l''expert',
        'Collecte des documents',
        'Audit technique',
        'Validation finale',
        'Demande de remboursement'
    ]) as step_name
),
actual_steps AS (
    SELECT DISTINCT step_name
    FROM "DossierStep"
    WHERE dossier_id = '4f14164f-d6ca-4d82-bf43-cd4953c88f2d'
)
SELECT 
    'Étapes attendues (6)' as type,
    COUNT(*) as count
FROM expected_steps
UNION ALL
SELECT 
    'Étapes uniques dans la base' as type,
    COUNT(*) as count
FROM actual_steps
UNION ALL
SELECT 
    'Total étapes (avec doublons)' as type,
    COUNT(*) as count
FROM "DossierStep"
WHERE dossier_id = '4f14164f-d6ca-4d82-bf43-cd4953c88f2d';

-- ============================================================================
-- PARTIE 4 : ANALYSE DES DOUBLONS
-- ============================================================================
-- Vérifier si les doublons sont dus à des créations multiples ou à des micro-étapes
SELECT 
    step_name,
    COUNT(*) as occurrences,
    COUNT(DISTINCT step_type) as types_differents,
    COUNT(DISTINCT status) as statuts_differents,
    COUNT(DISTINCT priority) as priorites_differentes,
    CASE 
        WHEN COUNT(*) > 1 THEN '⚠️ DOUBLON DÉTECTÉ'
        ELSE '✅ Unique'
    END as statut
FROM "DossierStep"
WHERE dossier_id = '4f14164f-d6ca-4d82-bf43-cd4953c88f2d'
GROUP BY step_name
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- ============================================================================
-- EXPLICATION DU SCRIPT analyze-dossier-progress.sql
-- ============================================================================
/*
SCRIPT : analyze-dossier-progress.sql
OBJECTIF : Analyser et corriger la progression du dossier

═══════════════════════════════════════════════════════════════════════════════
PARTIES DU SCRIPT ET LEUR UTILITÉ :
═══════════════════════════════════════════════════════════════════════════════

1. VÉRIFICATION DES ÉTAPES (DossierStep)
   → Liste toutes les étapes du dossier avec leurs statuts
   → Permet de voir quelles étapes existent et leur état actuel

2. COMPTAGE DES ÉTAPES PAR STATUT
   → Compte combien d'étapes sont completed, in_progress, pending
   → Permet de comprendre la répartition des étapes

3. CALCUL DU PROGRESS THÉORIQUE
   → Calcule ce que devrait être le progress basé sur les étapes
   → Compare avec les valeurs actuelles dans ClientProduitEligible

4. COMPARAISON AVEC LES VALEURS ACTUELLES
   → Montre l'écart entre les valeurs calculées et les valeurs en base
   → Identifie le problème de synchronisation

5. HISTORIQUE DES CHANGEMENTS DE STATUT
   → Montre l'évolution du dossier dans le temps
   → Permet de comprendre quelles étapes ont été réellement faites

6. VÉRIFICATION DES TRIGGERS
   → Vérifie si des triggers automatiques existent pour mettre à jour le progress
   → Identifie pourquoi le progress n'est pas mis à jour automatiquement

7. VÉRIFICATION DES FONCTIONS
   → Liste les fonctions disponibles pour mettre à jour le progress
   → Identifie les outils disponibles

8. ANALYSE COMPLÈTE HISTORIQUE vs ÉTAPES
   → Compare l'historique avec les étapes pour identifier les incohérences
   → Montre quelles étapes devraient être completed selon l'historique

═══════════════════════════════════════════════════════════════════════════════
RECOMMANDATIONS (PARTIES 9-13) :
═══════════════════════════════════════════════════════════════════════════════

⚠️ ATTENTION : Ces recommandations NE DOIVENT PAS être exécutées automatiquement
   car elles modifient les données. Elles sont là pour comprendre ce qui devrait
   être fait.

9. MISE À JOUR DES ÉTAPES SELON L'HISTORIQUE
   → Marque les étapes comme "completed" si l'historique montre qu'elles sont faites
   → Exemple : Si l'historique montre "eligibility_validated", alors l'étape
     "Confirmer l'éligibilité" devrait être "completed"
   
   ⚠️ NE PAS EXÉCUTER si les doublons sont des micro-étapes intentionnelles

10. SUPPRESSION DES DOUBLONS
    → Supprime les doublons en gardant la première occurrence
    → ⚠️ NE PAS EXÉCUTER si les doublons sont des micro-étapes intentionnelles
    → ⚠️ À NE FAIRE QUE si on est sûr que ce sont de vrais doublons

11. RECALCUL DU PROGRESS
    → Met à jour current_step et progress dans ClientProduitEligible
    → Basé sur les étapes DossierStep après correction
    → ⚠️ À exécuter APRÈS avoir vérifié que les étapes sont correctes

12. CORRECTION DE LA FONCTION update_dossier_progress_from_steps()
    → Modifie la fonction pour inclure tous les statuts (pas seulement eligible/en_cours/termine)
    → Permet de mettre à jour le progress même pour expert_assigned
    → ⚠️ Modification importante, à tester d'abord

13. VÉRIFICATION FINALE
    → Vérifie les résultats après correction
    → Permet de valider que tout est cohérent

═══════════════════════════════════════════════════════════════════════════════
CONCLUSION :
═══════════════════════════════════════════════════════════════════════════════

Le script est un OUTIL D'ANALYSE et de DIAGNOSTIC. Les parties 1-8 sont sûres
à exécuter (lecture seule). Les parties 9-13 sont des RECOMMANDATIONS qui
modifient les données et doivent être utilisées avec précaution.

Si les 12 étapes sont des micro-étapes intentionnelles (améliorations précédentes),
il ne faut PAS supprimer les doublons. Il faut plutôt comprendre pourquoi le
progress n'est pas calculé correctement avec ces 12 étapes.
*/

