-- ===== ORGANISATION ESPACE DOCUMENTAIRE FINANCIALTRACKER =====
-- Script pour organiser la documentation avec permissions par rôle
-- 
-- DOCUMENTATION GÉNÉRALE (guides, workflows) :
-- - Admin : Accès complet à tout
-- - Client : Guides utilisateur + workflows clients uniquement
-- - Expert : Guides utilisateur + workflows experts uniquement
--
-- DOCUMENTS MÉTIER (dossiers, rapports, fichiers) :
-- - Client :
--     ✅ Accès à TOUS ses propres documents
--     ✅ Accès à ses documents financiers (BDC, factures)
--     ✅ Accès à ses chartes (charte de signature, charte produit, etc.)
-- - Expert :
--     ✅ Accès à TOUS les documents des missions qui lui sont assignées
--     ✅ Accès aux factures BDC liées à ses missions
--     ✅ Accès aux chartes nécessaires à ses missions
-- - Admin :
--     ✅ Accès à TOUS les documents de la plateforme, sans restriction
--
-- Rappel :
-- Chaque utilisateur (client ou expert) n'accède qu'aux documents qui le concernent.
-- L'admin a une vision totale.
--
-- Note : Tous les utilisateurs doivent être authentifiés, pas d'accès public

-- ===== SYNTHÈSE FONCTIONNELLE ADMIN PROFITUM =====
-- Catégorie : Documentation Technique
-- Titre : "Synthèse fonctionnelle complète - Administrateur Profitum"
--
-- L'administrateur Profitum dispose d'un accès total à la plateforme FinancialTracker. Il peut :
--   • Gérer l'ensemble des utilisateurs (clients, experts, autres admins)
--   • Superviser et valider les dossiers clients et missions experts
--   • Accéder à tous les documents (dossiers, rapports, factures, chartes, etc.)
--   • Consulter et éditer toute la documentation technique, métier, sécurité, conformité
--   • Configurer les workflows documentaires et les règles métier
--   • Gérer les droits d'accès et les politiques de sécurité (RLS, permissions)
--   • Suivre les indicateurs clés (KPI, tableaux de bord, statistiques)
--   • Auditer les actions et accéder à l'historique complet
--   • Intervenir sur les incidents, escalades, et assurer la conformité réglementaire
--   • Exporter des rapports, superviser la maintenance et la sécurité
--
-- L'admin est le garant du bon fonctionnement, de la sécurité et de la conformité de l'ensemble du système documentaire et métier.
--
-- === RÉCAPITULATIF VISUEL DES ARTICLES DOCUMENTAIRES ===
--
-- | Titre                                              | Catégorie                   | Publié | Mis en avant | Vues |
-- | -------------------------------------------------- | --------------------------- | ------ | ------------ | ---- |
-- | Plan Complet - Marketplace Experts & Documentation | Fonctionnalités application | true   | true         | 1    |
-- | Guide d'utilisation - Espace Expert                | Guide Expert                | true   | true         | 0    |
-- | Guide d'utilisation - Espace Client                | Guide Client                | true   | true         | 0    |
-- | Guide Complet des Workflows - Admin                | Workflows Admin             | true   | true         | 0    |
-- | Comment valider les CGV                            | Guide Client                | true   | false        | 0    |
-- | Politique de Sécurité Complète                     | Politique de Sécurité       | true   | false        | 0    |
-- | Gestion des délais SLA                             | Guide Expert                | true   | false        | 0    |
-- | Comment produire un rapport d'éligibilité          | Guide Expert                | true   | false        | 0    |
-- | Documentation Complète Base de Données             | Base de Données             | true   | false        | 0    |
-- | Workflow Simulation - Guide Client                 | Workflows Client            | true   | false        | 0    |
-- | Workflow CGV - Guide Client                        | Workflows Client            | true   | false        | 0    |
-- | Workflow Prééligibilité - Guide Expert             | Workflows Expert            | true   | false        | 0    |
-- | Workflow Éligibilité Expert - Guide Expert         | Workflows Expert            | true   | false        | 0    |
-- | Monitoring et Suivi des Workflows                  | Workflows Admin             | true   | false        | 0    |
-- | Documentation API et Intégrations                  | API & Intégrations          | true   | false        | 0    |
-- | Comprendre les rapports de simulation              | Guide Client                | true   | false        | 0    |
--
-- ===== 1. CRÉATION DES CATÉGORIES DE DOCUMENTATION =====

-- Catégories principales
INSERT INTO public.documentation_categories (
    id, name, description, icon, color, sort_order, is_active, created_at, updated_at
) VALUES
    -- Catégories racines (toutes accessibles aux utilisateurs authentifiés selon leur rôle)
    (gen_random_uuid(), 'Documentation Technique', 'Documentation technique complète pour l''admin', 'code', '#3B82F6', 1, true, now(), now()),
    (gen_random_uuid(), 'Guides Utilisateur', 'Guides d''utilisation pour clients et experts', 'book', '#10B981', 2, true, now(), now()),
    (gen_random_uuid(), 'Workflows Documentaires', 'Documentation des workflows par rôle', 'workflow', '#F59E0B', 3, true, now(), now()),
    (gen_random_uuid(), 'Sécurité & Conformité', 'Documentation sécurité et conformité', 'shield', '#EF4444', 4, true, now(), now()),
    (gen_random_uuid(), 'Rapports & Analyses', 'Rapports techniques et analyses', 'chart', '#8B5CF6', 5, true, now(), now())
ON CONFLICT (name) DO NOTHING;

-- Récupérer les IDs des catégories racines
DO $$
DECLARE
    tech_id UUID;
    guides_id UUID;
    workflows_id UUID;
    security_id UUID;
    reports_id UUID;
