import { Router, Request, Response } from 'express';
import { supabase } from '../../lib/supabase';
import { CabinetService } from '../../services/cabinetService';
import { AuthUser } from '../../types/auth';
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

    // Générer un mot de passe aléatoire
    const randomPassword = generateRandomPassword(12);

    // 1. Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: randomPassword,
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
          niveauExpertise: 'intermediaire',
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

      // Retourner les données (sans le mot de passe)
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
          password_generated: true // Indiquer qu'un mot de passe a été généré
          // Note: Le mot de passe sera envoyé par email (à implémenter)
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
    const { commission_rate, fee_amount, fee_mode, is_active } = req.body;

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

    // Mettre à jour
    const updates: Record<string, any> = {};
    if (commission_rate !== undefined) updates.commission_rate = commission_rate;
    if (fee_amount !== undefined) updates.fee_amount = fee_amount;
    if (fee_mode !== undefined) updates.fee_mode = fee_mode;
    if (is_active !== undefined) updates.is_active = is_active;
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

export default router;

