import { Router, Request, Response } from 'express';
import { supabase } from '../../lib/supabase';
import { CabinetService } from '../../services/cabinetService';
import { AuthUser } from '../../types/auth';

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
        message: 'Seul l’owner peut rafraîchir les statistiques'
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

export default router;