BEGIN
    -- Récupérer les IDs
    SELECT id INTO tech_id FROM public.documentation_categories WHERE name = 'Documentation Technique';
    SELECT id INTO guides_id FROM public.documentation_categories WHERE name = 'Guides Utilisateur';
    SELECT id INTO workflows_id FROM public.documentation_categories WHERE name = 'Workflows Documentaires';
    SELECT id INTO security_id FROM public.documentation_categories WHERE name = 'Sécurité & Conformité';
    SELECT id INTO reports_id FROM public.documentation_categories WHERE name = 'Rapports & Analyses';

    -- Sous-catégories Documentation Technique
    INSERT INTO public.documentation_categories (id, name, description, icon, color, sort_order, is_active, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Base de Données', 'Documentation complète de la base de données', 'database', '#1E40AF', 1, true, now(), now()),
        (gen_random_uuid(), 'API & Intégrations', 'Documentation des APIs et intégrations', 'api', '#1D4ED8', 2, true, now(), now()),
        (gen_random_uuid(), 'Architecture Système', 'Architecture et design du système', 'architecture', '#2563EB', 3, true, now(), now()),
        (gen_random_uuid(), 'Déploiement', 'Guides de déploiement et configuration', 'deploy', '#3B82F6', 4, true, now(), now())
    ON CONFLICT (name) DO NOTHING;

    -- Sous-catégories Guides Utilisateur
    INSERT INTO public.documentation_categories (id, name, description, icon, color, sort_order, is_active, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Guide Client', 'Guide complet pour les clients', 'user', '#059669', 1, true, now(), now()),
        (gen_random_uuid(), 'Guide Expert', 'Guide complet pour les experts', 'expert', '#047857', 2, true, now(), now()),
        (gen_random_uuid(), 'FAQ', 'Questions fréquemment posées', 'faq', '#10B981', 3, true, now(), now()),
        (gen_random_uuid(), 'Tutoriels Vidéo', 'Tutoriels vidéo d''utilisation', 'video', '#34D399', 4, true, now(), now())
    ON CONFLICT (name) DO NOTHING;

    -- Sous-catégories Workflows Documentaires
    INSERT INTO public.documentation_categories (id, name, description, icon, color, sort_order, is_active, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Workflows Client', 'Workflows accessibles aux clients', 'workflow-client', '#D97706', 1, true, now(), now()),
        (gen_random_uuid(), 'Workflows Expert', 'Workflows accessibles aux experts', 'workflow-expert', '#F59E0B', 2, true, now(), now()),
        (gen_random_uuid(), 'Workflows Admin', 'Workflows complets pour l''admin', 'workflow-admin', '#FBBF24', 3, true, now(), now())
    ON CONFLICT (name) DO NOTHING;

    -- Sous-catégories Sécurité & Conformité
    INSERT INTO public.documentation_categories (id, name, description, icon, color, sort_order, is_active, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Politique de Sécurité', 'Politiques de sécurité', 'security', '#DC2626', 1, true, now(), now()),
        (gen_random_uuid(), 'Conformité RGPD', 'Documentation conformité RGPD', 'gdpr', '#EA580C', 2, true, now(), now()),
        (gen_random_uuid(), 'Audit de Sécurité', 'Rapports d''audit de sécurité', 'audit', '#EF4444', 3, true, now(), now()),
        (gen_random_uuid(), 'Incidents & Résolution', 'Gestion des incidents de sécurité', 'incident', '#F87171', 4, true, now(), now())
    ON CONFLICT (name) DO NOTHING;

    -- Sous-catégories Rapports & Analyses
    INSERT INTO public.documentation_categories (id, name, description, icon, color, sort_order, is_active, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Rapports de Performance', 'Rapports de performance système', 'performance', '#7C3AED', 1, true, now(), now()),
        (gen_random_uuid(), 'Analyses Métier', 'Analyses et rapports métier', 'business', '#8B5CF6', 2, true, now(), now()),
        (gen_random_uuid(), 'Statistiques Utilisateurs', 'Statistiques d''utilisation', 'stats', '#A78BFA', 3, true, now(), now()),
        (gen_random_uuid(), 'Rapports de Conformité', 'Rapports de conformité réglementaire', 'compliance', '#C4B5FD', 4, true, now(), now())
    ON CONFLICT (name) DO NOTHING;

END $$;

-- ===== AJOUT DES CATÉGORIES ET SOUS-CATÉGORIES MANQUANTES =====
-- (Bloc à insérer après la création des catégories principales)

DO $$
DECLARE
    maintenance_id UUID;
    procedures_id UUID;
    specialized_id UUID;
BEGIN
    -- Ajout des catégories principales manquantes
    INSERT INTO public.documentation_categories (id, name, description, icon, color, sort_order, is_active, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Maintenance & Exploitation', 'Documentation sur la maintenance, le monitoring et l''exploitation', 'wrench', '#6366F1', 6, true, now(), now()),
        (gen_random_uuid(), 'Procédures Opérationnelles', 'Procédures système, métier et sécurité', 'clipboard-list', '#F472B6', 7, true, now(), now()),
        (gen_random_uuid(), 'Documentation Spécialisée', 'Guides d''intégration, modules avancés, formation', 'star', '#FBBF24', 8, true, now(), now())
    ON CONFLICT (name) DO NOTHING;

    -- Récupérer les IDs des nouvelles catégories
    SELECT id INTO maintenance_id FROM public.documentation_categories WHERE name = 'Maintenance & Exploitation';
    SELECT id INTO procedures_id FROM public.documentation_categories WHERE name = 'Procédures Opérationnelles';
    SELECT id INTO specialized_id FROM public.documentation_categories WHERE name = 'Documentation Spécialisée';

    -- Sous-catégories Maintenance & Exploitation
    INSERT INTO public.documentation_categories (id, name, description, icon, color, sort_order, is_active, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Maintenance Préventive', 'Tâches régulières et scripts de maintenance', 'calendar-check', '#818CF8', 1, true, now(), now()),
        (gen_random_uuid(), 'Monitoring & Alertes', 'Configuration du monitoring et alertes', 'bell', '#A5B4FC', 2, true, now(), now()),
        (gen_random_uuid(), 'Gestion des Incidents', 'Procédures de gestion des incidents', 'exclamation-triangle', '#F87171', 3, true, now(), now()),
        (gen_random_uuid(), 'Sauvegarde & Restauration', 'Stratégies et procédures de sauvegarde', 'database', '#FDE68A', 4, true, now(), now())
    ON CONFLICT (name) DO NOTHING;

    -- Sous-catégories Procédures Opérationnelles
    INSERT INTO public.documentation_categories (id, name, description, icon, color, sort_order, is_active, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Procédures Système', 'Procédures de déploiement, configuration, monitoring', 'server', '#F472B6', 1, true, now(), now()),
        (gen_random_uuid(), 'Procédures Métier', 'Procédures de validation, communication, formation', 'briefcase', '#F9A8D4', 2, true, now(), now()),
        (gen_random_uuid(), 'Procédures de Sécurité', 'Procédures d''authentification, chiffrement, audit', 'lock-closed', '#F43F5E', 3, true, now(), now())
    ON CONFLICT (name) DO NOTHING;

    -- Sous-catégories Documentation Spécialisée
    INSERT INTO public.documentation_categories (id, name, description, icon, color, sort_order, is_active, created_at, updated_at) VALUES
        (gen_random_uuid(), 'Intégrations Externes', 'Guides d''intégration de services externes', 'puzzle', '#FBBF24', 1, true, now(), now()),
        (gen_random_uuid(), 'Modules Spécialisés', 'Guides sur les modules avancés (simulateur, GED, etc.)', 'cube', '#FDE68A', 2, true, now(), now()),
        (gen_random_uuid(), 'Formation & Support', 'Guides de formation, support technique', 'academic-cap', '#F59E42', 3, true, now(), now())
    ON CONFLICT (name) DO NOTHING;
END $$;

-- ===== FIN AJOUT CATÉGORIES =====

-- ===== 2. CRÉATION DES ARTICLES DE DOCUMENTATION =====

-- Récupérer les catégories pour les articles
DO $$
DECLARE
    guide_client_id UUID;
    guide_expert_id UUID;
    workflows_client_id UUID;
    workflows_expert_id UUID;
    workflows_admin_id UUID;
    db_doc_id UUID;
    api_doc_id UUID;
    security_doc_id UUID;
    -- Ajout des variables pour les sous-blocs techniques
    db_optim_id UUID;
    db_rls_id UUID;
    db_backup_id UUID;
    db_migration_id UUID;
    api_auth_id UUID;
    api_websocket_id UUID;
    api_examples_id UUID;
    api_errors_id UUID;
    arch_overview_id UUID;
    arch_deploy_id UUID;
    arch_perf_id UUID;
    arch_security_id UUID;
    arch_roadmap_id UUID;
    dev_quickstart_id UUID;
    dev_standards_id UUID;
    dev_tests_id UUID;
    dev_cicd_id UUID;
    dev_debug_id UUID;
BEGIN
    -- Récupérer les IDs des catégories
    SELECT id INTO guide_client_id FROM public.documentation_categories WHERE name = 'Guide Client';
    SELECT id INTO guide_expert_id FROM public.documentation_categories WHERE name = 'Guide Expert';
    SELECT id INTO workflows_client_id FROM public.documentation_categories WHERE name = 'Workflows Client';
    SELECT id INTO workflows_expert_id FROM public.documentation_categories WHERE name = 'Workflows Expert';
    SELECT id INTO workflows_admin_id FROM public.documentation_categories WHERE name = 'Workflows Admin';
    SELECT id INTO db_doc_id FROM public.documentation_categories WHERE name = 'Base de Données';
    SELECT id INTO api_doc_id FROM public.documentation_categories WHERE name = 'API & Intégrations';
    SELECT id INTO security_doc_id FROM public.documentation_categories WHERE name = 'Politique de Sécurité';

    -- Articles Guide Client
    INSERT INTO public.documentation_items (
        id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
    ) VALUES
        (
            gen_random_uuid(), guide_client_id,
            'Guide d''utilisation - Espace Client',
            'Guide complet pour utiliser l''espace client FinancialTracker. Découvrez toutes les fonctionnalités disponibles pour gérer vos dossiers, consulter vos rapports et interagir avec les experts.',
            'guide-utilisation-espace-client',
            'Guide complet pour utiliser l''espace client FinancialTracker',
            ARRAY['client', 'guide', 'utilisation'],
            true,
            true,
            NULL,
            now(), now()
        ),
        (
            gen_random_uuid(), guide_client_id,
            'Comment valider les CGV',
            'Étapes détaillées pour valider les Conditions Générales de Vente lors de votre inscription. Processus simple et sécurisé.',
            'comment-valider-cgv',
            'Guide pour valider les Conditions Générales de Vente',
            ARRAY['cgv', 'validation', 'inscription'],
            true,
            false,
            NULL,
            now(), now()
        ),
        (
            gen_random_uuid(), guide_client_id,
            'Comprendre les rapports de simulation',
            'Explication détaillée des rapports de simulation générés automatiquement. Apprenez à interpréter les résultats et les recommandations.',
            'comprendre-rapports-simulation',
            'Guide pour comprendre les rapports de simulation',
            ARRAY['simulation', 'rapport', 'comprehension'],
            true,
            false,
            NULL,
            now(), now()
        )
    ON CONFLICT (slug) DO NOTHING;

    -- Articles Guide Expert
    INSERT INTO public.documentation_items (
        id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
    ) VALUES
        (
            gen_random_uuid(), guide_expert_id,
            'Guide d''utilisation - Espace Expert',
            'Guide complet pour utiliser l''espace expert FinancialTracker. Découvrez comment gérer vos missions, produire des rapports et interagir avec les clients.',
            'guide-utilisation-espace-expert',
            'Guide complet pour utiliser l''espace expert FinancialTracker',
            ARRAY['expert', 'guide', 'utilisation'],
            true,
            true,
            NULL,
            now(), now()
        ),
        (
            gen_random_uuid(), guide_expert_id,
            'Comment produire un rapport d''éligibilité',
            'Guide détaillé pour produire un rapport d''éligibilité complet et conforme aux standards de qualité. Inclut les bonnes pratiques et les points d''attention.',
            'comment-produire-rapport-eligibilite',
            'Guide pour produire un rapport d''éligibilité',
            ARRAY['rapport', 'eligibilite', 'expert'],
            true,
            false,
            NULL,
            now(), now()
        ),
        (
            gen_random_uuid(), guide_expert_id,
            'Gestion des délais SLA',
            'Comprendre et respecter les délais SLA pour les rapports. Guide pratique pour optimiser votre workflow et respecter les engagements.',
            'gestion-delais-sla',
            'Guide pour gérer les délais SLA',
            ARRAY['sla', 'delais', 'respect'],
            true,
            false,
            NULL,
            now(), now()
        )
    ON CONFLICT (slug) DO NOTHING;

    -- Articles Workflows Client
    INSERT INTO public.documentation_items (
        id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
    ) VALUES
        (
            gen_random_uuid(), workflows_client_id,
            'Workflow CGV - Guide Client',
            'Guide détaillé du workflow de validation des Conditions Générales de Vente. Processus étape par étape pour valider vos CGV de manière sécurisée.',
            'workflow-cgv-guide-client',
            'Guide du workflow de validation des CGV',
            ARRAY['workflow', 'cgv', 'client'],
            true,
            false,
            NULL,
            now(), now()
        ),
        (
            gen_random_uuid(), workflows_client_id,
            'Workflow Simulation - Guide Client',
            'Guide du workflow de génération de rapport de simulation. Comprendre le processus automatique de création de vos rapports de simulation.',
            'workflow-simulation-guide-client',
            'Guide du workflow de simulation',
            ARRAY['workflow', 'simulation', 'client'],
            true,
            false,
            NULL,
            now(), now()
        )
    ON CONFLICT (slug) DO NOTHING;

    -- Articles Workflows Expert
    INSERT INTO public.documentation_items (
        id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
    ) VALUES
        (
            gen_random_uuid(), workflows_expert_id,
            'Workflow Éligibilité Expert - Guide Expert',
            'Guide détaillé du workflow de rapport d''éligibilité. Processus complet pour produire des rapports d''éligibilité conformes et de qualité.',
            'workflow-eligibilite-expert-guide',
            'Guide du workflow de rapport d''éligibilité',
            ARRAY['workflow', 'eligibilite', 'expert'],
            true,
            false,
            NULL,
            now(), now()
        ),
        (
            gen_random_uuid(), workflows_expert_id,
            'Workflow Prééligibilité - Guide Expert',
            'Guide du workflow de rapport de prééligibilité. Étapes pour évaluer rapidement l''éligibilité d''un client.',
            'workflow-preeligibilite-expert-guide',
            'Guide du workflow de prééligibilité',
            ARRAY['workflow', 'preeligibilite', 'expert'],
            true,
            false,
            NULL,
            now(), now()
        )
    ON CONFLICT (slug) DO NOTHING;

    -- Articles Workflows Admin
    INSERT INTO public.documentation_items (
        id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
    ) VALUES
        (
            gen_random_uuid(), workflows_admin_id,
            'Guide Complet des Workflows - Admin',
            'Guide complet de tous les workflows documentaires du système. Vue d''ensemble des processus et des responsabilités de chaque acteur.',
            'guide-complet-workflows-admin',
            'Guide complet des workflows documentaires',
            ARRAY['workflow', 'admin', 'complet'],
            true,
            true,
            NULL,
            now(), now()
        ),
        (
            gen_random_uuid(), workflows_admin_id,
            'Monitoring et Suivi des Workflows',
            'Guide pour monitorer et suivre les workflows en temps réel. Outils et bonnes pratiques pour assurer le bon fonctionnement des processus.',
            'monitoring-suivi-workflows',
            'Guide pour monitorer les workflows',
            ARRAY['monitoring', 'suivi', 'admin'],
            true,
            false,
            NULL,
            now(), now()
        )
    ON CONFLICT (slug) DO NOTHING;

    -- Articles Documentation Technique
    INSERT INTO public.documentation_items (
        id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
    ) VALUES
        (
            gen_random_uuid(), db_doc_id,
            'Documentation Complète Base de Données',
            'Documentation technique complète de la base de données FinancialTracker. Architecture, schémas, relations et bonnes pratiques.',
            'documentation-complete-base-donnees',
            'Documentation technique de la base de données',
            ARRAY['database', 'technical', 'admin'],
            true,
            false,
            NULL,
            now(), now()
        ),
        (
            gen_random_uuid(), api_doc_id,
            'Documentation API et Intégrations',
            'Documentation complète des APIs et intégrations du système FinancialTracker. Endpoints, authentification et exemples d''utilisation.',
            'documentation-api-integrations',
            'Documentation des APIs et intégrations',
            ARRAY['api', 'integration', 'technical'],
            true,
            false,
            NULL,
            now(), now()
        ),
        (
            gen_random_uuid(), security_doc_id,
            'Politique de Sécurité Complète',
            'Politique de sécurité détaillée du système FinancialTracker. Mesures de protection, bonnes pratiques et procédures de sécurité.',
            'politique-securite-complete',
            'Politique de sécurité du système',
            ARRAY['security', 'policy', 'admin'],
            true,
            false,
            NULL,
            now(), now()
        )
    ON CONFLICT (slug) DO NOTHING;

    -- ===== AJOUT DE TOUS LES DOCUMENTS TECHNIQUES =====
    -- (Déplacez ici toutes les instructions d'insertion techniques supplémentaires, sans BEGIN...END imbriqué)
    -- ...
END $$;

    -- ===== AJOUT DE TOUS LES GUIDES UTILISATEUR =====
    
    DO $$
    DECLARE
        guide_admin_id UUID;
        faq_id UUID;
        tutorials_id UUID;
        troubleshooting_id UUID;
        tips_id UUID;
    BEGIN
        -- Récupérer les IDs des sous-catégories Guides Utilisateur
        SELECT id INTO guide_admin_id FROM public.documentation_categories WHERE name = 'Guide Client';
        SELECT id INTO faq_id FROM public.documentation_categories WHERE name = 'FAQ';
        SELECT id INTO tutorials_id FROM public.documentation_categories WHERE name = 'Tutoriels Vidéo';
        SELECT id INTO troubleshooting_id FROM public.documentation_categories WHERE name = 'FAQ';
        SELECT id INTO tips_id FROM public.documentation_categories WHERE name = 'FAQ';

        -- Articles Guide Admin (supplémentaires)
        INSERT INTO public.documentation_items (
            id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
        ) VALUES
            (
                gen_random_uuid(), guide_admin_id,
                'Guide Administrateur Complet',
                '# Guide Administrateur Complet

## Vue d''ensemble
Guide complet pour les administrateurs de FinancialTracker.

## Gestion des Experts
- Validation des inscriptions d''experts
- Suivi des performances
- Gestion des compensations
- Évaluation et feedback

## Gestion des Dossiers Clients
- Supervision des dossiers en cours
- Validation des étapes critiques
- Gestion des escalades
- Contrôle qualité des livrables

## Processus Métier
- Configuration des workflows
- Définition des règles métier
- Automatisation des processus
- Gestion des exceptions

## Reporting et Analytics
- KPIs et métriques clés
- Rapports de performance
- Analyses de tendances
- Export de données

## Configuration Système
- Paramètres de sécurité
- Gestion des droits d''accès
- Configuration des notifications
- Maintenance préventive

## Gestion des Incidents
- Détection des problèmes
- Procédures d''escalade
- Résolution des incidents
- Communication avec les parties prenantes',
                'guide-administrateur-complet',
                'Guide complet pour les administrateurs de FinancialTracker',
                ARRAY['admin', 'guide', 'complete', 'admin'],
                true,
                true,
                NULL,
                now(), now()
            ),
            (
                gen_random_uuid(), guide_admin_id,
                'Gestion des Experts - Guide Admin',
                '# Gestion des Experts - Guide Admin

## Vue d''ensemble
Guide détaillé pour la gestion des experts sur la plateforme.

## Validation des Inscriptions
- Révision des dossiers de candidature
- Vérification des qualifications
- Approbation ou rejet avec justifications
- Notification automatique aux candidats

## Suivi des Performances
- Métriques de performance par expert
- Taux de satisfaction client
- Temps de traitement des dossiers
- Qualité des rapports fournis

## Gestion des Compensations
- Configuration des taux de compensation
- Suivi des paiements
- Génération des rapports financiers
- Gestion des litiges

## Évaluation et Feedback
- Évaluations clients
- Feedback de l''administration
- Amélioration continue
- Plan de développement

## Support et Formation
- Assistance aux experts
- Formation continue
- Ressources documentaires
- Communauté d''experts',
                'gestion-experts-guide-admin',
                'Guide détaillé pour la gestion des experts',
                ARRAY['admin', 'experts', 'management', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            ),
            (
                gen_random_uuid(), guide_admin_id,
                'Gestion des Dossiers Clients - Guide Admin',
                '# Gestion des Dossiers Clients - Guide Admin

## Vue d''ensemble
Guide pour la supervision et la gestion des dossiers clients.

## Vue d''Ensemble des Dossiers
- Liste de tous les dossiers clients
- Statut et progression de chaque dossier
- Filtres par type, statut, expert assigné
- Recherche et tri avancés

## Validation des Étapes
- Contrôle qualité des documents soumis
- Validation des étapes du processus
- Approbation des livrables
- Gestion des rejets avec justifications

## Escalade et Résolution
- Détection automatique des problèmes
- Processus d''escalade défini
- Intervention administrative si nécessaire
- Suivi des résolutions

## Contrôle Qualité
- Vérification des rapports
- Validation des calculs
- Contrôle de conformité
- Audit des processus

## Communication
- Contact avec les clients
- Coordination avec les experts
- Notifications automatiques
- Suivi des échanges',
                'gestion-dossiers-clients-guide-admin',
                'Guide pour la supervision des dossiers clients',
                ARRAY['admin', 'clients', 'dossiers', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            ),
            (
                gen_random_uuid(), guide_admin_id,
                'Processus Métier - Guide Admin',
                '# Processus Métier - Guide Admin

## Vue d''ensemble
Guide pour la configuration et l''optimisation des processus métier.

## Workflows de Validation
- Configuration des étapes de validation
- Définition des règles métier
- Automatisation des processus
- Gestion des exceptions

## Règles de Gestion
- Configuration des critères d''éligibilité
- Définition des seuils et limites
- Gestion des cas particuliers
- Mise à jour des règles

## Automatisations
- Attribution automatique des dossiers
- Notifications automatiques
- Génération de rapports
- Alertes et rappels

## Optimisation
- Analyse des processus
- Identification des goulots d''étranglement
- Amélioration continue
- Mesure des performances

## Conformité
- Respect des réglementations
- Audit des processus
- Documentation des procédures
- Formation des équipes',
                'processus-metier-guide-admin',
                'Guide pour la configuration des processus métier',
                ARRAY['admin', 'processus', 'metier', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            ),
            (
                gen_random_uuid(), guide_admin_id,
                'Reporting et Analytics - Guide Admin',
                '# Reporting et Analytics - Guide Admin

## Vue d''ensemble
Guide pour l''utilisation des outils de reporting et d''analytics.

## KPIs et Métriques Clés
- Nombre total d''utilisateurs
- Dossiers en cours et terminés
- Taux de satisfaction client
- Performance des experts
- Revenus et compensations

## Rapports de Performance
- Rapports mensuels et trimestriels
- Analyse des tendances
- Comparaisons avec les objectifs
- Identification des améliorations

## Statistiques Détaillées
- Métriques par expert
- Performance par type de dossier
- Analyse de la satisfaction client
- Statistiques financières

## Export de Données
- Export en différents formats (PDF, Excel, CSV)
- Rapports personnalisables
- Données pour analyse externe
- Archivage des données

## Tableaux de Bord
- Dashboards personnalisables
- Métriques en temps réel
- Alertes automatiques
- Partage des rapports',
                'reporting-analytics-guide-admin',
                'Guide pour l''utilisation des outils de reporting',
                ARRAY['admin', 'reporting', 'analytics', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            ),
            (
                gen_random_uuid(), guide_admin_id,
                'Configuration Système - Guide Admin',
                '# Configuration Système - Guide Admin

## Vue d''ensemble
Guide pour la configuration et la maintenance du système.

## Paramètres Généraux
- Configuration de la plateforme
- Paramètres de sécurité
- Configuration des notifications
- Gestion des templates

## Gestion des Droits
- Création et modification des rôles
- Attribution des permissions
- Gestion des accès utilisateurs
- Audit des droits d''accès

## Maintenance
- Maintenance préventive
- Gestion des sauvegardes
- Mise à jour du système
- Résolution des incidents

## Sécurité
- Configuration des politiques de sécurité
- Gestion des certificats SSL
- Configuration des firewalls
- Monitoring de sécurité

## Performance
- Optimisation des performances
- Configuration du cache
- Gestion de la base de données
- Monitoring des ressources',
                'configuration-systeme-guide-admin',
                'Guide pour la configuration du système',
                ARRAY['admin', 'configuration', 'systeme', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            ),
            (
                gen_random_uuid(), guide_admin_id,
                'Gestion des Incidents - Guide Admin',
                '# Gestion des Incidents - Guide Admin

## Vue d''ensemble
Guide pour la gestion efficace des incidents système.

## Détection des Problèmes
- Monitoring automatique
- Alertes en temps réel
- Détection des anomalies
- Priorisation des incidents

## Processus de Résolution
- Procédures d''escalade
- Intervention administrative
- Communication avec les parties prenantes
- Suivi de la résolution

## Classification des Incidents
- **P0 - Critique** : Service indisponible
- **P1 - Haute** : Fonctionnalité majeure impactée
- **P2 - Moyenne** : Fonctionnalité mineure impactée
- **P3 - Basse** : Amélioration ou bug mineur

## Communication
- Templates de communication
- Notification des parties prenantes
- Mise à jour des statuts
- Post-mortem et analyse

## Prévention
- Analyse des causes racines
- Amélioration des processus
- Formation des équipes
- Mise en place de mesures préventives',
                'gestion-incidents-guide-admin',
                'Guide pour la gestion des incidents système',
                ARRAY['admin', 'incidents', 'gestion', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            );

        -- Articles FAQ (supplémentaires)
        INSERT INTO public.documentation_items (
            id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
        ) VALUES
            (
                gen_random_uuid(), faq_id,
                'FAQ Générale',
                '# FAQ Générale

## Questions Fréquentes

### Authentification
**Q : Comment récupérer mon mot de passe ?**
R : Utilisez la fonction "Mot de passe oublié" sur la page de connexion.

**Q : Comment activer l''authentification à deux facteurs ?**
R : Allez dans vos paramètres de sécurité et suivez les instructions.

### Utilisation de la Plateforme
**Q : Comment créer un nouveau dossier ?**
R : Cliquez sur "Nouveau dossier" dans votre espace personnel.

**Q : Comment contacter un expert ?**
R : Utilisez la messagerie intégrée dans l''espace de votre dossier.

**Q : Comment télécharger mes documents ?**
R : Allez dans l''onglet "Documents" et cliquez sur le bouton de téléchargement.

### Facturation
**Q : Comment consulter mes factures ?**
R : Accédez à l''onglet "Facturation" dans votre espace personnel.

**Q : Quels sont les modes de paiement acceptés ?**
R : Carte bancaire, virement bancaire, prélèvement automatique.

### Support
**Q : Comment contacter le support ?**
R : Utilisez le chat en ligne ou envoyez un email à support@financialtracker.fr

**Q : Quels sont les horaires du support ?**
R : Du lundi au vendredi, de 9h à 18h.',
                'faq-generale',
                'Questions fréquemment posées sur FinancialTracker',
                ARRAY['faq', 'general', 'support'],
                true,
                false,
                NULL,
                now(), now()
            ),
            (
                gen_random_uuid(), troubleshooting_id,
                'Résolution de Problèmes',
                '# Résolution de Problèmes

## Problèmes Courants et Solutions

### Problèmes de Connexion
**Problème : Impossible de se connecter**
- Vérifiez vos identifiants
- Videz le cache de votre navigateur
- Désactivez les extensions de navigateur
- Contactez le support si le problème persiste

**Problème : Session expirée**
- Reconnectez-vous avec vos identifiants
- Activez "Se souvenir de moi" pour éviter les déconnexions

### Problèmes de Performance
**Problème : Pages qui se chargent lentement**
- Vérifiez votre connexion internet
- Fermez les onglets inutiles
- Videz le cache de votre navigateur
- Contactez le support si le problème persiste

**Problème : Upload de fichiers qui échoue**
- Vérifiez la taille du fichier (max 10MB)
- Vérifiez le format du fichier
- Réessayez l''upload
- Contactez le support si le problème persiste

### Problèmes de Données
**Problème : Données manquantes**
- Actualisez la page
- Vérifiez vos permissions d''accès
- Contactez le support

**Problème : Erreurs de calcul**
- Vérifiez les données saisies
- Contactez votre expert
- Contactez le support si nécessaire

### Problèmes de Communication
**Problème : Messages non reçus**
- Vérifiez vos paramètres de notification
- Vérifiez votre dossier spam
- Contactez le support

**Problème : Impossible d''envoyer un message**
- Vérifiez votre connexion internet
- Réessayez l''envoi
- Contactez le support si le problème persiste',
                'resolution-problemes',
                'Guide de résolution des problèmes courants',
                ARRAY['troubleshooting', 'problemes', 'support'],
                true,
                false,
                NULL,
                now(), now()
            ),
            (
                gen_random_uuid(), tips_id,
                'Astuces et Bonnes Pratiques',
                '# Astuces et Bonnes Pratiques

## Optimisation de l''Utilisation

### Navigation
- Utilisez les raccourcis clavier pour naviguer plus rapidement
- Organisez vos favoris pour accéder rapidement aux pages importantes
- Utilisez la recherche pour trouver rapidement vos documents

### Gestion des Documents
- Nommez vos fichiers de manière claire et descriptive
- Organisez vos documents par dossiers
- Sauvegardez régulièrement vos documents importants
- Utilisez les tags pour catégoriser vos documents

### Communication
- Soyez précis dans vos messages
- Joignez les documents nécessaires
- Répondez dans les délais convenus
- Utilisez les notifications pour rester informé

### Sécurité
- Changez régulièrement votre mot de passe
- Activez l''authentification à deux facteurs
- Ne partagez jamais vos identifiants
- Déconnectez-vous après chaque session

### Performance
- Fermez les onglets inutiles
- Videz régulièrement le cache de votre navigateur
- Utilisez un navigateur à jour
- Évitez d''ouvrir trop d''onglets simultanément

### Support
- Consultez d''abord la FAQ
- Préparez les informations nécessaires avant de contacter le support
- Soyez patient et respectueux
- Donnez un feedback sur la qualité du support',
                'astuces-bonnes-pratiques',
                'Astuces et bonnes pratiques pour optimiser l''utilisation',
                ARRAY['tips', 'bonnes-pratiques', 'optimisation'],
                true,
                false,
                NULL,
                now(), now()
            );

        -- Articles Tutoriels Vidéo (supplémentaires)
        INSERT INTO public.documentation_items (
            id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
        ) VALUES
            (
                gen_random_uuid(), tutorials_id,
                'Tutoriels Vidéo d''Utilisation',
                '# Tutoriels Vidéo d''Utilisation

## Vue d''ensemble
Collection de tutoriels vidéo pour maîtriser FinancialTracker.

## Tutoriels Client
- **Création de compte et première connexion** (5 min)
- **Création et gestion de dossiers** (8 min)
- **Upload et organisation de documents** (6 min)
- **Communication avec les experts** (4 min)
- **Consultation des rapports** (7 min)
- **Gestion des factures** (5 min)

## Tutoriels Expert
- **Configuration du profil expert** (6 min)
- **Acceptation et gestion de missions** (8 min)
- **Production de rapports** (10 min)
- **Communication avec les clients** (5 min)
- **Suivi des compensations** (4 min)
- **Utilisation des outils d''audit** (12 min)

## Tutoriels Admin
- **Gestion des utilisateurs** (8 min)
- **Supervision des dossiers** (10 min)
- **Configuration des workflows** (12 min)
- **Génération de rapports** (6 min)
- **Gestion des incidents** (8 min)
- **Maintenance du système** (15 min)

## Bonnes Pratiques
- Regardez les tutoriels dans l''ordre recommandé
- Prenez des notes pendant les tutoriels
- Mettez en pause pour pratiquer
- Revenez aux tutoriels si nécessaire

## Support
- Contactez le support si vous avez des questions
- Demandez des tutoriels supplémentaires si nécessaire
- Donnez un feedback sur les tutoriels',
                'tutoriels-video-utilisation',
                'Collection de tutoriels vidéo pour maîtriser FinancialTracker',
                ARRAY['tutorials', 'video', 'formation'],
                true,
                false,
                NULL,
                now(), now()
            );

    END $$;

    -- ===== AJOUT DE TOUS LES DOCUMENTS SÉCURITÉ & CONFORMITÉ =====
    
    DO $$
    DECLARE
        gdpr_id UUID;
        audit_id UUID;
        incident_id UUID;
        compliance_id UUID;
        privacy_id UUID;
        security_incident_id UUID;
    BEGIN
        -- Récupérer les IDs des sous-catégories Sécurité & Conformité
        SELECT id INTO gdpr_id FROM public.documentation_categories WHERE name = 'Conformité RGPD';
        SELECT id INTO audit_id FROM public.documentation_categories WHERE name = 'Audit de Sécurité';
        SELECT id INTO incident_id FROM public.documentation_categories WHERE name = 'Incidents & Résolution';
        SELECT id INTO compliance_id FROM public.documentation_categories WHERE name = 'Conformité RGPD';
        SELECT id INTO privacy_id FROM public.documentation_categories WHERE name = 'Conformité RGPD';
        SELECT id INTO security_incident_id FROM public.documentation_categories WHERE name = 'Incidents & Résolution';

        -- Articles Conformité RGPD (supplémentaires)
        INSERT INTO public.documentation_items (
            id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
        ) VALUES
            (
                gen_random_uuid(), gdpr_id,
                'Guide Conformité RGPD Complet',
                '# Guide Conformité RGPD Complet

## Vue d''ensemble
Guide complet sur la conformité RGPD pour FinancialTracker.

## Principes Fondamentaux
- **Licéité** : Traitement basé sur une base légale
- **Loyauté** : Traitement transparent
- **Transparence** : Information claire des personnes
- **Finalité** : Objectif déterminé et légitime
- **Minimisation** : Données limitées au nécessaire
- **Exactitude** : Données exactes et à jour
- **Limitation de conservation** : Durée limitée
- **Intégrité et confidentialité** : Sécurité des données

## Droits des Personnes
- **Droit d''accès** : Accès aux données personnelles
- **Droit de rectification** : Correction des données inexactes
- **Droit à l''effacement** : Suppression des données
- **Droit à la portabilité** : Récupération des données
- **Droit d''opposition** : Opposition au traitement
- **Droit à la limitation** : Limitation du traitement

## Mesures Techniques
- Chiffrement des données sensibles
- Authentification multi-facteurs
- Journalisation des accès
- Sauvegarde sécurisée
- Tests de pénétration réguliers

## Mesures Organisationnelles
- Formation des employés
- Procédures de gestion des incidents
- Audit de conformité annuel
- Délégué à la protection des données (DPO)
- Registre des traitements

## Gestion des Violations
- Détection et notification
- Évaluation des risques
- Notification à la CNIL (si nécessaire)
- Communication aux personnes concernées
- Mesures correctives

## Documentation Requise
- Registre des traitements
- Politique de confidentialité
- Procédures de gestion des droits
- Plan de gestion des violations
- Rapports d''audit',
                'guide-conformite-rgpd-complet',
                'Guide complet sur la conformité RGPD',
                ARRAY['gdpr', 'conformite', 'privacy', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            ),
            (
                gen_random_uuid(), privacy_id,
                'Politique de Confidentialité',
                '# Politique de Confidentialité

## Vue d''ensemble
Politique de confidentialité de FinancialTracker.

## Collecte des Données
Nous collectons les données suivantes :
- **Données d''identification** : Nom, prénom, email
- **Données professionnelles** : Entreprise, fonction
- **Données de connexion** : Logs d''accès, adresse IP
- **Données de contenu** : Documents uploadés, messages
- **Données techniques** : Cookies, métriques d''utilisation

## Finalités du Traitement
- Fourniture des services FinancialTracker
- Gestion de la relation client
- Amélioration des services
- Conformité légale et réglementaire
- Sécurité et prévention des fraudes

## Base Légale
- **Exécution du contrat** : Fourniture des services
- **Obligation légale** : Conformité réglementaire
- **Intérêt légitime** : Amélioration des services, sécurité
- **Consentement** : Marketing (si applicable)

## Destinataires des Données
- Personnel FinancialTracker (accès limité)
- Experts assignés aux dossiers
- Prestataires techniques (sous-traitants)
- Autorités (si obligation légale)

## Durée de Conservation
- **Données de compte** : Durée du contrat + 3 ans
- **Données de connexion** : 12 mois
- **Documents clients** : Durée du contrat + 5 ans
- **Données de facturation** : 10 ans (obligation comptable)

## Vos Droits
- Accès, rectification, effacement
- Portabilité des données
- Opposition au traitement
- Limitation du traitement
- Retrait du consentement

## Sécurité
- Chiffrement des données
- Authentification sécurisée
- Sauvegarde régulière
- Tests de sécurité
- Formation du personnel

## Contact
Pour toute question sur vos données :
- Email : privacy@financialtracker.fr
- Adresse : [Adresse du siège social]
- DPO : dpo@financialtracker.fr',
                'politique-confidentialite',
                'Politique de confidentialité de FinancialTracker',
                ARRAY['privacy', 'confidentialite', 'gdpr'],
                true,
                false,
                NULL,
                now(), now()
            ),
            (
                gen_random_uuid(), compliance_id,
                'Procédures de Conformité',
                '# Procédures de Conformité

## Vue d''ensemble
Procédures de conformité réglementaire pour FinancialTracker.

## Conformité Financière
- Respect des réglementations bancaires
- Lutte contre le blanchiment d''argent
- Conformité comptable
- Audit financier annuel

## Conformité Technique
- Standards de sécurité informatique
- Normes de développement
- Tests de pénétration
- Certification des systèmes

## Conformité Métier
- Réglementation sectorielle
- Bonnes pratiques professionnelles
- Formation continue
- Contrôle qualité

## Procédures d''Audit
- Audit interne trimestriel
- Audit externe annuel
- Contrôles ponctuels
- Suivi des recommandations

## Gestion des Risques
- Identification des risques
- Évaluation et priorisation
- Mesures de mitigation
- Monitoring continu

## Reporting
- Rapports de conformité
- Alertes de non-conformité
- Escalade des problèmes
- Communication aux autorités

## Formation
- Formation initiale obligatoire
- Formation continue annuelle
- Tests de connaissance
- Certification des compétences

## Documentation
- Procédures documentées
- Registres de conformité
- Preuves d''audit
- Historique des incidents',
                'procedures-conformite',
                'Procédures de conformité réglementaire',
                ARRAY['compliance', 'procedures', 'reglementation', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            );

        -- Articles Audit de Sécurité (supplémentaires)
        INSERT INTO public.documentation_items (
            id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
        ) VALUES
            (
                gen_random_uuid(), audit_id,
                'Rapport d''Audit de Sécurité',
                '# Rapport d''Audit de Sécurité

## Vue d''ensemble
Rapport d''audit de sécurité de FinancialTracker.

## Méthodologie
- **Analyse de vulnérabilités** : Scan automatisé et manuel
- **Tests de pénétration** : Simulation d''attaques
- **Audit de code** : Revue de sécurité du code
- **Audit de configuration** : Vérification des paramètres
- **Tests d''intrusion** : Tentatives d''accès non autorisé

## Résultats de l''Audit
### Vulnérabilités Critiques
- Aucune vulnérabilité critique détectée
- Toutes les vulnérabilités connues ont été corrigées
- Système de mise à jour automatique en place

### Vulnérabilités Moyennes
- 2 vulnérabilités moyennes identifiées
- Plan de correction en cours
- Monitoring renforcé mis en place

### Vulnérabilités Faibles
- 5 vulnérabilités faibles détectées
- Corrections programmées
- Impact limité sur la sécurité

## Recommandations
- Renforcement de l''authentification
- Amélioration du monitoring
- Formation sécurité renforcée
- Tests de pénétration plus fréquents

## Plan d''Action
- Correction des vulnérabilités moyennes (30 jours)
- Mise en place des recommandations (60 jours)
- Audit de suivi (90 jours)
- Formation équipe (120 jours)

## Métriques de Sécurité
- **Score de sécurité** : 8.5/10
- **Temps de détection** : < 1 heure
- **Temps de réponse** : < 4 heures
- **Temps de résolution** : < 24 heures

## Conformité
- Conformité ISO 27001
- Conformité RGPD
- Conformité SOC 2
- Bonnes pratiques OWASP',
                'rapport-audit-securite',
                'Rapport d''audit de sécurité de FinancialTracker',
                ARRAY['audit', 'security', 'rapport', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            ),
            (
                gen_random_uuid(), audit_id,
                'Tests de Pénétration',
                '# Tests de Pénétration

## Vue d''ensemble
Guide sur les tests de pénétration de FinancialTracker.

## Types de Tests
- **Tests externes** : Attaques depuis l''internet
- **Tests internes** : Attaques depuis le réseau interne
- **Tests d''applications web** : Vulnérabilités web
- **Tests d''applications mobiles** : Vulnérabilités mobiles
- **Tests d''ingénierie sociale** : Manipulation humaine

## Méthodologie
1. **Reconnaissance** : Collecte d''informations
2. **Scanning** : Identification des vulnérabilités
3. **Gaining Access** : Tentative d''accès
4. **Maintaining Access** : Maintien de l''accès
5. **Covering Tracks** : Effacement des traces

## Outils Utilisés
- **Nmap** : Scan de ports et services
- **Burp Suite** : Tests d''applications web
- **Metasploit** : Exploitation de vulnérabilités
- **Wireshark** : Analyse de trafic réseau
- **OWASP ZAP** : Tests de sécurité web

## Résultats Typiques
- **Vulnérabilités d''injection** : SQL, XSS, CSRF
- **Vulnérabilités d''authentification** : Brute force, session
- **Vulnérabilités d''autorisation** : Élévation de privilèges
- **Vulnérabilités de configuration** : Services par défaut
- **Vulnérabilités de chiffrement** : Algorithmes faibles

## Bonnes Pratiques
- Tests réguliers (trimestriels)
- Tests après modifications majeures
- Documentation complète
- Formation des équipes
- Suivi des corrections

## Reporting
- Rapport détaillé des vulnérabilités
- Évaluation des risques
- Recommandations de correction
- Plan d''action priorisé
- Suivi des corrections',
                'tests-penetration',
                'Guide sur les tests de pénétration',
                ARRAY['penetration', 'tests', 'security', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            ),
            (
                gen_random_uuid(), audit_id,
                'Audit de Code Sécurisé',
                '# Audit de Code Sécurisé

## Vue d''ensemble
Guide sur l''audit de code sécurisé pour FinancialTracker.

## Méthodologie d''Audit
- **Analyse statique** : Revue du code source
- **Analyse dynamique** : Tests en exécution
- **Analyse manuelle** : Revue par experts
- **Analyse automatisée** : Outils de scan

## Vulnérabilités Recherchées
### Injection
- SQL Injection
- NoSQL Injection
- Command Injection
- LDAP Injection

### Authentification
- Weak Passwords
- Session Management
- Multi-factor Authentication
- Password Reset

### Autorisation
- Access Control
- Privilege Escalation
- Horizontal Access Control
- Vertical Access Control

### Validation
- Input Validation
- Output Encoding
- File Upload
- API Security

## Outils d''Audit
- **SonarQube** : Qualité et sécurité du code
- **OWASP Dependency Check** : Vulnérabilités des dépendances
- **Bandit** : Vulnérabilités Python
- **ESLint Security** : Vulnérabilités JavaScript
- **CodeQL** : Analyse de code GitHub

## Bonnes Pratiques
- Code review obligatoire
- Tests de sécurité automatisés
- Formation sécurité développeurs
- Documentation des vulnérabilités
- Suivi des corrections

## Métriques
- **Couverture de code** : > 80%
- **Vulnérabilités critiques** : 0
- **Vulnérabilités moyennes** : < 5
- **Temps de correction** : < 7 jours

## Intégration CI/CD
- Scan automatique à chaque commit
- Blocage en cas de vulnérabilité critique
- Rapport automatique
- Notification des équipes',
                'audit-code-securise',
                'Guide sur l''audit de code sécurisé',
                ARRAY['audit', 'code', 'security', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            );

        -- Articles Incidents & Résolution (supplémentaires)
        INSERT INTO public.documentation_items (
            id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
        ) VALUES
            (
                gen_random_uuid(), incident_id,
                'Gestion des Incidents de Sécurité',
                '# Gestion des Incidents de Sécurité

## Vue d''ensemble
Guide pour la gestion des incidents de sécurité.

## Classification des Incidents
### Niveau 1 - Mineur
- Tentative d''accès non autorisé échouée
- Spam ou phishing détecté
- Vulnérabilité mineure découverte

### Niveau 2 - Modéré
- Accès non autorisé réussi
- Données sensibles exposées
- Service temporairement indisponible

### Niveau 3 - Critique
- Violation de données personnelles
- Service complètement indisponible
- Compromission système majeure

### Niveau 4 - Catastrophique
- Violation massive de données
- Service indisponible prolongé
- Impact financier majeur

## Procédures de Réponse
1. **Détection** : Identification de l''incident
2. **Classification** : Évaluation de la gravité
3. **Containment** : Limitation de l''impact
4. **Éradication** : Suppression de la menace
5. **Recovery** : Restauration des services
6. **Lessons Learned** : Analyse post-incident

## Équipe de Réponse
- **Incident Commander** : Coordination générale
- **Technical Lead** : Expertise technique
- **Communications Lead** : Communication externe
- **Legal Lead** : Aspects juridiques
- **Business Lead** : Impact métier

## Communication
- **Interne** : Équipe technique et management
- **Clients** : Notification selon la gravité
- **Autorités** : CNIL, CERT, etc.
- **Médias** : Communication publique si nécessaire

## Documentation
- Rapport d''incident détaillé
- Timeline des événements
- Actions entreprises
- Impact évalué
- Mesures correctives

## Prévention
- Monitoring continu
- Formation des équipes
- Tests de réponse
- Mise à jour des procédures
- Amélioration continue',
                'gestion-incidents-securite',
                'Guide pour la gestion des incidents de sécurité',
                ARRAY['incidents', 'security', 'gestion', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            ),
            (
                gen_random_uuid(), security_incident_id,
                'Plan de Continuité d''Activité',
                '# Plan de Continuité d''Activité

## Vue d''ensemble
Plan de continuité d''activité pour FinancialTracker.

## Scénarios de Sinistre
- **Incendie** : Destruction des locaux
- **Cyberattaque** : Compromission système
- **Panne électrique** : Indisponibilité infrastructure
- **Pandémie** : Indisponibilité personnel
- **Catastrophe naturelle** : Inondation, tremblement de terre

## Objectifs de Récupération
- **RTO (Recovery Time Objective)** : 4 heures
- **RPO (Recovery Point Objective)** : 1 heure
- **MTO (Maximum Tolerable Outage)** : 8 heures

## Sites de Récupération
- **Site principal** : Paris, France
- **Site de secours** : Lyon, France
- **Site cloud** : AWS Europe

## Procédures de Récupération
### Infrastructure
- Activation du site de secours
- Restauration des sauvegardes
- Vérification des services
- Tests de connectivité

### Applications
- Déploiement des applications
- Restauration des données
- Tests fonctionnels
- Validation des performances

### Communication
- Notification des équipes
- Communication clients
- Mise à jour statut
- Coordination avec les partenaires

## Tests et Maintenance
- **Tests trimestriels** : Simulation de sinistre
- **Mise à jour annuelle** : Révision du plan
- **Formation continue** : Équipes de récupération
- **Audit externe** : Validation du plan

## Ressources Requises
- **Personnel** : Équipe de récupération dédiée
- **Infrastructure** : Serveurs de secours
- **Connectivité** : Réseaux redondants
- **Documentation** : Procédures détaillées

## Coordination
- **Crisis Management Team** : Direction générale
- **Technical Team** : IT et développement
- **Business Team** : Métier et clients
- **External Partners** : Fournisseurs et autorités',
                'plan-continuite-activite',
                'Plan de continuité d''activité pour FinancialTracker',
                ARRAY['continuite', 'activite', 'plan', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            );

    END $$;

    -- ===== AJOUT DE TOUS LES RAPPORTS & ANALYSES =====
    
    DO $$
    DECLARE
        perf_id UUID;
        business_id UUID;
        stats_id UUID;
        compliance_report_id UUID;
        kpi_id UUID;
        trend_id UUID;
    BEGIN
        -- Récupérer les IDs des sous-catégories Rapports & Analyses
        SELECT id INTO perf_id FROM public.documentation_categories WHERE name = 'Rapports de Performance';
        SELECT id INTO business_id FROM public.documentation_categories WHERE name = 'Analyses Métier';
        SELECT id INTO stats_id FROM public.documentation_categories WHERE name = 'Statistiques Utilisateurs';
        SELECT id INTO compliance_report_id FROM public.documentation_categories WHERE name = 'Rapports de Conformité';
        SELECT id INTO kpi_id FROM public.documentation_categories WHERE name = 'Rapports de Performance';
        SELECT id INTO trend_id FROM public.documentation_categories WHERE name = 'Analyses Métier';

        -- Articles Rapports de Performance (supplémentaires)
        INSERT INTO public.documentation_items (
            id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
        ) VALUES
            (
                gen_random_uuid(), perf_id,
                'Rapport de Performance Système',
                '# Rapport de Performance Système

## Vue d''ensemble
Rapport de performance système de FinancialTracker.

## Métriques de Performance
### Temps de Réponse
- **Page d''accueil** : 0.8s (objectif < 1s)
- **Connexion** : 1.2s (objectif < 2s)
- **Upload de documents** : 2.5s (objectif < 3s)
- **Génération de rapports** : 5.8s (objectif < 10s)

### Disponibilité
- **Uptime mensuel** : 99.95% (objectif > 99.9%)
- **Temps d''arrêt planifié** : 0.02% (objectif < 0.1%)
- **Temps d''arrêt non planifié** : 0.03% (objectif < 0.05%)

### Capacité
- **Utilisateurs simultanés** : 500 (objectif 1000)
- **Requêtes par seconde** : 150 (objectif 300)
- **Stockage utilisé** : 75% (objectif < 80%)

## Analyse des Tendances
### Évolution Mensuelle
- **Janvier** : Performance stable
- **Février** : Amélioration de 15%
- **Mars** : Légère dégradation (-5%)
- **Avril** : Retour à la normale

### Facteurs d''Influence
- **Trafic utilisateur** : +25% ce mois
- **Nouveaux modules** : Impact minimal
- **Optimisations** : Amélioration de 10%
- **Maintenance** : Impact contrôlé

## Recommandations
### Court Terme (1 mois)
- Optimisation des requêtes de base de données
- Mise en cache des données fréquemment consultées
- Compression des images et documents

### Moyen Terme (3 mois)
- Migration vers une architecture microservices
- Implémentation d''un CDN
- Optimisation du frontend

### Long Terme (6 mois)
- Migration vers le cloud
- Implémentation de l''auto-scaling
- Nouvelle architecture de base de données

## Monitoring
- **Alertes automatiques** : Seuils configurés
- **Dashboards temps réel** : Métriques clés
- **Rapports quotidiens** : Résumé des performances
- **Analyses hebdomadaires** : Tendances et anomalies

## Plan d''Action
- **Semaine 1-2** : Analyse détaillée des goulots d''étranglement
- **Semaine 3-4** : Implémentation des optimisations prioritaires
- **Mois 2** : Tests de charge et validation
- **Mois 3** : Déploiement en production et monitoring',
                'rapport-performance-systeme',
                'Rapport de performance système de FinancialTracker',
                ARRAY['performance', 'systeme', 'rapport', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            ),
            (
                gen_random_uuid(), kpi_id,
                'KPIs et Métriques Clés',
                '# KPIs et Métriques Clés

## Vue d''ensemble
Indicateurs clés de performance pour FinancialTracker.

## KPIs Métier
### Acquisition
- **Nouveaux clients** : 150/mois (objectif 200)
- **Taux de conversion** : 12% (objectif 15%)
- **Coût d''acquisition** : 250€ (objectif 200€)
- **Temps de conversion** : 15 jours (objectif 10)

### Rétention
- **Taux de rétention** : 85% (objectif 90%)
- **Churn mensuel** : 8% (objectif < 5%)
- **Durée de vie client** : 18 mois (objectif 24)
- **Taux de réactivation** : 25% (objectif 30%)

### Satisfaction
- **NPS (Net Promoter Score)** : 65 (objectif 70)
- **Satisfaction client** : 4.2/5 (objectif 4.5)
- **Temps de résolution** : 4h (objectif 2h)
- **Taux de résolution** : 95% (objectif 98%)

## KPIs Techniques
### Performance
- **Temps de chargement** : 1.2s (objectif < 1s)
- **Disponibilité** : 99.95% (objectif > 99.9%)
- **Erreurs 500** : 0.1% (objectif < 0.05%)
- **Temps de réponse API** : 200ms (objectif < 150ms)

### Qualité
- **Bugs critiques** : 0 (objectif 0)
- **Bugs majeurs** : 2 (objectif < 5)
- **Couverture de tests** : 85% (objectif > 80%)
- **Temps de déploiement** : 30min (objectif < 20min)

## KPIs Financiers
### Revenus
- **MRR (Monthly Recurring Revenue)** : 50k€ (objectif 75k€)
- **ARR (Annual Recurring Revenue)** : 600k€ (objectif 900k€)
- **Croissance mensuelle** : 8% (objectif 12%)
- **LTV (Lifetime Value)** : 3000€ (objectif 4000€)

### Rentabilité
- **Marge brute** : 75% (objectif 80%)
- **CAC (Customer Acquisition Cost)** : 250€ (objectif 200€)
- **LTV/CAC ratio** : 12:1 (objectif 15:1)
- **Burn rate** : 15k€/mois (objectif < 10k€)

## Tableaux de Bord
### Executive Dashboard
- Vue d''ensemble des KPIs principaux
- Alertes automatiques sur les seuils
- Tendances et prévisions
- Actions prioritaires

### Operational Dashboard
- Métriques détaillées par équipe
- Performance en temps réel
- Analyse des incidents
- Planification des actions

## Reporting
- **Rapport quotidien** : KPIs critiques
- **Rapport hebdomadaire** : Analyse des tendances
- **Rapport mensuel** : Vue d''ensemble complète
- **Rapport trimestriel** : Analyse stratégique',
                'kpis-metriques-cles',
                'Indicateurs clés de performance pour FinancialTracker',
                ARRAY['kpis', 'metriques', 'performance', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            );

        -- Articles Analyses Métier (supplémentaires)
        INSERT INTO public.documentation_items (
            id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
        ) VALUES
            (
                gen_random_uuid(), business_id,
                'Analyse Métier Complète',
                '# Analyse Métier Complète

## Vue d''ensemble
Analyse métier complète de FinancialTracker.

## Marché et Concurrence
### Taille du Marché
- **Marché total adressable** : 2.5M€
- **Marché accessible** : 500k€
- **Part de marché actuelle** : 2% (objectif 10%)
- **Croissance du marché** : 15%/an

### Analyse Concurrentielle
- **Concurrents directs** : 5 principaux
- **Avantages concurrentiels** : Technologie, service client
- **Points de différenciation** : Simplicité, rapidité, expertise
- **Menaces** : Entrée de nouveaux acteurs

## Segmentation Client
### Clients B2B
- **PME** : 60% du chiffre d''affaires
- **Grandes entreprises** : 30% du chiffre d''affaires
- **Startups** : 10% du chiffre d''affaires

### Profils Clients
- **Dirigeants** : Décideurs principaux
- **Comptables** : Utilisateurs quotidiens
- **Experts-comptables** : Partenaires
- **Consultants** : Utilisateurs avancés

## Produits et Services
### Produits Principaux
- **Audit énergétique** : 40% des revenus
- **Simulation financière** : 35% des revenus
- **Conseil expert** : 20% des revenus
- **Formation** : 5% des revenus

### Évolution des Produits
- **Nouveaux produits** : 3 en développement
- **Améliorations** : 15 fonctionnalités par trimestre
- **Retrait** : 2 produits obsolètes
- **Pivot** : 1 produit en transformation

## Canaux de Distribution
### Canaux Directs
- **Site web** : 70% des ventes
- **Téléphone** : 20% des ventes
- **Email** : 10% des ventes

### Canaux Indirects
- **Partenaires** : 30% des nouveaux clients
- **Réseaux sociaux** : 15% du trafic
- **SEO/SEA** : 25% des conversions
- **Événements** : 10% des prospects

## Modèle Économique
### Sources de Revenus
- **Abonnements** : 60% des revenus
- **Services ponctuels** : 30% des revenus
- **Formation** : 5% des revenus
- **Partenariats** : 5% des revenus

### Structure des Coûts
- **Développement** : 40% des coûts
- **Marketing** : 25% des coûts
- **Support client** : 20% des coûts
- **Administration** : 15% des coûts

## Risques et Opportunités
### Risques Identifiés
- **Réglementation** : Changements fréquents
- **Technologie** : Obsolescence rapide
- **Concurrence** : Intensification
- **Économique** : Récession possible

### Opportunités
- **Expansion internationale** : Marchés européens
- **Nouveaux produits** : IA/ML, blockchain
- **Partenariats** : Intégrations tierces
- **Acquisitions** : Consolidation du marché

## Recommandations Stratégiques
### Court Terme (6 mois)
- Amélioration de l''expérience utilisateur
- Renforcement de l''équipe commerciale
- Développement de nouveaux produits
- Optimisation des processus

### Moyen Terme (1-2 ans)
- Expansion géographique
- Développement de partenariats
- Innovation technologique
- Préparation à la levée de fonds

### Long Terme (3-5 ans)
- Leadership du marché
- Diversification des activités
- Internationalisation
- Exit stratégique',
                'analyse-metier-complete',
                'Analyse métier complète de FinancialTracker',
                ARRAY['analyse', 'metier', 'strategie', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            ),
            (
                gen_random_uuid(), trend_id,
                'Analyse des Tendances',
                '# Analyse des Tendances

## Vue d''ensemble
Analyse des tendances du marché et de l''industrie.

## Tendances Technologiques
### Intelligence Artificielle
- **Adoption croissante** : +40% par an
- **Applications** : Automatisation, prédiction, personnalisation
- **Impact sur FinancialTracker** : Opportunité d''innovation
- **Investissements** : 2.5M€ dans le secteur

### Cloud Computing
- **Migration continue** : 85% des entreprises
- **Avantages** : Scalabilité, coûts, sécurité
- **Risques** : Dépendance, sécurité
- **Impact** : Transformation des modèles économiques

### Blockchain
- **Adoption émergente** : 15% des entreprises
- **Applications** : Traçabilité, contrats intelligents
- **Potentiel** : Disruption des processus traditionnels
- **Timeline** : 3-5 ans pour l''adoption massive

## Tendances Réglementaires
### RGPD et Protection des Données
- **Évolution continue** : Nouvelles réglementations
- **Impact** : Renforcement de la conformité
- **Opportunités** : Services de conseil
- **Risques** : Sanctions financières

### Conformité Financière
- **Réglementations bancaires** : Renforcement
- **Lutte anti-blanchiment** : Nouvelles obligations
- **Reporting** : Transparence accrue
- **Impact** : Coûts de conformité

### Développement Durable
- **Réglementations environnementales** : Renforcement
- **Reporting ESG** : Obligations croissantes
- **Investissements verts** : Croissance rapide
- **Opportunités** : Services spécialisés

## Tendances Métier
### Digitalisation
- **Transformation digitale** : Accélération post-Covid
- **Télétravail** : Nouvelle norme
- **Collaboration à distance** : Outils spécialisés
- **Impact** : Nouveaux besoins clients

### Personnalisation
- **Expérience client** : Personnalisation poussée
- **Données** : Exploitation avancée
- **IA** : Recommandations intelligentes
- **Avantage concurrentiel** : Différenciation

### Durabilité
- **ESG** : Critères d''investissement
- **Reporting** : Obligations réglementaires
- **Consommation responsable** : Nouveaux comportements
- **Opportunités** : Services spécialisés

## Tendances Consommateurs
### Comportements d''Achat
- **En ligne** : Croissance continue
- **Mobile** : Prédominance
- **Social commerce** : Émergence
- **Impact** : Adaptation des canaux

### Attentes Clients
- **Simplicité** : Expérience fluide
- **Rapidité** : Réponse immédiate
- **Transparence** : Information claire
- **Personnalisation** : Service sur mesure

### Valeurs
- **Durabilité** : Conscience environnementale
- **Éthique** : Responsabilité sociale
- **Transparence** : Confiance
- **Impact** : Choix d''achat

## Implications pour FinancialTracker
### Opportunités
- **Nouveaux marchés** : Expansion géographique
- **Nouveaux produits** : Innovation technologique
- **Nouveaux clients** : Segments émergents
- **Nouveaux partenariats** : Écosystème

### Menaces
- **Nouveaux concurrents** : Entrée de nouveaux acteurs
- **Changements réglementaires** : Coûts de conformité
- **Évolution technologique** : Obsolescence
- **Changements de comportement** : Adaptation nécessaire

### Actions Recommandées
- **Innovation** : Investissement R&D
- **Adaptation** : Évolution des produits
- **Formation** : Compétences nouvelles
- **Partenariats** : Écosystème élargi

## Prévisions
### Court Terme (1 an)
- **Croissance du marché** : +15%
- **Adoption technologique** : +25%
- **Réglementations** : +10 nouvelles
- **Concurrence** : +5 nouveaux acteurs

### Moyen Terme (3 ans)
- **Transformation digitale** : 90% des entreprises
- **IA généralisée** : 60% des processus
- **Durabilité** : Critère principal
- **Personnalisation** : Standard du marché

### Long Terme (5 ans)
- **Automatisation** : 80% des tâches
- **Durabilité** : Obligation réglementaire
- **Innovation** : Différenciation clé
- **Collaboration** : Modèle dominant',
                'analyse-tendances',
                'Analyse des tendances du marché et de l''industrie',
                ARRAY['tendances', 'marche', 'analyse', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            );

        -- Articles Statistiques Utilisateurs (supplémentaires)
        INSERT INTO public.documentation_items (
            id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
        ) VALUES
            (
                gen_random_uuid(), stats_id,
                'Statistiques Utilisateurs Détaillées',
                '# Statistiques Utilisateurs Détaillées

## Vue d''ensemble
Statistiques détaillées des utilisateurs FinancialTracker.

## Démographie des Utilisateurs
### Répartition par Âge
- **18-25 ans** : 5% des utilisateurs
- **26-35 ans** : 25% des utilisateurs
- **36-45 ans** : 40% des utilisateurs
- **46-55 ans** : 20% des utilisateurs
- **55+ ans** : 10% des utilisateurs

### Répartition par Genre
- **Hommes** : 65% des utilisateurs
- **Femmes** : 35% des utilisateurs

### Répartition Géographique
- **Île-de-France** : 35% des utilisateurs
- **Auvergne-Rhône-Alpes** : 20% des utilisateurs
- **Occitanie** : 15% des utilisateurs
- **Nouvelle-Aquitaine** : 10% des utilisateurs
- **Autres régions** : 20% des utilisateurs

## Comportements d''Utilisation
### Fréquence d''Utilisation
- **Utilisateurs quotidiens** : 45% (objectif 60%)
- **Utilisateurs hebdomadaires** : 30% (objectif 25%)
- **Utilisateurs mensuels** : 20% (objectif 10%)
- **Utilisateurs inactifs** : 5% (objectif 5%)

### Temps de Session
- **Session moyenne** : 12 minutes (objectif 15)
- **Session médiane** : 8 minutes
- **Sessions longues (>30min)** : 15% des sessions
- **Sessions courtes (<5min)** : 25% des sessions

### Pages Consultées
- **Page d''accueil** : 40% des visites
- **Dashboard** : 25% des visites
- **Documents** : 20% des visites
- **Support** : 10% des visites
- **Autres** : 5% des visites

## Engagement
### Métriques d''Engagement
- **Taux de rétention** : 85% (objectif 90%)
- **Temps passé** : 45 minutes/semaine (objectif 60)
- **Actions par session** : 8 (objectif 10)
- **Pages par session** : 6 (objectif 8)

### Conversion
- **Visiteurs vers inscrits** : 12% (objectif 15%)
- **Inscrits vers clients** : 25% (objectif 30%)
- **Clients vers payants** : 60% (objectif 70%)
- **Taux de conversion global** : 1.8% (objectif 2.5%)

## Satisfaction
### Scores de Satisfaction
- **Satisfaction globale** : 4.2/5 (objectif 4.5)
- **Facilité d''utilisation** : 4.0/5 (objectif 4.3)
- **Qualité du service** : 4.3/5 (objectif 4.5)
- **Support client** : 4.1/5 (objectif 4.4)

### NPS (Net Promoter Score)
- **Score global** : 65 (objectif 70)
- **Promoteurs** : 70% (objectif 75%)
- **Passifs** : 20% (objectif 15%)
- **Détracteurs** : 10% (objectif 10%)

## Support et Assistance
### Demandes de Support
- **Tickets par mois** : 150 (objectif < 100)
- **Temps de résolution** : 4h (objectif 2h)
- **Taux de résolution** : 95% (objectif 98%)
- **Satisfaction support** : 4.1/5 (objectif 4.4)

### Types de Demandes
- **Problèmes techniques** : 40% des demandes
- **Questions d''utilisation** : 30% des demandes
- **Demandes de fonctionnalités** : 20% des demandes
- **Problèmes de facturation** : 10% des demandes

## Évolution Temporelle
### Croissance Mensuelle
- **Janvier** : +15% d''utilisateurs
- **Février** : +12% d''utilisateurs
- **Mars** : +18% d''utilisateurs
- **Avril** : +10% d''utilisateurs

### Saisonnalité
- **Périodes de pointe** : Janvier, Septembre
- **Périodes creuses** : Juillet, Août
- **Facteurs** : Exercice fiscal, rentrée

## Recommandations
### Amélioration de l''Engagement
- Personnalisation de l''expérience
- Gamification des fonctionnalités
- Notifications intelligentes
- Formation utilisateurs

### Amélioration de la Conversion
- Optimisation du parcours utilisateur
- A/B testing des pages clés
- Amélioration du support
- Programmes de fidélisation

### Amélioration de la Satisfaction
- Formation des équipes support
- Amélioration de l''interface
- Ajout de fonctionnalités demandées
- Communication proactive',
                'statistiques-utilisateurs-detaillees',
                'Statistiques détaillées des utilisateurs FinancialTracker',
                ARRAY['statistiques', 'utilisateurs', 'analyse', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            );

        -- Articles Rapports de Conformité (supplémentaires)
        INSERT INTO public.documentation_items (
            id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
        ) VALUES
            (
                gen_random_uuid(), compliance_report_id,
                'Rapport de Conformité Réglementaire',
                '# Rapport de Conformité Réglementaire

## Vue d''ensemble
Rapport de conformité réglementaire de FinancialTracker.

## Conformité RGPD
### Principes Respectés
- ✅ **Licéité** : Base légale documentée
- ✅ **Loyauté** : Traitement transparent
- ✅ **Transparence** : Information claire
- ✅ **Finalité** : Objectifs déterminés
- ✅ **Minimisation** : Données limitées
- ✅ **Exactitude** : Données à jour
- ✅ **Limitation** : Durée limitée
- ✅ **Intégrité** : Sécurité assurée

### Droits des Personnes
- **Demandes d''accès** : 25 traitées (100% dans les délais)
- **Demandes de rectification** : 15 traitées (100% dans les délais)
- **Demandes d''effacement** : 8 traitées (100% dans les délais)
- **Demandes de portabilité** : 5 traitées (100% dans les délais)
- **Demandes d''opposition** : 3 traitées (100% dans les délais)

### Violations de Données
- **Incidents détectés** : 0 (objectif 0)
- **Notifications CNIL** : 0 (objectif 0)
- **Notifications personnes** : 0 (objectif 0)
- **Mesures correctives** : N/A

## Conformité Financière
### Lutte Anti-Blanchiment
- **Clients vérifiés** : 100% (obligation légale)
- **Suspicions déclarées** : 0 (objectif 0)
- **Formation équipe** : 100% (obligation légale)
- **Audit externe** : Conforme (obligation légale)

### Conformité Comptable
- **Comptabilité** : Conforme aux normes françaises
- **Audit externe** : Annuel, sans réserve
- **Contrôles internes** : Trimestriels, conformes
- **Reporting** : Mensuel, conforme

## Conformité Technique
### Standards de Sécurité
- **ISO 27001** : Certification en cours
- **OWASP Top 10** : Conformité 100%
- **Tests de pénétration** : Trimestriels, conformes
- **Audit de code** : Continu, conforme

### Sauvegarde et Récupération
- **Sauvegardes** : Quotidiennes, testées
- **Récupération** : Tests mensuels, conformes
- **Chiffrement** : 100% des données sensibles
- **Accès** : Contrôlé et audité

## Conformité Métier
### Réglementation Sectorielle
- **Autorisations** : Toutes obtenues
- **Agréments** : Tous valides
- **Assurances** : Couverture complète
- **Garanties** : Conformes

### Bonnes Pratiques
- **Formation continue** : 100% du personnel
- **Contrôle qualité** : Processus documentés
- **Gestion des risques** : Évaluation continue
- **Amélioration continue** : Processus en place

## Audit et Contrôles
### Audit Interne
- **Fréquence** : Trimestrielle
- **Couverture** : 100% des processus
- **Résultats** : Conformes
- **Actions** : Toutes traitées

### Audit Externe
- **Fréquence** : Annuelle
- **Organisme** : Cabinet certifié
- **Résultats** : Conformes
- **Recommandations** : Toutes implémentées

### Contrôles Réglementaires
- **CNIL** : Contrôle en 2023, conforme
- **ACPR** : Contrôle en 2023, conforme
- **DGFiP** : Contrôle en 2023, conforme
- **URSSAF** : Contrôle en 2023, conforme

## Incidents et Résolution
### Incidents de Conformité
- **Incidents détectés** : 0 (objectif 0)
- **Temps de détection** : N/A
- **Temps de résolution** : N/A
- **Mesures préventives** : En place

### Améliorations
- **Processus** : Amélioration continue
- **Formation** : Renforcement annuel
- **Technologie** : Mise à jour continue
- **Documentation** : Mise à jour continue

## Plan d''Action
### Court Terme (3 mois)
- Finalisation certification ISO 27001
- Renforcement formation équipe
- Amélioration monitoring
- Mise à jour documentation

### Moyen Terme (6 mois)
- Extension certification
- Nouveaux contrôles
- Amélioration processus
- Formation continue

### Long Terme (1 an)
- Leadership conformité
- Innovation réglementaire
- Excellence opérationnelle
- Reconnaissance sectorielle

## Conclusion
FinancialTracker maintient un niveau de conformité élevé avec toutes les réglementations applicables. Les processus de contrôle et d''amélioration continue garantissent la pérennité de cette conformité.',
                'rapport-conformite-reglementaire',
                'Rapport de conformité réglementaire de FinancialTracker',
                ARRAY['conformite', 'reglementaire', 'rapport', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            );

    END $$;

    -- ===== AJOUT MAINTENANCE & EXPLOITATION =====
    
    DO $$
    DECLARE
        maintenance_id UUID;
        monitoring_id UUID;
        incident_id UUID;
        backup_id UUID;
    BEGIN
        -- Récupérer les IDs des sous-catégories Maintenance & Exploitation
        SELECT id INTO maintenance_id FROM public.documentation_categories WHERE name = 'Maintenance Préventive';
        SELECT id INTO monitoring_id FROM public.documentation_categories WHERE name = 'Monitoring & Alertes';
        SELECT id INTO incident_id FROM public.documentation_categories WHERE name = 'Gestion des Incidents';
        SELECT id INTO backup_id FROM public.documentation_categories WHERE name = 'Sauvegarde & Restauration';

        -- Articles Maintenance Préventive
        INSERT INTO public.documentation_items (
            id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
        ) VALUES
            (
                gen_random_uuid(), maintenance_id,
                'Maintenance Préventive - Guide Complet',
                '# Maintenance Préventive - Guide Complet

## Vue d''ensemble
Guide complet sur la maintenance préventive de FinancialTracker.

## Tâches Quotidiennes
- Vérification des sauvegardes
- Monitoring des performances
- Contrôle des logs d''erreur
- Vérification de la disponibilité

## Tâches Hebdomadaires
- Analyse des métriques de performance
- Nettoyage des logs anciens
- Vérification des certificats SSL
- Test des procédures de récupération

## Tâches Mensuelles
- Audit de sécurité
- Mise à jour des dépendances
- Optimisation de la base de données
- Revue des configurations

## Scripts Automatisés
- Sauvegarde automatique
- Monitoring des services
- Nettoyage des données temporaires
- Génération de rapports

## Planification
- Calendrier de maintenance
- Fenêtres de maintenance
- Communication aux utilisateurs
- Procédures de rollback',
                'maintenance-preventive-guide-complet',
                'Guide complet sur la maintenance préventive',
                ARRAY['maintenance', 'preventive', 'guide', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            );

        -- Articles Monitoring & Alertes
        INSERT INTO public.documentation_items (
            id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
        ) VALUES
            (
                gen_random_uuid(), monitoring_id,
                'Configuration Monitoring et Alertes',
                '# Configuration Monitoring et Alertes

## Vue d''ensemble
Configuration du monitoring et des alertes pour FinancialTracker.

## Métriques Surveillées
- **Performance** : Temps de réponse, CPU, mémoire
- **Disponibilité** : Uptime, temps d''arrêt
- **Sécurité** : Tentatives d''intrusion, anomalies
- **Métier** : Transactions, utilisateurs actifs

## Seuils d''Alerte
- **Critique** : Action immédiate requise
- **Important** : Action dans les 4 heures
- **Moyen** : Action dans les 24 heures
- **Faible** : Surveillance renforcée

## Canaux d''Alerte
- **Email** : Notifications détaillées
- **SMS** : Alertes critiques uniquement
- **Slack** : Notifications équipe
- **Dashboard** : Vue temps réel

## Escalade
- **Niveau 1** : Équipe technique
- **Niveau 2** : Lead technique
- **Niveau 3** : Management
- **Niveau 4** : Direction',
                'configuration-monitoring-alertes',
                'Configuration du monitoring et des alertes',
                ARRAY['monitoring', 'alertes', 'configuration', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            );

    END $$;

    -- ===== AJOUT PROCÉDURES OPÉRATIONNELLES =====
    
    DO $$
    DECLARE
        system_id UUID;
        business_id UUID;
        security_id UUID;
    BEGIN
        -- Récupérer les IDs des sous-catégories Procédures Opérationnelles
        SELECT id INTO system_id FROM public.documentation_categories WHERE name = 'Procédures Système';
        SELECT id INTO business_id FROM public.documentation_categories WHERE name = 'Procédures Métier';
        SELECT id INTO security_id FROM public.documentation_categories WHERE name = 'Procédures de Sécurité';

        -- Articles Procédures Système
        INSERT INTO public.documentation_items (
            id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
        ) VALUES
            (
                gen_random_uuid(), system_id,
                'Procédures de Déploiement',
                '# Procédures de Déploiement

## Vue d''ensemble
Procédures de déploiement pour FinancialTracker.

## Préparation
- Tests complets en environnement de staging
- Validation des changements par l''équipe
- Préparation du plan de rollback
- Communication aux utilisateurs

## Déploiement
- Sauvegarde de l''environnement de production
- Déploiement par phases
- Tests de validation post-déploiement
- Monitoring des performances

## Rollback
- Détection des problèmes
- Activation du plan de rollback
- Restauration de l''état précédent
- Communication d''incident

## Validation
- Tests fonctionnels
- Tests de performance
- Vérification des métriques
- Validation par les utilisateurs clés',
                'procedures-deploiement',
                'Procédures de déploiement pour FinancialTracker',
                ARRAY['deploiement', 'procedures', 'systeme', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            ),
            (
                gen_random_uuid(), system_id,
                'Procédures de Configuration',
                '# Procédures de Configuration

## Vue d''ensemble
Procédures de configuration système pour FinancialTracker.

## Environnements
- **Development** : Configuration locale
- **Staging** : Configuration de test
- **Production** : Configuration finale

## Paramètres
- Variables d''environnement
- Configuration de la base de données
- Paramètres de sécurité
- Configuration des services

## Validation
- Tests de configuration
- Vérification des paramètres
- Validation par l''équipe
- Documentation des changements

## Maintenance
- Mise à jour des configurations
- Sauvegarde des paramètres
- Audit des configurations
- Formation des équipes',
                'procedures-configuration',
                'Procédures de configuration système',
                ARRAY['configuration', 'procedures', 'systeme', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            );

        -- Articles Procédures Métier
        INSERT INTO public.documentation_items (
            id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
        ) VALUES
            (
                gen_random_uuid(), business_id,
                'Procédures de Validation',
                '# Procédures de Validation

## Vue d''ensemble
Procédures de validation métier pour FinancialTracker.

## Validation des Dossiers
- Vérification de la complétude
- Contrôle de la conformité
- Validation des calculs
- Approbation finale

## Validation des Experts
- Vérification des qualifications
- Contrôle des références
- Validation des compétences
- Approbation administrative

## Validation des Rapports
- Contrôle qualité
- Vérification des données
- Validation des conclusions
- Approbation technique

## Escalade
- Détection des anomalies
- Notification des responsables
- Intervention administrative
- Résolution et suivi',
                'procedures-validation',
                'Procédures de validation métier',
                ARRAY['validation', 'procedures', 'metier', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            );

        -- Articles Procédures de Sécurité
        INSERT INTO public.documentation_items (
            id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
        ) VALUES
            (
                gen_random_uuid(), security_id,
                'Procédures d''Authentification',
                '# Procédures d''Authentification

## Vue d''ensemble
Procédures d''authentification sécurisée pour FinancialTracker.

## Authentification Utilisateur
- Création de compte sécurisé
- Validation d''email obligatoire
- Politique de mots de passe forts
- Authentification multi-facteurs

## Gestion des Sessions
- Durée de session limitée
- Déconnexion automatique
- Gestion des tokens
- Protection contre les attaques

## Récupération de Compte
- Procédure de réinitialisation
- Vérification d''identité
- Notification de sécurité
- Audit des accès

## Monitoring
- Détection des anomalies
- Alertes de sécurité
- Audit des connexions
- Blocage automatique',
                'procedures-authentification',
                'Procédures d''authentification sécurisée',
                ARRAY['authentification', 'securite', 'procedures', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            );

    END $$;

    -- ===== AJOUT DOCUMENTATION SPÉCIALISÉE =====
    
    DO $$
    DECLARE
        integration_id UUID;
        modules_id UUID;
        formation_id UUID;
    BEGIN
        -- Récupérer les IDs des sous-catégories Documentation Spécialisée
        SELECT id INTO integration_id FROM public.documentation_categories WHERE name = 'Intégrations Externes';
        SELECT id INTO modules_id FROM public.documentation_categories WHERE name = 'Modules Spécialisés';
        SELECT id INTO formation_id FROM public.documentation_categories WHERE name = 'Formation & Support';

        -- Articles Intégrations Externes
        INSERT INTO public.documentation_items (
            id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
        ) VALUES
            (
                gen_random_uuid(), integration_id,
                'Intégrations Externes - Guide Complet',
                '# Intégrations Externes - Guide Complet

## Vue d''ensemble
Guide complet sur les intégrations externes de FinancialTracker.

## Intégrations Comptables
- **Sage** : Synchronisation automatique
- **Cegid** : Import/export des données
- **FEC** : Fichier des écritures comptables
- **API bancaires** : Récupération des relevés

## Intégrations Réglementaires
- **DGFiP** : Déclaration automatique
- **URSSAF** : Télédéclaration
- **CNIL** : Reporting de conformité
- **ACPR** : Reporting financier

## Intégrations Métier
- **CRM** : Synchronisation clients
- **ERP** : Intégration données
- **Outils de facturation** : Génération automatique
- **Plateformes de paiement** : Sécurisation

## Configuration
- Paramètres d''authentification
- Mapping des données
- Tests de connectivité
- Monitoring des intégrations

## Sécurité
- Chiffrement des échanges
- Authentification sécurisée
- Audit des accès
- Gestion des erreurs',
                'integrations-externes-guide-complet',
                'Guide complet sur les intégrations externes',
                ARRAY['integrations', 'externes', 'guide', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            );

        -- Articles Modules Spécialisés
        INSERT INTO public.documentation_items (
            id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
        ) VALUES
            (
                gen_random_uuid(), modules_id,
                'Simulateur TICPE - Guide Expert',
                '# Simulateur TICPE - Guide Expert

## Vue d''ensemble
Guide expert sur le simulateur TICPE de FinancialTracker.

## Fonctionnalités
- **Calcul automatique** : TICPE selon la réglementation
- **Simulations multiples** : Comparaison de scénarios
- **Export des résultats** : Rapports détaillés
- **Historique** : Suivi des évolutions

## Utilisation
- Saisie des données véhicule
- Configuration des paramètres
- Lancement des simulations
- Analyse des résultats

## Réglementation
- Textes de référence
- Évolutions réglementaires
- Cas particuliers
- Jurisprudence

## Support
- FAQ spécialisée
- Exemples pratiques
- Formation utilisateurs
- Support technique',
                'simulateur-ticpe-guide-expert',
                'Guide expert sur le simulateur TICPE',
                ARRAY['simulateur', 'ticpe', 'expert', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            ),
            (
                gen_random_uuid(), modules_id,
                'GED - Gestion Électronique des Documents',
                '# GED - Gestion Électronique des Documents

## Vue d''ensemble
Guide sur la Gestion Électronique des Documents.

## Fonctionnalités
- **Stockage sécurisé** : Documents chiffrés
- **Indexation** : Recherche avancée
- **Workflow** : Validation documentaire
- **Archivage** : Conservation légale

## Organisation
- Arborescence documentaire
- Métadonnées obligatoires
- Tags et catégories
- Versions et historique

## Sécurité
- Contrôle d''accès
- Audit des consultations
- Sauvegarde automatique
- Chiffrement des données

## Conformité
- Durée de conservation
- Formats acceptés
- Traçabilité
- Archivage légal',
                'ged-gestion-electronique-documents',
                'Guide sur la Gestion Électronique des Documents',
                ARRAY['ged', 'documents', 'gestion', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            );

        -- Articles Formation & Support
        INSERT INTO public.documentation_items (
            id, category_id, title, content, slug, meta_description, tags, is_published, is_featured, author_id, created_at, updated_at
        ) VALUES
            (
                gen_random_uuid(), formation_id,
                'Programme de Formation',
                '# Programme de Formation

## Vue d''ensemble
Programme de formation complet pour FinancialTracker.

## Formation Initiale
- **Nouveaux utilisateurs** : 2 jours
- **Administrateurs** : 3 jours
- **Experts** : 1 jour spécialisé
- **Support** : 2 jours techniques

## Formation Continue
- **Mises à jour** : 1 jour par trimestre
- **Nouvelles fonctionnalités** : 0.5 jour
- **Bonnes pratiques** : 0.5 jour par mois
- **Certification** : Renouvellement annuel

## Modules Spécialisés
- **Sécurité** : 1 jour obligatoire
- **Conformité** : 0.5 jour par an
- **Performance** : 0.5 jour par an
- **Support** : 1 jour par an

## Méthodes
- **Présentiel** : Formation en salle
- **Distanciel** : Webinaires
- **E-learning** : Modules en ligne
- **Pratique** : Exercices guidés

## Évaluation
- **Tests de connaissance** : Obligatoires
- **Certification** : Validation des compétences
- **Suivi** : Évaluation continue
- **Amélioration** : Feedback utilisateurs',
                'programme-formation',
                'Programme de formation complet pour FinancialTracker',
                ARRAY['formation', 'programme', 'apprentissage', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            ),
            (
                gen_random_uuid(), formation_id,
                'Support Technique',
                '# Support Technique

## Vue d''ensemble
Guide sur le support technique de FinancialTracker.

## Canaux de Support
- **Chat en ligne** : Support immédiat
- **Email** : Support détaillé
- **Téléphone** : Support urgent
- **Ticket** : Suivi des demandes

## Niveaux de Support
- **Niveau 1** : Questions générales
- **Niveau 2** : Problèmes techniques
- **Niveau 3** : Problèmes complexes
- **Niveau 4** : Développement

## SLA (Service Level Agreement)
- **Réponse** : 2h pour les urgences
- **Résolution** : 24h pour les problèmes critiques
- **Suivi** : Communication régulière
- **Escalade** : Si nécessaire

## Ressources
- **Base de connaissances** : Articles détaillés
- **Vidéos tutorielles** : Guides visuels
- **FAQ** : Questions fréquentes
- **Communauté** : Forum utilisateurs

## Amélioration
- **Feedback** : Évaluation du support
- **Formation** : Équipe support
- **Outils** : Amélioration continue
- **Processus** : Optimisation',
                'support-technique',
                'Guide sur le support technique',
                ARRAY['support', 'technique', 'assistance', 'admin'],
                true,
                false,
                NULL,
                now(), now()
            );

    END $$;

-- ===== 3. GESTION DES PERMISSIONS =====

-- Les permissions sont gérées via les politiques RLS (Row Level Security) 
-- définies dans les migrations de création des tables.
-- 
-- ACCÈS PAR RÔLE - DOCUMENTATION GÉNÉRALE :
-- - Admin : Accès complet à toute la documentation
-- - Client : Accès aux guides utilisateur + workflows clients uniquement
-- - Expert : Accès aux guides utilisateur + workflows experts uniquement
-- - Documentation Technique, Sécurité & Conformité, Rapports & Analyses : Admin uniquement
--
-- ACCÈS PAR RÔLE - DOCUMENTS MÉTIER :
-- - Client : Accès à TOUS ses propres documents (dossiers, rapports, fichiers)
-- - Expert : Accès à TOUS les documents de ses missions assignées
-- - Admin : Accès à TOUS les documents de la plateforme
--
-- SÉCURITÉ :
-- - Tous les utilisateurs doivent être authentifiés
-- - Pas d'accès public sans authentification
-- - Les politiques RLS filtrent l'accès selon le rôle utilisateur

-- Exemple de politique RLS pour la documentation (déjà définie dans les migrations) :
-- CREATE POLICY "Anyone can view published documentation" ON public.documentation_items
--     FOR SELECT USING (is_published = true);
--
-- CREATE POLICY "Admins can view all documentation" ON public.documentation_items
--     FOR SELECT USING (
--         EXISTS (
--             SELECT 1 FROM public."Admin" 
--             WHERE "Admin".email = (SELECT email FROM auth.users WHERE id = auth.uid())
--         )
--     );

-- Exemple de politique RLS pour les documents métier (DocumentFile) :
-- CREATE POLICY "Users can view their own documents" ON DocumentFile
--     FOR SELECT USING (
--         auth.uid()::text = client_id::text OR
--         auth.uid()::text = expert_id::text OR
--         auth.jwt() ->> 'role' = 'admin'
--     );

-- Pour implémenter les permissions par rôle, vous devrez ajouter des politiques RLS
-- spécifiques basées sur le rôle utilisateur dans auth.jwt() ->> 'role'
-- ou via une table de mapping utilisateur/rôle.

-- ===== 4. VÉRIFICATION DE L'ORGANISATION =====

-- Afficher la structure de l'espace documentaire
SELECT 
    'Structure de l''espace documentaire créée avec succès' as status,
    COUNT(*) as total_categories
FROM public.documentation_categories;

-- Afficher les catégories par statut
SELECT 
    is_active as "Actif",
    COUNT(*) as "Nombre de catégories"
FROM public.documentation_categories
GROUP BY is_active
ORDER BY is_active;

-- Afficher les articles par catégorie
SELECT 
    dc.name as "Catégorie",
    dc.is_active as "Actif",
    COUNT(di.id) as "Nombre d'articles"
FROM public.documentation_categories dc
LEFT JOIN public.documentation_items di ON dc.id = di.category_id
GROUP BY dc.id, dc.name, dc.is_active
ORDER BY dc.name;

-- Afficher les articles publiés
SELECT 
    di.title as "Titre",
    dc.name as "Catégorie",
    di.is_published as "Publié",
    di.is_featured as "Mis en avant",
    di.view_count as "Vues"
FROM public.documentation_items di
JOIN public.documentation_categories dc ON di.category_id = dc.id
WHERE di.is_published = true
ORDER BY di.is_featured DESC, di.view_count DESC; 