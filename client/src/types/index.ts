// Export centralisé de tous les types

// Types expert
export type {
  Expert
} from './expert';

// Types analytics
export type {
  ExpertAnalytics,
  AnalyticsFilter,
  AnalyticsExport
} from './analytics';

// Types business
export type {
  ExpertBusiness,
  RevenueData,
  ProductPerformance,
  ClientPerformance,
  BusinessMetrics
} from './business';

// Types assignations
export type {
  Assignment,
  AssignmentStats,
  AssignmentFilter,
  AssignmentAction
} from './assignment';

// Types agenda
export type {
  AgendaEvent,
  AgendaFilter,
  AgendaStats,
  AgendaAction
} from './agenda';

// Types notifications
export type {
  ExpertNotification,
  NotificationStats,
  NotificationFilter,
  NotificationAction
} from './notification';

// Types préférences
export type {
  ExpertPreferences,
  PreferenceCategory,
  PreferenceSetting
} from './preferences'; 

// Types cabinets
export type {
  Cabinet,
  CabinetMember,
  CabinetMemberRole,
  CabinetProduct,
  CabinetApporteur,
  CabinetShare,
  CabinetProductPayload,
  CabinetKPIs
} from './cabinets';