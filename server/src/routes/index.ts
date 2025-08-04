import { Router } from "express";
import authRoutes from "./auth";
import auditRoutes from "./audits";
import simulationRoutes from "./simulationRoutes";
import partnerRoutes from "./partners";
import produitsEligiblesRoutes from "./produits-eligibles";
import specializationsRoutes from "./specializations";
import expertsRoutes from "./experts";
import expertRoutes from "./expert";
import expertDemoRequestRoutes from "./expert/demo-request";
import adminRoutes from "./admin";
import monitoringRoutes from "./monitoring";
import testsRoutes from "./tests";
import terminalTestsRoutes from "./terminal-tests";
import documentsRoutes from "./documents";
import clientDocumentsRoutes from "./client-documents";
import dossiersRoutes from "./dossiers";
import workflowRoutes from "./documents/workflow";
import remindersRoutes from "./reminders";
import simulatorRoutes from "./simulator";
import notificationsRoutes from "./notifications";
import calendarRoutes from "./calendar";

import unifiedMessagingRoutes from "./unified-messaging";
import { enhancedAuthMiddleware, requireUserType } from "../middleware/auth-enhanced";
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

// Routes d'authentification
router.use('/auth', authRoutes);

// Routes des audits
router.use('/audits', auditRoutes);

// Routes des simulations
router.use('/simulations', enhancedAuthMiddleware, simulationRoutes);

// Routes des partenaires
router.use('/partners', partnerRoutes);

// Routes des produits éligibles
router.use('/produits-eligibles', produitsEligiblesRoutes);

// Routes des spécialisations
router.use('/specializations', specializationsRoutes);

// Routes des experts
router.use('/experts', expertsRoutes);

// Routes expert (profil, analytics, business, etc.)
router.use('/expert', expertRoutes);

// Routes des demandes de démo expert
router.use('/expert/demo-request', expertDemoRequestRoutes);

// Routes des documents (GED)
router.use('/documents', documentsRoutes);

// Routes des documents client (sans préfixe api car déjà dans /api)
router.use('/client-documents', clientDocumentsRoutes);

// Routes des dossiers
router.use('/dossiers', dossiersRoutes);

// Routes du workflow
router.use('/workflow', workflowRoutes);

// Routes des relances
router.use('/reminders', remindersRoutes);

// Routes du simulateur d'éligibilité
router.use('/simulator', simulatorRoutes);

// Routes des notifications
router.use('/notifications', notificationsRoutes);

// Routes du calendrier
router.use('/calendar', enhancedAuthMiddleware, calendarRoutes);

// Routes de messagerie unifiée
router.use('/messaging', unifiedMessagingRoutes);

// Routes pour les images statiques
router.get('/avatar.png', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Avatar placeholder',
    data: {
      url: '/images/avatar-placeholder.png',
      alt: 'Avatar utilisateur'
    }
  });
});

router.get('/profitum_logo_texte.png', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Logo Profitum',
    data: {
      url: '/images/profitum-logo.png',
      alt: 'Logo Profitum'
    }
  });
});

// Routes de monitoring (admin uniquement)
router.use("/monitoring", enhancedAuthMiddleware, requireUserType('admin'), monitoringRoutes);

// Routes des tests (admin uniquement)
router.use('/tests', enhancedAuthMiddleware, requireUserType('admin'), testsRoutes);

// Routes des tests terminaux (admin uniquement)
router.use('/terminal-tests', enhancedAuthMiddleware, requireUserType('admin'), terminalTestsRoutes);

