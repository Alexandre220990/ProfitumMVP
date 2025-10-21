import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

export const logSupabaseRequest = async (req: Request, res: Response, next: NextFunction) => {
  // Logs désactivés en production pour éviter le rate limiting
  if (process.env.NODE_ENV !== 'production') {
    const originalJson = res.json;
    
    res.json = function(body) {
      console.log('🔍 Requête Supabase:', req.method, req.url);
      return originalJson.call(this, body);
    };
  }
  
  next();
}; 