import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Génère le manifest PWA selon le type d'utilisateur
 * 
 * Types supportés :
 * - client -> "Profitum Client"
 * - expert -> "Profitum Expert"
 * - apporteur -> "Profitum Sales"
 * - admin -> "Profitum Admin"
 * - par défaut -> "Profitum Client"
 * 
 * Note: L'authentification est optionnelle - si l'utilisateur n'est pas authentifié,
 * on utilise "client" par défaut
 */
router.get('/manifest', (req: Request, res: Response) => {
  try {
    // Essayer de récupérer le type d'utilisateur depuis l'authentification (si disponible)
    // Sinon, utiliser "client" par défaut
    let userType = 'client';
    
    // Essayer d'utiliser le middleware d'authentification de manière optionnelle
    // Si l'utilisateur est authentifié, utiliser son type
    if ((req as any).user?.type) {
      userType = (req as any).user.type;
    } else {
      // Si pas d'authentification, essayer de récupérer depuis le paramètre de requête
      const queryType = req.query.userType as string;
      if (queryType && ['client', 'expert', 'apporteur', 'admin'].includes(queryType)) {
        userType = queryType;
      }
    }
    
    // Définir le nom de l'app selon le type d'utilisateur
    let appName: string;
    let shortName: string;
    let description: string;
    let startUrl: string;
    let themeColor: string;

    switch (userType) {
      case 'client':
        appName = 'Profitum Client';
        shortName = 'Profitum Client';
        description = 'Application Profitum - Espace client';
        startUrl = '/';
        themeColor = '#2563eb';
        break;
      case 'expert':
        appName = 'Profitum Expert';
        shortName = 'Profitum Expert';
        description = 'Application Profitum - Espace expert';
        startUrl = '/';
        themeColor = '#2563eb';
        break;
      case 'apporteur':
        appName = 'Profitum Sales';
        shortName = 'Profitum Sales';
        description = 'Application Profitum - Espace apporteur d\'affaires';
        startUrl = '/';
        themeColor = '#2563eb';
        break;
      case 'admin':
        appName = 'Profitum Admin';
        shortName = 'Profitum Admin';
        description = 'Application Profitum - Accès administrateur sécurisé';
        startUrl = '/admin-redirect';
        themeColor = '#9333ea';
        break;
      default:
        appName = 'Profitum Client';
        shortName = 'Profitum Client';
        description = 'Application Profitum - Espace client';
        startUrl = '/';
        themeColor = '#2563eb';
    }

    // Manifest PWA standard
    const manifest = {
      name: appName,
      short_name: shortName,
      description: description,
      start_url: startUrl,
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: themeColor,
      orientation: 'portrait-primary',
      scope: '/',
      lang: 'fr',
      dir: 'ltr',
      categories: ['business', 'finance', 'productivity'],
      icons: [
        {
          src: '/images/icon-72x72.png',
          sizes: '72x72',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/images/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/images/icon-128x128.png',
          sizes: '128x128',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/images/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/images/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/images/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/images/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/images/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ],
      shortcuts: [
        {
          name: 'Dashboard',
          short_name: 'Dashboard',
          description: 'Accéder au dashboard principal',
          url: '/dashboard',
          icons: [
            {
              src: '/images/dashboard-icon.png',
              sizes: '96x96'
            }
          ]
        },
        {
          name: 'Messagerie',
          short_name: 'Messages',
          description: 'Accéder à la messagerie',
          url: '/messagerie',
          icons: [
            {
              src: '/images/message-icon.png',
              sizes: '96x96'
            }
          ]
        },
        {
          name: 'Documents',
          short_name: 'Docs',
          description: 'Gérer les documents',
          url: '/documents',
          icons: [
            {
              src: '/images/document-icon.png',
              sizes: '96x96'
            }
          ]
        }
      ],
      screenshots: [
        {
          src: '/images/screenshot-desktop.png',
          sizes: '1280x720',
          type: 'image/png',
          form_factor: 'wide',
          label: 'Dashboard principal sur desktop'
        },
        {
          src: '/images/screenshot-mobile.png',
          sizes: '390x844',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Interface mobile'
        }
      ],
      related_applications: [],
      prefer_related_applications: false,
      share_target: {
        action: '/share',
        method: 'GET',
        params: {
          title: 'title',
          text: 'text',
          url: 'url'
        }
      },
      edge_side_panel: {
        preferred_width: 400
      },
      launch_handler: {
        client_mode: 'navigate-existing'
      },
      handle_links: 'preferred',
      protocol_handlers: [
        {
          protocol: 'web+profitum',
          url: '/?action=%s'
        }
      ]
    };

    // Retourner le manifest avec les headers appropriés
    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.json(manifest);
  } catch (error) {
    console.error('Erreur lors de la génération du manifest:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du manifest'
    });
  }
});

