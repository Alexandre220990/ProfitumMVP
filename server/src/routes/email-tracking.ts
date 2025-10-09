/**
 * Routes pour le tracking des emails
 * Pixel invisible (ouverture) + Redirections (clics)
 */

import { Router, Request, Response } from 'express';
import { EmailTrackingService } from '../services/EmailTrackingService';

const router = Router();

/**
 * GET /api/email-tracking/open/:emailId
 * Pixel invisible de 1x1 pour tracker les ouvertures
 */
router.get('/open/:emailId', async (req: Request, res: Response) => {
  const { emailId } = req.params;
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip || req.connection.remoteAddress;

  try {
    // Enregistrer l'ouverture
    await EmailTrackingService.trackEvent({
      email_id: emailId,
      event_type: 'opened',
      user_agent: userAgent,
      ip_address: ipAddress
    });

    // Retourner un pixel transparent 1x1
    const pixelBuffer = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixelBuffer.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.end(pixelBuffer);
  } catch (error) {
    console.error('❌ Erreur tracking ouverture:', error);
    
    // Même en cas d'erreur, retourner le pixel
    const pixelBuffer = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.writeHead(200, { 'Content-Type': 'image/gif' });
    res.end(pixelBuffer);
  }
});

/**
 * GET /api/email-tracking/click/:emailId
 * Redirection avec tracking pour les clics sur liens
 */
router.get('/click/:emailId', async (req: Request, res: Response) => {
  const { emailId } = req.params;
  const { url } = req.query;
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip || req.connection.remoteAddress;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'URL manquante'
    });
  }

  try {
    // Enregistrer le clic
    await EmailTrackingService.trackEvent({
      email_id: emailId,
      event_type: 'clicked',
      user_agent: userAgent,
      ip_address: ipAddress,
      link_url: url
    });

    // Rediriger vers l'URL cible
    res.redirect(302, decodeURIComponent(url));
  } catch (error) {
    console.error('❌ Erreur tracking clic:', error);
    
    // Même en cas d'erreur, rediriger vers l'URL
    res.redirect(302, decodeURIComponent(url));
  }
});

/**
 * GET /api/email-tracking/metrics/:emailId
 * Obtenir les métriques d'un email spécifique
 */
router.get('/metrics/:emailId', async (req: Request, res: Response) => {
  const { emailId } = req.params;

  try {
    const metrics = await EmailTrackingService.getEmailMetrics(emailId);

    return res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('❌ Erreur récupération métriques:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur récupération métriques'
    });
  }
});

/**
 * GET /api/email-tracking/metrics
 * Obtenir les métriques globales
 */
router.get('/metrics', async (req: Request, res: Response) => {
  const { template_name, start_date, end_date } = req.query;

  try {
    const metrics = await EmailTrackingService.getGlobalMetrics({
      template_name: template_name as string,
      start_date: start_date as string,
      end_date: end_date as string
    });

    return res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('❌ Erreur récupération métriques globales:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur récupération métriques'
    });
  }
});

/**
 * GET /api/email-tracking/metrics/by-template
 * Obtenir les métriques par template
 */
router.get('/metrics/by-template', async (req: Request, res: Response) => {
  try {
    const metrics = await EmailTrackingService.getMetricsByTemplate();

    return res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('❌ Erreur récupération métriques par template:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur récupération métriques'
    });
  }
});

/**
 * DELETE /api/email-tracking/clean
 * Nettoyer les anciens trackings (admin uniquement)
 */
router.delete('/clean', async (req: Request, res: Response) => {
  const { days = 90 } = req.body;

  try {
    const deletedCount = await EmailTrackingService.cleanOldTrackings(days);

    return res.json({
      success: true,
      message: `${deletedCount} trackings supprimés`,
      data: { deleted_count: deletedCount }
    });
  } catch (error) {
    console.error('❌ Erreur nettoyage trackings:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur nettoyage'
    });
  }
});

export default router;

