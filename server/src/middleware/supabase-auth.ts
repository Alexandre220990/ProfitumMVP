import { Request, Response, NextFunction } from 'express';

export const addSupabaseAuth = (req: Request, res: Response, next: NextFunction) => {
  // Ajouter la clé API Supabase aux headers
  req.headers['apikey'] = process.env.SUPABASE_SERVICE_ROLE_KEY;
  req.headers['Authorization'] = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
  
  next();
}; 