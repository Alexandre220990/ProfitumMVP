import { createClient } from '@supabase/supabase-js';
import { NotificationService, NotificationType } from './notification-service';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Types CRM
export enum ContactType {
  CLIENT = 'client',
  EXPERT = 'expert',
  PROSPECT = 'prospect',
  PARTNER = 'partner',
  SUPPLIER = 'supplier'
}

export enum ContactStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PROSPECT = 'prospect',
  LEAD = 'lead',
  CUSTOMER = 'customer',
  CHURNED = 'churned'
}

export enum InteractionType {
  EMAIL = 'email',
  PHONE = 'phone',
  MEETING = 'meeting',
  DOCUMENT = 'document',
  NOTE = 'note',
  TASK = 'task',
  OPPORTUNITY = 'opportunity'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Contact {
  id: string;
  type: ContactType;
  status: ContactStatus;
  company_name?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  industry?: string;
  size?: string;
  website?: string;
  linkedin?: string;
  notes?: string;
  tags: string[];
  assigned_to?: string;
  source?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  last_contact_date?: string;
}

export interface Interaction {
  id: string;
  contact_id: string;
  type: InteractionType;
  subject: string;
  description: string;
  date: string;
  duration?: number; // en minutes
  outcome?: string;
  next_action?: string;
  next_action_date?: string;
  created_by: string;
  metadata?: any;
  created_at: string;
}

export interface Task {
  id: string;
  contact_id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string;
  completed_date?: string;
  assigned_to: string;
  created_by: string;
  tags: string[];
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  contact_id: string;
  title: string;
  description?: string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  value: number;
  probability: number; // 0-100
  expected_close_date?: string;
  actual_close_date?: string;
  assigned_to: string;
  created_by: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  total_contacts: number;
  new_contacts_this_month: number;
  active_opportunities: number;
  total_pipeline_value: number;
  conversion_rate: number;
  average_deal_size: number;
  tasks_due_today: number;
  overdue_tasks: number;
  interactions_this_week: number;
}

export class CRMService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  // ===== GESTION DES CONTACTS =====

