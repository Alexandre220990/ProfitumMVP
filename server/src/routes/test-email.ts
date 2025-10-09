/**
 * Route de test pour le service email RDV
 */

import { Router, Request, Response } from 'express';
import { RDVEmailService } from '../services/RDVEmailService';

const router = Router();

/**
 * POST /api/test-email - Envoyer un email de test
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Email destinataire requis'
      });
    }

    console.log(`📧 Tentative d'envoi email test à : ${to}`);

    const success = await RDVEmailService.sendTestEmail(to);

    if (success) {
      return res.json({
        success: true,
        message: `Email test envoyé avec succès à ${to}`
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Échec envoi email'
      });
    }

  } catch (error) {
    console.error('❌ Erreur route test-email:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur serveur'
    });
  }
});

/**
 * POST /api/test-email/rdv-confirmation - Tester template confirmation
 */
router.post('/rdv-confirmation', async (req: Request, res: Response) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Email destinataire requis'
      });
    }

    // Données de test
    const testData = {
      rdv_id: 'test-rdv-id',
      client_email: to,
      client_name: 'Alexandre Grandjean',
      company_name: 'Test Entreprise SARL',
      meetings: [
        {
          expert_name: 'Jean Dupont',
          scheduled_date: '15 octobre 2025',
          scheduled_time: '10:00',
          duration_minutes: 60,
          meeting_type: 'video',
          location: 'Lien visio',
          products: [
            { name: 'TICPE', estimated_savings: 15000 },
            { name: 'URSSAF', estimated_savings: 8000 }
          ]
        }
      ],
      total_savings: 23000,
      products_count: 2,
      temp_password: 'Test123!',
      apporteur_name: 'Marie Martin',
      apporteur_email: 'marie@profitum.fr',
      apporteur_phone: '06 12 34 56 78',
      platform_url: 'https://www.profitum.app'
    };

    const success = await RDVEmailService.sendRDVConfirmationToClient(testData);

    if (success) {
      return res.json({
        success: true,
        message: `Email test confirmation envoyé à ${to}`
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Échec envoi email'
      });
    }

  } catch (error) {
    console.error('❌ Erreur test confirmation:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Erreur serveur'
    });
  }
});

export default router;

