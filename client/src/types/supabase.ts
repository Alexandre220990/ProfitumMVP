export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database { public: {
    Tables: {
      Appointment: {
        Row: {
          id: number
          clientId: string
          expertId: string
          auditId: string
          date: string
          duree: number
          type: string
          statut: string
          lieu: string | null
          lien_visio: string | null
          notes: string | null
          rappel_envoye: boolean
          createdAt: string
          updatedAt: string }
        Insert: { id?: number
          clientId: string
          expertId: string
          auditId: string
          date: string
          duree: number
          type: string
          statut: string
          lieu?: string | null
          lien_visio?: string | null
          notes?: string | null
          rappel_envoye?: boolean
          createdAt?: string
          updatedAt?: string }
        Update: { id?: number
          clientId?: string
          expertId?: string
          auditId?: string
          date?: string
          duree?: number
          type?: string
          statut?: string
          lieu?: string | null
          lien_visio?: string | null
          notes?: string | null
          rappel_envoye?: boolean
          createdAt?: string
          updatedAt?: string }
      }
      Audit: { Row: {
          id: string
          type: string
          description: string | null
          montant: number | null
          status: string
          dateDebut: string
          dateFin: string | null
          clientId: string
          expertId: string | null
          documents: Json | null
          commentaires: string | null
          createdAt: string
          updatedAt: string
          charter_signed: boolean
          current_step: number
          progress: number
          appointment_datetime: string | null }
        Insert: { id?: string
          type: string
          description?: string | null
          montant?: number | null
          status: string
          dateDebut: string
          dateFin?: string | null
          clientId: string
          expertId?: string | null
          documents?: Json | null
          commentaires?: string | null
          createdAt?: string
          updatedAt?: string
          charter_signed?: boolean
          current_step?: number
          progress?: number
          appointment_datetime?: string | null }
        Update: { id?: string
          type?: string
          description?: string | null
          montant?: number | null
          status?: string
          dateDebut?: string
          dateFin?: string | null
          clientId?: string
          expertId?: string | null
          documents?: Json | null
          commentaires?: string | null
          createdAt?: string
          updatedAt?: string
          charter_signed?: boolean
          current_step?: number
          progress?: number
          appointment_datetime?: string | null }
      }
      Charter: { Row: {
          id: number
          audit_type: string
          clientId: string
          status: string
          signed_at: string | null
          content_version: string
          createdAt: string
          updatedAt: string }
        Insert: { id?: number
          audit_type: string
          clientId: string
          status: string
          signed_at?: string | null
          content_version: string
          createdAt?: string
          updatedAt?: string }
        Update: { id?: number
          audit_type?: string
          clientId?: string
          status?: string
          signed_at?: string | null
          content_version?: string
          createdAt?: string
          updatedAt?: string }
      }
      Client: { Row: {
          id: string
          email: string
          password: string
          name: string
          company: string | null
          phone: string | null
          revenuAnnuel: number | null
          secteurActivite: string | null
          nombreEmployes: number | null
          ancienneteEntreprise: number | null
          besoinFinancement: number | null
          typeProjet: string | null
          dateSimulation: string
          createdAt: string
          updatedAt: string
          simulationId: number | null }
        Insert: { id?: string
          email: string
          password: string
          name: string
          company?: string | null
          phone?: string | null
          revenuAnnuel?: number | null
          secteurActivite?: string | null
          nombreEmployes?: number | null
          ancienneteEntreprise?: number | null
          besoinFinancement?: number | null
          typeProjet?: string | null
          dateSimulation?: string
          createdAt?: string
          updatedAt?: string
          simulationId?: number | null }
        Update: { id?: string
          email?: string
          password?: string
          name?: string
          company?: string | null
          phone?: string | null
          revenuAnnuel?: number | null
          secteurActivite?: string | null
          nombreEmployes?: number | null
          ancienneteEntreprise?: number | null
          besoinFinancement?: number | null
          typeProjet?: string | null
          dateSimulation?: string
          createdAt?: string
          updatedAt?: string
          simulationId?: number | null }
      }
      ClientProduitEligible: { Row: {
          id: string
          clientId: string
          produitId: string
          statut: string
          tauxFinal: number | null
          montantFinal: number | null
          dureeFinale: number | null
          createdAt: string
          updatedAt: string
          simulationId: number | null }
        Insert: { id?: string
          clientId: string
          produitId: string
          statut: string
          tauxFinal?: number | null
          montantFinal?: number | null
          dureeFinale?: number | null
          createdAt?: string
          updatedAt?: string
          simulationId?: number | null }
        Update: { id?: string
          clientId?: string
          produitId?: string
          statut?: string
          tauxFinal?: number | null
          montantFinal?: number | null
          dureeFinale?: number | null
          createdAt?: string
          updatedAt?: string
          simulationId?: number | null }
      }
      Document: { Row: {
          id: number
          clientId: string
          filename: string
          original_name: string
          file_path: string
          file_size: number
          mime_type: string
          category: string | null
          description: string | null
          upload_date: string
          status: string
          audit_id: string | null
          createdAt: string
          updatedAt: string }
        Insert: { id?: number
          clientId: string
          filename: string
          original_name: string
          file_path: string
          file_size: number
          mime_type: string
          category?: string | null
          description?: string | null
          upload_date?: string
          status: string
          audit_id?: string | null
          createdAt?: string
          updatedAt?: string }
        Update: { id?: number
          clientId?: string
          filename?: string
          original_name?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          category?: string | null
          description?: string | null
          upload_date?: string
          status?: string
          audit_id?: string | null
          createdAt?: string
          updatedAt?: string }
      }
      Dossier: { Row: {
          id: number
          type: string
          status: string
          montant: number | null
          description: string | null
          createdAt: string
          updatedAt: string
          clientId: string
          expertId: string | null }
        Insert: { id?: number
          type: string
          status: string
          montant?: number | null
          description?: string | null
          createdAt?: string
          updatedAt?: string
          clientId: string
          expertId?: string | null }
        Update: { id?: number
          type?: string
          status?: string
          montant?: number | null
          description?: string | null
          createdAt?: string
          updatedAt?: string
          clientId?: string
          expertId?: string | null }
      }
      Expert: { Row: {
          id: string
          email: string
          password: string
          name: string
          company: string | null
          siren: string | null
          specializations: string[] | null
          experience: string | null
          location: string | null
          rating: number | null
          compensation: number | null
          description: string | null
          status: string
          disponibilites: Json | null
          certifications: Json | null
          createdAt: string
          updatedAt: string
          card_number: string | null
          card_expiry: string | null
          card_cvc: string | null
          abonnement: string | null }
        Insert: { id?: string
          email: string
          password: string
          name: string
          company?: string | null
          siren?: string | null
          specializations?: string[] | null
          experience?: string | null
          location?: string | null
          rating?: number | null
          compensation?: number | null
          description?: string | null
          status: string
          disponibilites?: Json | null
          certifications?: Json | null
          createdAt?: string
          updatedAt?: string
          card_number?: string | null
          card_expiry?: string | null
          card_cvc?: string | null
          abonnement?: string | null }
        Update: { id?: string
          email?: string
          password?: string
          name?: string
          company?: string | null
          siren?: string | null
          specializations?: string[] | null
          experience?: string | null
          location?: string | null
          rating?: number | null
          compensation?: number | null
          description?: string | null
          status?: string
          disponibilites?: Json | null
          certifications?: Json | null
          createdAt?: string
          updatedAt?: string
          card_number?: string | null
          card_expiry?: string | null
          card_cvc?: string | null
          abonnement?: string | null }
      }
      ExpertCategory: { Row: {
          id: number
          name: string
          description: string | null
          createdAt: string
          updatedAt: string }
        Insert: { id?: number
          name: string
          description?: string | null
          createdAt?: string
          updatedAt?: string }
        Update: { id?: number
          name?: string
          description?: string | null
          createdAt?: string
          updatedAt?: string }
      }
      ExpertProduitEligible: { Row: {
          id: string
          expertId: string
          produitId: string
          niveauExpertise: string
          tarifHoraire: number | null
          disponibilite: string | null
          filtresTaille: Json | null
          filtresGeographie: Json | null
          filtresVolume: Json | null
          statut: string
          createdAt: string
          updatedAt: string }
        Insert: { id?: string
          expertId: string
          produitId: string
          niveauExpertise: string
          tarifHoraire?: number | null
          disponibilite?: string | null
          filtresTaille?: Json | null
          filtresGeographie?: Json | null
          filtresVolume?: Json | null
          statut: string
          createdAt?: string
          updatedAt?: string }
        Update: { id?: string
          expertId?: string
          produitId?: string
          niveauExpertise?: string
          tarifHoraire?: number | null
          disponibilite?: string | null
          filtresTaille?: Json | null
          filtresGeographie?: Json | null
          filtresVolume?: Json | null
          statut?: string
          createdAt?: string
          updatedAt?: string }
      }
      ExpertSpecialization: { Row: {
          expertId: string
          specializationId: number }
        Insert: { expertId: string
          specializationId: number }
        Update: { expertId?: string
          specializationId?: number }
      }
      Notification: { Row: {
          id: number
          recipient_id: string
          message: string
          status: string
          type_notification: string
          lu: boolean
          date_notification: string }
        Insert: { id?: number
          recipient_id: string
          message: string
          status: string
          type_notification: string
          lu?: boolean
          date_notification?: string }
        Update: { id?: number
          recipient_id?: string
          message?: string
          status?: string
          type_notification?: string
          lu?: boolean
          date_notification?: string }
      }
      Plan: { Row: {
          id: number
          name: string
          price: number
          description: string | null
          features: string[] | null
          createdAt: string
          updatedAt: string }
        Insert: { id?: number
          name: string
          price: number
          description?: string | null
          features?: string[] | null
          createdAt?: string
          updatedAt?: string }
        Update: { id?: number
          name?: string
          price?: number
          description?: string | null
          features?: string[] | null
          createdAt?: string
          updatedAt?: string }
      }
      ProduitEligible: { Row: {
          id: string
          name: string
          description: string | null
          type: string
          created_at: string
          updated_at: string
          status: string
          requirements: Json | null
          benefits: Json | null
          limitations: Json | null
          documentation: Json | null
          version: string
          category: string | null
          priority: number | null }
        Insert: { id?: string
          name: string
          description?: string | null
          type: string
          created_at?: string
          updated_at?: string
          status: string
          requirements?: Json | null
          benefits?: Json | null
          limitations?: Json | null
          documentation?: Json | null
          version: string
          category?: string | null
          priority?: number | null }
        Update: { id?: string
          name?: string
          description?: string | null
          type?: string
          created_at?: string
          updated_at?: string
          status?: string
          requirements?: Json | null
          benefits?: Json | null
          limitations?: Json | null
          documentation?: Json | null
          version?: string
          category?: string | null
          priority?: number | null }
      }
      Question: { Row: {
          id: number
          texte: string
          type: string
          ordre: number
          categorie: string | null
          options: Json | null
          description: string | null
          placeholder: string | null
          validation: Json | null
          conditions: Json | null
          branchement: Json | null
          importance: number | null
          createdAt: string
          updatedAt: string }
        Insert: { id?: number
          texte: string
          type: string
          ordre: number
          categorie?: string | null
          options?: Json | null
          description?: string | null
          placeholder?: string | null
          validation?: Json | null
          conditions?: Json | null
          branchement?: Json | null
          importance?: number | null
          createdAt?: string
          updatedAt?: string }
        Update: { id?: number
          texte?: string
          type?: string
          ordre?: number
          categorie?: string | null
          options?: Json | null
          description?: string | null
          placeholder?: string | null
          validation?: Json | null
          conditions?: Json | null
          branchement?: Json | null
          importance?: number | null
          createdAt?: string
          updatedAt?: string }
      }
      RegleEligibilite: { Row: {
          id: string
          produitid: string
          questionid: number
          operateur: string
          valeur: Json | null
          poids: number | null }
        Insert: { id?: string
          produitid: string
          questionid: number
          operateur: string
          valeur?: Json | null
          poids?: number | null }
        Update: { id?: string
          produitid?: string
          questionid?: number
          operateur?: string
          valeur?: Json | null
          poids?: number | null }
      }
      Reponse: { Row: {
          id: number
          simulationId: number
          questionId: number
          valeur: string
          createdAt: string
          updatedAt: string }
        Insert: { id?: number
          simulationId: number
          questionId: number
          valeur: string
          createdAt?: string
          updatedAt?: string }
        Update: { id?: number
          simulationId?: number
          questionId?: number
          valeur?: string
          createdAt?: string
          updatedAt?: string }
      }
      Simulation: { Row: {
          id: number
          clientId: string
          dateCreation: string
          statut: string
          Answers: Json | null
          score: number | null
          tempsCompletion: number | null
          abandonA: string | null
          createdAt: string
          updatedAt: string
          CheminParcouru: Json | null }
        Insert: { id?: number
          clientId: string
          dateCreation?: string
          statut: string
          Answers?: Json | null
          score?: number | null
          tempsCompletion?: number | null
          abandonA?: string | null
          createdAt?: string
          updatedAt?: string
          CheminParcouru?: Json | null }
        Update: { id?: number
          clientId?: string
          dateCreation?: string
          statut?: string
          Answers?: Json | null
          score?: number | null
          tempsCompletion?: number | null
          abandonA?: string | null
          createdAt?: string
          updatedAt?: string
          CheminParcouru?: Json | null }
      }
      SimulationProcessed: { Row: {
          id: string
          clientid: string
          simulationid: number
          dateprocessed: string
          produitseligiblesids: string[] | null
          produitsdetails: Json | null
          rawanswers: Json | null
          score: number | null
          dureeanalysems: number | null
          statut: string
          createdat: string
          updatedat: string }
        Insert: { id?: string
          clientid: string
          simulationid: number
          dateprocessed?: string
          produitseligiblesids?: string[] | null
          produitsdetails?: Json | null
          rawanswers?: Json | null
          score?: number | null
          dureeanalysems?: number | null
          statut: string
          createdat?: string
          updatedat?: string }
        Update: { id?: string
          clientid?: string
          simulationid?: number
          dateprocessed?: string
          produitseligiblesids?: string[] | null
          produitsdetails?: Json | null
          rawanswers?: Json | null
          score?: number | null
          dureeanalysems?: number | null
          statut?: string
          createdat?: string
          updatedat?: string }
      }
      SimulationResult: { Row: {
          id: number
          clientId: string
          produitEligible: string
          tauxInteret: number | null
          montantMaximal: number | null
          dureeMaximale: number | null
          scoreEligibilite: number | null
          commentaires: string | null
          dateSimulation: string
          createdAt: string
          updatedAt: string
          simulationId: number }
        Insert: { id?: number
          clientId: string
          produitEligible: string
          tauxInteret?: number | null
          montantMaximal?: number | null
          dureeMaximale?: number | null
          scoreEligibilite?: number | null
          commentaires?: string | null
          dateSimulation?: string
          createdAt?: string
          updatedAt?: string
          simulationId: number }
        Update: { id?: number
          clientId?: string
          produitEligible?: string
          tauxInteret?: number | null
          montantMaximal?: number | null
          dureeMaximale?: number | null
          scoreEligibilite?: number | null
          commentaires?: string | null
          dateSimulation?: string
          createdAt?: string
          updatedAt?: string
          simulationId?: number }
      }
      Specialization: { Row: {
          id: number
          name: string
          description: string | null
          conditions: Json | null
          tauxSuccess: number | null
          dureeAverage: number | null
          createdAt: string
          updatedAt: string }
        Insert: { id?: number
          name: string
          description?: string | null
          conditions?: Json | null
          tauxSuccess?: number | null
          dureeAverage?: number | null
          createdAt?: string
          updatedAt?: string }
        Update: { id?: number
          name?: string
          description?: string | null
          conditions?: Json | null
          tauxSuccess?: number | null
          dureeAverage?: number | null
          createdAt?: string
          updatedAt?: string }
      }
    }
  }
} 