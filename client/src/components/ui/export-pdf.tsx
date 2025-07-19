import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Label } from "./label";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { RefreshCw, Plus, Trash2, Edit, Save, FileText, Download } from "lucide-react";

// Types pour les templates PDF
interface PDFTemplate { 
  id: string;
  name: string;
  description: string;
  category: 'report' | 'invoice' | 'contract' | 'certificate' | 'custom';
  type: 'dossier' | 'audit' | 'expert' | 'client' | 'business' | 'compliance';
  sections: PDFSection[];
  variables: PDFVariable[];
  styling: PDFStyling;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string 
}

interface PDFSection { 
  id: string;
  name: string;
  type: 'header' | 'content' | 'table' | 'chart' | 'footer' | 'custom';
  content: string;
  order: number;
  required: boolean;
  conditional?: string 
}

interface PDFVariable { 
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'percentage' | 'boolean' | 'array' | 'object';
  defaultValue?: any;
  required: boolean;
  description: string 
}

interface PDFStyling { 
  fontFamily: string;
  fontSize: number;
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  watermark?: string;
  headerStyle: 'simple' | 'professional' | 'modern' | 'classic';
  footerStyle: 'simple' | 'detailed' | 'minimal' 
}

interface PDFExport { 
  id: string;
  templateId: string;
  templateName: string;
  data: Record<string, any>;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  createdAt: string;
  completedAt?: string;
  fileSize?: number;
  pages?: number 
}

interface PDFReport { 
  id: string;
  name: string;
  type: 'dossier' | 'audit' | 'expert' | 'client' | 'business' | 'compliance';
  data: any;
  template: PDFTemplate;
  generatedAt: string;
  expiresAt?: string;
  accessCount: number;
  lastAccessed?: string 
}

