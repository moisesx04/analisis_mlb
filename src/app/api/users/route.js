import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function GET() {
  try {
    const users = await query(
      'SELECT id, username, email, credits, role, created_at FROM users ORDER BY created_at DESC'
    );
    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error en GET /api/users (Neon):', error);
    return NextResponse.json({ error: 'Error al obtener los usuarios.' }, { status: 500 });
  }
}
