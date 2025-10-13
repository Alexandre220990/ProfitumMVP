/**
 * 📁 Documents Apporteur - Page complète
 * Utilise UnifiedDocumentManager avec userType="apporteur"
 */

import { UnifiedDocumentManager } from '@/components/documents/UnifiedDocumentManager';

export default function ApporteurDocumentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <UnifiedDocumentManager userType="apporteur" />
    </div>
  );
}

