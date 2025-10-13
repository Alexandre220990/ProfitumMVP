/**
 * 📁 Documents Client - Page complète
 * Utilise UnifiedDocumentManager avec userType="client"
 */

import { UnifiedDocumentManager } from '@/components/documents/UnifiedDocumentManager';

export default function ClientDocumentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <UnifiedDocumentManager userType="client" />
    </div>
  );
}

