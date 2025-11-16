import { Router, Request, Response } from 'express';
import { CabinetService } from '../../services/cabinetService';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const MEMBER_TYPES = ['expert', 'apporteur', 'assistant', 'responsable_cabinet'] as const;
const TEAM_ROLES = ['OWNER', 'MANAGER', 'EXPERT', 'ASSISTANT'] as const;
const MEMBER_STATUSES = ['active', 'invited', 'suspended', 'disabled'] as const;

type CabinetMemberStatus = 'active' | 'invited' | 'suspended' | 'disabled';

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

const normalizeStatus = (value?: string): CabinetMemberStatus => {
  if (value && MEMBER_STATUSES.includes(value as typeof MEMBER_STATUSES[number])) {
    return value as CabinetMemberStatus;
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

router.get('/', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const cabinets = await CabinetService.listCabinets({
      search: typeof search === 'string' ? search : undefined
    });

    return res.json({
      success: true,
      data: cabinets || []
    });
  } catch (error) {
    console.error('❌ Erreur GET /admin/cabinets:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cabinet = await CabinetService.getCabinetDetail(id);

    if (!cabinet) {
      return res.status(404).json({
        success: false,
        message: 'Cabinet non trouvé'
      });
    }

    return res.json({
      success: true,
      data: cabinet
    });
  } catch (error) {
    console.error('❌ Erreur GET /admin/cabinets/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.get('/:id/hierarchy', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const hierarchy = await CabinetService.getCabinetHierarchy(id);

    return res.json({
      success: true,
      data: hierarchy
    });
  } catch (error) {
    console.error('❌ Erreur GET /admin/cabinets/:id/hierarchy:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.get('/:id/team-stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stats = await CabinetService.getCabinetTeamStats(id);

    return res.json({
      success: true,
      data: {
        stats,
        kpis: CabinetService.getCabinetKpisFromStats(stats)
      }
    });
  } catch (error) {
    console.error('❌ Erreur GET /admin/cabinets/:id/team-stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.get('/:id/clients', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const clients = await CabinetService.getCabinetClients(id);

    return res.json({
      success: true,
      data: clients
    });
  } catch (error) {
    console.error('❌ Erreur GET /admin/cabinets/:id/clients:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.get('/:id/apporteurs', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const apporteurs = await CabinetService.getCabinetApporteurs(id);

    return res.json({
      success: true,
      data: apporteurs
    });
  } catch (error) {
    console.error('❌ Erreur GET /admin/cabinets/:id/apporteurs:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.get('/:id/shares', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const shares = await CabinetService.listCabinetShares(id);

    return res.json({
      success: true,
      data: shares
    });
  } catch (error) {
    console.error('❌ Erreur GET /admin/cabinets/:id/shares:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.post('/:id/shares', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { client_produit_eligible_id, expert_id, permissions } = req.body || {};

    if (!client_produit_eligible_id) {
      return res.status(400).json({
        success: false,
        message: 'client_produit_eligible_id requis'
      });
    }

    const share = await CabinetService.createCabinetShare({
      cabinet_id: id,
      client_produit_eligible_id,
      expert_id,
      permissions
    });

    return res.status(201).json({
      success: true,
      data: share
    });
  } catch (error) {
    console.error('❌ Erreur POST /admin/cabinets/:id/shares:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.delete('/:id/shares/:shareId', async (req: Request, res: Response) => {
  try {
    const { shareId } = req.params;
    await CabinetService.deleteCabinetShare(shareId);

    return res.json({
      success: true,
      message: 'Partage supprimé'
    });
  } catch (error) {
    console.error('❌ Erreur DELETE /admin/cabinets/:id/shares/:shareId:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.get('/:id/timeline', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const timeline = await CabinetService.getCabinetTimeline(id, { days, page, limit });

    return res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    console.error('❌ Erreur GET /admin/cabinets/:id/timeline:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.get('/:id/tasks', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;

    const tasks = await CabinetService.getCabinetTasks(id, { status, type });

    return res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    console.error('❌ Erreur GET /admin/cabinets/:id/tasks:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, siret, phone, email, address } = req.body || {};

    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Nom de cabinet requis'
      });
    }

    const cabinet = await CabinetService.createCabinet({
      name: name.trim(),
      siret,
      phone,
      email,
      address
    });

    return res.status(201).json({
      success: true,
      data: cabinet
    });

  } catch (error) {
    console.error('❌ Erreur POST /admin/cabinets:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune donnée à mettre à jour'
      });
    }

    const updated = await CabinetService.updateCabinet(id, updates);

    return res.json({
      success: true,
      data: updated
    });

  } catch (error) {
    console.error('❌ Erreur PUT /admin/cabinets/:id:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.put('/:id/products', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const products = Array.isArray(req.body?.products) ? req.body.products : [];

    if (!products.length) {
      return res.status(400).json({
        success: false,
        message: 'Liste de produits requise'
      });
    }

    const result = await CabinetService.upsertCabinetProducts(id, products);

    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ Erreur PUT /admin/cabinets/:id/products:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.post('/:id/owner', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { expert_id } = req.body || {};

    if (!expert_id) {
      return res.status(400).json({
        success: false,
        message: 'expert_id requis'
      });
    }

    const owner = await CabinetService.setCabinetOwner(id, expert_id);

    return res.json({
      success: true,
      data: owner
    });
  } catch (error) {
    console.error('❌ Erreur POST /admin/cabinets/:id/owner:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.post('/:id/managers', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { expert_id } = req.body || {};

    if (!expert_id) {
      return res.status(400).json({
        success: false,
        message: 'expert_id requis'
      });
    }

    const manager = await CabinetService.assignManager(id, expert_id);

    return res.status(201).json({
      success: true,
      data: manager
    });
  } catch (error) {
    console.error('❌ Erreur POST /admin/cabinets/:id/managers:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.post('/:id/experts', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { expert_id, manager_member_id } = req.body || {};

    if (!expert_id || !manager_member_id) {
      return res.status(400).json({
        success: false,
        message: 'expert_id et manager_member_id requis'
      });
    }

    const expert = await CabinetService.assignExpertToManager(id, expert_id, manager_member_id);

    return res.status(201).json({
      success: true,
      data: expert
    });
  } catch (error) {
    console.error('❌ Erreur POST /admin/cabinets/:id/experts:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.post('/:id/members', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { member_id, member_type, team_role, manager_member_id, status, permissions, products } = req.body || {};

    if (!member_id || !member_type || !MEMBER_TYPES.includes(member_type)) {
      return res.status(400).json({
        success: false,
        message: 'member_id et member_type valides requis'
      });
    }

    const normalizedType = normalizeMemberType(member_type);
    const normalizedRole = normalizeTeamRole(team_role, member_type);

    const member = await CabinetService.addMember({
      cabinet_id: id,
      member_id,
      member_type: normalizedType as any,
      team_role: normalizedRole as any,
      manager_member_id: manager_member_id || null,
      status: normalizeStatus(status),
      permissions: sanitizeObject(permissions, {}),
      products: sanitizeArray(products)
    });

    return res.status(201).json({
      success: true,
      data: member
    });

  } catch (error) {
    console.error('❌ Erreur POST /admin/cabinets/:id/members:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.patch('/:id/members/:memberId', async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;
    const { status, manager_member_id, team_role, permissions, products } = req.body || {};

    const payload: Record<string, any> = {};

    if (status) {
      if (!MEMBER_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'status invalide'
        });
      }
      payload.status = status;
    }

    if (manager_member_id !== undefined) {
      payload.manager_member_id = manager_member_id || null;
    }

    if (team_role) {
      const normalizedRole = team_role.toUpperCase();
      if (!TEAM_ROLES.includes(normalizedRole as typeof TEAM_ROLES[number])) {
        return res.status(400).json({
          success: false,
          message: 'team_role invalide'
        });
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

    const member = await CabinetService.updateCabinetMember(memberId, payload);

    return res.json({
      success: true,
      data: member
    });
  } catch (error) {
    console.error('❌ Erreur PATCH /admin/cabinets/:id/members/:memberId:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.delete('/:id/members/:memberId', async (req: Request, res: Response) => {
  try {
    const { id, memberId } = req.params;

    await CabinetService.removeMember(id, memberId);

    return res.json({
      success: true,
      message: 'Membre retiré'
    });

  } catch (error) {
    console.error('❌ Erreur DELETE /admin/cabinets/:id/members/:memberId:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.post('/:id/assign-manager', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { expert_id } = req.body || {};

    if (!expert_id) {
      return res.status(400).json({
        success: false,
        message: 'expert_id requis'
      });
    }

    const manager = await CabinetService.assignManager(id, expert_id);

    return res.status(201).json({
      success: true,
      data: manager
    });
  } catch (error) {
    console.error('❌ Erreur POST /admin/cabinets/:id/assign-manager:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.post('/:id/assign-expert', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { expert_id, manager_member_id } = req.body || {};

    if (!expert_id || !manager_member_id) {
      return res.status(400).json({
        success: false,
        message: 'expert_id et manager_member_id requis'
      });
    }

    const expert = await CabinetService.assignExpertToManager(id, expert_id, manager_member_id);

    return res.status(201).json({
      success: true,
      data: expert
    });
  } catch (error) {
    console.error('❌ Erreur POST /admin/cabinets/:id/assign-expert:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.patch('/:id/members/:memberRecordId', async (req: Request, res: Response) => {
  try {
    const { id, memberRecordId } = req.params;
    const updates = req.body || {};

    const member = await CabinetService.updateCabinetMember(memberRecordId, updates);

    return res.json({
      success: true,
      data: member
    });
  } catch (error) {
    console.error('❌ Erreur PATCH /admin/cabinets/:id/members/:memberRecordId:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.post('/:id/refresh-stats', async (req: Request, res: Response) => {
  try {
    await CabinetService.refreshTeamStats();
    return res.json({
      success: true,
      message: 'Statistiques rafraîchies'
    });
  } catch (error) {
    console.error('❌ Erreur POST /admin/cabinets/:id/refresh-stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Route pour lister les apporteurs disponibles (pour auto-complétion)
router.get('/apporteurs/available', async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Configuration Supabase manquante'
      });
    }

    const { search } = req.query;
    let query = supabase
      .from('ApporteurAffaires')
      .select('id, first_name, last_name, company_name, email, phone_number')
      .order('company_name', { ascending: true })
      .limit(50);

    if (search && typeof search === 'string') {
      query = query.or(`company_name.ilike.%${search}%,email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.json({
      success: true,
      data: (data || []).map((aa: any) => ({
        id: aa.id,
        name: `${aa.first_name || ''} ${aa.last_name || ''}`.trim() || aa.company_name || 'Apporteur',
        company_name: aa.company_name,
        email: aa.email,
        phone_number: aa.phone_number
      }))
    });
  } catch (error) {
    console.error('❌ Erreur GET /admin/cabinets/apporteurs/available:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

router.get('/experts/available', async (req: Request, res: Response) => {
  try {
    if (!supabase) {
      return res.status(500).json({
        success: false,
        message: 'Configuration Supabase manquante'
      });
    }

    const { search } = req.query;
    let query = supabase
      .from('Expert')
      .select('id, first_name, last_name, name, email, is_active, cabinet_id')
      .is('cabinet_id', null)
      .order('name', { ascending: true })
      .limit(50);

    if (search && typeof search === 'string' && search.trim().length) {
      const term = search.trim();
      query = query.or(
        `name.ilike.%${term}%,email.ilike.%${term}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.json({
      success: true,
      data: (data || []).map((expert: any) => ({
        id: expert.id,
        name:
          expert.name ||
          `${expert.first_name || ''} ${expert.last_name || ''}`.trim() ||
          expert.email ||
          expert.id,
        email: expert.email,
        is_active: expert.is_active
      }))
    });
  } catch (error) {
    console.error('❌ Erreur GET /admin/cabinets/experts/available:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

export default router;

