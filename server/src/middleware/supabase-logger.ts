import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

export const logSupabaseRequest = async (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(body) {
    console.log('🔍 Requête Supabase:');
    console.log(`   URL: ${req.url}`);
    console.log(`   Method: ${req.method}`);
    console.log(`   Headers:`, {
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20)}...`
    });
    
    return originalJson.call(this, body);
  };
  
  next();
}; 