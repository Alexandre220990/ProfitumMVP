import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DocumentPaginationProps { currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void }

export default function DocumentPagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }: DocumentPaginationProps) { // Calculer les éléments affichés
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Afficher toutes les pages si il y en a peu
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i); }
    } else { // Logique pour afficher les pages avec ellipsis
      if (currentPage <= 3) {
        // Début : 1, 2, 3, 4, ..., last
        for (let i = 1; i <= 4; i++) {
          pages.push(i); }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) { // Fin : 1, ..., last-3, last-2, last-1, last
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i); }
      } else { // Milieu : 1, ..., current-1, current, current+1, ..., last
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages); }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) { return null; }

  return (
    <div className="flex items-center justify-between px-2 py-4">
      { /* Informations sur les éléments affichés */ }
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <span>
          Affichage de { startItem } à { endItem } sur { totalItems } documents
        </span>
      </div>

      { /* Contrôles de pagination */ }
      <div className="flex items-center space-x-6">
        { /* Sélection du nombre d'éléments par page */ }
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Par page: </span>
          <Select
            value={ itemsPerPage.toString() }
            onValueChange={ (value) => onItemsPerPageChange(parseInt(value)) }
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        { /* Navigation des pages */ }
        <div className="flex items-center space-x-1">
          { /* Bouton précédent */ }
          <Button
            variant="outline"
            size="sm"
            onClick={ () => onPageChange(currentPage - 1) }
            disabled={ currentPage === 1 }
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          { /* Numéros de page */ }
          { pageNumbers.map((page, index) => (
            <div key={index }>
              { page === '...' ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-8 w-8 p-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline" }
                  size="sm"
                  onClick={ () => onPageChange(page as number) }
                  className="h-8 w-8 p-0"
                >
                  { page }
                </Button>
              )}
            </div>
          ))}

          { /* Bouton suivant */ }
          <Button
            variant="outline"
            size="sm"
            onClick={ () => onPageChange(currentPage + 1) }
            disabled={ currentPage === totalPages }
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 