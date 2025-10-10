import { UnifiedAgendaView } from '../../components/rdv/UnifiedAgendaView';

/**
 * Page Agenda Expert
 * Utilise le composant UnifiedAgendaView pour affichage multi-types
 */
export default function AgendaExpert() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-6">
      <UnifiedAgendaView />
    </div>
  );
}
