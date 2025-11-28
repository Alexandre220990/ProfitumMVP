import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import { EntityType, MappingConfig } from '../../types/import';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class EntityCreatorService {
  /**
   * Génère un mot de passe aléatoire sécurisé
   */
  private generateRandomPassword(length: number = 12): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let password = '';
    // Assurer au moins un caractère de chaque type
    password += uppercase[crypto.randomInt(uppercase.length)];
    password += lowercase[crypto.randomInt(lowercase.length)];
    password += numbers[crypto.randomInt(numbers.length)];
    password += symbols[crypto.randomInt(symbols.length)];
    
    // Remplir le reste
    for (let i = password.length; i < length; i++) {
      password += allChars[crypto.randomInt(allChars.length)];
    }
    
    // Mélanger
    return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
  }

  /**
   * Crée un client avec compte Auth
   */
  async createClient(
    data: Record<string, any>,
    mapping: MappingConfig,
    options: { generatePassword?: boolean; password?: string } = {}
  ): Promise<{ id: string; authUserId: string }> {
    // Préparer les données client
    const clientData: any = {
      email: data.email,
      first_name: data.first_name || data.name?.split(' ')[0] || '',
      last_name: data.last_name || data.name?.split(' ').slice(1).join(' ') || '',
      name: data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.company_name || '',
      company_name: data.company_name || '',
      phone_number: data.phone_number || data.phone || null,
      address: data.address || '',
      city: data.city || '',
      postal_code: data.postal_code || null,
      siren: data.siren ? data.siren.toString().replace(/\s/g, '') : null,
      secteurActivite: data.secteurActivite || null,
      nombreEmployes: data.nombreEmployes ? Number(data.nombreEmployes) : null,
      revenuAnnuel: data.revenuAnnuel ? Number(data.revenuAnnuel) : null,
      type: 'client',
      statut: data.statut || 'actif',
      username: data.username || data.email?.split('@')[0] || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Générer ou utiliser le mot de passe
    const password = options.password || (options.generatePassword ? this.generateRandomPassword() : this.generateRandomPassword());
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le compte Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: clientData.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        type: 'client',
        first_name: clientData.first_name,
        last_name: clientData.last_name,
        name: clientData.name,
        company_name: clientData.company_name,
        phone_number: clientData.phone_number,
        siren: clientData.siren,
        city: clientData.city,
        postal_code: clientData.postal_code,
        address: clientData.address,
        email_verified: true
      }
    });

    if (authError || !authData.user) {
      throw new Error(`Erreur création compte Auth: ${authError?.message}`);
    }

    // Ajouter l'auth_user_id et le mot de passe hashé
    clientData.auth_user_id = authData.user.id;
    clientData.password = hashedPassword;

    // Insérer dans la table Client
    const { data: newClient, error: clientError } = await supabase
      .from('Client')
      .insert(clientData)
      .select('id')
      .single();

    if (clientError) {
      // Nettoyer Auth en cas d'erreur
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Erreur création client: ${clientError.message}`);
    }

    return {
      id: newClient.id,
      authUserId: authData.user.id
    };
  }

  /**
   * Crée un expert avec compte Auth
   */
  async createExpert(
    data: Record<string, any>,
    mapping: MappingConfig,
    options: { generatePassword?: boolean; password?: string } = {}
  ): Promise<{ id: string; authUserId: string }> {
    // Préparer les données expert
    const expertData: any = {
      email: data.email,
      first_name: data.first_name || data.name?.split(' ')[0] || '',
      last_name: data.last_name || data.name?.split(' ').slice(1).join(' ') || '',
      name: data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.company_name || '',
      company_name: data.company_name || '',
      siren: data.siren ? data.siren.toString().replace(/\s/g, '') : '',
      specializations: data.specializations || [],
      experience: data.experience || null,
      description: data.description || null,
      location: data.location || data.city || null,
      rating: data.rating ? Number(data.rating) : 0,
      compensation: data.compensation ? Number(data.compensation) : null,
      client_fee_percentage: data.client_fee_percentage ? Number(data.client_fee_percentage) : 0.30,
      status: data.status || 'active',
      approval_status: data.approval_status || 'pending',
      website: data.website || null,
      linkedin: data.linkedin || null,
      languages: data.languages || ['Français'],
      availability: data.availability || 'disponible',
      max_clients: data.max_clients ? Number(data.max_clients) : 10,
      hourly_rate: data.hourly_rate ? Number(data.hourly_rate) : null,
      phone: data.phone || data.phone_number || null,
      cabinet_id: data.cabinet_id || null,
      secteur_activite: data.secteur_activite || [],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Générer ou utiliser le mot de passe
    const password = options.password || (options.generatePassword ? this.generateRandomPassword() : this.generateRandomPassword());
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le compte Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: expertData.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        type: 'expert',
        name: expertData.name,
        first_name: expertData.first_name,
        last_name: expertData.last_name,
        company: expertData.company_name,
        siren: expertData.siren,
        specializations: expertData.specializations,
        user_type: 'expert'
      }
    });

    if (authError || !authData.user) {
      throw new Error(`Erreur création compte Auth: ${authError?.message}`);
    }

    // Ajouter l'auth_user_id et le mot de passe hashé
    expertData.id = authData.user.id;
    expertData.auth_user_id = authData.user.id;
    expertData.password = hashedPassword;

    // Insérer dans la table Expert
    const { data: newExpert, error: expertError } = await supabase
      .from('Expert')
      .insert(expertData)
      .select('id')
      .single();

    if (expertError) {
      // Nettoyer Auth en cas d'erreur
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Erreur création expert: ${expertError.message}`);
    }

    return {
      id: newExpert.id,
      authUserId: authData.user.id
    };
  }

  /**
   * Crée un apporteur avec compte Auth
   */
  async createApporteur(
    data: Record<string, any>,
    mapping: MappingConfig,
    options: { generatePassword?: boolean; password?: string } = {}
  ): Promise<{ id: string; authUserId: string }> {
    // Préparer les données apporteur
    const apporteurData: any = {
      email: data.email,
      first_name: data.first_name || data.name?.split(' ')[0] || '',
      last_name: data.last_name || data.name?.split(' ').slice(1).join(' ') || '',
      company_name: data.company_name || '',
      phone: data.phone || data.phone_number || null,
      siren: data.siren ? data.siren.toString().replace(/\s/g, '') : null,
      company_type: data.company_type || 'independant',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Générer ou utiliser le mot de passe
    const password = options.password || (options.generatePassword ? this.generateRandomPassword() : this.generateRandomPassword());
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le compte Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: apporteurData.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        type: 'apporteur',
        first_name: apporteurData.first_name,
        last_name: apporteurData.last_name,
        name: `${apporteurData.first_name} ${apporteurData.last_name}`,
        company: apporteurData.company_name,
        siren: apporteurData.siren,
        user_type: 'apporteur'
      }
    });

    if (authError || !authData.user) {
      throw new Error(`Erreur création compte Auth: ${authError?.message}`);
    }

    // Ajouter l'auth_user_id et le mot de passe hashé
    apporteurData.id = authData.user.id;
    apporteurData.auth_user_id = authData.user.id;
    apporteurData.password = hashedPassword;

    // Insérer dans la table ApporteurAffaires
    const { data: newApporteur, error: apporteurError } = await supabase
      .from('ApporteurAffaires')
      .insert(apporteurData)
      .select('id')
      .single();

    if (apporteurError) {
      // Nettoyer Auth en cas d'erreur
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(`Erreur création apporteur: ${apporteurError.message}`);
    }

    return {
      id: newApporteur.id,
      authUserId: authData.user.id
    };
  }
}

