import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSignature, BarChart3, BookOpen, Clock, Eye, Share2, Euro, TrendingUp, Clock as ClockIcon, FileText, CheckCircle, Download, Calendar } from "lucide-react";
import { CharteDocument, AuditDocument, SimulationDocument, GuideDocument } from "@/types/client-documents";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DocumentGridProps { documents: (CharteDocument | AuditDocument | SimulationDocument | GuideDocument)[];
  type: string;
  onView?: (document: any) => void;
  onDownload?: (document: any) => void;
  onShare?: (document: any) => void }

const getDocumentIcon = (type: string) => { switch (type) {
    case 'charte':
      return FileSignature;
    case 'audit':
      return BarChart3;
    case 'simulation':
      return Clock;
    case 'guide':
      return BookOpen;
    default: return FileText; }
};

const getStatusColor = (status: string) => { switch (status) {
    case 'signée':
    case 'finalisé':
    case 'validé':
    case 'complétée':
      return 'bg-green-100 text-green-800';
    case 'en_cours':
      return 'bg-blue-100 text-blue-800';
    case 'en_attente':
      return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800'; }
};

const getStatusIcon = (status: string) => { switch (status) {
    case 'signée':
    case 'finalisé':
    case 'validé':
    case 'complétée':
      return CheckCircle;
    case 'en_cours':
      return ClockIcon;
    default: return ClockIcon; }
};

const formatDate = (dateString: string) => { try {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
  } catch { return 'Date invalide'; }
};

const formatCurrency = (amount: number) => { 
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', 
    currency: 'EUR' 
  }).format(amount);
};

export default function DocumentGrid({ documents, type, onView, onDownload, onShare }: DocumentGridProps) { 
  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun document trouvé
        </h3>
        <p className="text-gray-500">
          {type === 'all' 
            ? 'Vous n\'avez pas encore de documents.'
            : `Vous n'avez pas encore de documents de type "${type }".`
          }
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-3 gap-6">
      { documents.map((doc) => {
        const Icon = getDocumentIcon(type);
        const StatusIcon = getStatusIcon(doc.status || '');
        
        return (
          <Card key={doc.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold line-clamp-2">
                      { type === 'charte' && 'produit' in doc 
                        ? `Charte ${doc.produit}`
                        : type === 'audit' && 'name' in doc
                        ? doc.name
                        : type === 'simulation' && 'produitEligible' in doc
                        ? `Simulation ${ doc.produitEligible }`
                        : type === 'guide' && 'title' in doc
                        ? doc.title
                        : 'Document'
                      }
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        { formatDate(
                          type === 'charte' && 'dateSignature' in doc
                            ? doc.dateSignature
                            : type === 'audit' && 'createdAt' in doc
                            ? doc.createdAt
                            : type === 'simulation' && 'dateSimulation' in doc
                            ? doc.dateSimulation
                            : type === 'guide' && 'lastModified' in doc
                            ? doc.lastModified
                            : new Date().toISOString()
                        ) }
                      </span>
                    </div>
                  </div>
                </div>
                <Badge className={ getStatusColor(doc.status || '') }>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  { doc.status }
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              { /* Informations spécifiques par type */ }
              <div className="space-y-3">
                { type === 'charte' && 'gainsPotentiels' in doc && (
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(doc.gainsPotentiels) }
                    </span>
                    <span className="text-xs text-gray-500">gains potentiels</span>
                  </div>
                )}

                { type === 'audit' && 'audit' in doc && doc.audit && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-600">
                        {formatCurrency(doc.audit.potential_gain) }
                      </span>
                      <span className="text-xs text-gray-500">potentiel</span>
                    </div>
                    { doc.audit.expert && (
                      <div className="text-xs text-gray-500">
                        Expert: {doc.audit.expert.name}
                      </div>
                    )}
                  </div>
                )}

                { type === 'simulation' && 'scoreEligibilite' in doc && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-600">
                        {doc.scoreEligibilite }%
                      </span>
                      <span className="text-xs text-gray-500">éligibilité</span>
                    </div>
                    { doc.gainsEstimés > 0 && (
                      <div className="flex items-center gap-2">
                        <Euro className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(doc.gainsEstimés) }
                        </span>
                        <span className="text-xs text-gray-500">estimés</span>
                      </div>
                    )}
                  </div>
                )}

                { type === 'guide' && 'readTime' in doc && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm text-indigo-600">
                      {doc.readTime } min de lecture
                    </span>
                  </div>
                )}
              </div>

              { /* Actions */ }
              <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                { onView && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(doc) }
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                )}
                { onDownload && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDownload(doc) }
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Télécharger
                  </Button>
                )}
                { onShare && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onShare(doc) }
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 