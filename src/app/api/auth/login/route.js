import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Por favor ingresa tu correo y contraseña.' }, { status: 400 });
    }

    // Consultar el usuario en Neon DB
    const users = await query(
      'SELECT id, username, email, password, credits, role, created_at FROM users WHERE email = $1 AND password = $2 LIMIT 1',
      [email.toLowerCase(), password]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 });
    }

    const user = users[0];

    return NextResponse.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('Error en ruta de login (Neon):', error);
    return NextResponse.json({ error: 'Error interno del servidor al iniciar sesión.' }, { status: 500 });
  }
}
