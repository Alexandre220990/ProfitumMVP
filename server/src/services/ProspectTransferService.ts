/**
 * Service pour transférer un prospect vers un client avec assignation d'un produit et d'un expert
 */

import { createClient } from '@supabase/supabase-js';
import { ExpertNotificationService } from './expert-notification-service';
import { EmailService } from './EmailService';
import bcrypt from 'bcrypt';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TransferProspectInput {
  prospectId: string;
  produitId: string;
  expertId: string;
  montantPotentiel?: number;
  notes?: string;
}

export interface TransferProspectResult {
  success: boolean;
  clientId?: string;
  clientProduitEligibleId?: string;
  error?: string;
  message?: string;
}

export class ProspectTransferService {
  /**
   * Transfère un prospect vers un client avec assignation d'un produit et d'un expert
   */
  static async transferProspectToExpert(
    input: TransferProspectInput,
    adminUserId?: string
  ): Promise<TransferProspectResult> {
    try {
      console.log(`🔄 Transfert prospect ${input.prospectId} vers expert ${input.expertId}...`);

      // 1. Récupérer le prospect
      const { data: prospect, error: prospectError } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', input.prospectId)
        .single();

      if (prospectError || !prospect) {
        return {
          success: false,
          error: `Prospect non trouvé: ${prospectError?.message}`
        };
      }

      // 2. Vérifier que le prospect n'a pas déjà été transféré
      const { data: existingClient } = await supabase
        .from('Client')
        .select('id')
        .eq('email', prospect.email)
        .eq('type', 'prospect')
        .single();

      if (existingClient) {
        return {
          success: false,
          error: 'Ce prospect a déjà été transféré'
        };
      }

      // 3. Récupérer les informations du produit
      const { data: produit, error: produitError } = await supabase
        .from('ProduitEligible')
        .select('*')
        .eq('id', input.produitId)
        .single();

      if (produitError || !produit) {
        return {
          success: false,
          error: `Produit non trouvé: ${produitError?.message}`
        };
      }

      // 4. Récupérer les informations de l'expert
      const { data: expert, error: expertError } = await supabase
        .from('Expert')
        .select('*')
        .eq('id', input.expertId)
        .single();

      if (expertError || !expert) {
        return {
          success: false,
          error: `Expert non trouvé: ${expertError?.message}`
        };
      }

      // 5. Générer un mot de passe temporaire pour le client
      const temporaryPassword = EmailService.generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      // 6. Créer le compte Supabase Auth pour le client
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: prospect.email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          type: 'client',
          first_name: prospect.firstname || '',
          last_name: prospect.lastname || '',
          name: prospect.firstname && prospect.lastname 
            ? `${prospect.firstname} ${prospect.lastname}`.trim()
            : prospect.company_name || prospect.email,
          company_name: prospect.company_name || '',
          phone_number: prospect.phone_direct || prospect.phone_standard || '',
          siren: prospect.siren || '',
          city: prospect.city || '',
          postal_code: prospect.postal_code || '',
          address: prospect.adresse || '',
          email_verified: true,
          prospect_transferred: true,
          prospect_id: input.prospectId
        }
      });

      if (authError || !authData.user) {
        console.error('❌ Erreur création compte Auth:', authError);
        return {
          success: false,
          error: `Erreur création compte utilisateur: ${authError?.message}`
        };
      }

      // 7. Créer le Client dans la table Client
      const clientName = prospect.firstname && prospect.lastname
        ? `${prospect.firstname} ${prospect.lastname}`.trim()
        : prospect.company_name || prospect.email;

      const clientData = {
        auth_user_id: authData.user.id,
        email: prospect.email,
        password: hashedPassword,
        first_name: prospect.firstname || null,
        last_name: prospect.lastname || null,
        name: clientName,
        username: (prospect.firstname || '').toLowerCase() + (prospect.lastname || '').toLowerCase() || prospect.email.split('@')[0],
        company_name: prospect.company_name || null,
        phone_number: prospect.phone_direct || prospect.phone_standard || null,
        siren: prospect.siren || null,
        address: prospect.adresse || null,
        city: prospect.city || null,
        postal_code: prospect.postal_code || null,
        secteurActivite: prospect.enrichment_data?.secteur_activite?.description || null,
        nombreEmployes: prospect.employee_range ? this.parseEmployeeRange(prospect.employee_range) : null,
        type: 'prospect', // Type "prospect" tant qu'il n'a pas signé
        statut: 'actif',
        notes: input.notes || null,
        metadata: {
          prospect_id: input.prospectId,
          prospect_source: prospect.source,
          prospect_enrichment_data: prospect.enrichment_data,
          prospect_ai_summary: prospect.ai_summary,
          prospect_ai_trigger_points: prospect.ai_trigger_points,
          prospect_ai_product_match: prospect.ai_product_match,
          transferred_at: new Date().toISOString(),
          transferred_by: adminUserId || null,
          transferred_from: 'prospect_system'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newClient, error: clientError } = await supabase
        .from('Client')
        .insert(clientData)
        .select()
        .single();

      if (clientError) {
        console.error('❌ Erreur création client:', clientError);
        // Nettoyer le compte Auth en cas d'erreur
        await supabase.auth.admin.deleteUser(authData.user.id);
        return {
          success: false,
          error: `Erreur création client: ${clientError.message}`
        };
      }

      console.log(`✅ Client créé: ${newClient.id}`);

      // 8. Créer le ClientProduitEligible
      const clientProduitEligibleData = {
        clientId: newClient.id,
        produitId: input.produitId,
        statut: 'eligible',
        expert_pending_id: input.expertId, // En attente d'acceptation de l'expert
        montantFinal: input.montantPotentiel || null,
        priorite: 1,
        notes: input.notes || null,
        metadata: {
          prospect_id: input.prospectId,
          transferred_from_prospect: true,
          transferred_at: new Date().toISOString(),
          product_selected_by: adminUserId || null
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newClientProduitEligible, error: cpeError } = await supabase
        .from('ClientProduitEligible')
        .insert(clientProduitEligibleData)
        .select()
        .single();

      if (cpeError) {
        console.error('❌ Erreur création ClientProduitEligible:', cpeError);
        // Nettoyer le client et le compte Auth en cas d'erreur
        await supabase.from('Client').delete().eq('id', newClient.id);
        await supabase.auth.admin.deleteUser(authData.user.id);
        return {
          success: false,
          error: `Erreur création ClientProduitEligible: ${cpeError.message}`
        };
      }

      console.log(`✅ ClientProduitEligible créé: ${newClientProduitEligible.id}`);

      // 9. Envoyer email au client avec toutes les informations
      try {
        const clientCompany = prospect.company_name || clientName;
        const produitNom = produit.nom || 'Produit';
        const produitType = produit.type_produit || produit.categorie || null;
        
        // Récupérer les informations complètes de l'expert
        const { data: expertData } = await supabase
          .from('Expert')
          .select('email, name, first_name, last_name, company_name')
          .eq('id', input.expertId)
          .single();

        const expertName = expertData?.first_name && expertData?.last_name
          ? `${expertData.first_name} ${expertData.last_name}`
          : expertData?.name || expert.name || expert.company_name || 'Expert';
        
        const expertCompany = expertData?.company_name || expert.company_name || null;
        const expertEmail = expertData?.email || expert.email || null;

        // Générer l'URL de connexion
        const loginUrl = `${process.env.FRONTEND_URL || 'https://www.profitum.app'}/client/login`;

        // Envoyer l'email au client avec toutes les informations
        await EmailService.sendProspectTransferEmail({
          clientEmail: prospect.email,
          clientName: clientName,
          clientCompany: clientCompany || undefined,
          temporaryPassword: temporaryPassword,
          loginUrl: loginUrl,
          produitName: produitNom,
          produitType: produitType || undefined,
          expertName: expertName,
          expertCompany: expertCompany || undefined,
          expertEmail: expertEmail || undefined,
          montantPotentiel: input.montantPotentiel || undefined,
          adminNotes: input.notes || undefined
        });

        console.log('✅ Email de bienvenue envoyé au client');
      } catch (emailError) {
        console.error('⚠️ Erreur envoi email client (non bloquant):', emailError);
        // Ne pas faire échouer le transfert si l'email échoue
      }

      // 10. Notifier l'expert (notification + email)
      try {
        const clientCompany = prospect.company_name || clientName;
        const produitNom = produit.nom || 'Produit';
        const produitType = produit.type_produit || produit.nom || 'Produit';

        await ExpertNotificationService.notifyDossierPendingAcceptance({
          expert_id: input.expertId,
          client_produit_id: newClientProduitEligible.id,
          client_id: newClient.id,
          client_company: clientCompany,
          client_name: clientName,
          product_type: produitType,
          product_name: produitNom,
          estimated_amount: input.montantPotentiel || 0
        });

        // Envoyer email à l'expert
        const { data: expertData } = await supabase
          .from('Expert')
          .select('email, name, first_name, last_name')
          .eq('id', input.expertId)
          .single();

        if (expertData?.email) {
          const expertName = expertData.first_name && expertData.last_name
            ? `${expertData.first_name} ${expertData.last_name}`
            : expertData.name || 'Expert';

          await EmailService.sendExpertNotification(expertData.email, {
            prospectName: clientName,
            companyName: clientCompany,
            apporteurName: 'Administrateur Profitum'
          });
        }

        console.log('✅ Notification et email envoyés à l\'expert');
      } catch (notifError) {
        console.error('⚠️ Erreur notification expert (non bloquant):', notifError);
      }

      // 11. Ajouter un événement timeline si le service existe
      try {
        const { DossierTimelineService } = await import('./dossier-timeline-service');
        await DossierTimelineService.expertAssigne({
          dossier_id: newClientProduitEligible.id,
          expert_id: input.expertId,
          expert_name: expert.name || expert.company_name || 'Expert',
          product_name: produit.nom || 'Produit',
          client_name: clientName
        });
      } catch (timelineError) {
        console.error('⚠️ Erreur timeline (non bloquant):', timelineError);
      }

      console.log(`✅ Transfert prospect ${input.prospectId} vers client ${newClient.id} réussi`);

      return {
        success: true,
        clientId: newClient.id,
        clientProduitEligibleId: newClientProduitEligible.id,
        message: 'Prospect transféré avec succès vers un client'
      };

    } catch (error: any) {
      console.error('❌ Erreur transfert prospect:', error);
      return {
        success: false,
        error: error.message || 'Erreur inconnue lors du transfert'
      };
    }
  }

  /**
   * Parse employee range string to number
   */
  private static parseEmployeeRange(range: string): number | null {
    if (!range) return null;
    
    // Exemples: "1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"
    const match = range.match(/(\d+)-(\d+)/);
    if (match) {
      return parseInt(match[2]); // Prendre la valeur max
    }
    
    const plusMatch = range.match(/(\d+)\+/);
    if (plusMatch) {
      return parseInt(plusMatch[1]);
    }
    
    return null;
  }

  /**
   * Récupère les données du prospect lié à un client
   */
  static async getProspectDataForClient(clientId: string): Promise<any> {
    try {
      const { data: client, error } = await supabase
        .from('Client')
        .select('metadata')
        .eq('id', clientId)
        .single();

      if (error || !client?.metadata?.prospect_id) {
        return null;
      }

      const prospectId = client.metadata.prospect_id;

      // Récupérer le prospect
      const { data: prospect, error: prospectError } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', prospectId)
        .single();

      if (prospectError || !prospect) {
        return null;
      }

      // Récupérer les emails envoyés
      const { data: emails } = await supabase
        .from('prospect_emails')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('created_at', { ascending: false });

      // Récupérer les emails programmés
      const { data: scheduledEmails } = await supabase
        .from('prospect_email_scheduled')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('scheduled_for', { ascending: false });

      // Récupérer les emails reçus
      const { data: receivedEmails } = await supabase
        .from('prospect_emails_received')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('received_at', { ascending: false });

      // Récupérer le rapport
      const { data: report } = await supabase
        .from('prospect_reports')
        .select('*')
        .eq('prospect_id', prospectId)
        .single();

      return {
        prospect,
        emails: emails || [],
        scheduledEmails: scheduledEmails || [],
        receivedEmails: receivedEmails || [],
        report: report || null
      };
    } catch (error) {
      console.error('Erreur récupération données prospect:', error);
      return null;
    }
  }
}
