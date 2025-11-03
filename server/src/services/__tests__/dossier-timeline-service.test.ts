/**
 * Tests unitaires pour DossierTimelineService
 */

import { DossierTimelineService } from '../dossier-timeline-service';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js');

describe('DossierTimelineService', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('addEvent', () => {
    it('devrait ajouter un événement timeline avec succès', async () => {
      const mockEvent = {
        id: '123',
        dossier_id: 'dossier-1',
        type: 'eligibiliteValidee',
        title: 'Éligibilité validée',
        description: 'Document validé par admin',
        actor_type: 'admin',
        actor_id: 'admin-1',
        actor_name: 'Admin Test',
        date: new Date().toISOString(),
        metadata: {},
        color: 'green',
        icon: 'CheckCircle'
      };

      mockSupabase.insert.mockResolvedValue({
        data: mockEvent,
        error: null
      });

      const result = await DossierTimelineService.addEvent({
        dossier_id: 'dossier-1',
        type: 'eligibiliteValidee',
        title: 'Éligibilité validée',
        description: 'Document validé par admin',
        actor_type: 'admin',
        actor_id: 'admin-1',
        actor_name: 'Admin Test'
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('dossier_timeline');
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs lors de l\'ajout', async () => {
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await DossierTimelineService.addEvent({
        dossier_id: 'dossier-1',
        type: 'eligibiliteValidee',
        title: 'Test',
        description: 'Test',
        actor_type: 'admin',
        actor_id: 'admin-1',
        actor_name: 'Admin'
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('erreur');
    });
  });

  describe('getTimeline', () => {
    it('devrait récupérer la timeline d\'un dossier', async () => {
      const mockTimeline = [
        {
          id: '1',
          type: 'dossierCree',
          title: 'Dossier créé',
          date: new Date().toISOString()
        },
        {
          id: '2',
          type: 'eligibiliteValidee',
          title: 'Éligibilité validée',
          date: new Date().toISOString()
        }
      ];

      mockSupabase.select.mockResolvedValue({
        data: mockTimeline,
        error: null
      });

      const result = await DossierTimelineService.getTimeline('dossier-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('dossier_timeline');
      expect(mockSupabase.eq).toHaveBeenCalledWith('dossier_id', 'dossier-1');
    });

    it('devrait appliquer un filtre par type', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null
      });

      await DossierTimelineService.getTimeline('dossier-1', {
        type: 'eligibiliteValidee'
      });

      expect(mockSupabase.eq).toHaveBeenCalledWith('type', 'eligibiliteValidee');
    });

    it('devrait appliquer une limite', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null
      });

      await DossierTimelineService.getTimeline('dossier-1', {
        limit: 10
      });

      expect(mockSupabase.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('Helper methods', () => {
    it('eligibiliteValidee devrait créer l\'événement correct', async () => {
      mockSupabase.insert.mockResolvedValue({
        data: { id: '123' },
        error: null
      });

      const result = await DossierTimelineService.eligibiliteValidee({
        dossier_id: 'dossier-1',
        admin_id: 'admin-1',
        admin_name: 'Admin Test'
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('expertAccepte devrait créer l\'événement correct', async () => {
      mockSupabase.insert.mockResolvedValue({
        data: { id: '123' },
        error: null
      });

      const result = await DossierTimelineService.expertAccepte({
        dossier_id: 'dossier-1',
        expert_id: 'expert-1',
        expert_name: 'Expert Test',
        client_name: 'Client Test'
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('auditTermine devrait créer l\'événement correct', async () => {
      mockSupabase.insert.mockResolvedValue({
        data: { id: '123' },
        error: null
      });

      const result = await DossierTimelineService.auditTermine({
        dossier_id: 'dossier-1',
        expert_id: 'expert-1',
        expert_name: 'Expert Test',
        montant_final: 50000
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });

  describe('updateEvent', () => {
    it('devrait mettre à jour un événement', async () => {
      mockSupabase.update.mockResolvedValue({
        data: { id: '123', title: 'Updated' },
        error: null
      });

      const result = await DossierTimelineService.updateEvent('123', {
        title: 'Updated'
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123');
    });
  });

  describe('deleteEvent', () => {
    it('devrait supprimer un événement', async () => {
      mockSupabase.delete.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await DossierTimelineService.deleteEvent('123');

      expect(result.success).toBe(true);
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123');
    });
  });
});

