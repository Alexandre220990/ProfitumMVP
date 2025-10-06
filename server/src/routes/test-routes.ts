import express, { Request, Response } from 'express';

const router = express.Router();

// Route de test simple
router.get('/test-clients', async (req: Request, res: Response): Promise<void> => {
  console.log('🧪 ROUTE TEST /test-clients APPELÉE');
  
  const user = (req as any).user;
  console.log('🧪 Route test - User object:', user ? 'PRÉSENT' : 'MANQUANT');
  if (user) {
    console.log('🧪 Route test - User complet:', JSON.stringify(user, null, 2));
  }
  
  if (!user || user.type !== 'apporteur_affaires') {
    console.log('🧪 Route test - Accès refusé:', { hasUser: !!user, userType: user?.type });
    res.status(403).json({
      success: false,
      message: 'Accès refusé dans la route de test'
    });
    return;
  }
  
  res.json({
    success: true,
    message: 'Route de test réussie',
    user: user
  });
});

// Route de test avec le middleware enhanced
router.get('/test-enhanced', async (req: Request, res: Response): Promise<void> => {
  console.log('🧪 ROUTE TEST ENHANCED /test-enhanced APPELÉE');
  
  const user = (req as any).user;
  console.log('🧪 Route test enhanced - User object:', user ? 'PRÉSENT' : 'MANQUANT');
  if (user) {
    console.log('🧪 Route test enhanced - User complet:', JSON.stringify(user, null, 2));
    console.log('🧪 Route test enhanced - User type:', user.type);
    console.log('🧪 Route test enhanced - User type strict:', user.type === 'apporteur_affaires');
  }
  
  if (!user || user.type !== 'apporteur_affaires') {
    console.log('🧪 Route test enhanced - Accès refusé:', { hasUser: !!user, userType: user?.type });
    res.status(403).json({
      success: false,
      message: 'Accès refusé dans la route de test enhanced'
    });
    return;
  }
  
  res.json({
    success: true,
    message: 'Route de test enhanced réussie',
    user: user
  });
});

export default router;
