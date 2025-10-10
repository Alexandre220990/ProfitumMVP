import { UnifiedAgendaView } from '../components/rdv/UnifiedAgendaView';

/**
 * Page Agenda Client
 * Utilise le composant UnifiedAgendaView pour affichage multi-types
 */
export default function AgendaClient() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <UnifiedAgendaView />
    </div>
  );
}