// Routes de documentation COMPLÈTEMENT INDÉPENDANTES
router.get('/documentation/categories', (req, res) => {
  console.log('📚 Route /documentation/categories appelée');
  
  const categories = [
    {
      id: 'general',
      name: 'Général',
      description: 'Documentation générale du projet',
      icon: '📋',
      color: 'bg-blue-500',
      items: [
        {
          id: 'readme',
          title: 'README.md',
          category: 'general',
          description: 'Documentation principale du projet FinancialTracker',
          content: '<h1>FinancialTracker - Documentation</h1><p>Plateforme SaaS complète de gestion financière et d\'audit.</p><h2>Fonctionnalités principales</h2><ul><li>Gestion des clients</li><li>Espace experts</li><li>Sécurité et conformité</li><li>Analytics et reporting</li></ul>',
          filePath: 'docs/README.md',
          lastModified: new Date(),
          tags: ['documentation', 'principal', 'vue-ensemble'],
          readTime: 3
        }
      ]
    },
    {
      id: 'security',
      name: 'Sécurité',
      description: 'Politiques de sécurité et conformité ISO',
      icon: '🔒',
      color: 'bg-red-500',
      items: [
        {
          id: 'security-md',
          title: 'SECURITY.md',
          category: 'security',
          description: 'Politique de sécurité du projet',
          content: '<h1>Politique de Sécurité - FinancialTracker</h1><h2>Principes de sécurité</h2><ul><li>Authentification renforcée</li><li>Protection des données</li><li>Audit et monitoring</li></ul><h2>Conformité</h2><ul><li>ISO 27001</li><li>RGPD</li></ul>',
          filePath: 'docs/SECURITY.md',
          lastModified: new Date(),
          tags: ['sécurité', 'iso', 'rgpd', 'conformité'],
          readTime: 4
        }
      ]
    },
    {
      id: 'tests',
      name: 'Tests',
      description: 'Guides de tests et résolution de problèmes',
      icon: '🧪',
      color: 'bg-green-500',
      items: [
        {
          id: 'guide-tests',
          title: 'GUIDE-TESTS.md',
          category: 'tests',
          description: 'Guide complet des tests du projet',
          content: '<h1>Guide des Tests - FinancialTracker</h1><h2>Tests automatisés</h2><ul><li>Tests unitaires</li><li>Tests d\'intégration</li><li>Tests de performance</li></ul><h2>Outils de test</h2><ul><li>Jest</li><li>Cypress</li><li>React Testing Library</li></ul>',
          filePath: 'docs/GUIDE-TESTS.md',
          lastModified: new Date(),
          tags: ['tests', 'guide', 'qualité', 'automation'],
          readTime: 5
        }
      ]
    }
  ];

  return res.json({
    success: true,
    data: categories
  });
});

router.get('/documentation/stats', (req, res) => {
  console.log('📊 Route /documentation/stats appelée');
  
  return res.json({
    success: true,
    data: {
      totalDocuments: 3,
      categories: {
        general: 1,
        security: 1,
        tests: 1
      },
      lastUpdate: new Date()
    }
  });
});

