import { createClient } from '@supabase/supabase-js';
import { NotificationService, NotificationType } from './notification-service';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types de facturation
export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  PAYPAL = 'paypal',
  CHECK = 'check',
  CASH = 'cash'
}

export enum BillingType {
  CLIENT_SUBSCRIPTION = 'client_subscription',
  EXPERT_COMMISSION = 'expert_commission',
  SERVICE_FEE = 'service_fee',
  DOCUMENT_PROCESSING = 'document_processing',
  AUDIT_SERVICE = 'audit_service'
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
  metadata?: any;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  expert_id?: string;
  billing_type: BillingType;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  paid_date?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  payment_method?: PaymentMethod;
  payment_reference?: string;
  notes?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  reference: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  metadata?: any;
  created_at: string;
}

export interface BillingSettings {
  id: string;
  client_id: string;
  billing_address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  tax_number?: string;
  payment_terms: number; // jours
  currency: string;
  auto_generate_invoices: boolean;
  payment_reminders: boolean;
  created_at: string;
  updated_at: string;
}

export class BillingService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Créer une facture
   */
  async createInvoice(invoiceData: {
    client_id: string;
    expert_id?: string;
    billing_type: BillingType;
    items: Array<{
      description: string;
      quantity: number;
      unit_price: number;
      tax_rate?: number;
      metadata?: any;
    }>;
    due_date?: string;
    notes?: string;
    metadata?: any;
  }): Promise<string> {
    try {
      // Générer le numéro de facture
      const invoiceNumber = await this.generateInvoiceNumber();
      
      // Calculer les totaux
      const items = invoiceData.items.map(item => ({
        ...item,
        tax_rate: item.tax_rate || 0,
        total: item.quantity * item.unit_price * (1 + (item.tax_rate || 0) / 100)
      }));

      const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const taxAmount = items.reduce((sum, item) => sum + (item.total - (item.quantity * item.unit_price)), 0);
      const totalAmount = subtotal + taxAmount;

      // Créer la facture
      const { data: invoice, error } = await supabase
        .from('Invoice')
        .insert({
          invoice_number: invoiceNumber,
          client_id: invoiceData.client_id,
          expert_id: invoiceData.expert_id,
          billing_type: invoiceData.billing_type,
          status: InvoiceStatus.DRAFT,
          issue_date: new Date().toISOString(),
          due_date: invoiceData.due_date || this.calculateDueDate(),
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          currency: 'EUR',
          notes: invoiceData.notes,
          metadata: invoiceData.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Créer les lignes de facture
      for (const item of items) {
        await supabase
          .from('InvoiceItem')
          .insert({
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            tax_rate: item.tax_rate,
            total: item.total,
            metadata: item.metadata || null
          });
      }

      // Envoyer notification
      await this.notificationService.sendNotification(
        invoiceData.client_id,
        'client',
        NotificationType.CLIENT_INVOICE_GENERATED,
        {
          invoice_number: invoiceNumber,
          total_amount: totalAmount,
          due_date: invoice.due_date,
          invoice_url: `/invoices/${invoice.id}`
        }
      );

      return invoice.id;

    } catch (error) {
      console.error('Erreur création facture:', error);
      throw error;
    }
  }

  /**
   * Générer un numéro de facture unique
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { count, error } = await supabase
      .from('Invoice')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01`)
      .lt('created_at', `${year + 1}-01-01`);

    if (error) {
      console.error('Erreur génération numéro facture:', error);
      return `FACT-${year}-${Date.now()}`;
    }

    const sequence = (count || 0) + 1;
    return `FACT-${year}-${sequence.toString().padStart(6, '0')}`;
  }

  /**
   * Calculer la date d'échéance par défaut
   */
  private calculateDueDate(): string {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 jours par défaut
    return dueDate.toISOString();
  }

  /**
   * Envoyer une facture
   */
  async sendInvoice(invoiceId: string): Promise<void> {
    try {
      // Mettre à jour le statut
      await supabase
        .from('Invoice')
        .update({
          status: InvoiceStatus.SENT,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      // Obtenir les détails de la facture
      const { data: invoice } = await supabase
        .from('Invoice')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoice) {
        // Envoyer notification
        await this.notificationService.sendNotification(
          invoice.client_id,
          'client',
          NotificationType.CLIENT_INVOICE_GENERATED,
          {
            invoice_number: invoice.invoice_number,
            total_amount: invoice.total_amount,
            due_date: invoice.due_date,
            invoice_url: `/invoices/${invoice.id}`
          }
        );

        // Programmer les rappels
        await this.schedulePaymentReminders(invoice);
      }

    } catch (error) {
      console.error('Erreur envoi facture:', error);
      throw error;
    }
  }

  /**
   * Programmer les rappels de paiement
   */
  private async schedulePaymentReminders(invoice: Invoice): Promise<void> {
    const dueDate = new Date(invoice.due_date);
    
    // Rappel 7 jours avant
    const reminder7Days = new Date(dueDate);
    reminder7Days.setDate(reminder7Days.getDate() - 7);
    
    // Rappel 1 jour avant
    const reminder1Day = new Date(dueDate);
    reminder1Day.setDate(reminder1Day.getDate() - 1);
    
    // Rappel le jour de l'échéance
    const reminderDue = new Date(dueDate);

    // Créer les rappels
    await this.createPaymentReminder(invoice.id, reminder7Days, '7_days_before');
    await this.createPaymentReminder(invoice.id, reminder1Day, '1_day_before');
    await this.createPaymentReminder(invoice.id, reminderDue, 'due_date');
  }

  /**
   * Créer un rappel de paiement
   */
  private async createPaymentReminder(
    invoiceId: string,
    reminderDate: Date,
    type: string
  ): Promise<void> {
    await supabase
      .from('PaymentReminder')
      .insert({
        invoice_id: invoiceId,
        reminder_date: reminderDate.toISOString(),
        type,
        sent: false,
        created_at: new Date().toISOString()
      });
  }

  /**
   * Enregistrer un paiement
   */
  async recordPayment(paymentData: {
    invoice_id: string;
    amount: number;
    payment_method: PaymentMethod;
    payment_date: string;
    reference: string;
    metadata?: any;
  }): Promise<string> {
    try {
      // Créer le paiement
      const { data: payment, error } = await supabase
        .from('Payment')
        .insert({
          invoice_id: paymentData.invoice_id,
          amount: paymentData.amount,
          payment_method: paymentData.payment_method,
          payment_date: paymentData.payment_date,
          reference: paymentData.reference,
          status: 'completed',
          metadata: paymentData.metadata,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour la facture
      await this.updateInvoiceStatus(paymentData.invoice_id, InvoiceStatus.PAID);

      // Obtenir les détails de la facture
      const { data: invoice } = await supabase
        .from('Invoice')
        .select('*')
        .eq('id', paymentData.invoice_id)
        .single();

      if (invoice) {
        // Envoyer notification de paiement reçu
        await this.notificationService.sendNotification(
          invoice.client_id,
          'client',
          NotificationType.CLIENT_PAYMENT_RECEIVED,
          {
            invoice_number: invoice.invoice_number,
            amount: paymentData.amount,
            payment_method: paymentData.payment_method,
            payment_date: paymentData.payment_date
          }
        );

        // Si c'est une commission d'expert, notifier l'expert
        if (invoice.expert_id && invoice.billing_type === BillingType.EXPERT_COMMISSION) {
                  await this.notificationService.sendNotification(
          invoice.expert_id,
          'expert',
          NotificationType.EXPERT_PAYMENT_PROCESSED,
            {
              invoice_number: invoice.invoice_number,
              amount: paymentData.amount,
              commission_type: 'expert_commission'
            }
          );
        }
      }

      return payment.id;

    } catch (error) {
      console.error('Erreur enregistrement paiement:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour le statut d'une facture
   */
  private async updateInvoiceStatus(invoiceId: string, status: InvoiceStatus): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === InvoiceStatus.PAID) {
      updateData.paid_date = new Date().toISOString();
    }

    await supabase
      .from('Invoice')
      .update(updateData)
      .eq('id', invoiceId);
  }

  /**
   * Générer une facture automatique pour un client
   */
  async generateAutomaticInvoice(
    clientId: string,
    billingType: BillingType,
    amount: number,
    description: string
  ): Promise<string> {
    try {
      // Vérifier si la génération automatique est activée
      const { data: settings } = await supabase
        .from('BillingSettings')
        .select('auto_generate_invoices')
        .eq('client_id', clientId)
        .single();

      if (!settings?.auto_generate_invoices) {
        throw new Error('Génération automatique désactivée pour ce client');
      }

      // Créer la facture
      const invoiceId = await this.createInvoice({
        client_id: clientId,
        billing_type: billingType,
        items: [{
          description,
          quantity: 1,
          unit_price: amount,
          tax_rate: 20 // TVA française
        }]
      });

      // Envoyer automatiquement
      await this.sendInvoice(invoiceId);

      return invoiceId;

    } catch (error) {
      console.error('Erreur génération facture automatique:', error);
      throw error;
    }
  }

  /**
   * Calculer les commissions d'expert
   */
  async calculateExpertCommission(
    expertId: string,
    clientId: string,
    baseAmount: number,
    commissionRate: number = 15 // 15% par défaut
  ): Promise<number> {
    try {
      // Calculer la commission
      const commission = baseAmount * (commissionRate / 100);

      // Créer la facture de commission
      await this.createInvoice({
        client_id: clientId,
        expert_id: expertId,
        billing_type: BillingType.EXPERT_COMMISSION,
        items: [{
          description: `Commission expert - ${commissionRate}%`,
          quantity: 1,
          unit_price: commission,
          tax_rate: 20
        }],
        metadata: {
          base_amount: baseAmount,
          commission_rate: commissionRate,
          commission_type: 'expert_commission'
        }
      });

      return commission;

    } catch (error) {
      console.error('Erreur calcul commission expert:', error);
      throw error;
    }
  }

  /**
   * Obtenir les factures d'un client
   */
  async getClientInvoices(
    clientId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('Invoice')
      .select(`
        *,
        InvoiceItem(*)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erreur récupération factures client:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Obtenir les factures d'un expert
   */
  async getExpertInvoices(
    expertId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('Invoice')
      .select(`
        *,
        InvoiceItem(*)
      `)
      .eq('expert_id', expertId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erreur récupération factures expert:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Obtenir les statistiques de facturation
   */
  async getBillingStats(
    userId: string,
    userType: 'client' | 'expert' | 'admin',
    period: 'month' | 'quarter' | 'year' = 'month'
  ): Promise<any> {
    try {
      const startDate = this.getPeriodStartDate(period);
      
      let query = supabase
        .from('Invoice')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (userType === 'client') {
        query = query.eq('client_id', userId);
      } else if (userType === 'expert') {
        query = query.eq('expert_id', userId);
      }

      const { data: invoices, error } = await query;

      if (error) throw error;

      const stats = {
        total_invoices: invoices?.length || 0,
        total_amount: 0,
        paid_amount: 0,
        pending_amount: 0,
        overdue_amount: 0,
        by_status: {} as any,
        by_type: {} as any
      };

      for (const invoice of invoices || []) {
        stats.total_amount += invoice.total_amount;

        if (invoice.status === InvoiceStatus.PAID) {
          stats.paid_amount += invoice.total_amount;
        } else if (invoice.status === InvoiceStatus.SENT) {
          stats.pending_amount += invoice.total_amount;
        } else if (invoice.status === InvoiceStatus.OVERDUE) {
          stats.overdue_amount += invoice.total_amount;
        }

        // Compter par statut
        stats.by_status[invoice.status] = (stats.by_status[invoice.status] || 0) + 1;

        // Compter par type
        stats.by_type[invoice.billing_type] = (stats.by_type[invoice.billing_type] || 0) + 1;
      }

      return stats;

    } catch (error) {
      console.error('Erreur calcul statistiques facturation:', error);
      return null;
    }
  }

  /**
   * Obtenir la date de début de période
   */
  private getPeriodStartDate(period: 'month' | 'quarter' | 'year'): Date {
    const now = new Date();
    
    switch (period) {
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }

  /**
   * Exporter les factures en Excel
   */
  async exportInvoicesToExcel(
    userId: string,
    userType: 'client' | 'expert' | 'admin',
    filters?: any
  ): Promise<Buffer> {
    // Implémentation de l'export Excel
    // À implémenter avec une bibliothèque comme ExcelJS
    throw new Error('Export Excel non implémenté');
  }

  /**
   * Exporter les factures en PDF
   */
  async exportInvoiceToPDF(invoiceId: string): Promise<Buffer> {
    // Implémentation de l'export PDF
    // À implémenter avec une bibliothèque comme Puppeteer
    throw new Error('Export PDF non implémenté');
  }
}

export default BillingService; 