import { AdminDashboard } from '../../components/admin/AdminDashboard';

/**
 * Page Dashboard Admin
 * Utilise les vues SQL pour afficher les données globales
 */
export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto py-6">
      <AdminDashboard />
    </div>
  );
}