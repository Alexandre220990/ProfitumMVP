import { Request, Response, NextFunction } from 'express';

// Middleware de test simple pour diagnostiquer l'authentification
export const testAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log('🧪 TEST MIDDLEWARE - Route:', req.path, 'Method:', req.method);
  
  const token = req.headers.authorization?.replace('Bearer ', '');
  console.log('🧪 TEST MIDDLEWARE - Token:', token ? 'PRÉSENT' : 'MANQUANT');
  
  if (token) {
    try {
      // Décoder le JWT sans vérifier la signature
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('🧪 TEST MIDDLEWARE - JWT décodé:', JSON.stringify(payload, null, 2));
      
      // Simuler un utilisateur apporteur
      (req as any).user = {
        id: payload.id,
        type: payload.type,
        email: payload.email,
        database_id: payload.database_id
      };
      
      console.log('🧪 TEST MIDDLEWARE - User simulé:', JSON.stringify((req as any).user, null, 2));
    } catch (error) {
      console.log('🧪 TEST MIDDLEWARE - Erreur décodage JWT:', error);
    }
  }
  
  next();
};
