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
  montant_remboursement: number;
  expert_total_fee: number;
  profitum_total_fee: number;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
  apporteur_commission: number;
  expert_garde: number;
  profitum_garde: number;
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
          Expert(id, name, email, client_fee_percentage, profitum_fee_percentage),
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
      let apporteurSharePercentage = 0.10; // 10% de ce que Profitum touche

      if (clientInfo?.apporteur_id) {
        const { data: apporteur } = await supabase
          .from('ApporteurAffaires')
          .select('id, nom, prenom, profitum_share_percentage')
          .eq('id', clientInfo.apporteur_id)
          .single();

        if (apporteur) {
          apporteurInfo = apporteur;
          apporteurSharePercentage = apporteur.profitum_share_percentage ?? 0.10;
        }
      }

      // 3. Calculer les montants selon le WATERFALL CORRECT
      const clientFeePercentage = expertInfo?.client_fee_percentage ?? 0.30; // Client paie 30% à expert
      const profitumFeePercentage = expertInfo?.profitum_fee_percentage ?? 0.30; // Expert paie 30% à Profitum
      
      // Si données manquantes, créer facture avec erreur
      if (!clientFeePercentage || !profitumFeePercentage || montantReelAccorde === 0 || !montantReelAccorde) {
        const invoiceNumber = await this.generateInvoiceNumber();
        
        const { data: errorFacture, error: insertError } = await supabase
          .from('invoice')
          .insert({
            invoice_number: invoiceNumber,
            client_id: clientInfo?.id,
            expert_id: expertId,
            client_produit_eligible_id: dossierId,
            apporteur_id: apporteurInfo?.id || null,
            montant_remboursement: montantReelAccorde || 0,
            client_fee_percentage: clientFeePercentage || 0,
            profitum_fee_percentage: profitumFeePercentage || 0,
            apporteur_share_percentage: apporteurSharePercentage,
            amount: 0,
            status: 'error',
            error_message: `ERREUR: Données manquantes - Expert.client_fee_percentage=${clientFeePercentage}, Expert.profitum_fee_percentage=${profitumFeePercentage}, montant=${montantReelAccorde}`,
            currency: 'EUR',
            issue_date: new Date().toISOString(),
            description: `Rémunération dossier ${produitInfo?.nom || 'Produit'} - ERREUR DE CALCUL`,
            metadata: {
              error_details: {
                missing_client_fee: !clientFeePercentage,
                missing_profitum_fee: !profitumFeePercentage,
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
            montant_remboursement: montantReelAccorde || 0,
            expert_total_fee: 0,
            profitum_total_fee: 0,
            montant_ht: 0,
            tva: 0,
            montant_ttc: 0,
            apporteur_commission: 0,
            expert_garde: 0,
            profitum_garde: 0
          }
        };
      }

      // CALCULS WATERFALL CORRECT
      // 1. Client paie X% à l'expert
      const expertTotalFee = montantReelAccorde * clientFeePercentage;
      
      // 2. Expert paie Y% à Profitum (sur ce qu'il a reçu)
      const profitumTotalFee = expertTotalFee * profitumFeePercentage;
      
      // 3. Profitum reverse Z% à l'apporteur (sur ce que Profitum touche)
      const apporteurCommission = apporteurInfo ? (profitumTotalFee * apporteurSharePercentage) : 0;
      
      // 4. TVA sur ce que Profitum facture à l'expert
      const tva = profitumTotalFee * 0.20;
      const profitumTotalTTC = profitumTotalFee + tva;
      
      // 5. Ce que garde vraiment chacun
      const expertKeeps = expertTotalFee - profitumTotalFee; // Expert garde 70%
      const profitumKeeps = profitumTotalFee - apporteurCommission; // Profitum garde 90%

      console.log('💰 Calculs facture WATERFALL:', {
        montant_remboursement: montantReelAccorde,
        '1_client_paie_expert': `${expertTotalFee.toFixed(2)}€ (${(clientFeePercentage * 100).toFixed(0)}%)`,
        '2_expert_paie_profitum': `${profitumTotalFee.toFixed(2)}€ (${(profitumFeePercentage * 100).toFixed(0)}%)`,
        '3_profitum_reverse_apporteur': `${apporteurCommission.toFixed(2)}€ (${(apporteurSharePercentage * 100).toFixed(0)}%)`,
        expert_garde: `${expertKeeps.toFixed(2)}€`,
        profitum_garde: `${profitumKeeps.toFixed(2)}€`,
        tva: `${tva.toFixed(2)}€`,
        facture_profitum_ttc: `${profitumTotalTTC.toFixed(2)}€`
      });

      // 4. Générer numéro de facture
      const invoiceNumber = await this.generateInvoiceNumber();

      // 5. Créer la facture
      const { data: facture, error: insertError} = await supabase
        .from('invoice')
        .insert({
          invoice_number: invoiceNumber,
          client_id: clientInfo?.id,
          expert_id: expertId,
          client_produit_eligible_id: dossierId,
          apporteur_id: apporteurInfo?.id || null,
          
          // Montants WATERFALL
          montant_remboursement: montantReelAccorde,
          client_fee_percentage: clientFeePercentage,
          expert_total_fee: expertTotalFee,
          profitum_fee_percentage: profitumFeePercentage,
          profitum_total_fee: profitumTotalFee,
          apporteur_share_percentage: apporteurSharePercentage,
          apporteur_commission: apporteurCommission,
          amount: profitumTotalFee, // Montant HT facturé par Profitum
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
            montant_ttc: profitumTotalTTC,
            tva: tva,
            expert_garde: expertKeeps,
            profitum_garde: profitumKeeps,
            dossier_ref: dossierId,
            expert_name: expertInfo?.name,
            expert_email: expertInfo?.email,
            apporteur_name: apporteurInfo ? `${apporteurInfo.prenom} ${apporteurInfo.nom}` : null,
            client_name: clientInfo?.company_name,
            client_siren: clientInfo?.siren,
            produit: produitInfo?.nom,
            calcul_date: new Date().toISOString(),
            waterfall: {
              step1_client_paie_expert: expertTotalFee,
              step2_expert_paie_profitum: profitumTotalFee,
              step3_profitum_reverse_apporteur: apporteurCommission
            }
          },
          
          // Items (détail ligne facture)
          items: [
            {
              description: `Frais Profitum - Dossier ${produitInfo?.nom || 'Produit'}`,
              montant_base_expert: expertTotalFee,
              taux_profitum: profitumFeePercentage,
              montant_ht: profitumTotalFee,
              tva: tva,
              montant_ttc: profitumTotalTTC
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
          montant_remboursement: montantReelAccorde,
          expert_total_fee: expertTotalFee,
          profitum_total_fee: profitumTotalFee,
          montant_ht: profitumTotalFee,
          tva: tva,
          montant_ttc: profitumTotalTTC,
          apporteur_commission: apporteurCommission,
          expert_garde: expertKeeps,
          profitum_garde: profitumKeeps
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

