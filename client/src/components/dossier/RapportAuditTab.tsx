/**
 * Composant pour afficher le rapport d'audit dans l'onglet dédié
 * Affiche les détails du formulaire, récap montants, rapport détaillé et documents joints
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileCheck, DollarSign, FileText, Download, AlertCircle } from 'lucide-react';
import { get } from '@/lib/api';
import { toast } from 'sonner';

interface RapportAuditTabProps {
  dossierId: string;
}

interface AuditResult {
  completed_by: string;
  completed_at: string;
  montant_initial: number;
  montant_final: number;
  rapport_detaille: string;
  notes: string;
  client_fee_percentage_negotiated: number;
  client_fee_percentage_default: number;
  commission_negotiated: boolean;
}

interface AuditDocument {
  id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  file_type?: string;
  description?: string;
  uploaded_at: string;
}

const formatCurrency = (amount?: number) => {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function RapportAuditTab({ dossierId }: RapportAuditTabProps) {
  const [loading, setLoading] = useState(true);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditDocuments, setAuditDocuments] = useState<AuditDocument[]>([]);

  useEffect(() => {
    loadRapportAudit();
  }, [dossierId]);

  const loadRapportAudit = async () => {
    if (!dossierId) return;

    try {
      setLoading(true);
      
      // Charger les données du dossier
      const dossierResponse = await get(`/api/expert/dossier/${dossierId}`);
      if (dossierResponse.success && dossierResponse.data) {
        const dossier = dossierResponse.data as any;
        
        // Extraire le rapport d'audit depuis metadata
        if (dossier.metadata?.audit_result) {
          setAuditResult(dossier.metadata.audit_result);
        }
      }

      // Charger les documents du rapport
      const documentsResponse = await get(`/api/expert/dossier/${dossierId}/audit-documents`);
      if (documentsResponse.success && documentsResponse.data) {
        setAuditDocuments(Array.isArray(documentsResponse.data) ? documentsResponse.data : []);
      }
    } catch (error) {
      console.error('Erreur chargement rapport audit:', error);
      toast.error('Erreur lors du chargement du rapport d\'audit');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-lg border text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement du rapport d'audit...</p>
      </div>
    );
  }

  // Si aucun rapport n'existe encore
  if (!auditResult) {
    return (
      <div className="bg-white p-12 rounded-lg border text-center">
        <FileCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucun rapport d'audit disponible
        </h3>
        <p className="text-gray-600">
          Le rapport d'audit sera disponible une fois que l'expert aura finalisé l'audit technique.
        </p>
      </div>
    );
  }

  const commissionPercentage = auditResult.client_fee_percentage_negotiated ?? auditResult.client_fee_percentage_default ?? 0;
  const commissionAmount = (auditResult.montant_final || 0) * commissionPercentage;
  const montantNetClient = (auditResult.montant_final || 0) - commissionAmount;

  return (
    <div className="space-y-6">
      {/* Détails du formulaire */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-blue-600" />
            Détails du rapport d'audit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Montant initial</p>
              <p className="text-lg font-semibold text-gray-700">
                {formatCurrency(auditResult.montant_initial)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Montant final</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(auditResult.montant_final)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Commission expert</p>
              <p className="text-lg font-semibold text-blue-600">
                {formatCurrency(commissionAmount)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ({(commissionPercentage * 100).toFixed(1)}%)
                {auditResult.commission_negotiated && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Négociée
                  </Badge>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Date de finalisation</p>
              <p className="text-lg font-semibold text-gray-700">
                {formatDate(auditResult.completed_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Récap des montants récupérables */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <DollarSign className="h-5 w-5" />
            Récapitulatif des montants récupérables
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
            <span className="text-gray-700">Montant total récupérable</span>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(auditResult.montant_final)}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
            <span className="text-gray-700">Commission expert</span>
            <span className="text-xl font-semibold text-blue-600">
              - {formatCurrency(commissionAmount)}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-green-100 rounded-lg border-2 border-green-300">
            <span className="text-lg font-semibold text-green-900">Montant net pour le client</span>
            <span className="text-2xl font-bold text-green-700">
              {formatCurrency(montantNetClient)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Rapport détaillé */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Rapport d'audit détaillé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-6 rounded-lg border">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {auditResult.rapport_detaille || 'Aucun rapport détaillé disponible'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Documents joints */}
      {auditDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Documents joints au rapport
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {doc.file_name}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {doc.file_size && (
                          <p className="text-xs text-gray-500">
                            {formatFileSize(doc.file_size)}
                          </p>
                        )}
                        {doc.uploaded_at && (
                          <p className="text-xs text-gray-500">
                            {formatDate(doc.uploaded_at)}
                          </p>
                        )}
                      </div>
                      {doc.description && (
                        <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(doc.file_url, '_blank')}
                    className="ml-4"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes internes (si présentes) */}
      {auditResult.notes && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 text-sm">
              <AlertCircle className="h-4 w-4" />
              Notes internes (non visibles par le client)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-800 whitespace-pre-wrap">
              {auditResult.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

