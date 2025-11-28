import * as XLSX from 'exceljs';
import { ExcelFileData } from '../../types/import';

export class ExcelParserService {
  /**
   * Parse un fichier Excel et retourne les colonnes et lignes
   */
  async parseFile(buffer: Buffer): Promise<ExcelFileData> {
    try {
      const workbook = new XLSX.Workbook();
      await workbook.xlsx.load(buffer);

      // Prendre la première feuille
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error('Aucune feuille trouvée dans le fichier Excel');
      }

      // Extraire les colonnes depuis la première ligne
      const headerRow = worksheet.getRow(1);
      const columns: string[] = [];
      
      headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const value = cell.value?.toString().trim();
        if (value) {
          columns[colNumber - 1] = value;
        }
      });

      // Nettoyer les colonnes (enlever les undefined)
      const cleanColumns = columns.filter(col => col !== undefined);

      if (cleanColumns.length === 0) {
        throw new Error('Aucune colonne trouvée dans le fichier Excel');
      }

      // Extraire les lignes de données
      const rows: any[][] = [];
      const totalRows = worksheet.rowCount;

      for (let rowIndex = 2; rowIndex <= totalRows; rowIndex++) {
        const row = worksheet.getRow(rowIndex);
        const rowData: any[] = [];

        // Vérifier si la ligne est vide
        let isEmpty = true;
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const value = cell.value;
          if (value !== null && value !== undefined && value !== '') {
            isEmpty = false;
          }
          rowData[colNumber - 1] = this.extractCellValue(cell);
        });

        // Ne pas ajouter les lignes complètement vides
        if (!isEmpty) {
          rows.push(rowData);
        }
      }

      return {
        columns: cleanColumns,
        rows,
        totalRows: rows.length
      };
    } catch (error: any) {
      throw new Error(`Erreur lors du parsing du fichier Excel: ${error.message}`);
    }
  }

  /**
   * Extrait la valeur d'une cellule en fonction de son type
   */
  private extractCellValue(cell: XLSX.Cell): any {
    if (!cell.value) {
      return null;
    }

    // Gérer les différents types de valeurs
    if (cell.value instanceof Date) {
      return cell.value.toISOString();
    }

    if (typeof cell.value === 'object' && 'text' in cell.value) {
      return (cell.value as any).text;
    }

    if (typeof cell.value === 'object' && 'result' in cell.value) {
      // Formule calculée
      return (cell.value as any).result;
    }

    return cell.value;
  }

  /**
   * Parse un fichier CSV (alternative)
   */
  async parseCSV(buffer: Buffer): Promise<ExcelFileData> {
    const text = buffer.toString('utf-8');
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      throw new Error('Fichier CSV vide');
    }

    // Première ligne = colonnes
    const columns = lines[0].split(',').map(col => col.trim().replace(/^"|"$/g, ''));
    
    // Lignes suivantes = données
    const rows: any[][] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(val => {
        const trimmed = val.trim().replace(/^"|"$/g, '');
        return trimmed === '' ? null : trimmed;
      });
      rows.push(row);
    }

    return {
      columns,
      rows,
      totalRows: rows.length
    };
  }
}

