import { useRouter } from 'next/router';
import ProspectManagement from '../../components/apporteur/ProspectManagement';

/**
 * Page Gestion des Prospects
 * Interface complète pour gérer les prospects
 */
export default function ProspectsPage() {
  const router = useRouter();
  const { apporteurId } = router.query;

  if (!apporteurId || typeof apporteurId !== 'string') {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ID Apporteur Requis</h2>
            <p className="text-gray-600">Veuillez vous connecter pour accéder à vos prospects.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <ProspectManagement />
    </div>
  );
}
