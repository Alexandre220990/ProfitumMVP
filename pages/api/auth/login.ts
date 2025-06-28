import { supabaseAdmin } from '../../../server/src/config/supabase';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const { data: expert, error } = await supabaseAdmin
      .from('Expert')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: "Identifiants invalides" },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, expert.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: "Identifiants invalides" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { userId: expert.id, email: expert.email },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    return NextResponse.json(
      { success: true, token, expert },
      { status: 200 }
    );

  } catch (error) {
    console.error("Erreur de connexion:", error);
    return NextResponse.json(
      { success: false, message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
} 