router.get('/documentation/document/:id', (req, res) => {
  const { id } = req.params;
  console.log('📄 Route /documentation/document/:id appelée avec id:', id);
  
  // Données statiques des documents
  const documents = {
    'readme': {
      id: 'readme',
      title: 'README.md',
      category: 'general',
      description: 'Documentation principale du projet FinancialTracker',
      content: '<h1>FinancialTracker - Documentation</h1><p>Plateforme SaaS complète de gestion financière et d\'audit, conçue pour les entreprises et les experts-comptables.</p><h2>Fonctionnalités principales</h2><h3>🏢 Gestion des clients</h3><ul><li>Inscription et authentification sécurisée</li><li>Profils d\'entreprise détaillés</li><li>Tableau de bord personnalisé</li><li>Gestion des dossiers et projets</li></ul><h3>👨‍💼 Espace experts</h3><ul><li>Validation et approbation des comptes</li><li>Attribution automatique des dossiers</li><li>Outils d\'audit et de reporting</li><li>Communication client/expert</li></ul>',
      filePath: 'docs/README.md',
      lastModified: new Date(),
      tags: ['documentation', 'principal', 'vue-ensemble'],
      readTime: 3
    },
    'security-md': {
      id: 'security-md',
      title: 'SECURITY.md',
      category: 'security',
      description: 'Politique de sécurité du projet',
      content: '<h1>Politique de Sécurité - FinancialTracker</h1><h2>Principes de sécurité</h2><h3>🔒 Authentification renforcée</h3><ul><li>Tokens JWT sécurisés avec expiration</li><li>Validation multi-facteurs</li><li>Sessions sécurisées</li><li>Protection contre les attaques par force brute</li></ul><h3>🛡️ Protection des données</h3><ul><li>Chiffrement AES-256 pour les données sensibles</li><li>Politiques RLS (Row Level Security) sur Supabase</li><li>Isolation des données par utilisateur</li><li>Sauvegarde chiffrée</li></ul>',
      filePath: 'docs/SECURITY.md',
      lastModified: new Date(),
      tags: ['sécurité', 'iso', 'rgpd', 'conformité'],
      readTime: 4
    },
    'guide-tests': {
      id: 'guide-tests',
      title: 'GUIDE-TESTS.md',
      category: 'tests',
      description: 'Guide complet des tests du projet',
      content: '<h1>Guide des Tests - FinancialTracker</h1><h2>Tests automatisés</h2><h3>🧪 Tests unitaires</h3><ul><li>Tests des composants React</li><li>Tests des services backend</li><li>Tests des utilitaires</li><li>Couverture de code > 80%</li></ul><h3>🔄 Tests d\'intégration</h3><ul><li>Tests API REST</li><li>Tests de base de données</li><li>Tests d\'authentification</li><li>Tests de workflow</li></ul>',
      filePath: 'docs/GUIDE-TESTS.md',
      lastModified: new Date(),
      tags: ['tests', 'guide', 'qualité', 'automation'],
      readTime: 5
    }
  };

  const document = documents[id as keyof typeof documents];
  if (!document) {
    return res.status(404).json({
      success: false,
      error: 'Document non trouvé'
    });
  }

  return res.json({
    success: true,
    data: document
  });
});

router.get('/documentation/search', (req, res) => {
  const { q } = req.query;
  console.log('🔍 Route /documentation/search appelée avec query:', q);
  
  if (!q || typeof q !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Paramètre de recherche requis'
    });
  }

  // Recherche dans les documents statiques
  const allDocuments = [
    {
      id: 'readme',
      title: 'README.md',
      category: 'general',
      description: 'Documentation principale du projet FinancialTracker',
      content: 'FinancialTracker plateforme SaaS gestion financière audit',
      tags: ['documentation', 'principal', 'vue-ensemble']
    },
    {
      id: 'security-md',
      title: 'SECURITY.md',
      category: 'security',
      description: 'Politique de sécurité du projet',
      content: 'Politique sécurité authentification protection données ISO RGPD',
      tags: ['sécurité', 'iso', 'rgpd', 'conformité']
    },
    {
      id: 'guide-tests',
      title: 'GUIDE-TESTS.md',
      category: 'tests',
      description: 'Guide complet des tests du projet',
      content: 'Guide tests automatisés unitaires intégration performance',
      tags: ['tests', 'guide', 'qualité', 'automation']
    }
  ];

  const lowerQuery = q.toLowerCase();
  const results = allDocuments.filter(doc => 
    doc.title.toLowerCase().includes(lowerQuery) ||
    doc.description.toLowerCase().includes(lowerQuery) ||
    doc.content.toLowerCase().includes(lowerQuery) ||
    doc.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );

  return res.json({
    success: true,
    data: results
  });
});

// Route de healthcheck pour Railway
router.get('/health', (req, res) => {
  return res.json({
    success: true,
    message: 'API Profitum opérationnelle',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes administrateur
router.use('/admin', enhancedAuthMiddleware, adminRoutes);

export default router; 