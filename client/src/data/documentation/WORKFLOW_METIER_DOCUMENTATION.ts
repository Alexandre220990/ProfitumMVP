/**
 * DOCUMENTATION DES WORKFLOWS MÉTIERS
 * 
 * Cette documentation décrit les processus métiers implémentés dans l'application Profitum
 * pour optimiser la conversion client et l'expérience utilisateur.
 * 
 * Version: 1.0
 * Date: 2024-01-03
 * Auteur: Équipe Profitum
 */

export const WORKFLOW_METIER_DOCUMENTATION = { title: "Workflows Métiers - Profitum, ", version: "1.0, ", lastUpdate: "2024-01-03, ", overview: {
    description: "Documentation complète des workflows métiers implémentés dans l'application Profitum pour optimiser la conversion client et l'expérience utilisateur., ", objectives: [
      "Optimiser la conversion client, ", "Simplifier l'expérience utilisateur", "Standardiser les processus par produit", "Faciliter l'accompagnement client"
    ] },

  workflows: { productWorkflow: {
      name: "Workflow Produit (ProductProcessWorkflow), ", description: "Processus détaillé pour les pages produits individuelles avec présélection d'experts, ", steps: [
        {
          id: 0, title: "Simulation validée, ", description: "Votre produit est éligible, ", status: "completed, ", actions: [], notes: "Étape automatique après validation de la simulation" },
        { id: 1, title: "Signature de la charte, ", description: "Accepter les conditions d'engagement, ", status: "active, ", actions: ["Signer la charte"], notes: "Modal de signature avec conditions d'engagement spécifiques au produit" },
        { id: 2, title: "Sélection d'expert, ", description: "Choisir un expert qualifié, ", status: "pending, ", actions: ["Présélection Top 3, ", "Voir tous les experts"], notes: "Présélection immédiate après signature chart, e, Top 3 experts recommandés" },
        { id: 3, title: "Complétion du dossier, ", description: "Remplir les informations nécessaires, ", status: "pending, ", actions: ["Compléter le dossier"], notes: "Redirection vers le dossier client pour finalisation" },
        { id: 4, title: "Validation administrative, ", description: "Vérification et approbation, ", status: "pending, ", actions: ["En attente"], notes: "Validation spécifique selon le produit (URSSA, F, TICPE, CEE, etc.)" },
        { id: 5, title: "Dossier finalisé, ", description: "Mission accomplie, ", status: "pending, ", actions: [], notes: "Étape final, e, dossier traité avec succès" }
      ],

      productSpecifics: { URSSAF: {
          validationTitle: "Validation URSSAF, ", productDescription: "Récupération de vos cotisations URSSAF, ", charteConditions: [
            "Audit complet de vos cotisations URSSAF, ", "Détection et récupération des trop-perçus", "Accompagnement juridique sécurisé", "Commission uniquement sur les montants récupérés", "Engagement sans frais préalables"
          ] },
        TICPE: { validationTitle: "Validation TICPE, ", productDescription: "Récupération de votre taxe TICPE, ", charteConditions: [
            "Audit complet de votre consommation carburant, ", "Récupération des trop-perçus TICPE", "Accompagnement juridique sécurisé", "Commission uniquement sur les montants récupérés", "Engagement sans frais préalables"
          ] },
        DFS: { validationTitle: "Validation DFS, ", productDescription: "Déclaration fiscale simplifiée, ", charteConditions: [
            "Analyse de votre situation fiscale, ", "Calcul optimisé de votre DFS", "Récupération des déductions forfaitaires", "Commission uniquement sur les montants récupérés", "Engagement sans frais préalables"
          ] },
        CEE: { validationTitle: "Validation CEE, ", productDescription: "Certificats d'économies d'énergie, ", charteConditions: [
            "Audit énergétique complet, ", "Optimisation des certificats CEE", "Accompagnement technique sécurisé", "Commission uniquement sur les gains réalisés", "Engagement sans frais préalables"
          ] }
      }
    },

    marketplaceWorkflow: { name: "Workflow Marketplace (MarketplaceSimplified), ", description: "Marketplace épurée avec sections par produit et gestion de signature charte, ", features: [
        "Design simple avec sections par produit éligible, ", "Gestion de la signature charte au clic sur expert", "Interface claire et conversion optimisée", "Cartes compactes d'experts avec informations essentielles"
      ], flow: {
        step1: "Affichage des produits éligibles du client, ", step2: "Clic sur expert → Vérification charte signée, ", step3: "Si charte non signée → Modal de signature, ", step4: "Si charte signée → Accès direct à l'expert, ", step5: "Assignation d'expert et passage à l'étape suivante" },

      expertDisplay: { informations: [
          "Nom de l'expert, ", "Note (étoiles)", "Commission (%)", "Localisation", "Spécialisations (Top 2 + compteur)"
        ], actions: [
          "Sélectionner l'expert, ", "Voir tous les experts (si plus de 6)"
        ] }
    }
  },

  conversionOptimization: { strategies: [
      {
        name: "Présélection immédiate, ", description: "Affichage Top 3 experts après signature charte, ", impact: "Réduction du temps de décisio, n, augmentation du taux de conversion" },
      { name: "Signature charte contextuelle, ", description: "Modal de signature au moment du besoin, ", impact: "Meilleure compréhension des enjeu, x, engagement plus fort" },
      { name: "Processus simplifié, ", description: "Étapes claires et actions directes, ", impact: "Réduction de l'abando, n, expérience utilisateur fluide" },
      { name: "Personnalisation par produit, ", description: "Libellés et descriptions adaptés à chaque produit, ", impact: "Pertinence accru, e, confiance client renforcée" }
    ],

    metrics: { conversionRate: "Objectif: +25% de taux de conversion, ", timeToExpert: "Objectif: -50% du temps jusqu'à l'assignation d'expert, ", userSatisfaction: "Objectif: +30% de satisfaction utilisateur, ", abandonmentRate: "Objectif: -40% de taux d'abandon" }
  },

  technicalImplementation: { components: {
      ProductProcessWorkflow: {
        location: "client/src/components/ProductProcessWorkflow.tsx, ", features: [
          "Étapes personnalisées selon le produit, ", "Présélection d'experts après signature charte", "Interactions directes (signature, sélection, assignation)", "Gestion des états en temps réel"
        ] },
      MarketplaceSimplified: { location: "client/src/components/MarketplaceSimplified.tsx, ", features: [
          "Design simple avec sections par produit, ", "Gestion de la signature charte au clic sur expert", "Interface claire et conversion optimisée"
        ] }
    },

    dataFlow: { authentication: "Vérification client via useAuth, ", dataLoading: "Chargement des produits éligibles via API, ", stateManagement: "Gestion des états avec useState et useEffect, ", apiIntegration: "Appels API pour signature charte et assignation expert" }
  },

  userExperience: { flowOptimization: {
      pageProduit: "Signature charte → Présélection expert (Top 3) → Assignation directe, ", marketplace: "Sections par produit → Clic expert → Signature si nécessaire → Assignation, ", shortcuts: "Possibilité d'aller directement en marketplace depuis page produit" },

    responsiveDesign: { mobile: "Adaptation parfaite mobile/tablette, ", desktop: "Interface optimisée pour écrans larges, ", animations: "Transitions fluides et micro-animations" },

    accessibility: { navigation: "Breadcrumb et boutons de retour, ", feedback: "Toasts de confirmation et messages d'erreur, ", loading: "Indicateurs de chargement et états de transition" }
  },

  maintenance: { updates: [
      "Ajout de nouveaux produits dans productSpecifics, ", "Modification des étapes selon les besoins métier", "Optimisation des libellés et descriptions", "A/B testing des flows de conversion"
    ], monitoring: [
      "Suivi des taux de conversion par produit, ", "Analyse des points d'abandon", "Mesure de la satisfaction utilisateur", "Performance des composants"
    ] },

  futureEnhancements: { planned: [
      "Intégration de recommandations IA pour les experts, ", "Workflow adaptatif selon le profil client", "Notifications push pour les étapes importantes", "Intégration avec CRM pour suivi client"
    ], research: [
      "A/B testing avancé des workflows, ", "Analyse comportementale des utilisateurs", "Optimisation continue basée sur les données", "Personnalisation dynamique des expériences"
    ] }
};

export default WORKFLOW_METIER_DOCUMENTATION; 