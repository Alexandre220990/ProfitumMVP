import { UnifiedAgendaView } from '../components/rdv/UnifiedAgendaView';

/**
 * Page Agenda Admin
 * Utilise le composant UnifiedAgendaView pour affichage multi-types
 */
export default function AgendaAdmin() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-6">
      <UnifiedAgendaView />
    </div>
  );
}
