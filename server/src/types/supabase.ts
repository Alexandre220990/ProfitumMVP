export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      Client: {
        Row: {
          id: string;
          email?: string;
          nom?: string;
          prenom?: string;
          createdAt?: string;
          updatedAt?: string;
        };
        Insert: {
          id: string;
          email?: string;
          nom?: string;
          prenom?: string;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          email?: string;
          nom?: string;
          prenom?: string;
          updatedAt?: string;
        };
      };
      Simulation: {
        Row: {
          id: string | number;
          clientId: string;
          cheminParcouru?: Record<string, any>;
          statut: string;
          dateCreation?: string;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          clientId: string;
          cheminParcouru?: Record<string, any>;
          statut: string;
          dateCreation?: string;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          clientId?: string;
          cheminParcouru?: Record<string, any>;
          statut?: string;
          updatedAt?: string;
        };
      };
      SimulationProcessed: {
        Row: {
          id: string | number;
          clientid: string;
          simulationid: number;
          dateprocessed: string;
          produitseligiblesids: string[];
          produitsdetails: any[];
          rawanswers: any;
          score: number;
          dureeanalysems: number;
          statut: string;
          createdat: string;
          updatedat: string;
        };
        Insert: {
          clientid: string;
          simulationid: number;
          dateprocessed: string;
          produitseligiblesids: string[];
          produitsdetails: any[];
          rawanswers: any;
          score: number;
          dureeanalysems: number;
          statut: string;
          createdat: string;
          updatedat: string;
        };
        Update: {
          statut?: string;
          updatedat?: string;
        };
      };
      Question: {
        Row: {
          id: number;
          texte: string;
          type: string;
          ordre: number;
          categorie: string;
          options: any;
          description?: string;
          importance: number;
        };
        Insert: {
          texte: string;
          type: string;
          ordre: number;
          categorie: string;
          options: any;
          description?: string;
          importance: number;
        };
        Update: {
          texte?: string;
          type?: string;
          ordre?: number;
          categorie?: string;
          options?: any;
          description?: string;
          importance?: number;
        };
      };
      Reponse: {
        Row: {
          id: number;
          simulationId: number;
          questionId: number;
          valeur: string;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          simulationId: number;
          questionId: number;
          valeur: string;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          valeur?: string;
          updatedAt?: string;
        };
      };
      SimulationResult: {
        Row: {
          id: number;
          simulationId: number;
          produitsEligibles: string[];
          score: number;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          simulationId: number;
          produitsEligibles: string[];
          score: number;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          produitsEligibles?: string[];
          score?: number;
          updatedAt?: string;
        };
      };
      ProduitEligible: {
        Row: {
          id: string;
          nom: string;
          description: string;
          categorie: string;
          eligibilite: any;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          nom: string;
          description: string;
          categorie: string;
          eligibilite: any;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          nom?: string;
          description?: string;
          categorie?: string;
          eligibilite?: any;
          updatedAt?: string;
        };
      };
      ClientProduitEligible: {
        Row: {
          id: number;
          clientId: string;
          produitId: string;
          simulationId: number;
          status: string;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          clientId: string;
          produitId: string;
          simulationId: number;
          status: string;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          status?: string;
          updatedAt?: string;
        };
      };
      Audit: {
        Row: {
          id: string;
          type: string;
          status: string;
          expertId: string;
          clientId: string;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          type: string;
          status: string;
          expertId: string;
          clientId: string;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          type?: string;
          status?: string;
          expertId?: string;
          clientId?: string;
          updatedAt?: string;
        };
      };
    }
  }
} 