export const ExportPDF: React.FC = () => { 
  const [templates, setTemplates] = useState<PDFTemplate[]>([]);
  const [exports, setExports] = useState<PDFExport[]>([]);
  const [reports, setReports] = useState<PDFReport[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportData, setExportData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Charger les données
  useEffect(() => { 
    loadTemplates();
    loadExports();
    loadReports(); 
  }, []);

  const loadTemplates = async () => { 
    try {
      // TODO: Remplacer par l'API réelle
      const mockTemplates: PDFTemplate[] = [
        {
          id: '1', 
          name: 'Rapport Dossier Standard', 
          description: 'Rapport complet pour les dossiers clients', 
          category: 'report', 
          type: 'dossier', 
          sections: [
            {
              id: 'header', 
              name: 'En-tête', 
              type: 'header', 
              content: 'Rapport Dossier - {clientName}',
              order: 1,
              required: true
            },
            { 
              id: 'summary', 
              name: 'Résumé', 
              type: 'content', 
              content: 'Dossier {dossierId} - {productType}',
              order: 2,
              required: true
            },
            { 
              id: 'details', 
              name: 'Détails', 
              type: 'table', 
              content: 'Tableau des informations détaillées', 
              order: 3, 
              required: true 
            },
            { 
              id: 'footer', 
              name: 'Pied de page', 
              type: 'footer', 
              content: 'Généré le {date} par Profitum',
              order: 4,
              required: true
            }
          ],
          variables: [
            { 
              id: 'clientName', 
              name: 'Nom du client', 
              type: 'text', 
              required: true, 
              description: 'Nom complet du client' 
            },
            { 
              id: 'dossierId', 
              name: 'ID du dossier', 
              type: 'text', 
              required: true, 
              description: 'Identifiant unique du dossier' 
            },
            { 
              id: 'productType', 
              name: 'Type de produit', 
              type: 'text', 
              required: true, 
              description: 'Type de produit (TICPE, URSSAF, etc.)' 
            },
            { 
              id: 'date', 
              name: 'Date', 
              type: 'date', 
              required: true, 
              description: 'Date de génération' 
            }
          ],
          styling: { 
            fontFamily: 'Arial', 
            fontSize: 12, 
            primaryColor: '#2563eb', 
            secondaryColor: '#64748b', 
            headerStyle: 'professional', 
            footerStyle: 'detailed' 
          },
          isDefault: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        },
        { 
          id: '2', 
          name: 'Certificat de Conformité', 
          description: 'Certificat de conformité ISO 27001', 
          category: 'certificate', 
          type: 'compliance', 
          sections: [
            {
              id: 'header', 
              name: 'En-tête', 
              type: 'header', 
              content: 'Certificat de Conformité ISO 27001', 
              order: 1, 
              required: true 
            },
            { 
              id: 'content', 
              name: 'Contenu', 
              type: 'content', 
              content: 'Ce certificat atteste que {companyName} respecte les standards ISO 27001',
              order: 2,
              required: true
            },
            { 
              id: 'footer', 
              name: 'Pied de page', 
              type: 'footer', 
              content: 'Certifié le {certificationDate}',
              order: 3,
              required: true
            }
          ],
          variables: [
            { 
              id: 'companyName', 
              name: 'Nom de l\'entreprise', 
              type: 'text', 
              required: true, 
              description: 'Nom de l\'entreprise certifiée' 
            },
            { 
              id: 'certificationDate', 
              name: 'Date de certification', 
              type: 'date', 
              required: true, 
              description: 'Date de certification' 
            }
          ],
          styling: { 
            fontFamily: 'Times New Roman', 
            fontSize: 14, 
            primaryColor: '#059669', 
            secondaryColor: '#374151', 
            headerStyle: 'classic', 
            footerStyle: 'detailed' 
          },
          isDefault: false,
          createdAt: '2024-01-10T00:00:00Z',
          updatedAt: '2024-01-10T00:00:00Z'
        }
      ];

      setTemplates(mockTemplates);
    } catch (error) { 
      console.error('Erreur lors du chargement des templates: ', error); 
    }
  };

  const loadExports = async () => { 
    try {
      const mockExports: PDFExport[] = [
        {
          id: '1', 
          templateId: '1', 
          templateName: 'Rapport Dossier Standard', 
          data: {
            clientName: 'Jean Dupont', 
            dossierId: 'DOS-2024-001', 
            productType: 'TICPE', 
            date: new Date().toISOString() 
          },
          status: 'completed',
          progress: 100,
          downloadUrl: '/api/exports/1/download',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          fileSize: 245760,
          pages: 3
        },
        { 
          id: '2', 
          templateId: '2', 
          templateName: 'Certificat de Conformité', 
          data: {
            companyName: 'Profitum SAS', 
            certificationDate: new Date().toISOString() 
          },
          status: 'generating',
          progress: 65,
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        }
      ];

      setExports(mockExports);
    } catch (error) { 
      console.error('Erreur lors du chargement des exports: ', error); 
    }
  };

  const loadReports = async () => { 
    try {
      const mockReports: PDFReport[] = [{
          id: '1', 
          name: 'Rapport Mensuel Janvier 2024', 
          type: 'business', 
          data: {
            revenue: 45600, 
            newClients: 25, 
            completedDossiers: 45 
          },
          template: templates[0],
          generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          accessCount: 12,
          lastAccessed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      setReports(mockReports);
    } catch (error) { 
      console.error('Erreur lors du chargement des rapports: ', error); 
    }
  };

  const generatePDF = async (templateId: string, data: Record<string, any>) => { 
    setLoading(true);
    try {
      const newExport: PDFExport = {
        id: Date.now().toString(), 
        templateId, 
        templateName: templates.find(t => t.id === templateId)?.name || '', 
        data, 
        status: 'generating', 
        progress: 0, 
        createdAt: new Date().toISOString() 
      };

      setExports(prev => [newExport, ...prev]);
      setShowExportDialog(false);

      // Simuler la génération
      setTimeout(() => {
        setExports(prev => 
          prev.map(exp => 
            exp.id === newExport.id 
              ? { 
                  ...exp, 
                  status: 'completed', 
                  progress: 100, 
                  downloadUrl: `/api/exports/${exp.id}/download`,
                  completedAt: new Date().toISOString(),
                  fileSize: 245760,
                  pages: 3
                }
              : exp
          )
        );
        setLoading(false);
      }, 3000);

    } catch (error) {
      console.error('Erreur lors de la génération PDF: ', error);
      setLoading(false);
    }
  };

  const downloadPDF = async (exportId: string) => { 
    try {
      const exportItem = exports.find(exp => exp.id === exportId);
      if (exportItem?.downloadUrl) {
        window.open(exportItem.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement: ', error);
    }
  };

  const deleteExport = (exportId: string) => { 
    setExports(prev => prev.filter(exp => exp.id !== exportId)); 
  };

  const getStatusColor = (status: string) => { 
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'generating': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Fonction supprimée car non utilisée

  const formatFileSize = (bytes: number) => { 
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredExports = exports.filter(exp => {
    if (filter !== 'all' && exp.status !== filter) return false;
    if (search && !exp.templateName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Export PDF</h1>
          <p className="text-muted-foreground">
            Générez et gérez vos exports PDF
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowTemplateEditor(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button onClick={() => setShowExportDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel Export
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher dans les exports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="generating">En cours</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contenu principal */}
      <Tabs defaultValue="exports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="exports">Exports</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        {/* Exports */}
        <TabsContent value="exports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exports PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredExports.map((exportItem) => (
                  <div key={exportItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileText className="w-8 h-8 text-blue-500" />
                      
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {exportItem.templateName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Créé le {new Date(exportItem.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getStatusColor(exportItem.status)}`}>
                          {exportItem.status === 'completed' ? 'Terminé' :
                           exportItem.status === 'generating' ? 'En cours' :
                           exportItem.status === 'pending' ? 'En attente' : 'Échoué'}
                        </div>
                        {exportItem.status === 'generating' && (
                          <div className="text-sm text-gray-600">
                            {exportItem.progress}%
                          </div>
                        )}
                        {exportItem.status === 'completed' && exportItem.fileSize && (
                          <div className="text-sm text-gray-600">
                            {formatFileSize(exportItem.fileSize)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {exportItem.status === 'completed' && (
                          <Button size="sm" variant="outline" onClick={() => downloadPDF(exportItem.id)}>
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => deleteExport(exportItem.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rapports */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rapports Générés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileText className="w-8 h-8 text-blue-500" />
                      
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {report.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Généré le {new Date(report.generatedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {report.accessCount} accès
                        </div>
                        {report.lastAccessed && (
                          <div className="text-sm text-gray-600">
                            Dernier accès: {new Date(report.lastAccessed).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                      
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Export */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Exporter PDF</DialogTitle>
            <DialogDescription>
              Sélectionnez un template et remplissez les données
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="template">Template</Label>
              <Select
                value={selectedTemplate?.id || ''}
                onValueChange={(value: string) => setSelectedTemplate(templates.find(t => t.id === value) || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedTemplate && (
              <div className="space-y-4">
                <h4 className="font-medium">Variables requises</h4>
                {selectedTemplate.variables.map((variable) => (
                  <div key={variable.id}>
                    <Label htmlFor={variable.id}>
                      {variable.name}
                      {variable.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Input
                      id={variable.id}
                      placeholder={variable.description}
                      value={exportData[variable.id] || ''}
                      onChange={(e) => setExportData(prev => ({
                        ...prev, 
                        [variable.id]: e.target.value 
                      }))}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => selectedTemplate && generatePDF(selectedTemplate.id, exportData)}
              disabled={!selectedTemplate || loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Générer PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Template Editor */}
      <Dialog open={showTemplateEditor} onOpenChange={setShowTemplateEditor}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Modifier Template' : 'Nouveau Template'}
            </DialogTitle>
            <DialogDescription>
              Créer ou modifier un template PDF
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="templateName">Nom du template</Label>
                <Input
                  id="templateName"
                  placeholder="Nom du template"
                  defaultValue={selectedTemplate?.name}
                />
              </div>
              
              <div>
                <Label htmlFor="templateCategory">Catégorie</Label>
                <Select defaultValue={selectedTemplate?.category || 'report'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="report">Rapport</SelectItem>
                    <SelectItem value="invoice">Facture</SelectItem>
                    <SelectItem value="contract">Contrat</SelectItem>
                    <SelectItem value="certificate">Certificat</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="templateDescription">Description</Label>
              <Textarea
                id="templateDescription"
                placeholder="Description du template"
                defaultValue={selectedTemplate?.description}
              />
            </div>
            
            <div>
              <Label>Sections</Label>
              <div className="space-y-2 mt-2">
                {selectedTemplate?.sections.map((section) => (
                  <div key={section.id} className="flex items-center space-x-2 p-2 border rounded">
                    <span className="flex-1">{section.name}</span>
                    <Badge variant="outline">{section.type}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateEditor(false)}>
              Annuler
            </Button>
            <Button onClick={() => setShowTemplateEditor(false)}>
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 