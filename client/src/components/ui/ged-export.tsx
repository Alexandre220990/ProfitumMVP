import { useRef, useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Checkbox } from "./checkbox";
import { Label } from "./label";
import { Search, Loader2, Download, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Document { id: string;
  title: string;
  content: string;
  category: string;
  labels: string[];
  created_at: string;
  updated_at: string;
  read_time: number }

interface ExportOptions { format: 'pdf' | 'markdown';
  includeMetadata: boolean;
  includeTableOfContents: boolean;
  includePageNumbers: boolean;
  includeWatermark: boolean;
  pageSize: 'a4' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  margin: 'small' | 'medium' | 'large';
  fontSize: 'small' | 'medium' | 'large' }

interface SearchResult { document: Document;
  relevance: number;
  highlights: string[] }

export const GEDExport: React.FC<{ documents: Document[];
  onExport: (documents: Document[], options: ExportOptions) => Promise<void> }> = ({ documents, onExport }) => { const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeMetadata: true,
    includeTableOfContents: true,
    includePageNumbers: true,
    includeWatermark: false,
    pageSize: 'a4',
    orientation: 'portrait',
    margin: 'medium',
    fontSize: 'medium'
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Recherche sémantique
  const performSemanticSearch = async (query: string) => { if (!query.trim()) {
      setSearchResults([]);
      return; }

    setIsSearching(true);
    
    try { // Simulation de recherche sémantique
      // TODO: Remplacer par l'API de recherche réelle
      const results: SearchResult[] = documents
        .map(doc => {
          const relevance = calculateRelevance(doc, query);
          const highlights = extractHighlights(doc.content, query);
          
          return {
            document: doc, relevance, highlights };
        })
        .filter(result => result.relevance > 0.1)
        .sort((a, b) => b.relevance - a.relevance);

      setSearchResults(results);
    } catch (error) { console.error('Erreur lors de la recherche: ', error); } finally { setIsSearching(false); }
  };

  // Calcul de pertinence sémantique
  const calculateRelevance = (document: Document, query: string): number => { const queryWords = query.toLowerCase().split(/\s+/);
    const content = document.content.toLowerCase();
    const title = document.title.toLowerCase();
    
    let relevance = 0;
    
    // Pertinence du titre (poids plus important)
    queryWords.forEach(word => {
      if (title.includes(word)) relevance += 0.3;
      if (content.includes(word)) relevance += 0.1; });
    
    // Pertinence des labels
    document.labels.forEach(label => { if (query.toLowerCase().includes(label.toLowerCase())) {
        relevance += 0.2; }
    });
    
    // Pertinence de la catégorie
    if (query.toLowerCase().includes(document.category.toLowerCase())) { relevance += 0.15; }
    
    return Math.min(relevance, 1);
  };

  // Extraction des passages pertinents
  const extractHighlights = (content: string, query: string): string[] => { const queryWords = query.toLowerCase().split(/\s+/);
    const sentences = content.split(/[.!?]+/);
    const highlights: string[] = [];
    
    sentences.forEach(sentence => {
      const sentenceLower = sentence.toLowerCase();
      const matchCount = queryWords.filter(word => sentenceLower.includes(word)).length;
      
      if (matchCount > 0) {
        const relevance = matchCount / queryWords.length;
        if (relevance > 0.3) {
          highlights.push(sentence.trim()); }
      }
    });
    
    return highlights.slice(0, 3); // Limiter à 3 passages
  };

  // Gestion de la recherche avec debounce
  const handleSearch = (query: string) => { setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current); }
    
    searchTimeoutRef.current = setTimeout(() => { performSemanticSearch(query); }, 300);
  };

  // Sélection/désélection de documents
  const toggleDocument = (documentId: string) => { const newSelected = new Set(selectedDocuments);
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId); } else { newSelected.add(documentId); }
    setSelectedDocuments(newSelected);
  };

  // Sélection de tous les documents
  const selectAll = () => { const allIds = searchQuery ? searchResults.map(r => r.document.id) : documents.map(d => d.id);
    setSelectedDocuments(new Set(allIds)); };

  // Désélection de tous les documents
  const deselectAll = () => { setSelectedDocuments(new Set()); };

  // Export des documents sélectionnés
  const handleExport = async () => { if (selectedDocuments.size === 0) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      const selectedDocs = documents.filter(d => selectedDocuments.has(d.id));
      
      // Simulation de progression
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90; }
          return prev + 10;
        });
      }, 200);
      
      await onExport(selectedDocs, exportOptions);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      setTimeout(() => { setShowExportDialog(false);
        setIsExporting(false);
        setExportProgress(0); }, 1000);
      
    } catch (error) { console.error('Erreur lors de l\'export: ', error);
      setIsExporting(false);
      setExportProgress(0); }
  };

  const displayDocuments = searchQuery ? searchResults.map(r => r.document) : documents;

  return (
    <div className="space-y-6">
      { /* Barre de recherche */ }
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Recherche sémantique dans les documents..."
                value={ searchQuery }
                onChange={ (e) => handleSearch(e.target.value) }
                className="pl-10"
              />
              { isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
              ) }
            </div>
            <Button
              variant="outline"
              onClick={ () => setShowExportDialog(true) }
              disabled={ selectedDocuments.size === 0 }
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Exporter ({ selectedDocuments.size })</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      { /* Actions de sélection */ }
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={ selectAll }>
            Tout sélectionner
          </Button>
          <Button variant="outline" size="sm" onClick={ deselectAll }>
            Tout désélectionner
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          { selectedDocuments.size } document(s) sélectionné(s) sur { displayDocuments.length }
        </div>
      </div>

      { /* Liste des documents */ }
      <div className="space-y-2">
        { displayDocuments.map((document) => {
          const isSelected = selectedDocuments.has(document.id);
          const searchResult = searchResults.find(r => r.document.id === document.id);
          
          return (<Card
              key={document.id }
              className={ cn(
                'cursor-pointer transition-all duration-200', isSelected && 'ring-2 ring-blue-500 bg-blue-50 dark: bg-blue-900/20') }
              onClick={ () => toggleDocument(document.id) }
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <Checkbox
                    checked={ isSelected }
                    onChange={ () => toggleDocument(document.id) }
                    onClick={ (e) => e.stopPropagation() }
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        { document.title }
                      </h3>
                      { searchResult && (
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(searchResult.relevance * 100) }% pertinent
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark: text-gray-400 mb-2">
                      <span>{ document.category }</span>
                      <span>•</span>
                      <span>{ document.read_time } min de lecture</span>
                      <span>•</span>
                      <span>Mis à jour le { new Date(document.updated_at).toLocaleDateString() }</span>
                    </div>
                    
                    { document.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {document.labels.map((label) => (
                          <Badge key={label } variant="outline" className="text-xs">
                            { label }
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    { searchResult && searchResult.highlights.length > 0 && (
                      <div className="mt-2 p-2 bg-yellow-50 dark: bg-yellow-900/20 rounded text-sm">
                        <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                          Passages pertinents :
                        </div>
                        {searchResult.highlights.map((highlight, index) => (
                          <div key={index} className="text-yellow-700 dark:text-yellow-300">
                            "...{highlight}..."
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      { /* Dialog d'export */ }
      <Dialog open={ showExportDialog } onOpenChange={ setShowExportDialog }>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Exporter en PDF</span>
            </DialogTitle>
            <DialogDescription>
              Configurez les options d'export pour { selectedDocuments.size } document(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            { /* Options de format */ }
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Taille de page</Label>
                <Select
                  value={ exportOptions.pageSize }
                  onValueChange={ (value: 'a4' | 'letter' | 'legal') =>
                    setExportOptions(prev => ({ ...prev, pageSize: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a4">A4</SelectItem>
                    <SelectItem value="letter">Letter</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Orientation</Label>
                <Select
                  value={ exportOptions.orientation }
                  onValueChange={ (value: 'portrait' | 'landscape') =>
                    setExportOptions(prev => ({ ...prev, orientation: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Paysage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            { /* Options de contenu */ }
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="metadata"
                  checked={ exportOptions.includeMetadata }
                  onCheckedChange={ (checked) =>
                    setExportOptions(prev => ({ ...prev, includeMetadata: !!checked }))
                  }
                />
                <Label htmlFor="metadata">Inclure les métadonnées</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="toc"
                  checked={ exportOptions.includeTableOfContents }
                  onCheckedChange={ (checked) =>
                    setExportOptions(prev => ({ ...prev, includeTableOfContents: !!checked }))
                  }
                />
                <Label htmlFor="toc">Inclure la table des matières</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pageNumbers"
                  checked={ exportOptions.includePageNumbers }
                  onCheckedChange={ (checked) =>
                    setExportOptions(prev => ({ ...prev, includePageNumbers: !!checked }))
                  }
                />
                <Label htmlFor="pageNumbers">Inclure la numérotation des pages</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="watermark"
                  checked={ exportOptions.includeWatermark }
                  onCheckedChange={ (checked) =>
                    setExportOptions(prev => ({ ...prev, includeWatermark: !!checked }))
                  }
                />
                <Label htmlFor="watermark">Inclure un filigrane</Label>
              </div>
            </div>

            { /* Progression d'export */ }
            { isExporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Export en cours...</span>
                  <span>{exportProgress }%</span>
                </div>
                <div className="w-full bg-gray-200 dark: bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={ { width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={ () => setShowExportDialog(false) }
              disabled={ isExporting }
            >
              Annuler
            </Button>
            <Button
              onClick={ handleExport }
              disabled={ isExporting }
              className="flex items-center space-x-2"
            >
              { isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Export...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Exporter</span>
                </>
              ) }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 