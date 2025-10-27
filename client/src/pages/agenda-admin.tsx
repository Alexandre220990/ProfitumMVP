import { UnifiedCalendar } from '../components/UnifiedCalendar';

/**
 * Page Agenda Admin
 * Vue calendrier avec tous les RDV (clients, experts, apporteurs)
 */
export default function AgendaAdmin() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Agenda</h1>
        <p className="text-gray-600">
          Vue calendrier - Tous les rendez-vous (clients, experts, apporteurs)
        </p>
      </div>

      {/* Calendrier unifié */}
      <UnifiedCalendar
        theme="purple"
        showHeader={false}
        enableGoogleSync={true}
        enableRealTime={true}
        defaultView="month"
      />
    </div>
  );
}
