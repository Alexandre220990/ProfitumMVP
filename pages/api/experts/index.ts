import { supabaseAdmin } from '../../../server/src/config/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data: experts, error } = await supabaseAdmin
      .from('Expert')
      .select('*')
      .order('name');

    if (error) {
      return NextResponse.json(
        { message: 'Erreur lors de la récupération des experts' },
        { status: 500 }
      );
    }

    return NextResponse.json(experts, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération des experts:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 