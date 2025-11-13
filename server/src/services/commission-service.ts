/**
 * Service de calcul des commissions
 * Utilisé pour afficher les estimations et les commissions réelles
 */

import { supabase } from '../lib/supabase';

interface CommissionCalculation {
  montant_base: number;
  
  // Expert
  taux_expert: number;
  montant_expert_ht: number;
  montant_expert_tva: number;
  montant_expert_ttc: number;
  
  // Apporteur (si présent)
  a_apporteur: boolean;
  taux_apporteur?: number;
  montant_apporteur_ht?: number;
  montant_apporteur_tva?: number;
  montant_apporteur_ttc?: number;
  
  // Total
  total_commissions_ht: number;
  total_commissions_tva: number;
  total_commissions_ttc: number;
}

export class CommissionService {
  
  /**
   * Calculer les commissions pour un dossier
   * @param dossierId - ID du dossier ClientProduitEligible
   * @param montantBase - Montant sur lequel calculer (montant audit)
   * @returns Détails des commissions ou erreur
   */
  static async calculate(dossierId: string, montantBase: number): Promise<{ success: boolean; data?: CommissionCalculation; error?: string }> {
    try {
      console.log('💰 Calcul commissions:', { dossierId, montantBase });

      // Récupérer les infos du dossier
      const { data: dossier, error: dossierError } = await supabase
        .from('ClientProduitEligible')
        .select(`
          id,
          expert_id,
          clientId,
          Client(apporteur_id),
          Expert(compensation:client_fee_percentage)
        `)
        .eq('id', dossierId)
        .single();

      if (dossierError || !dossier) {
        return {
          success: false,
          error: 'Dossier non trouvé'
        };
      }

      const expertInfo = Array.isArray(dossier.Expert) ? dossier.Expert[0] : dossier.Expert;
      const clientInfo = Array.isArray(dossier.Client) ? dossier.Client[0] : dossier.Client;

      // Taux expert (30% par défaut)
      const tauxExpert = expertInfo?.compensation ?? 0.30;
      
      // Calculs expert
      const montantExpertHT = montantBase * tauxExpert;
      const montantExpertTVA = montantExpertHT * 0.20;
      const montantExpertTTC = montantExpertHT + montantExpertTVA;

      // Apporteur si présent
      let aApporteur = false;
      let tauxApporteur = 0;
      let montantApporteurHT = 0;
      let montantApporteurTVA = 0;
      let montantApporteurTTC = 0;

      if (clientInfo?.apporteur_id) {
        const { data: apporteur } = await supabase
          .from('ApporteurAffaires')
          .select('commission_rate')
          .eq('id', clientInfo.apporteur_id)
          .single();

        if (apporteur) {
          aApporteur = true;
          tauxApporteur = apporteur.commission_rate ?? 0.10; // 10% par défaut
          montantApporteurHT = montantExpertHT * tauxApporteur; // Commission sur la rémunération expert
          montantApporteurTVA = montantApporteurHT * 0.20;
          montantApporteurTTC = montantApporteurHT + montantApporteurTVA;
        }
      }

      // Totaux
      const totalHT = montantExpertHT + montantApporteurHT;
      const totalTVA = montantExpertTVA + montantApporteurTVA;
      const totalTTC = montantExpertTTC + montantApporteurTTC;

      console.log('✅ Commissions calculées:', {
        expert: `${montantExpertTTC.toFixed(2)} € TTC`,
        apporteur: aApporteur ? `${montantApporteurTTC.toFixed(2)} € TTC` : 'N/A',
        total: `${totalTTC.toFixed(2)} € TTC`
      });

      return {
        success: true,
        data: {
          montant_base: montantBase,
          
          taux_expert: tauxExpert,
          montant_expert_ht: montantExpertHT,
          montant_expert_tva: montantExpertTVA,
          montant_expert_ttc: montantExpertTTC,
          
          a_apporteur: aApporteur,
          taux_apporteur: aApporteur ? tauxApporteur : undefined,
          montant_apporteur_ht: aApporteur ? montantApporteurHT : undefined,
          montant_apporteur_tva: aApporteur ? montantApporteurTVA : undefined,
          montant_apporteur_ttc: aApporteur ? montantApporteurTTC : undefined,
          
          total_commissions_ht: totalHT,
          total_commissions_tva: totalTVA,
          total_commissions_ttc: totalTTC
        }
      };

    } catch (error: any) {
      console.error('❌ Erreur calcul commissions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtenir les commissions pour un expert
   * Liste des commissions pour un expert donné
   */
  static async getExpertCommissions(expertId: string) {
    try {
      const { data: factures } = await supabase
        .from('invoice')
        .select(`
          id,
          invoice_number,
          amount,
          status,
          issue_date,
          due_date,
          taux_compensation_expert,
          montant_audit,
          client_produit_eligible_id,
          ClientProduitEligible(
            Client(company_name),
            ProduitEligible(nom)
          )
        `)
        .eq('expert_id', expertId)
        .order('issue_date', { ascending: false });

      return {
        success: true,
        data: factures || []
      };
    } catch (error: any) {
      console.error('❌ Erreur récupération commissions expert:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtenir les commissions pour un apporteur
   * Liste des commissions pour un apporteur donné
   */
  static async getApporteurCommissions(apporteurId: string) {
    try {
      const { data: factures } = await supabase
        .from('invoice')
        .select(`
          id,
          invoice_number,
          amount,
          status,
          issue_date,
          due_date,
          taux_commission_apporteur,
          montant_audit,
          metadata,
          client_produit_eligible_id,
          ClientProduitEligible(
            Client(company_name),
            ProduitEligible(nom)
          )
        `)
        .eq('apporteur_id', apporteurId)
        .order('issue_date', { ascending: false });

      // Extraire commission apporteur de metadata
      const commissionsAvecDetails = factures?.map(f => ({
        ...f,
        commission_apporteur: (f.metadata as any)?.commission_apporteur || 0
      }));

      return {
        success: true,
        data: commissionsAvecDetails || []
      };
    } catch (error: any) {
      console.error('❌ Erreur récupération commissions apporteur:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

