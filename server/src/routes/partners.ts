import express from 'express';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const router = express.Router();

// Configuration de Supabase
import { supabase } from '../lib/supabase'; 

// Route pour créer un nouvel expert (partenaire)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, expertise } = req.body;

    // Vérifier si l'expert existe déjà
    const { data: existingExpert, error: searchError } = await supabase
      .from('Expert')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (searchError) {
      console.error('Erreur lors de la vérification de l\'expert:', searchError);
      throw searchError;
    }
      
    if (existingExpert) {
      return res.status(400).json({
        success: false,
        message: 'Un expert avec cet email existe déjà'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'expert
    const expertId = randomUUID();
    
    const { data: expert, error: createError } = await supabase
      .from('Expert')
      .insert({
        id: expertId,
        name,
        email,
        password: hashedPassword,
        phone,
        expertise,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Erreur lors de la création de l\'expert:', createError);
      throw createError;
    }

    // Générer un token JWT
    const token = jwt.sign(
      { id: expert.id, email: expert.email, role: 'expert' },
      process.env.JWT_SECRET || 'votre_secret_jwt_super_securise',
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      success: true,
      data: {
        token,
        expert: {
          id: expert.id,
          name: expert.name,
          email: expert.email
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'expert:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'expert',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

export default router; 