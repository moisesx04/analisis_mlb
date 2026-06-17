import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Falta el parámetro de correo.' }, { status: 400 });
    }

    const users = await query(
      'SELECT id, username, email, credits, role, created_at FROM users WHERE email = $1 LIMIT 1',
      [email.toLowerCase()]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    const user = users[0];

    return NextResponse.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('Error en GET /api/users/profile (Neon):', error);
    return NextResponse.json({ error: 'Error al obtener perfil del usuario.' }, { status: 500 });
  }
}