  /**
   * Créer un nouveau contact
   */
  async createContact(contactData: {
    type: ContactType;
    status: ContactStatus;
    company_name?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: any;
    industry?: string;
    size?: string;
    website?: string;
    linkedin?: string;
    notes?: string;
    tags?: string[];
    assigned_to?: string;
    source?: string;
    metadata?: any;
  }): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('Contact')
        .insert({
          ...contactData,
          tags: contactData.tags || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Envoyer notification si assigné
      if (contactData.assigned_to) {
        await this.notificationService.sendNotification(
          contactData.assigned_to,
          'admin',
          NotificationType.ADMIN_NEW_CLIENT_REGISTRATION,
          {
            contact_name: `${contactData.first_name} ${contactData.last_name}`,
            company_name: contactData.company_name,
            contact_type: contactData.type
          }
        );
      }

      return data.id;

    } catch (error) {
      console.error('Erreur création contact:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un contact
   */
  async updateContact(
    contactId: string,
    updateData: Partial<Contact>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('Contact')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', contactId);

      if (error) throw error;

    } catch (error) {
      console.error('Erreur mise à jour contact:', error);
      throw error;
    }
  }

  /**
   * Obtenir un contact
   */
  async getContact(contactId: string): Promise<Contact | null> {
    try {
      const { data, error } = await supabase
        .from('Contact')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Erreur récupération contact:', error);
      return null;
    }
  }

  /**
   * Rechercher des contacts
   */
  async searchContacts(
    query: string,
    filters?: {
      type?: ContactType;
      status?: ContactStatus;
      assigned_to?: string;
      tags?: string[];
    },
    limit: number = 50,
    offset: number = 0
  ): Promise<Contact[]> {
    try {
      let supabaseQuery = supabase
        .from('Contact')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,company_name.ilike.%${query}%,email.ilike.%${query}%`);

      if (filters?.type) {
        supabaseQuery = supabaseQuery.eq('type', filters.type);
      }

      if (filters?.status) {
        supabaseQuery = supabaseQuery.eq('status', filters.status);
      }

      if (filters?.assigned_to) {
        supabaseQuery = supabaseQuery.eq('assigned_to', filters.assigned_to);
      }

      if (filters?.tags && filters.tags.length > 0) {
        supabaseQuery = supabaseQuery.overlaps('tags', filters.tags);
      }

      const { data, error } = await supabaseQuery
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Erreur recherche contacts:', error);
      return [];
    }
  }

  // ===== GESTION DES INTERACTIONS =====

  /**
   * Créer une interaction
   */
  async createInteraction(interactionData: {
    contact_id: string;
    type: InteractionType;
    subject: string;
    description: string;
    date: string;
    duration?: number;
    outcome?: string;
    next_action?: string;
    next_action_date?: string;
    created_by: string;
    metadata?: any;
  }): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('Interaction')
        .insert({
          ...interactionData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Mettre à jour la date de dernier contact
      await this.updateContact(interactionData.contact_id, {
        last_contact_date: interactionData.date
      });

      // Créer une tâche si une action de suivi est définie
      if (interactionData.next_action && interactionData.next_action_date) {
        await this.createTask({
          contact_id: interactionData.contact_id,
          title: interactionData.next_action,
          description: `Action de suivi suite à l'interaction: ${interactionData.subject}`,
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.TODO,
          due_date: interactionData.next_action_date,
          assigned_to: interactionData.created_by,
          created_by: interactionData.created_by,
          tags: ['follow-up']
        });
      }

      return data.id;

    } catch (error) {
      console.error('Erreur création interaction:', error);
      throw error;
    }
  }

  /**
   * Obtenir les interactions d'un contact
   */
  async getContactInteractions(
    contactId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Interaction[]> {
    try {
      const { data, error } = await supabase
        .from('Interaction')
        .select('*')
        .eq('contact_id', contactId)
        .order('date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Erreur récupération interactions:', error);
      return [];
    }
  }

  // ===== GESTION DES TÂCHES =====

  /**
   * Créer une tâche
   */
  async createTask(taskData: {
    contact_id: string;
    title: string;
    description?: string;
    priority: TaskPriority;
    status: TaskStatus;
    due_date?: string;
    assigned_to: string;
    created_by: string;
    tags?: string[];
    metadata?: any;
  }): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('Task')
        .insert({
          ...taskData,
          tags: taskData.tags || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Envoyer notification si assigné à quelqu'un d'autre
      if (taskData.assigned_to !== taskData.created_by) {
        await this.notificationService.sendNotification(
          taskData.assigned_to,
          'admin',
          NotificationType.CLIENT_DEADLINE_REMINDER,
          {
            task_title: taskData.title,
            due_date: taskData.due_date,
            priority: taskData.priority,
            contact_id: taskData.contact_id
          }
        );
      }

      return data.id;

    } catch (error) {
      console.error('Erreur création tâche:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une tâche
   */
  async updateTask(
    taskId: string,
    updateData: Partial<Task>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('Task')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

    } catch (error) {
      console.error('Erreur mise à jour tâche:', error);
      throw error;
    }
  }

  /**
   * Obtenir les tâches d'un utilisateur
   */
  async getUserTasks(
    userId: string,
    status?: TaskStatus,
    limit: number = 50,
    offset: number = 0
  ): Promise<Task[]> {
    try {
      let query = supabase
        .from('Task')
        .select('*')
        .eq('assigned_to', userId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query
        .order('due_date', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Erreur récupération tâches:', error);
      return [];
    }
  }

  // ===== GESTION DES OPPORTUNITÉS =====

  /**
   * Créer une opportunité
   */
  async createOpportunity(opportunityData: {
    contact_id: string;
    title: string;
    description?: string;
    stage: string;
    value: number;
    probability: number;
    expected_close_date?: string;
    assigned_to: string;
    created_by: string;
    metadata?: any;
  }): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('Opportunity')
        .insert({
          ...opportunityData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Envoyer notification
      await this.notificationService.sendNotification(
        opportunityData.assigned_to,
        'admin',
        NotificationType.EXPERT_NEW_ASSIGNMENT,
        {
          opportunity_title: opportunityData.title,
          value: opportunityData.value,
          stage: opportunityData.stage,
          contact_id: opportunityData.contact_id
        }
      );

      return data.id;

    } catch (error) {
      console.error('Erreur création opportunité:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une opportunité
   */
  async updateOpportunity(
    opportunityId: string,
    updateData: Partial<Opportunity>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('Opportunity')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', opportunityId);

      if (error) throw error;

    } catch (error) {
      console.error('Erreur mise à jour opportunité:', error);
      throw error;
    }
  }

  /**
   * Obtenir les opportunités d'un utilisateur
   */
  async getUserOpportunities(
    userId: string,
    stage?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Opportunity[]> {
    try {
      let query = supabase
        .from('Opportunity')
        .select('*')
        .eq('assigned_to', userId);

      if (stage) {
        query = query.eq('stage', stage);
      }

      const { data, error } = await query
        .order('expected_close_date', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Erreur récupération opportunités:', error);
      return [];
    }
  }

  // ===== DASHBOARD ET MÉTRIQUES =====

  /**
   * Obtenir les métriques du dashboard
   */
  async getDashboardMetrics(userId: string, userType: 'client' | 'expert' | 'admin'): Promise<DashboardMetrics> {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      // Contacts totaux
      const { count: totalContacts } = await supabase
        .from('Contact')
        .select('*', { count: 'exact', head: true })
        .eq(userType === 'admin' ? 'assigned_to' : 'id', userId);

      // Nouveaux contacts ce mois
      const { count: newContactsThisMonth } = await supabase
        .from('Contact')
        .select('*', { count: 'exact', head: true })
        .eq(userType === 'admin' ? 'assigned_to' : 'id', userId)
        .gte('created_at', monthStart.toISOString());

      // Opportunités actives
      const { data: activeOpportunities } = await supabase
        .from('Opportunity')
        .select('*')
        .eq('assigned_to', userId)
        .not('stage', 'in', ['closed_won', 'closed_lost']);

      // Valeur totale du pipeline
      const pipelineValue = activeOpportunities?.reduce((sum, opp) => sum + opp.value, 0) || 0;

      // Tâches dues aujourd'hui
      const today = new Date().toISOString().split('T')[0];
      const { count: tasksDueToday } = await supabase
        .from('Task')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', userId)
        .eq('status', TaskStatus.TODO)
        .eq('due_date', today);

      // Tâches en retard
      const { count: overdueTasks } = await supabase
        .from('Task')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', userId)
        .eq('status', TaskStatus.TODO)
        .lt('due_date', today);

      // Interactions cette semaine
      const { count: interactionsThisWeek } = await supabase
        .from('Interaction')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId)
        .gte('date', weekStart.toISOString());

      return {
        total_contacts: totalContacts || 0,
        new_contacts_this_month: newContactsThisMonth || 0,
        active_opportunities: activeOpportunities?.length || 0,
        total_pipeline_value: pipelineValue,
        conversion_rate: 0, // À calculer selon les données historiques
        average_deal_size: activeOpportunities?.length ? pipelineValue / activeOpportunities.length : 0,
        tasks_due_today: tasksDueToday || 0,
        overdue_tasks: overdueTasks || 0,
        interactions_this_week: interactionsThisWeek || 0
      };

    } catch (error) {
      console.error('Erreur calcul métriques dashboard:', error);
      return {
        total_contacts: 0,
        new_contacts_this_month: 0,
        active_opportunities: 0,
        total_pipeline_value: 0,
        conversion_rate: 0,
        average_deal_size: 0,
        tasks_due_today: 0,
        overdue_tasks: 0,
        interactions_this_week: 0
      };
    }
  }

  /**
   * Obtenir les rapports CRM
   */
  async getCRMReports(
    userId: string,
    userType: 'client' | 'expert' | 'admin',
    reportType: 'contacts' | 'opportunities' | 'tasks' | 'interactions',
    period: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ): Promise<any> {
    try {
      const startDate = this.getPeriodStartDate(period);
      
      let query = supabase
        .from(reportType === 'contacts' ? 'Contact' : 
              reportType === 'opportunities' ? 'Opportunity' :
              reportType === 'tasks' ? 'Task' : 'Interaction')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (userType !== 'admin') {
        const field = reportType === 'contacts' ? 'assigned_to' : 
                     reportType === 'opportunities' ? 'assigned_to' :
                     reportType === 'tasks' ? 'assigned_to' : 'created_by';
        query = query.eq(field, userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Traiter les données selon le type de rapport
      return this.processReportData(data || [], reportType, period);

    } catch (error) {
      console.error('Erreur génération rapport CRM:', error);
      return null;
    }
  }

  /**
   * Traiter les données de rapport
   */
  private processReportData(data: any[], reportType: string, period: string): any {
    // Logique de traitement des données selon le type de rapport
    // À implémenter selon les besoins spécifiques
    return {
      total: data.length,
      data: data,
      period: period,
      type: reportType
    };
  }

  /**
   * Obtenir la date de début de période
   */
  private getPeriodStartDate(period: 'week' | 'month' | 'quarter' | 'year'): Date {
    const now = new Date();
    
    switch (period) {
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return weekStart;
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
}

export default CRMService; 