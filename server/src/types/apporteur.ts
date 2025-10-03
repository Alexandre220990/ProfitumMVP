// Types pour le module Apporteurs d'Affaires

export interface ProspectFormData {
    // Informations entreprise
    company_name: string;
    siren?: string;
    address?: string;
    website?: string;
    
    // Décisionnaire
    decision_maker_first_name: string;
    decision_maker_last_name: string;
    decision_maker_email: string;
    decision_maker_phone: string;
    decision_maker_position?: string;
    
    // Qualification
    qualification_score: number; // 1-10
    interest_level: 'high' | 'medium' | 'low';
    budget_range: '0-10k' | '10k-50k' | '50k-100k' | '100k+';
    timeline: 'immediate' | '1-3months' | '3-6months' | '6months+';
    
    // Présélection expert
    preselected_expert_id?: string;
    expert_selection_reason?: string;
    expert_note?: string; // Note à l'attention de l'expert
    
    // Métadonnées
    notes?: string;
    source: 'cold_call' | 'referral' | 'website' | 'social_media' | 'event' | 'other';
}

export interface ProspectResponse {
    id: string;
    apporteur_id: string;
    company_name: string;
    siren?: string;
    address?: string;
    website?: string;
    decision_maker_first_name: string;
    decision_maker_last_name: string;
    decision_maker_email: string;
    decision_maker_phone: string;
    decision_maker_position?: string;
    qualification_score: number;
    interest_level: string;
    budget_range: string;
    timeline: string;
    preselected_expert_id?: string;
    expert_selection_reason?: string;
    expert_note?: string;
    expert_response?: string;
    status: string;
    source: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    
    // Relations
    expert?: {
        id: string;
        name: string;
        email: string;
        specializations: string[];
    };
    apporteur?: {
        id: string;
        first_name: string;
        last_name: string;
        company_name: string;
    };
}

export interface ApporteurDashboard {
    prospects: {
        total: number;
        qualified: number;
        pending: number;
        new_this_month: number;
    };
    conversions: {
        signed_this_month: number;
        conversion_rate: number;
        in_progress: number;
        monthly_goal: number;
        goal_achieved: boolean;
    };
    commissions: {
        pending: number;
        paid_this_month: number;
        total_year: number;
        pending_amount: number;
    };
    experts: {
        active: number;
        available: number;
        top_performer: string;
        avg_response_time: string;
    };
}

export interface ExpertNotificationData {
    id: string;
    expert_id: string;
    prospect_id: string;
    apporteur_id: string;
    notification_type: string;
    title: string;
    message: string;
    priority: string;
    status: string;
    read_at?: string;
    acted_at?: string;
    created_at: string;
    expires_at: string;
    
    // Relations
    prospect?: ProspectResponse;
    apporteur?: {
        id: string;
        first_name: string;
        last_name: string;
        company_name: string;
    };
}

export interface ProspectMeetingData {
    id: string;
    prospect_id: string;
    expert_id: string;
    apporteur_id: string;
    meeting_type: 'phone' | 'video' | 'in_person';
    scheduled_at: string;
    duration_minutes: number;
    location?: string;
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
    completed_at?: string;
    outcome?: 'positive' | 'negative' | 'follow_up_needed' | 'converted';
    notes?: string;
    next_steps?: string;
    follow_up_date?: string;
    created_at: string;
    updated_at: string;
    
    // Relations
    prospect?: ProspectResponse;
    expert?: {
        id: string;
        name: string;
        email: string;
        specializations: string[];
    };
}

export interface CommissionData {
    id: string;
    apporteur_id: string;
    prospect_id: string;
    client_produit_eligible_id?: string;
    base_amount: number;
    commission_rate: number;
    commission_amount: number;
    status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
    payment_date?: string;
    payment_reference?: string;
    calculation_date: string;
    notes?: string;
    created_at: string;
    
    // Relations
    prospect?: ProspectResponse;
    client_produit_eligible?: {
        id: string;
        client_id: string;
        produit_id: string;
        statut: string;
        montantFinal: number;
    };
}

export interface ExpertData {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company_name?: string;
    specializations: string[];
    location?: string;
    rating: number;
    total_assignments: number;
    completed_assignments: number;
    success_rate: number;
    status: string;
    created_at: string;
}

export interface ApporteurStats {
    period: string;
    total_prospects: number;
    converted_prospects: number;
    conversion_rate: number;
    total_commissions: number;
    avg_commission_per_prospect: number;
    top_performing_experts: Array<{
        expert_id: string;
        expert_name: string;
        prospects_count: number;
        conversion_rate: number;
        total_commissions: number;
    }>;
    prospects_by_source: Array<{
        source: string;
        count: number;
        conversion_rate: number;
    }>;
    prospects_by_month: Array<{
        month: string;
        prospects: number;
        conversions: number;
    }>;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}

export interface ProspectFilters extends PaginationParams {
    status?: string;
    interest_level?: string;
    budget_range?: string;
    timeline?: string;
    expert_id?: string;
    source?: string;
    date_from?: string;
    date_to?: string;
}

export interface CommissionFilters extends PaginationParams {
    status?: string;
    date_from?: string;
    date_to?: string;
}

export interface NotificationFilters extends PaginationParams {
    status?: string;
    notification_type?: string;
    priority?: string;
}

// Types pour les formulaires
export interface ApporteurRegistrationData {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    company_name: string;
    company_type: 'independant' | 'expert' | 'call_center' | 'societe_commerciale';
    siren?: string;
    password: string;
    confirm_password?: string; // Optionnel car pas toujours fourni par l'admin
}

export interface ApporteurProfileData {
    first_name: string;
    last_name: string;
    phone: string;
    company_name: string;
    company_type: string;
    siren?: string;
}

// Types pour les réponses API
export interface CreateProspectResponse {
    prospect: ProspectResponse;
    notification_sent?: boolean;
    expert_notified?: boolean;
}

export interface AcceptProspectResponse {
    prospect: ProspectResponse;
    meeting_suggested?: boolean;
    notification_sent?: boolean;
}

export interface DeclineProspectResponse {
    prospect: ProspectResponse;
    reason: string;
    notification_sent?: boolean;
}

export interface ScheduleMeetingResponse {
    meeting: ProspectMeetingData;
    notifications_sent: string[];
}

export interface ConvertProspectResponse {
    client_id: string;
    prospect_id: string;
    dossier_created?: boolean;
    commission_calculated?: boolean;
}

// Types pour les erreurs
export interface ApporteurError {
    code: string;
    message: string;
    field?: string;
    details?: any;
}

export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}

// Types pour les webhooks
export interface WebhookData {
    event: string;
    timestamp: string;
    data: any;
}

export interface ProspectWebhookData extends WebhookData {
    event: 'prospect_created' | 'prospect_updated' | 'prospect_converted' | 'prospect_lost';
    data: ProspectResponse;
}

export interface MeetingWebhookData extends WebhookData {
    event: 'meeting_scheduled' | 'meeting_completed' | 'meeting_cancelled';
    data: ProspectMeetingData;
}

export interface CommissionWebhookData extends WebhookData {
    event: 'commission_calculated' | 'commission_confirmed' | 'commission_paid';
    data: CommissionData;
}
