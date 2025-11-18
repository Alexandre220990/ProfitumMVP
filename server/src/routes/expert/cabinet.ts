import { Router, Request, Response } from 'express';
import { supabase } from '../../lib/supabase';
import { CabinetService } from '../../services/cabinetService';
import { AuthUser } from '../../types/auth';
import { normalizeDossierStatus } from '../../utils/dossierStatus';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const router = Router();

const MEMBER_TYPES = ['expert', 'apporteur', 'assistant', 'responsable_cabinet'] as const;
const TEAM_ROLES = ['OWNER', 'MANAGER', 'EXPERT', 'ASSISTANT'] as const;
const MEMBER_STATUSES = ['active', 'invited', 'suspended', 'disabled'] as const;
type CabinetMemberStatusType = typeof MEMBER_STATUSES[number];

const normalizeMemberType = (value: string) => {
  if (value === 'responsable_cabinet') return 'expert';
  return value;
};

const normalizeTeamRole = (value: string | undefined, memberType: string) => {
  if (value && TEAM_ROLES.includes(value.toUpperCase() as typeof TEAM_ROLES[number])) {
    return value.toUpperCase();
  }
  if (memberType === 'responsable_cabinet') return 'MANAGER';
  if (memberType === 'apporteur') return 'ASSISTANT';
  return 'EXPERT';
};

const normalizeStatus = (value?: string): CabinetMemberStatusType => {
  if (value && MEMBER_STATUSES.includes(value as typeof MEMBER_STATUSES[number])) {
    return value as CabinetMemberStatusType;
  }
  return 'active';
};

const sanitizeObject = <T>(value: unknown, fallback: T): T => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as T;
  }
  return fallback;
};

const sanitizeArray = (value: unknown) => {
  if (Array.isArray(value)) return value;
  return [];
};

const isOwner = (membership?: any) => membership?.team_role === 'OWNER';
const isManager = (membership?: any) => membership?.team_role === 'MANAGER';

const buildPermissions = (membership: any) => ({
  isOwner: isOwner(membership),
  isManager: isManager(membership),
  canManageMembers: isOwner(membership) || isManager(membership),
  managerMemberId: membership?.id || null
});

const getCabinetIdForExpert = async (expertId: string) => {
  const { data, error } = await supabase
    .from('Expert')
    .select('cabinet_id')
    .eq('id', expertId)
    .single();

  if (error) throw error;
  return data?.cabinet_id || null;
};

const resolveCabinetContext = async (user: AuthUser) => {
  if (user.type !== 'expert') {
    throw new Error('forbidden');
  }

  const cabinetId = await getCabinetIdForExpert(user.database_id);
  if (!cabinetId) {
    return { cabinetId: null, membership: null };
  }

  const membership = await CabinetService.getMemberRecord(cabinetId, user.database_id);
  return { cabinetId, membership };
};

const ensureManagerReference = async (cabinetId: string, managerMemberId: string | null) => {
  if (!managerMemberId) return null;
  const managerRecord = await CabinetService.getMemberByRecordId(managerMemberId);
  if (!managerRecord || managerRecord.cabinet_id !== cabinetId) {
    throw new Error('invalid_manager');
  }
  if (managerRecord.team_role !== 'MANAGER' && managerRecord.team_role !== 'OWNER') {
    throw new Error('invalid_manager');
  }
  return managerRecord.id;
};

