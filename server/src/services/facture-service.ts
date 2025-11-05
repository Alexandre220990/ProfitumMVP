/**
 * Service de gestion des factures Profitum
 * Génération automatique lors de la saisie du montant réel par l'expert
 */

import { supabase } from '../lib/supabase';

interface GenerateFactureParams {
  dossierId: string;
  montantReelAccorde: number;
  expertId: string;
}

interface FactureData {
  id: string;
  invoice_number: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  commission_apporteur?: number;
}

export class FactureService {
  
  /**
   * Générer un numéro de facture unique
   * Format: PROF-YYYY-NNNN
   */
  static async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    
    // Compter les factures de l'année
    const { count } = await supabase
      .from('invoice')
      .select('*', { count: 'exact', head: true })
      .ilike('invoice_number', `PROF-${year}-%`);
    
    const nextNumber = (count || 0) + 1;
    const paddedNumber = nextNumber.toString().padStart(4, '0');
    
    return `PROF-${year}-${paddedNumber}`;
  }

  /**
   * Générer une facture automatiquement
   * Appelé quand l'expert saisit le montant réel reçu de l'administration
   */
  static async generate(params: GenerateFactureParams): Promise<{ success: boolean; data?: FactureData; error?: string }> {
    try {
      const { dossierId, montantReelAccorde, expertId } = params;

      console.log('🧾 Génération facture Profitum:', {
        dossierId,
        montantReelAccorde,
        expertId
      });

      // 1. Récupérer les données du dossier
      const { data: dossier, error: dossierError } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          clientId,
          montantFinal,
          Client(id, company_name, siren, apporteur_id),
          Expert(id, name, email, compensation),
          ProduitEligible(nom)
        `)
        .eq('id', dossierId)
        .single();

      if (dossierError || !dossier) {
        console.error('❌ Dossier non trouvé:', dossierError);
        return {
          success: false,
          error: 'Dossier non trouvé'
        };
      }

      const clientInfo = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;
      const expertInfo = Array.isArray(dossier.Expert) ? dossier.Expert[0] : dossier.Expert;
      const produitInfo = Array.isArray(dossier.ProduitEligible) ? dossier.ProduitEligible[0] : dossier.ProduitEligible;

      // 2. Récupérer l'apporteur si présent
      let apporteurInfo: any = null;
      let tauxApporteur = 0.10; // 10% par défaut

      if (clientInfo?.apporteur_id) {
        const { data: apporteur } = await supabase
          .from('ApporteurAffaires')
          .select('id, nom, prenom, commission_rate')
          .eq('id', clientInfo.apporteur_id)
          .single();

        if (apporteur) {
          apporteurInfo = apporteur;
          tauxApporteur = apporteur.commission_rate ?? 0.10;
        }
      }

      // 3. Calculer les montants
      const tauxExpert = expertInfo?.compensation ?? 0.30; // 30% par défaut
      
      // Si données manquantes, créer facture avec erreur
      if (!tauxExpert || montantReelAccorde === 0 || !montantReelAccorde) {
        const invoiceNumber = await this.generateInvoiceNumber();
        
        const { data: errorFacture, error: insertError } = await supabase
          .from('invoice')
          .insert({
            invoice_number: invoiceNumber,
            client_id: clientInfo?.id,
            expert_id: expertId,
            client_produit_eligible_id: dossierId,
            apporteur_id: apporteurInfo?.id || null,
            montant_audit: montantReelAccorde || 0,
            taux_compensation_expert: tauxExpert || 0,
            taux_commission_apporteur: tauxApporteur,
            amount: 0,
            status: 'error',
            error_message: `ERREUR: Données manquantes - Expert.compensation=${tauxExpert}, montant=${montantReelAccorde}`,
            currency: 'EUR',
            issue_date: new Date().toISOString(),
            description: `Rémunération dossier ${produitInfo?.nom || 'Produit'} - ERREUR DE CALCUL`,
            metadata: {
              error_details: {
                missing_compensation: !tauxExpert,
                missing_montant: !montantReelAccorde,
                expert_id: expertId,
                dossier_id: dossierId
              }
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Erreur création facture erreur:', insertError);
          return { success: false, error: 'Erreur création facture' };
        }

        console.warn('⚠️ Facture créée avec erreur (données manquantes)');
        
        return {
          success: true,
          data: {
            id: errorFacture.id,
            invoice_number: invoiceNumber,
            montant_ht: 0,
            tva: 0,
            montant_ttc: 0
          }
        };
      }

      // Calculs normaux
      const montantHT = montantReelAccorde * tauxExpert;
      const tva = montantHT * 0.20; // TVA 20%
      const montantTTC = montantHT + tva;
      const commissionApporteur = apporteurInfo ? (montantHT * tauxApporteur) : 0;

      console.log('💰 Calculs facture:', {
        montant_base: montantReelAccorde,
        taux_expert: `${(tauxExpert * 100).toFixed(0)}%`,
        montant_ht: montantHT.toFixed(2),
        tva: tva.toFixed(2),
        montant_ttc: montantTTC.toFixed(2),
        commission_apporteur: commissionApporteur.toFixed(2)
      });

      // 4. Générer numéro de facture
      const invoiceNumber = await this.generateInvoiceNumber();

      // 5. Créer la facture
      const { data: facture, error: insertError } = await supabase
        .from('invoice')
        .insert({
          invoice_number: invoiceNumber,
          client_id: clientInfo?.id,
          expert_id: expertId,
          client_produit_eligible_id: dossierId,
          apporteur_id: apporteurInfo?.id || null,
          
          // Montants
          montant_audit: montantReelAccorde,
          taux_compensation_expert: tauxExpert,
          taux_commission_apporteur: tauxApporteur,
          amount: montantHT,
          currency: 'EUR',
          
          // Statut
          status: 'generated',
          
          // Dates
          issue_date: new Date().toISOString(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 jours
          
          // Description
          description: `Rémunération dossier ${produitInfo?.nom || 'Produit'} - Réf: ${dossierId.substring(0, 8)}`,
          
          // Métadata enrichie
          metadata: {
            montant_ttc: montantTTC,
            tva: tva,
            commission_apporteur: commissionApporteur,
            dossier_ref: dossierId,
            expert_name: expertInfo?.name,
            expert_email: expertInfo?.email,
            apporteur_name: apporteurInfo ? `${apporteurInfo.prenom} ${apporteurInfo.nom}` : null,
            client_name: clientInfo?.company_name,
            client_siren: clientInfo?.siren,
            produit: produitInfo?.nom,
            calcul_date: new Date().toISOString()
          },
          
          // Items (détail ligne facture)
          items: [
            {
              description: `Accompagnement ${produitInfo?.nom || 'Produit'}`,
              montant_base: montantReelAccorde,
              taux: tauxExpert,
              montant_ht: montantHT,
              tva: tva
            }
          ],
          
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erreur création facture:', insertError);
        return {
          success: false,
          error: insertError.message
        };
      }

      console.log(`✅ Facture ${invoiceNumber} créée avec succès`);

      return {
        success: true,
        data: {
          id: facture.id,
          invoice_number: invoiceNumber,
          montant_ht: montantHT,
          tva: tva,
          montant_ttc: montantTTC,
          commission_apporteur: commissionApporteur
        }
      };

    } catch (error: any) {
      console.error('❌ Erreur génération facture:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Générer le PDF d'une facture
   * À implémenter avec PDFKit ou similaire
   */
  static async generatePDF(factureId: string): Promise<{ success: boolean; pdfPath?: string; error?: string }> {
    try {
      // TODO: Implémenter génération PDF
      // 1. Récupérer facture
      // 2. Créer PDF avec PDFKit
      // 3. Upload vers Supabase Storage (bucket: 'invoices')
      // 4. Update invoice.pdf_storage_path
      // 5. Retourner URL

      console.log('📄 Génération PDF facture:', factureId);
      
      // Placeholder pour l'instant
      return {
        success: true,
        pdfPath: `invoices/profitum/2025/PROF-2025-XXXX.pdf`
      };

    } catch (error: any) {
      console.error('❌ Erreur génération PDF:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

