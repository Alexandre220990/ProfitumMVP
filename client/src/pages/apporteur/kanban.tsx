import { useRouter } from 'next/router';
import KanbanBoard from '../../components/apporteur/KanbanBoard';

/**
 * Page Pipeline Kanban
 * Vue Kanban pour gérer le pipeline des prospects
 */
export default function KanbanPage() {
  const router = useRouter();
  const { apporteurId } = router.query;

  if (!apporteurId || typeof apporteurId !== 'string') {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ID Apporteur Requis</h2>
            <p className="text-gray-600">Veuillez vous connecter pour accéder au pipeline.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pipeline Kanban</h1>
        <p className="text-gray-600 mt-2">Gérez vos prospects par étapes du processus de vente</p>
      </div>
      <KanbanBoard />
    </div>
  );
}
