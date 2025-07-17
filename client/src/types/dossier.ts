export interface Dossier { id: number;
  type: string;
  status: string;
  montant: number | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  clientId: number;
  expertId: number | null;
  clientName: string;
  documents: Record<string, any> | null;
  current_step: number;
  progress: number; } 