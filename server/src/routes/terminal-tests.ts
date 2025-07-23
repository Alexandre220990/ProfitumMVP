import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { terminalService, TerminalSession } from '../services/terminal-service';

const router = Router();

// Rate limiting simple pour les sessions
const sessionRequests = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 10000; // 10 secondes
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requêtes max par fenêtre

// Middleware de rate limiting pour /sessions
const rateLimitMiddleware = (req: any, res: any, next: any) => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  
  const clientRequests = sessionRequests.get(clientId);
  
  if (!clientRequests || now > clientRequests.resetTime) {
    // Nouvelle fenêtre ou client inconnu
    sessionRequests.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return next();
  }
  
  if (clientRequests.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please wait before making more requests.',
      retryAfter: Math.ceil((clientRequests.resetTime - now) / 1000)
    });
  }
  
  clientRequests.count++;
  next();
};

/**
 * POST /api/terminal-tests/execute/:category - Lancer une commande de test
 */
router.post('/execute/:category', asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { commandIndex = 0 } = req.body;

  console.log(`🚀 Demande d'exécution de test pour la catégorie: ${category}`);

  try {
    const sessionId = await terminalService.executeCommand(category, commandIndex);
    
    res.json({
      success: true,
      message: `Test ${category} lancé avec succès`,
      data: {
        sessionId,
        category,
        status: 'running'
      }
    });
  } catch (error: any) {
    console.error(`❌ Erreur lors du lancement du test ${category}:`, error);
    res.status(400).json({
      success: false,
      message: error.message || `Erreur lors du lancement du test ${category}`,
      error: error.message
    });
  }
}));

/**
 * GET /api/terminal-tests/status/:sessionId - Récupérer le statut d'une session
 */
router.get('/status/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = terminalService.getSessionStatus(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      message: `Session ${sessionId} non trouvée`
    });
  }

  // Calculer la durée si la session est terminée
  let duration = null;
  if (session.endTime) {
    duration = session.endTime.getTime() - session.startTime.getTime();
  }

  return res.json({
    success: true,
    data: {
      ...session,
      duration,
      // Convertir les dates en ISO string pour la sérialisation JSON
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString()
    }
  });
}));

/**
 * GET /api/terminal-tests/sessions - Lister toutes les sessions
 */
router.get('/sessions', rateLimitMiddleware, asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  let sessions: TerminalSession[];
  
  if (status === 'active') {
    sessions = terminalService.getActiveSessions();
  } else {
    sessions = terminalService.getAllSessions();
  }

  // Calculer la durée pour chaque session
  const sessionsWithDuration = sessions.map(session => {
    let duration = null;
    if (session.endTime) {
      duration = session.endTime.getTime() - session.startTime.getTime();
    }

    return {
      ...session,
      duration,
      startTime: session.startTime.toISOString(),
      endTime: session.endTime?.toISOString()
    };
  });

  res.json({
    success: true,
    data: {
      sessions: sessionsWithDuration,
      summary: {
        total: sessions.length,
        running: sessions.filter(s => s.status === 'running').length,
        completed: sessions.filter(s => s.status === 'completed').length,
        failed: sessions.filter(s => s.status === 'failed').length,
        killed: sessions.filter(s => s.status === 'killed').length
      }
    }
  });
}));

/**
 * DELETE /api/terminal-tests/kill/:sessionId - Arrêter une session
 */
router.delete('/kill/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  console.log(`🛑 Demande d'arrêt de la session: ${sessionId}`);

  const success = await terminalService.killSession(sessionId);
  
  if (!success) {
    return res.status(404).json({
      success: false,
      message: `Session ${sessionId} non trouvée ou déjà terminée`
    });
  }

  return res.json({
    success: true,
    message: `Session ${sessionId} arrêtée avec succès`
  });
}));

/**
 * DELETE /api/terminal-tests/kill-all - Arrêter toutes les sessions
 */
router.delete('/kill-all', asyncHandler(async (req, res) => {
  console.log('🛑 Demande d\'arrêt de toutes les sessions');

  const sessions = terminalService.getAllSessions();
  let killedCount = 0;

  for (const session of sessions) {
    if (session.status === 'running') {
      const success = await terminalService.killSession(session.id);
      if (success) killedCount++;
    }
  }

  res.json({
    success: true,
    message: `${killedCount} sessions arrêtées avec succès`
  });
}));

/**
 * GET /api/terminal-tests/commands - Récupérer les commandes disponibles
 */
router.get('/commands', asyncHandler(async (req, res) => {
  const commands = terminalService.getAvailableCommands();
  
  res.json({
    success: true,
    data: commands
  });
}));

/**
 * GET /api/terminal-tests/logs/:sessionId - Récupérer les logs d'une session
 */
router.get('/logs/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { type = 'all' } = req.query; // 'output', 'error', 'all'

  const session = terminalService.getSessionStatus(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      message: `Session ${sessionId} non trouvée`
    });
  }

  let logs: string[] = [];
  
  switch (type) {
    case 'output':
      logs = session.output;
      break;
    case 'error':
      logs = session.error;
      break;
    case 'all':
    default:
      logs = [...session.output, ...session.error].sort();
      break;
  }

  return res.json({
    success: true,
    data: {
      sessionId,
      logs,
      summary: {
        total_logs: logs.length,
        output_count: session.output.length,
        error_count: session.error.length
      }
    }
  });
}));

/**
 * POST /api/terminal-tests/execute-all - Lancer tous les tests
 */
router.post('/execute-all', asyncHandler(async (req, res) => {
  const { commandIndex = 0 } = req.body;
  
  console.log('🚀 Demande de lancement de tous les tests');

  try {
    const categories = ['security', 'performance', 'database', 'api', 'system'];
    const results = [];

    for (const category of categories) {
      try {
        const sessionId = await terminalService.executeCommand(category, commandIndex);
        results.push({
          category,
          sessionId,
          status: 'started'
        });
      } catch (error: any) {
        results.push({
          category,
          error: error.message,
          status: 'failed'
        });
      }
    }

    return res.json({
      success: true,
      message: 'Tous les tests lancés',
      data: {
        results,
        summary: {
          total: categories.length,
          started: results.filter(r => r.status === 'started').length,
          failed: results.filter(r => r.status === 'failed').length
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Erreur lors du lancement de tous les tests:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors du lancement de tous les tests',
      error: error.message
    });
  }
}));

export default router; 