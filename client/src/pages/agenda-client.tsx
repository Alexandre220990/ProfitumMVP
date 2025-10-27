import { UnifiedCalendar } from '../components/UnifiedCalendar';

/**
 * Page Agenda Client
 * Vue calendrier avec RDV et événements
 */
export default function AgendaClient() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Agenda</h1>
        <p className="text-gray-600">
          Vue calendrier avec vos rendez-vous et événements
        </p>
      </div>

      {/* Calendrier unifié */}
      <UnifiedCalendar
        showHeader={false}
        enableRealTime={true}
        defaultView="month"
      />
    </div>
  );
}