/**
 * Endpoint alternatif qui accepte le type d'utilisateur en paramètre
 * Utile pour les cas où l'authentification n'est pas encore disponible
 */
router.get('/manifest/:userType', (req: Request, res: Response) => {
  try {
    const userType = req.params.userType as 'client' | 'expert' | 'apporteur' | 'admin';
    
    // Valider le type d'utilisateur
    const validTypes = ['client', 'expert', 'apporteur', 'admin'];
    if (!validTypes.includes(userType)) {
      return res.status(400).json({
        success: false,
        error: 'Type d\'utilisateur invalide'
      });
    }

    // Définir le nom de l'app selon le type d'utilisateur
    let appName: string;
    let shortName: string;
    let description: string;
    let startUrl: string;
    let themeColor: string;

    switch (userType) {
      case 'client':
        appName = 'Profitum Client';
        shortName = 'Profitum Client';
        description = 'Application Profitum - Espace client';
        startUrl = '/';
        themeColor = '#2563eb';
        break;
      case 'expert':
        appName = 'Profitum Expert';
        shortName = 'Profitum Expert';
        description = 'Application Profitum - Espace expert';
        startUrl = '/';
        themeColor = '#2563eb';
        break;
      case 'apporteur':
        appName = 'Profitum Sales';
        shortName = 'Profitum Sales';
        description = 'Application Profitum - Espace apporteur d\'affaires';
        startUrl = '/';
        themeColor = '#2563eb';
        break;
      case 'admin':
        appName = 'Profitum Admin';
        shortName = 'Profitum Admin';
        description = 'Application Profitum - Accès administrateur sécurisé';
        startUrl = '/admin-redirect';
        themeColor = '#9333ea';
        break;
      default:
        // Ce cas ne devrait jamais être atteint car on valide le type avant
        appName = 'Profitum Client';
        shortName = 'Profitum Client';
        description = 'Application Profitum - Espace client';
        startUrl = '/';
        themeColor = '#2563eb';
        break;
    }

    // Manifest PWA standard (même structure que ci-dessus)
    const manifest = {
      name: appName,
      short_name: shortName,
      description: description,
      start_url: startUrl,
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: themeColor,
      orientation: 'portrait-primary',
      scope: '/',
      lang: 'fr',
      dir: 'ltr',
      categories: ['business', 'finance', 'productivity'],
      icons: [
        {
          src: '/images/icon-72x72.png',
          sizes: '72x72',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/images/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/images/icon-128x128.png',
          sizes: '128x128',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/images/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/images/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/images/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/images/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/images/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ],
      shortcuts: [
        {
          name: 'Dashboard',
          short_name: 'Dashboard',
          description: 'Accéder au dashboard principal',
          url: '/dashboard',
          icons: [
            {
              src: '/images/dashboard-icon.png',
              sizes: '96x96'
            }
          ]
        },
        {
          name: 'Messagerie',
          short_name: 'Messages',
          description: 'Accéder à la messagerie',
          url: '/messagerie',
          icons: [
            {
              src: '/images/message-icon.png',
              sizes: '96x96'
            }
          ]
        },
        {
          name: 'Documents',
          short_name: 'Docs',
          description: 'Gérer les documents',
          url: '/documents',
          icons: [
            {
              src: '/images/document-icon.png',
              sizes: '96x96'
            }
          ]
        }
      ],
      screenshots: [
        {
          src: '/images/screenshot-desktop.png',
          sizes: '1280x720',
          type: 'image/png',
          form_factor: 'wide',
          label: 'Dashboard principal sur desktop'
        },
        {
          src: '/images/screenshot-mobile.png',
          sizes: '390x844',
          type: 'image/png',
          form_factor: 'narrow',
          label: 'Interface mobile'
        }
      ],
      related_applications: [],
      prefer_related_applications: false,
      share_target: {
        action: '/share',
        method: 'GET',
        params: {
          title: 'title',
          text: 'text',
          url: 'url'
        }
      },
      edge_side_panel: {
        preferred_width: 400
      },
      launch_handler: {
        client_mode: 'navigate-existing'
      },
      handle_links: 'preferred',
      protocol_handlers: [
        {
          protocol: 'web+profitum',
          url: '/?action=%s'
        }
      ]
    };

    // Retourner le manifest avec les headers appropriés
    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.json(manifest);
  } catch (error) {
    console.error('Erreur lors de la génération du manifest:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du manifest'
    });
  }
});

export default router;