router.get('/context', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;
    if (!user || user.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux experts' });
    }

    const { cabinetId, membership } = await resolveCabinetContext(user);

    if (!cabinetId) {
      return res.status(404).json({
        success: false,
        message: 'Aucun cabinet associé'
      });
    }

    const detail = await CabinetService.getCabinetDetail(cabinetId);

    return res.json({
      success: true,
      data: {
        cabinet: detail,
        membership,
        permissions: buildPermissions(membership)
      }
    });
  } catch (error) {
    console.error('❌ Erreur GET /expert/cabinet/context:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

router.get('/hierarchy', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;
    if (!user || user.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux experts' });
    }

    const { cabinetId } = await resolveCabinetContext(user);
    if (!cabinetId) {
      return res.status(404).json({
        success: false,
        message: 'Aucun cabinet associé'
      });
    }

    const hierarchy = await CabinetService.getCabinetHierarchy(cabinetId);
    return res.json({ success: true, data: hierarchy });
  } catch (error) {
    console.error('❌ Erreur GET /expert/cabinet/hierarchy:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

router.get('/team-stats', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;
    if (!user || user.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux experts' });
    }

    const { cabinetId } = await resolveCabinetContext(user);
    if (!cabinetId) {
      return res.status(404).json({
        success: false,
        message: 'Aucun cabinet associé'
      });
    }

    const stats = await CabinetService.getCabinetTeamStats(cabinetId);
    return res.json({
      success: true,
      data: {
        stats,
        kpis: CabinetService.getCabinetKpisFromStats(stats)
      }
    });
  } catch (error) {
    console.error('❌ Erreur GET /expert/cabinet/team-stats:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

router.post('/members', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;
    if (!user || user.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux experts' });
    }

    const { cabinetId, membership } = await resolveCabinetContext(user);
    if (!cabinetId) {
      return res.status(404).json({
        success: false,
        message: 'Aucun cabinet associé'
      });
    }

    if (!membership || (!isOwner(membership) && !isManager(membership))) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    const { member_id, member_type, team_role, manager_member_id, status, permissions, products } = req.body || {};

    if (!member_id || !member_type || !MEMBER_TYPES.includes(member_type)) {
      return res.status(400).json({
        success: false,
        message: 'member_id et member_type requis'
      });
    }

    const normalizedType = normalizeMemberType(member_type);
    const resolvedRole = isOwner(membership)
      ? normalizeTeamRole(team_role, member_type)
      : 'EXPERT';

    if (resolvedRole === 'OWNER') {
      return res.status(400).json({
        success: false,
        message: 'Utiliser un flux dédié pour définir un owner'
      });
    }

    if (isManager(membership) && normalizedType !== 'expert') {
      return res.status(403).json({
        success: false,
        message: 'Un manager ne peut ajouter que des experts'
      });
    }

    let resolvedManagerId: string | null = null;
    if (isOwner(membership)) {
      resolvedManagerId = manager_member_id ? await ensureManagerReference(cabinetId, manager_member_id) : null;
    } else if (isManager(membership)) {
      resolvedManagerId = membership.id;
    }

    const member = await CabinetService.addMember({
      cabinet_id: cabinetId,
      member_id,
      member_type: normalizedType as any,
      team_role: resolvedRole as any,
      manager_member_id: resolvedManagerId,
      status: normalizeStatus(status),
      permissions: sanitizeObject(permissions, {}),
      products: sanitizeArray(products)
    });

    return res.status(201).json({
      success: true,
      data: member
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'invalid_manager') {
      return res.status(400).json({
        success: false,
        message: 'manager_member_id invalide'
      });
    }

    console.error('❌ Erreur POST /expert/cabinet/members:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Fonction pour générer un mot de passe aléatoire
const generateRandomPassword = (length: number = 12): string => {
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
};

// POST /api/expert/cabinet/members/new - Créer un nouveau collaborateur
router.post('/members/new', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;
    if (!user || user.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux experts' });
    }

    const { cabinetId, membership } = await resolveCabinetContext(user);
    if (!cabinetId) {
      return res.status(404).json({
        success: false,
        message: 'Aucun cabinet associé'
      });
    }

    if (!membership || (!isOwner(membership) && !isManager(membership))) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    const {
      first_name,
      last_name,
      email,
      phone,
      company_name,
      siren,
      team_role,
      manager_member_id,
      produits_eligibles, // Array de { produit_id, client_fee_percentage }
      secteur_activite
    } = req.body;

    // Validation des champs obligatoires
    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Prénom, nom et email sont requis'
      });
    }

    // Vérifier que l'email n'existe pas déjà
    const { data: existingExpert } = await supabase
      .from('Expert')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingExpert) {
      return res.status(400).json({
        success: false,
        message: 'Un expert avec cet email existe déjà'
      });
    }

    // Récupérer les infos du cabinet pour pré-remplir company_name et siren
    const { data: cabinet } = await supabase
      .from('Cabinet')
      .select('name, siret')
      .eq('id', cabinetId)
      .single();

    // Générer un mot de passe temporaire (sera changé à la première connexion)
    const temporaryPassword = generateRandomPassword(12);

    // 1. Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        type: 'expert',
        name: `${first_name} ${last_name}`,
        first_name,
        last_name,
        company_name: company_name || cabinet?.name || '',
        must_change_password: true
      }
    });

    if (authError) {
      console.error('❌ Erreur création Auth:', authError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'utilisateur',
        error: authError.message
      });
    }

    const authUserId = authData.user.id;

    try {
      // 2. Créer l'expert dans la table Expert
      const expertData = {
        id: authUserId,
        auth_user_id: authUserId,
        email,
        first_name,
        last_name,
        name: `${first_name} ${last_name}`,
        company_name: company_name || cabinet?.name || '',
        siren: siren || cabinet?.siret || '',
        phone: phone || null,
        cabinet_id: cabinetId,
        secteur_activite: secteur_activite || [],
        approval_status: 'pending', // En attente de validation admin
        status: 'inactive', // Inactif jusqu'à validation
        is_active: true,
        rating: 0,
        client_fee_percentage: 0.30, // 30% par défaut
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newExpert, error: expertError } = await supabase
        .from('Expert')
        .insert(expertData)
        .select()
        .single();

      if (expertError || !newExpert) {
        // Nettoyer Auth en cas d'erreur
        await supabase.auth.admin.deleteUser(authUserId);
        throw expertError || new Error('Erreur création expert');
      }

      // 3. Déterminer le rôle et le manager
      const resolvedRole = isOwner(membership)
        ? (team_role === 'OWNER' ? 'EXPERT' : (team_role || 'EXPERT')) // OWNER ne peut pas être créé via cette route
        : 'EXPERT';

      if (resolvedRole === 'OWNER') {
        await supabase.auth.admin.deleteUser(authUserId);
        return res.status(400).json({
          success: false,
          message: 'Impossible de créer un OWNER via cette route'
        });
      }

      let resolvedManagerId: string | null = null;
      if (isOwner(membership)) {
        resolvedManagerId = manager_member_id ? await ensureManagerReference(cabinetId, manager_member_id) : null;
      } else if (isManager(membership)) {
        resolvedManagerId = membership.id;
      }

      // 4. Créer le CabinetMember
      const member = await CabinetService.addMember({
        cabinet_id: cabinetId,
        member_id: newExpert.id,
        member_type: 'expert' as any,
        team_role: resolvedRole as any,
        manager_member_id: resolvedManagerId,
        status: 'invited', // En attente de validation admin
        permissions: {},
        products: []
      });

      // 5. Créer les ExpertProduitEligible
      if (produits_eligibles && Array.isArray(produits_eligibles) && produits_eligibles.length > 0) {
        const expertProduits = produits_eligibles.map((p: { produit_id: string; client_fee_percentage: number }) => ({
          expert_id: newExpert.id,
          produit_id: p.produit_id,
          client_fee_percentage: p.client_fee_percentage || 0.30, // En décimal (0.30 = 30%)
          niveau_expertise: 'intermediaire',
          statut: 'actif',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error: epeError } = await supabase
          .from('ExpertProduitEligible')
          .insert(expertProduits);

        if (epeError) {
          console.error('⚠️ Erreur création ExpertProduitEligible (non bloquant):', epeError);
        }
      }

      // 6. Notification admin : Nouvel expert en attente de validation
      try {
        const { NotificationTriggers } = await import('../../services/NotificationTriggers');
        await NotificationTriggers.onNewExpertRegistration({
          id: newExpert.id,
          nom: newExpert.last_name || '',
          prenom: newExpert.first_name || '',
          email: newExpert.email,
          specialite: secteur_activite && Array.isArray(secteur_activite) 
            ? secteur_activite.join(', ') 
            : undefined
        });
        console.log('✅ Notification admin nouvel expert envoyée');
      } catch (notifError) {
        console.error('⚠️ Erreur notification admin (non bloquant):', notifError);
      }

      // 7. Préparer les informations pour l'email
      const frontendUrl = process.env.FRONTEND_URL || 'https://www.profitum.app';
      const loginUrl = `${frontendUrl}/connexion-expert`;

      // Retourner les données avec les informations pour l'email
      return res.status(201).json({
        success: true,
        data: {
          expert: {
            id: newExpert.id,
            email: newExpert.email,
            first_name: newExpert.first_name,
            last_name: newExpert.last_name,
            company_name: newExpert.company_name
          },
          member,
          email_info: {
            email: email,
            temporary_password: temporaryPassword,
            login_url: loginUrl
          }
        }
      });
    } catch (error) {
      // Nettoyer Auth en cas d'erreur
      await supabase.auth.admin.deleteUser(authUserId).catch(() => {});
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'invalid_manager') {
      return res.status(400).json({
        success: false,
        message: 'manager_member_id invalide'
      });
    }

    console.error('❌ Erreur POST /expert/cabinet/members/new:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

router.patch('/members/:memberRecordId', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;
    if (!user || user.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux experts' });
    }

    const { cabinetId, membership } = await resolveCabinetContext(user);
    if (!cabinetId || !membership) {
      return res.status(404).json({
        success: false,
        message: 'Cabinet introuvable'
      });
    }

    if (!buildPermissions(membership).canManageMembers) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    const { memberRecordId } = req.params;
    const targetRecord = await CabinetService.getMemberByRecordId(memberRecordId);

    if (!targetRecord || targetRecord.cabinet_id !== cabinetId) {
      return res.status(404).json({
        success: false,
        message: 'Membre introuvable'
      });
    }

    if (isManager(membership) && targetRecord.manager_member_id !== membership.id) {
      return res.status(403).json({
        success: false,
        message: 'Impossible de modifier ce membre'
      });
    }

    const { status, manager_member_id, team_role, permissions, products } = req.body || {};
    const payload: Record<string, any> = {};

    if (status) {
      if (!MEMBER_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: 'status invalide' });
      }
      payload.status = status;
    }

    if (manager_member_id !== undefined) {
      if (!isOwner(membership)) {
        return res.status(403).json({ success: false, message: 'Seul l’owner peut réassigner' });
      }
      payload.manager_member_id = await ensureManagerReference(cabinetId, manager_member_id || null);
    }

    if (team_role) {
      if (!isOwner(membership)) {
        return res.status(403).json({ success: false, message: 'Seul l’owner peut modifier le rôle' });
      }
      const normalizedRole = team_role.toUpperCase();
      if (!TEAM_ROLES.includes(normalizedRole as typeof TEAM_ROLES[number])) {
        return res.status(400).json({ success: false, message: 'team_role invalide' });
      }
      if (normalizedRole === 'OWNER') {
        return res.status(400).json({ success: false, message: 'Rôle OWNER non supporté via cette route' });
      }
      payload.team_role = normalizedRole;
    }

    if (permissions !== undefined) {
      payload.permissions = sanitizeObject(permissions, {});
    }

    if (products !== undefined) {
      payload.products = sanitizeArray(products);
    }

    if (!Object.keys(payload).length) {
      return res.status(400).json({
        success: false,
        message: 'Aucune donnée à mettre à jour'
      });
    }

    const updated = await CabinetService.updateCabinetMember(memberRecordId, payload);

    return res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'invalid_manager') {
      return res.status(400).json({
        success: false,
        message: 'manager_member_id invalide'
      });
    }

    console.error('❌ Erreur PATCH /expert/cabinet/members/:memberRecordId:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

router.delete('/members/:memberRecordId', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;
    if (!user || user.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux experts' });
    }

    const { cabinetId, membership } = await resolveCabinetContext(user);
    if (!cabinetId || !membership) {
      return res.status(404).json({
        success: false,
        message: 'Cabinet introuvable'
      });
    }

    const targetRecord = await CabinetService.getMemberByRecordId(req.params.memberRecordId);
    if (!targetRecord || targetRecord.cabinet_id !== cabinetId) {
      return res.status(404).json({
        success: false,
        message: 'Membre introuvable'
      });
    }

    if (isOwner(membership) === false && targetRecord.manager_member_id !== membership.id) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    await CabinetService.updateCabinetMember(req.params.memberRecordId, {
      status: 'disabled',
      manager_member_id: null,
      permissions: {},
      products: []
    });

    return res.json({
      success: true,
      message: 'Membre désactivé'
    });
  } catch (error) {
    console.error('❌ Erreur DELETE /expert/cabinet/members/:memberRecordId:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

router.post('/refresh-stats', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;
    if (!user || user.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux experts' });
    }

    const { membership } = await resolveCabinetContext(user);
    if (!isOwner(membership)) {
      return res.status(403).json({
        success: false,
        message: "Seul l'owner peut rafraîchir les statistiques"
      });
    }

    await CabinetService.refreshTeamStats();
    return res.json({
      success: true,
      message: 'Statistiques rafraîchies'
    });
  } catch (error) {
    console.error('❌ Erreur POST /expert/cabinet/refresh-stats:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================================
// Routes pour la gestion des produits du cabinet
// ============================================================================

// GET /api/expert/cabinet/products - Récupérer les produits du cabinet
router.get('/products', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;
    if (!user || user.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux experts' });
    }

    const { cabinetId } = await resolveCabinetContext(user);
    if (!cabinetId) {
      return res.status(404).json({
        success: false,
        message: 'Aucun cabinet associé'
      });
    }

    // Récupérer les produits du cabinet avec les détails du ProduitEligible
    const { data: cabinetProducts, error } = await supabase
      .from('CabinetProduitEligible')
      .select(`
        id,
        produit_eligible_id,
        commission_rate,
        fee_amount,
        fee_mode,
        client_fee_percentage_min,
        is_active,
        metadata,
        created_at,
        updated_at,
        ProduitEligible:produit_eligible_id (
          id,
          nom,
          description,
          categorie
        )
      `)
      .eq('cabinet_id', cabinetId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      data: cabinetProducts || []
    });
  } catch (error) {
    console.error('❌ Erreur GET /expert/cabinet/products:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/expert/cabinet/products - Ajouter un produit au cabinet (OWNER uniquement)
router.post('/products', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;
    if (!user || user.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux experts' });
    }

    const { cabinetId, membership } = await resolveCabinetContext(user);
    if (!cabinetId) {
      return res.status(404).json({
        success: false,
        message: 'Aucun cabinet associé'
      });
    }

    if (!isOwner(membership)) {
      return res.status(403).json({
        success: false,
        message: 'Seul l\'owner peut ajouter des produits'
      });
    }

    const { produit_eligible_id, commission_rate, fee_amount, fee_mode } = req.body;

    if (!produit_eligible_id) {
      return res.status(400).json({
        success: false,
        message: 'produit_eligible_id requis'
      });
    }

    // Vérifier que le produit existe
    const { data: produit, error: produitError } = await supabase
      .from('ProduitEligible')
      .select('id')
      .eq('id', produit_eligible_id)
      .single();

    if (produitError || !produit) {
      return res.status(404).json({
        success: false,
        message: 'Produit introuvable'
      });
    }

    // Créer ou mettre à jour le produit du cabinet
    const products = [{
      produit_eligible_id,
      commission_rate: commission_rate ?? 30.00, // En pourcentage (30.00 = 30%)
      fee_amount: fee_amount ?? 0,
      fee_mode: fee_mode || 'percent',
      is_active: true
    }];

    const result = await CabinetService.upsertCabinetProducts(cabinetId, products);

    return res.status(201).json({
      success: true,
      data: result[0]
    });
  } catch (error) {
    console.error('❌ Erreur POST /expert/cabinet/products:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/expert/cabinet/products/:id - Modifier la commission d'un produit (OWNER uniquement)
router.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;
    if (!user || user.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux experts' });
    }

    const { cabinetId, membership } = await resolveCabinetContext(user);
    if (!cabinetId) {
      return res.status(404).json({
        success: false,
        message: 'Aucun cabinet associé'
      });
    }

    if (!isOwner(membership)) {
      return res.status(403).json({
        success: false,
        message: 'Seul l\'owner peut modifier les produits'
      });
    }

    const { id } = req.params;
    const { commission_rate, fee_amount, fee_mode, is_active, client_fee_percentage_min } = req.body;

    // Vérifier que le produit appartient au cabinet
    const { data: existingProduct, error: checkError } = await supabase
      .from('CabinetProduitEligible')
      .select('id, cabinet_id')
      .eq('id', id)
      .single();

    if (checkError || !existingProduct || existingProduct.cabinet_id !== cabinetId) {
      return res.status(404).json({
        success: false,
        message: 'Produit introuvable'
      });
    }

    // Validation: client_fee_percentage_min doit être <= commission_rate
    if (client_fee_percentage_min !== undefined && commission_rate !== undefined) {
      const minDecimal = typeof client_fee_percentage_min === 'number' 
        ? client_fee_percentage_min 
        : parseFloat(client_fee_percentage_min);
      const maxDecimal = typeof commission_rate === 'number' 
        ? commission_rate / 100 
        : parseFloat(commission_rate) / 100;
      
      if (minDecimal > maxDecimal) {
        return res.status(400).json({
          success: false,
          message: 'Le minimum de commission ne peut pas être supérieur au maximum'
        });
      }
    }

    // Mettre à jour
    const updates: Record<string, any> = {};
    if (commission_rate !== undefined) {
      // Convertir en décimal si fourni en pourcentage (> 1)
      updates.commission_rate = typeof commission_rate === 'number' && commission_rate > 1
        ? commission_rate / 100
        : commission_rate;
    }
    if (fee_amount !== undefined) updates.fee_amount = fee_amount;
    if (fee_mode !== undefined) updates.fee_mode = fee_mode;
    if (is_active !== undefined) updates.is_active = is_active;
    if (client_fee_percentage_min !== undefined) {
      // Convertir en décimal si fourni en pourcentage
      updates.client_fee_percentage_min = typeof client_fee_percentage_min === 'number' && client_fee_percentage_min > 1
        ? client_fee_percentage_min / 100
        : client_fee_percentage_min;
    }
    updates.updated_at = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from('CabinetProduitEligible')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) throw updateError;

    return res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('❌ Erreur PUT /expert/cabinet/products/:id:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/expert/cabinet/products/:id - Supprimer un produit du cabinet (OWNER uniquement)
router.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;
    if (!user || user.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux experts' });
    }

    const { cabinetId, membership } = await resolveCabinetContext(user);
    if (!cabinetId) {
      return res.status(404).json({
        success: false,
        message: 'Aucun cabinet associé'
      });
    }

    if (!isOwner(membership)) {
      return res.status(403).json({
        success: false,
        message: 'Seul l\'owner peut supprimer des produits'
      });
    }

    const { id } = req.params;

    // Vérifier que le produit appartient au cabinet
    const { data: existingProduct, error: checkError } = await supabase
      .from('CabinetProduitEligible')
      .select('id, cabinet_id')
      .eq('id', id)
      .single();

    if (checkError || !existingProduct || existingProduct.cabinet_id !== cabinetId) {
      return res.status(404).json({
        success: false,
        message: 'Produit introuvable'
      });
    }

    // Désactiver plutôt que supprimer (soft delete)
    const { error: updateError } = await supabase
      .from('CabinetProduitEligible')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) throw updateError;

    return res.json({
      success: true,
      message: 'Produit supprimé du cabinet'
    });
  } catch (error) {
    console.error('❌ Erreur DELETE /expert/cabinet/products/:id:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ============================================================================
// Routes pour les alertes produit (OWNER uniquement)
// ============================================================================

// Statuts actifs (pas terminés, pas rejetés, pas annulés)
const ACTIVE_STATUSES = [
  'pending_upload',
  'pending_admin_validation',
  'admin_validated',
  'expert_assigned',
  'expert_pending_validation',
  'expert_validated',
  'charte_pending',
  'charte_signed',
  'documents_requested',
  'complementary_documents_upload_pending',
  'complementary_documents_sent',
  'complementary_documents_validated',
  'complementary_documents_refused',
  'audit_in_progress',
  'audit_completed',
  'validation_pending',
  'validated',
  'implementation_in_progress',
  'implementation_validated',
  'payment_requested',
  'payment_in_progress',
  // Statuts legacy
  'eligible',
  'opportunité',
  'documents_uploaded',
  'eligible_confirmed',
  'eligibility_validated',
  'expert_pending_acceptance',
  'en_cours',
  'documents_manquants',
  'documents_completes',
  'audit_en_cours'
];

// Statuts inactifs (terminés, rejetés, annulés)
const INACTIVE_STATUSES = [
  'admin_rejected',
  'refund_completed',
  'rejected',
  'cancelled',
  'archived'
];

// Helper: Vérifier si un statut est actif
const isActiveStatus = (statut: string | null | undefined): boolean => {
  if (!statut) return false;
  const normalized = normalizeDossierStatus(statut);
  return !INACTIVE_STATUSES.includes(normalized);
};

// 1. DOSSIERS BLOQUÉS (> 7 jours sans mise à jour)
// Helper pour vérifier si un statut est >= expert_assigned
function isStatusAfterExpertAssigned(statut: string): boolean {
  const statusesAfterExpertAssigned = [
    'expert_assigned',
    'expert_pending_validation',
    'expert_validated',
    'charte_pending',
    'charte_signed',
    'documents_requested',
    'complementary_documents_upload_pending',
    'complementary_documents_sent',
    'complementary_documents_validated',
    'complementary_documents_refused',
    'audit_in_progress',
    'audit_completed',
    'validation_pending',
    'validated',
    'implementation_in_progress',
    'implementation_validated',
    'payment_requested',
    'payment_in_progress',
    'refund_completed'
  ];
  return statusesAfterExpertAssigned.includes(statut);
}

async function getBlockedDossiers(produitId: string, authorizedExpertIds: Set<string>) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  // Récupérer tous les dossiers du produit avec statut >= expert_assigned
  let dossiersQuery = supabase
    .from('ClientProduitEligible')
    .select(`
      id,
      statut,
      expert_id,
      updated_at,
      montantFinal,
      Client:clientId (
        id,
        name,
        email,
        company_name,
        first_name,
        last_name
      ),
      Expert:expert_id (
        id,
        name,
        email
      )
    `)
    .eq('produitId', produitId)
    .order('updated_at', { ascending: true });

  // Filtrer uniquement les dossiers dont l'expert est membre du cabinet
  if (authorizedExpertIds.size > 0) {
    dossiersQuery = dossiersQuery.in('expert_id', Array.from(authorizedExpertIds));
  } else {
    // Si aucun expert autorisé, retourner une liste vide
    dossiersQuery = dossiersQuery.eq('expert_id', '00000000-0000-0000-0000-000000000000');
  }

  const { data: dossiers, error } = await dossiersQuery;
  if (error) throw error;

  // Filtrer et calculer les jours depuis la dernière mise à jour
  const blockedDossiers = (dossiers || [])
    .filter(dossier => {
      // Vérifier que le statut est >= expert_assigned
      if (!isStatusAfterExpertAssigned(dossier.statut)) return false;
      
      // Vérifier que l'expert est membre du cabinet
      if (!dossier.expert_id || !authorizedExpertIds.has(dossier.expert_id)) return false;
      
      const isActive = isActiveStatus(dossier.statut);
      if (!isActive) return false;
      
      const updatedAt = new Date(dossier.updated_at);
      return updatedAt < sevenDaysAgo;
    })
    .map(dossier => {
      const daysSinceUpdate = Math.floor(
        (new Date().getTime() - new Date(dossier.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        ...dossier,
        daysSinceUpdate
      };
    });

  return blockedDossiers;
}

// 2. EXPERTS INACTIFS (> 14 jours avec dossiers actifs)
async function getInactiveExperts(produitId: string, authorizedExpertIds: Set<string>) {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  // Récupérer tous les dossiers actifs du produit avec leurs experts
  // Filtrer uniquement les dossiers dont l'expert est membre du cabinet
  let dossiersQuery = supabase
    .from('ClientProduitEligible')
    .select(`
      id,
      expert_id,
      statut,
      updated_at,
      Expert:expert_id (
        id,
        name,
        email
      )
    `)
    .eq('produitId', produitId)
    .not('expert_id', 'is', null);

  // Filtrer uniquement les dossiers dont l'expert est membre du cabinet
  if (authorizedExpertIds.size > 0) {
    dossiersQuery = dossiersQuery.in('expert_id', Array.from(authorizedExpertIds));
  } else {
    dossiersQuery = dossiersQuery.eq('expert_id', '00000000-0000-0000-0000-000000000000');
  }

  const { data: dossiers, error: dossiersError } = await dossiersQuery;
  if (dossiersError) throw dossiersError;

  // Grouper par expert et calculer la dernière activité
  const expertsMap = new Map();
  
  (dossiers || []).forEach(dossier => {
    // Vérifier que le statut est >= expert_assigned
    if (!isStatusAfterExpertAssigned(dossier.statut)) return;
    
    // Vérifier que l'expert est membre du cabinet
    if (!dossier.expert_id || !authorizedExpertIds.has(dossier.expert_id)) return;
    
    if (!isActiveStatus(dossier.statut)) return;
    
    const expertId = dossier.expert_id;
    const expert = dossier.Expert as any;
    
    if (!expertsMap.has(expertId)) {
      expertsMap.set(expertId, {
        expert,
        dossiers: [],
        lastActivity: null
      });
    }
    
    const expertData = expertsMap.get(expertId);
    expertData.dossiers.push(dossier);
    
    const dossierDate = new Date(dossier.updated_at);
    if (!expertData.lastActivity || dossierDate > expertData.lastActivity) {
      expertData.lastActivity = dossierDate;
    }
  });

  // Filtrer les experts inactifs (> 14 jours)
  const inactiveExperts = Array.from(expertsMap.entries())
    .map(([expertId, data]: [string, any]) => ({
      expertId,
      expert: data.expert,
      activeDossiers: data.dossiers.length,
      lastActivity: data.lastActivity,
      daysSinceActivity: Math.floor(
        (new Date().getTime() - data.lastActivity.getTime()) / (1000 * 60 * 60 * 24)
      )
    }))
    .filter((exp: any) => exp.lastActivity < fourteenDaysAgo)
    .sort((a: any, b: any) => a.lastActivity.getTime() - b.lastActivity.getTime());

  return inactiveExperts;
}

// GET /api/expert/cabinet/products/:produitId/alerts - Récupérer les alertes pour un produit
router.get('/products/:produitId/alerts', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;
    if (!user || user.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux experts' });
    }

    const { cabinetId, membership } = await resolveCabinetContext(user);
    if (!cabinetId || !isOwner(membership)) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé au owner'
      });
    }

    const { produitId } = req.params;

    // Vérifier que le produit appartient au cabinet
    const { data: cabinetProduct, error: productError } = await supabase
      .from('CabinetProduitEligible')
      .select('id, produit_eligible_id')
      .eq('cabinet_id', cabinetId)
      .eq('produit_eligible_id', produitId)
      .eq('is_active', true)
      .single();

    if (productError || !cabinetProduct) {
      return res.status(404).json({
        success: false,
        message: 'Produit introuvable dans ce cabinet'
      });
    }

    // Récupérer tous les membres du cabinet (owner, managers, experts)
    const { data: cabinetMembers, error: membersError } = await supabase
      .from('CabinetMember')
      .select('member_id, member_type, team_role, status')
      .eq('cabinet_id', cabinetId)
      .eq('status', 'active');
    
    if (membersError) throw membersError;
    
    // Récupérer aussi l'owner du cabinet
    const { data: cabinet, error: cabinetError } = await supabase
      .from('Cabinet')
      .select('owner_expert_id')
      .eq('id', cabinetId)
      .single();
    
    if (cabinetError) throw cabinetError;
    
    // Construire la liste des expert_ids autorisés (membres du cabinet + owner)
    const authorizedExpertIds = new Set<string>();
    if (cabinet?.owner_expert_id) {
      authorizedExpertIds.add(cabinet.owner_expert_id);
    }
    (cabinetMembers || []).forEach(member => {
      if (member.member_type === 'expert' || member.team_role === 'OWNER' || member.team_role === 'MANAGER' || member.team_role === 'EXPERT') {
        authorizedExpertIds.add(member.member_id);
      }
    });

    // Récupérer les alertes (uniquement pour les experts du cabinet et statut >= expert_assigned)
    const blockedDossiers = await getBlockedDossiers(produitId, authorizedExpertIds);
    const inactiveExperts = await getInactiveExperts(produitId, authorizedExpertIds);

    return res.json({
      success: true,
      data: {
        blockedDossiers: {
          count: blockedDossiers.length,
          items: blockedDossiers
        },
        inactiveExperts: {
          count: inactiveExperts.length,
          items: inactiveExperts
        }
      }
    });
  } catch (error) {
    console.error('❌ Erreur GET /expert/cabinet/products/:produitId/alerts:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/expert/cabinet/products/:produitId/synthese - Synthèse complète d'un produit
router.get('/products/:produitId/synthese', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;
    if (!user || user.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux experts' });
    }

    const { cabinetId, membership } = await resolveCabinetContext(user);
    if (!cabinetId || !isOwner(membership)) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé au owner'
      });
    }

    const { produitId } = req.params;
    const { page = '1', limit = '20', statut, expertId, search } = req.query;

    // Vérifier que le produit appartient au cabinet et récupérer ses infos
    const { data: cabinetProduct, error: productError } = await supabase
      .from('CabinetProduitEligible')
      .select(`
        id,
        produit_eligible_id,
        commission_rate,
        fee_amount,
        fee_mode,
        client_fee_percentage_min,
        is_active,
        ProduitEligible:produit_eligible_id (
          id,
          nom,
          description,
          categorie
        )
      `)
      .eq('cabinet_id', cabinetId)
      .eq('produit_eligible_id', produitId)
      .eq('is_active', true)
      .single();

    if (productError || !cabinetProduct) {
      return res.status(404).json({
        success: false,
        message: 'Produit introuvable dans ce cabinet'
      });
    }

    // Récupérer tous les membres du cabinet (owner, managers, experts)
    const { data: cabinetMembers, error: membersError } = await supabase
      .from('CabinetMember')
      .select('member_id, member_type, team_role, status')
      .eq('cabinet_id', cabinetId)
      .eq('status', 'active');
    
    if (membersError) throw membersError;
    
    // Récupérer aussi l'owner du cabinet
    const { data: cabinet, error: cabinetError } = await supabase
      .from('Cabinet')
      .select('owner_expert_id')
      .eq('id', cabinetId)
      .single();
    
    if (cabinetError) throw cabinetError;
    
    // Construire la liste des expert_ids autorisés (membres du cabinet + owner)
    const authorizedExpertIds = new Set<string>();
    if (cabinet?.owner_expert_id) {
      authorizedExpertIds.add(cabinet.owner_expert_id);
    }
    (cabinetMembers || []).forEach(member => {
      if (member.member_type === 'expert' || member.team_role === 'OWNER' || member.team_role === 'MANAGER' || member.team_role === 'EXPERT') {
        authorizedExpertIds.add(member.member_id);
      }
    });
    
    // Récupérer tous les dossiers du produit avec jointures, filtrés par experts du cabinet
    // ET avec le statut "expert_assigned"
    let dossiersQuery = supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        clientId,
        expert_id,
        statut,
        montantFinal,
        tauxFinal,
        created_at,
        updated_at,
        Client:clientId (
          id,
          name,
          email,
          company_name,
          first_name,
          last_name
        ),
        Expert:expert_id (
          id,
          name,
          email
        )
      `, { count: 'exact' })
      .eq('produitId', produitId);
    
    // Filtrer uniquement les dossiers dont l'expert est membre du cabinet
    if (authorizedExpertIds.size > 0) {
      dossiersQuery = dossiersQuery.in('expert_id', Array.from(authorizedExpertIds));
    } else {
      // Si aucun expert autorisé, retourner une liste vide
      dossiersQuery = dossiersQuery.eq('expert_id', '00000000-0000-0000-0000-000000000000'); // UUID impossible
    }

    // Appliquer les filtres de statut
    // Par défaut, on filtre uniquement les dossiers avec statut "expert_assigned"
    // Sauf si l'utilisateur a choisi un autre filtre
    if (statut && statut !== 'all') {
      dossiersQuery = dossiersQuery.eq('statut', statut);
    } else {
      // Par défaut : uniquement les dossiers avec statut expert_assigned
      dossiersQuery = dossiersQuery.eq('statut', 'expert_assigned');
    }
    if (expertId && expertId !== 'all') {
      dossiersQuery = dossiersQuery.eq('expert_id', expertId);
    }

    // Pagination pour la liste
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    const dossiersQueryPaginated = dossiersQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data: dossiersPaginated, error: dossiersError, count: totalDossiers } = await dossiersQueryPaginated;
    if (dossiersError) throw dossiersError;

    // Récupérer tous les dossiers pour les statistiques (sans pagination), filtrés par experts du cabinet
    // ET avec le statut "expert_assigned"
    let allDossiersQuery = supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        statut,
        expert_id,
        montantFinal,
        tauxFinal,
        created_at,
        updated_at,
        Expert:expert_id (
          id,
          name,
          email
        )
      `)
      .eq('produitId', produitId)
      .eq('statut', 'expert_assigned'); // Pour les statistiques, on filtre uniquement les dossiers avec statut expert_assigned
    
    // Filtrer uniquement les dossiers dont l'expert est membre du cabinet
    if (authorizedExpertIds.size > 0) {
      allDossiersQuery = allDossiersQuery.in('expert_id', Array.from(authorizedExpertIds));
    } else {
      allDossiersQuery = allDossiersQuery.eq('expert_id', '00000000-0000-0000-0000-000000000000');
    }
    
    const { data: allDossiers, error: allDossiersError } = await allDossiersQuery;

    if (allDossiersError) throw allDossiersError;

    const dossiersList = allDossiers || [];

    // 1. KPIs GLOBAUX
    const total = dossiersList.length;
    const enCours = dossiersList.filter(d => isActiveStatus(d.statut)).length;
    const signes = dossiersList.filter(d => normalizeDossierStatus(d.statut) === 'validated').length;
    const enAttente = dossiersList.filter(d => {
      const status = normalizeDossierStatus(d.statut);
      return ['pending_upload', 'pending_admin_validation', 'expert_pending_validation'].includes(status);
    }).length;

    // 2. RÉPARTITION PAR STATUT
    const statutsRepartition: Record<string, number> = {};
    dossiersList.forEach(dossier => {
      const status = normalizeDossierStatus(dossier.statut);
      statutsRepartition[status] = (statutsRepartition[status] || 0) + 1;
    });

    // 3. EXPERTS RELIÉS AU PRODUIT (uniquement ceux qui sont membres du cabinet)
    const expertsMap = new Map();
    dossiersList.forEach(dossier => {
      if (!dossier.expert_id || !dossier.Expert) return;
      
      // Vérifier que l'expert est membre du cabinet
      if (!authorizedExpertIds.has(dossier.expert_id)) return;
      
      const expert = dossier.Expert as any;
      if (!expertsMap.has(dossier.expert_id)) {
        expertsMap.set(dossier.expert_id, {
          expert: {
            id: expert.id,
            name: expert.name,
            email: expert.email
          },
          dossiersTotal: 0,
          dossiersEnCours: 0,
          dossiersSignes: 0,
          dossiersTermines: 0,
          montantTotal: 0,
          lastActivity: null
        });
      }

      const expertData = expertsMap.get(dossier.expert_id);
      expertData.dossiersTotal++;
      
      if (isActiveStatus(dossier.statut)) {
        expertData.dossiersEnCours++;
      }
      if (normalizeDossierStatus(dossier.statut) === 'validated') {
        expertData.dossiersSignes++;
      }
      if (normalizeDossierStatus(dossier.statut) === 'refund_completed') {
        expertData.dossiersTermines++;
      }

      if (dossier.montantFinal) {
        expertData.montantTotal += dossier.montantFinal;
      }

      const updatedAt = new Date(dossier.updated_at);
      if (!expertData.lastActivity || updatedAt > expertData.lastActivity) {
        expertData.lastActivity = updatedAt;
      }
    });

    const expertsRelies = Array.from(expertsMap.values()).map(exp => ({
      ...exp,
      tauxReussite: exp.dossiersTotal > 0 ? Math.round((exp.dossiersSignes / exp.dossiersTotal) * 100) : 0,
      daysSinceActivity: exp.lastActivity
        ? Math.floor((new Date().getTime() - exp.lastActivity.getTime()) / (1000 * 60 * 60 * 24))
        : null
    })).sort((a, b) => b.dossiersTotal - a.dossiersTotal);

    // 4. MONTANTS ET COMMISSIONS
    const dossiersValides = dossiersList.filter(d => normalizeDossierStatus(d.statut) === 'validated' && d.montantFinal);
    const montantTotalSignes = dossiersValides.reduce((sum, d) => sum + (d.montantFinal || 0), 0);
    // commission_rate est stocké en pourcentage (ex: 30.00 pour 30%), donc on divise par 100 pour obtenir la décimale
    const commissionRateRaw = cabinetProduct.commission_rate || 30.0;
    const commissionRate = commissionRateRaw > 1 ? commissionRateRaw / 100 : commissionRateRaw;
    const commissionGeneree = montantTotalSignes * commissionRate;
    const commissionMoyenne = dossiersValides.length > 0 ? commissionGeneree / dossiersValides.length : 0;

    // 5. ÉVOLUTION TEMPORELLE (30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const evolution = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dossiersCreated = dossiersList.filter(d => {
        const created = new Date(d.created_at);
        return created >= date && created < nextDate;
      }).length;

      const dossiersSigned = dossiersList.filter(d => {
        if (normalizeDossierStatus(d.statut) !== 'validated') return false;
        const updated = new Date(d.updated_at);
        return updated >= date && updated < nextDate;
      }).length;

      evolution.push({
        date: date.toISOString().split('T')[0],
        dossiersCreated,
        dossiersSigned
      });
    }

    // 6. ALERTES (uniquement pour les experts du cabinet et statut >= expert_assigned)
    const blockedDossiers = await getBlockedDossiers(produitId, authorizedExpertIds);
    const inactiveExperts = await getInactiveExperts(produitId, authorizedExpertIds);

    // Format des dossiers paginés avec recherche
    let dossiersFiltered = dossiersPaginated || [];
    if (search) {
      const searchLower = (search as string).toLowerCase();
      dossiersFiltered = dossiersFiltered.filter((d: any) => {
        const client = d.Client as any;
        const clientName = client?.name || 
          (client?.first_name && client?.last_name ? `${client.first_name} ${client.last_name}` : client?.first_name || client?.last_name) ||
          client?.company_name || '';
        return (
          clientName.toLowerCase().includes(searchLower) ||
          client?.email?.toLowerCase().includes(searchLower) ||
          client?.company_name?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Extraire les données du produit (gérer le cas array/objet)
    const produitEligible = cabinetProduct.ProduitEligible as any;
    const produitData = Array.isArray(produitEligible) 
      ? produitEligible[0]
      : produitEligible;

    // Préparer les valeurs de commission pour le frontend
    // commission_rate est stocké en pourcentage dans la BDD, on le renvoie tel quel pour l'affichage
    const commissionRateForDisplay = cabinetProduct.commission_rate || 30.0;
    const clientFeeMinForDisplay = cabinetProduct.client_fee_percentage_min 
      ? (cabinetProduct.client_fee_percentage_min > 1 
          ? cabinetProduct.client_fee_percentage_min 
          : cabinetProduct.client_fee_percentage_min * 100)
      : null;
    
    return res.json({
      success: true,
      data: {
        produit: {
          id: produitData?.id || cabinetProduct.produit_eligible_id,
          nom: produitData?.nom,
          description: produitData?.description,
          categorie: produitData?.categorie,
          commission_rate: commissionRateForDisplay, // En pourcentage pour l'affichage
          client_fee_percentage_min: clientFeeMinForDisplay, // En pourcentage pour l'affichage
          fee_mode: cabinetProduct.fee_mode
        },
        kpis: {
          total,
          enCours,
          signes,
          enAttente
        },
        montants: {
          montantTotalSignes,
          commissionGeneree,
          commissionMoyenne
        },
        statutsRepartition,
        expertsRelies,
        evolution,
        dossiers: {
          items: dossiersFiltered,
          total: totalDossiers || 0,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil((totalDossiers || 0) / limitNum)
        },
        alertes: {
          blockedDossiers: {
            count: blockedDossiers.length,
            items: blockedDossiers.slice(0, 5) // Limiter à 5 pour l'affichage
          },
          inactiveExperts: {
            count: inactiveExperts.length,
            items: inactiveExperts.slice(0, 5) // Limiter à 5 pour l'affichage
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Erreur GET /expert/cabinet/products/:produitId/synthese:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/expert/cabinet/experts/:expertId/synthese - Synthèse complète d'un expert
router.get('/experts/:expertId/synthese', async (req: Request, res: Response) => {
  try {
    const user = req.user as AuthUser;
    if (!user || user.type !== 'expert') {
      return res.status(403).json({ success: false, message: 'Accès réservé aux experts' });
    }

    const { cabinetId, membership } = await resolveCabinetContext(user);
    if (!cabinetId || !isOwner(membership)) {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé au owner'
      });
    }

    const { expertId } = req.params;
    const { page = '1', limit = '20', produitId, statut, search } = req.query;

    // Vérifier que l'expert appartient au cabinet
    const { data: expertMember, error: memberError } = await supabase
      .from('CabinetMember')
      .select(`
        id,
        member_id,
        team_role,
        Expert:member_id (
          id,
          name,
          email,
          company_name,
          phone,
          first_name,
          last_name
        )
      `)
      .eq('cabinet_id', cabinetId)
      .eq('member_id', expertId)
      .eq('status', 'active')
      .single();

    if (memberError || !expertMember) {
      return res.status(404).json({
        success: false,
        message: 'Expert introuvable dans ce cabinet'
      });
    }

    // Récupérer tous les dossiers de l'expert avec jointures
    let dossiersQuery = supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        clientId,
        produitId,
        statut,
        montantFinal,
        tauxFinal,
        created_at,
        updated_at,
        Client:clientId (
          id,
          name,
          email,
          company_name,
          first_name,
          last_name
        ),
        ProduitEligible:produitId (
          id,
          nom,
          description,
          categorie
        )
      `, { count: 'exact' })
      .eq('expert_id', expertId);

    // Appliquer les filtres
    if (statut && statut !== 'all') {
      dossiersQuery = dossiersQuery.eq('statut', statut);
    }
    if (produitId && produitId !== 'all') {
      dossiersQuery = dossiersQuery.eq('produitId', produitId);
    }

    // Pagination pour la liste
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    const dossiersQueryPaginated = dossiersQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data: dossiersPaginated, error: dossiersError, count: totalDossiers } = await dossiersQueryPaginated;
    if (dossiersError) throw dossiersError;

    // Récupérer tous les dossiers pour les statistiques (sans pagination)
    const { data: allDossiers, error: allDossiersError } = await supabase
      .from('ClientProduitEligible')
      .select(`
        id,
        produitId,
        statut,
        montantFinal,
        tauxFinal,
        created_at,
        updated_at,
        ProduitEligible:produitId (
          id,
          nom,
          description,
          categorie
        )
      `)
      .eq('expert_id', expertId);

    if (allDossiersError) throw allDossiersError;

    const dossiersList = allDossiers || [];

    // 1. KPIs GLOBAUX
    const total = dossiersList.length;
    const enCours = dossiersList.filter(d => isActiveStatus(d.statut)).length;
    const signes = dossiersList.filter(d => normalizeDossierStatus(d.statut) === 'validated').length;
    const termines = dossiersList.filter(d => normalizeDossierStatus(d.statut) === 'refund_completed').length;

    // 2. RÉPARTITION PAR PRODUIT
    const produitsMap = new Map();
    dossiersList.forEach(dossier => {
      if (!dossier.produitId || !dossier.ProduitEligible) return;
      
      const produit = dossier.ProduitEligible as any;
      const produitData = Array.isArray(produit) ? produit[0] : produit;
      
      if (!produitsMap.has(dossier.produitId)) {
        produitsMap.set(dossier.produitId, {
          produit: {
            id: produitData?.id || dossier.produitId,
            nom: produitData?.nom,
            description: produitData?.description,
            categorie: produitData?.categorie
          },
          dossiersTotal: 0,
          dossiersEnCours: 0,
          dossiersSignes: 0,
          dossiersTermines: 0,
          montantTotal: 0
        });
      }

      const produitStats = produitsMap.get(dossier.produitId);
      produitStats.dossiersTotal++;
      
      if (isActiveStatus(dossier.statut)) {
        produitStats.dossiersEnCours++;
      }
      if (normalizeDossierStatus(dossier.statut) === 'validated') {
        produitStats.dossiersSignes++;
      }
      if (normalizeDossierStatus(dossier.statut) === 'refund_completed') {
        produitStats.dossiersTermines++;
      }

      if (dossier.montantFinal) {
        produitStats.montantTotal += dossier.montantFinal;
      }
    });

    const dossiersParProduit = Array.from(produitsMap.values())
      .map(prod => ({
        ...prod,
        tauxReussite: prod.dossiersTotal > 0 ? Math.round((prod.dossiersSignes / prod.dossiersTotal) * 100) : 0
      }))
      .sort((a, b) => b.dossiersTotal - a.dossiersTotal);

    // 3. MONTANTS ET COMMISSIONS
    const dossiersValides = dossiersList.filter(d => normalizeDossierStatus(d.statut) === 'validated' && d.montantFinal);
    const montantTotalSignes = dossiersValides.reduce((sum, d) => sum + (d.montantFinal || 0), 0);
    
    // Récupérer la commission de l'expert pour ce produit (prendre la moyenne si plusieurs produits)
    const { data: expertProduits, error: expertProduitsError } = await supabase
      .from('ExpertProduitEligible')
      .select('produit_id, client_fee_percentage')
      .eq('expert_id', expertId);

    let commissionMoyenneExpert = 0.30; // Défaut 30%
    if (!expertProduitsError && expertProduits && expertProduits.length > 0) {
      const totalCommission = expertProduits.reduce((sum, ep) => sum + (ep.client_fee_percentage || 0.30), 0);
      commissionMoyenneExpert = totalCommission / expertProduits.length;
    }

    const commissionGeneree = montantTotalSignes * commissionMoyenneExpert;

    // 4. RÉPARTITION PAR STATUT
    const statutsRepartition: Record<string, number> = {};
    dossiersList.forEach(dossier => {
      const status = normalizeDossierStatus(dossier.statut);
      statutsRepartition[status] = (statutsRepartition[status] || 0) + 1;
    });

    // 5. ÉVOLUTION TEMPORELLE (30 derniers jours)
    const evolution = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dossiersCreated = dossiersList.filter(d => {
        const created = new Date(d.created_at);
        return created >= date && created < nextDate;
      }).length;

      const dossiersSigned = dossiersList.filter(d => {
        if (normalizeDossierStatus(d.statut) !== 'validated') return false;
        const updated = new Date(d.updated_at);
        return updated >= date && updated < nextDate;
      }).length;

      evolution.push({
        date: date.toISOString().split('T')[0],
        dossiersCreated,
        dossiersSigned
      });
    }

    // 6. DERNIÈRE ACTIVITÉ
    const lastActivity = dossiersList.length > 0
      ? dossiersList.reduce((latest, d) => {
          const updated = new Date(d.updated_at);
          return updated > latest ? updated : latest;
        }, new Date(dossiersList[0].updated_at))
      : null;

    // Format des dossiers paginés avec recherche
    let dossiersFiltered = dossiersPaginated || [];
    if (search) {
      const searchLower = (search as string).toLowerCase();
      dossiersFiltered = dossiersFiltered.filter((d: any) => {
        const client = d.Client as any;
        const produit = d.ProduitEligible as any;
        const produitData = Array.isArray(produit) ? produit[0] : produit;
        const clientName = client?.name || 
          (client?.first_name && client?.last_name ? `${client.first_name} ${client.last_name}` : client?.first_name || client?.last_name) ||
          client?.company_name || '';
        return (
          clientName.toLowerCase().includes(searchLower) ||
          client?.email?.toLowerCase().includes(searchLower) ||
          client?.company_name?.toLowerCase().includes(searchLower) ||
          produitData?.nom?.toLowerCase().includes(searchLower)
        );
      });
    }

    const expert = expertMember.Expert as any;
    const expertData = Array.isArray(expert) ? expert[0] : expert;

    return res.json({
      success: true,
      data: {
        expert: {
          id: expertData?.id || expertId,
          name: expertData?.name,
          email: expertData?.email,
          company_name: expertData?.company_name,
          phone: expertData?.phone,
          first_name: expertData?.first_name,
          last_name: expertData?.last_name,
          team_role: expertMember.team_role
        },
        kpis: {
          total,
          enCours,
          signes,
          termines,
          tauxReussite: total > 0 ? Math.round((signes / total) * 100) : 0
        },
        montants: {
          montantTotalSignes,
          commissionGeneree,
          commissionMoyenneExpert
        },
        statutsRepartition,
        dossiersParProduit,
        evolution,
        lastActivity: lastActivity?.toISOString() || null,
        daysSinceActivity: lastActivity
          ? Math.floor((new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
          : null,
        dossiers: {
          items: dossiersFiltered,
          total: totalDossiers || 0,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil((totalDossiers || 0) / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('❌ Erreur GET /expert/cabinet/experts/:expertId/synthese:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;

