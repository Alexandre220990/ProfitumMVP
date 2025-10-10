import { UnifiedAgendaView } from '../../components/rdv/UnifiedAgendaView';

/**
 * Page Agenda Apporteur
 * Utilise le composant UnifiedAgendaView pour affichage multi-types
 */
export default function AgendaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <UnifiedAgendaView />
    </div>
  );
}
