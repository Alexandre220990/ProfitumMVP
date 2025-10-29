import { UnifiedCalendar } from '../../components/UnifiedCalendar';

/**
 * Page Agenda Apporteur
 * Utilise le composant UnifiedCalendar pour affichage multi-types
 */
export default function AgendaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
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
