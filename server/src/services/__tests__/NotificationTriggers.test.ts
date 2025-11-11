import { NotificationTriggers } from '../NotificationTriggers';

const insertMock = jest.fn();
const fromMock = jest.fn(() => ({ insert: insertMock }));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: fromMock
  }))
}));

describe('NotificationTriggers metadata enrichment', () => {
  beforeEach(() => {
    insertMock.mockReset();
    insertMock.mockResolvedValue({ error: null });
  fromMock.mockReturnValue({ insert: insertMock });
    jest.useFakeTimers().setSystemTime(new Date('2025-11-09T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('enriches payment requested notifications with SLA metadata and CTA', async () => {
    await NotificationTriggers.onPaymentRequested('client-auth', {
      dossier_id: 'dossier-123',
      produit: 'TICPE',
      montant: 5200,
      facture_reference: 'FACT-001'
    });

    expect(insertMock).toHaveBeenCalledTimes(1);
    const payload = insertMock.mock.calls[0][0];

    expect(payload.action_url).toBe('/produits/ticpe/dossier-123');
    expect(payload.notification_type).toBe('payment_requested');
    expect(payload.priority).toBe('high');

    expect(payload.metadata).toMatchObject({
      dossier_id: 'dossier-123',
      produit: 'TICPE',
      produit_slug: 'ticpe',
      montant: 5200,
      facture_reference: 'FACT-001',
    commission_type: 'expert',
    next_step_label: 'Régler la commission expert',
    next_step_description: expect.stringContaining('rémunère votre expert'),
    recommended_action: expect.stringContaining('commission expert'),
      support_email: expect.any(String),
      sla_hours: 48,
      escalation_level: 0
    });

    expect(payload.metadata.triggered_at).toBe('2025-11-09T12:00:00.000Z');
    expect(payload.metadata.due_at).toBe('2025-11-11T12:00:00.000Z');
  });
});


