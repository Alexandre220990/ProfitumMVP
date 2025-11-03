/**
 * Tests unitaires pour ExpertNotificationService
 */

import { ExpertNotificationService } from '../expert-notification-service';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js');

describe('ExpertNotificationService', () => {
  let mockSupabase: any;
  let service: ExpertNotificationService;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    service = new ExpertNotificationService();
  });

  describe('notifyDossierPendingAcceptance', () => {
    it('devrait envoyer une notification à l\'expert pour acceptation dossier', async () => {
      mockSupabase.insert.mockResolvedValue({
        data: { id: '123' },
        error: null
      });

      const result = await service.notifyDossierPendingAcceptance({
        expert_auth_user_id: 'expert-auth-1',
        dossier_id: 'dossier-1',
        client_name: 'Client Test',
        produit_nom: 'URSSAF',
        montant_estime: 50000
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('notification');
      expect(mockSupabase.insert).toHaveBeenCalled();

      const insertCall = mockSupabase.insert.mock.calls[0][0];
      expect(insertCall.user_type).toBe('expert');
      expect(insertCall.notification_type).toBe('dossier_pending_acceptance');
      expect(insertCall.priority).toBe('high');
    });

    it('devrait gérer les erreurs lors de l\'envoi', async () => {
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await service.notifyDossierPendingAcceptance({
        expert_auth_user_id: 'expert-auth-1',
        dossier_id: 'dossier-1',
        client_name: 'Client Test',
        produit_nom: 'URSSAF',
        montant_estime: 50000
      });

      expect(result.success).toBe(false);
    });
  });

  describe('notifyClientExpertAccepted', () => {
    it('devrait envoyer une notification au client après acceptation expert', async () => {
      mockSupabase.insert.mockResolvedValue({
        data: { id: '123' },
        error: null
      });

      const result = await service.notifyClientExpertAccepted({
        client_auth_user_id: 'client-auth-1',
        dossier_id: 'dossier-1',
        expert_name: 'Expert Test',
        produit_nom: 'URSSAF'
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('notification');

      const insertCall = mockSupabase.insert.mock.calls[0][0];
      expect(insertCall.user_type).toBe('client');
      expect(insertCall.notification_type).toBe('expert_accepted');
      expect(insertCall.priority).toBe('high');
      expect(insertCall.title).toContain('Expert Test');
    });
  });

  describe('notifyClientExpertRejected', () => {
    it('devrait envoyer une notification au client après refus expert', async () => {
      mockSupabase.insert.mockResolvedValue({
        data: { id: '123' },
        error: null
      });

      const result = await service.notifyClientExpertRejected({
        client_auth_user_id: 'client-auth-1',
        dossier_id: 'dossier-1',
        expert_name: 'Expert Test',
        produit_nom: 'URSSAF'
      });

      expect(result.success).toBe(true);

      const insertCall = mockSupabase.insert.mock.calls[0][0];
      expect(insertCall.notification_type).toBe('expert_rejected');
      expect(insertCall.priority).toBe('high');
      expect(insertCall.message).toContain('refusé');
    });
  });

  describe('notifyAdminExpertDecision', () => {
    it('devrait notifier l\'admin de l\'acceptation expert', async () => {
      // Mock la récupération des admins
      mockSupabase.select.mockResolvedValue({
        data: [
          { auth_user_id: 'admin-1' },
          { auth_user_id: 'admin-2' }
        ],
        error: null
      });

      mockSupabase.insert.mockResolvedValue({
        data: { id: '123' },
        error: null
      });

      const result = await service.notifyAdminExpertDecision({
        dossier_id: 'dossier-1',
        expert_name: 'Expert Test',
        client_name: 'Client Test',
        produit_nom: 'URSSAF',
        decision: 'accepted'
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('Admin');
      expect(mockSupabase.insert).toHaveBeenCalledTimes(2); // 2 admins
    });

    it('devrait notifier l\'admin du refus expert', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [{ auth_user_id: 'admin-1' }],
        error: null
      });

      mockSupabase.insert.mockResolvedValue({
        data: { id: '123' },
        error: null
      });

      await service.notifyAdminExpertDecision({
        dossier_id: 'dossier-1',
        expert_name: 'Expert Test',
        client_name: 'Client Test',
        produit_nom: 'URSSAF',
        decision: 'rejected'
      });

      const insertCall = mockSupabase.insert.mock.calls[0][0];
      expect(insertCall.message).toContain('refusé');
    });

    it('devrait gérer l\'absence d\'admins', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await service.notifyAdminExpertDecision({
        dossier_id: 'dossier-1',
        expert_name: 'Expert Test',
        client_name: 'Client Test',
        produit_nom: 'URSSAF',
        decision: 'accepted'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('admin');
    });
  });
});

