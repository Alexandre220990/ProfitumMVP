import { UnifiedCalendar } from '../../components/UnifiedCalendar';

/**
 * Page Agenda Expert
 * Utilise le composant UnifiedCalendar pour affichage multi-types
 */
export default function AgendaExpert() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-6">
      <div className="max-w-7xl mx-auto">
        <UnifiedCalendar 
          showHeader={true}
          showViewSelector={true}
          enableRealTime={true}
          defaultView="week"
        />
      </div>
    </div>
  );
}
