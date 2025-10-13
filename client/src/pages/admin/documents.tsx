/**
 * 📁 Documents Admin - Page complète
 * Utilise UnifiedDocumentManager avec userType="admin"
 * Vue globale sur tous les documents de tous les utilisateurs
 */

import { UnifiedDocumentManager } from '@/components/documents/UnifiedDocumentManager';

export default function AdminDocumentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <UnifiedDocumentManager userType="admin" />
    </div>
  );
}

