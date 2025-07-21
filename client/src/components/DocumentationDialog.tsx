import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, List, BookOpen, Tag, Calendar } from "lucide-react";

interface DocumentationDialogProps {
  open: boolean;
  onClose: () => void;
  document: {
    id: string;
    title: string;
    category: string;
    description: string;
    content: string;
    filePath: string;
    lastModified: Date;
    tags: string[];
    readTime: number;
  } | null;
}

interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
}

export default function DocumentationDialog({ open, onClose, document }: DocumentationDialogProps) {
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([]);
  const [showTOC, setShowTOC] = useState(false);

  useEffect(() => {
    if (document && typeof window !== 'undefined') {
      // Extraire la table des matières du contenu HTML
      const tempDiv = window.document.createElement('div');
      tempDiv.innerHTML = document.content;
      const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
      
      const toc: TableOfContentsItem[] = [];
      headings.forEach((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;
        toc.push({ id, title: heading.textContent || '', level: parseInt(heading.tagName.charAt(1)) });
      });
      
      setTableOfContents(toc);
    }
  }, [document]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // SUPPRIMER handleExportPDF

  const scrollToSection = (id: string) => {
    const element = window.document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'overview': 'bg-blue-500',
      'security': 'bg-red-500',
      'iso': 'bg-green-500',
      'guides': 'bg-purple-500',
      'tests': 'bg-yellow-500',
      'performance': 'bg-orange-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div className="flex-1">
            <DialogTitle className="text-xl font-bold text-gray-900">
              {document.title}
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              {document.description}
            </DialogDescription>
          </div>
          <div className="flex items-center space-x-2">
            {tableOfContents.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTOC(!showTOC)}
                className="flex items-center space-x-1"
              >
                <List className="w-4 h-4" />
                <span>Sommaire</span>
              </Button>
            )}
            {/* SUPPRIMER le bouton PDF */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Métadonnées du document */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{document.readTime} min de lecture</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Modifié le {formatDate(document.lastModified)}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={getCategoryColor(document.category)}>
              {document.category}
            </Badge>
          </div>
        </div>

        {/* Tags */}
        {document.tags.length > 0 && (
          <div className="flex items-center space-x-2 mb-4">
            <Tag className="w-4 h-4 text-gray-500" />
            <div className="flex flex-wrap gap-1">
              {document.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Table des matières */}
        {showTOC && tableOfContents.length > 0 && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">Table des matières</h3>
            <div className="space-y-1">
              {tableOfContents.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`block text-left text-sm text-blue-700 hover:text-blue-900 hover:underline ${
                    item.level === 1 ? 'font-semibold' : 
                    item.level === 2 ? 'ml-4' : 'ml-8'
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Contenu du document */}
        <div className="overflow-y-auto max-h-[60vh] pr-4">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: document.content }}
          />
        </div>

        {/* Pied de page */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Fichier : {document.filePath}</span>
            <span>ID : {document.id}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 