import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, List, BookOpen, Tag, Download, Calendar } from "lucide-react";

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

  const handleExportPDF = async () => {
    if (!document) return;
    
    try {
      // Utiliser html2pdf.js pour l'export PDF
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = window.document.createElement('div');
      element.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            ${document.title}
          </h1>
          <p style="color: #666; font-style: italic;">${document.description}</p>
          <hr style="margin: 20px 0;">
          ${document.content}
        </div>
      `;
      
      const opt = {
        margin: 1,
        filename: `${document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Erreur lors de l\'export PDF: ', error);
      // Fallback : ouvrir dans une nouvelle fenêtre pour impression
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${document.title}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px }
                h1 { color: #333; border-bottom: 2px solid #007bff }
                h2, h3 { color: #555 }
                ul { margin: 10px 0 }
                li { margin: 5px 0 }
              </style>
            </head>
            <body>
              <h1>${document.title}</h1>
              <p><em>${document.description}</em></p>
              <hr>
              ${document.content}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

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
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </Button>
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