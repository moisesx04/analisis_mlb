import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export async function POST(request) {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios.' }, { status: 400 });
    }

    // 1. Verificar si el email ya existe
    const existingUsers = await query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [email.toLowerCase()]
    );

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ error: 'Este correo electrónico ya está registrado.' }, { status: 400 });
    }

    // 2. Determinar rol
    const isAdminEmail = email.toLowerCase() === 'admin@analistamlb.com';
    const role = isAdminEmail ? 'admin' : 'user';

    // 3. Insertar nuevo usuario
    const insertResult = await query(
      'INSERT INTO users (username, email, password, credits, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, credits, role, created_at',
      [username, email.toLowerCase(), password, 0.00, role]
    );

    const newUser = insertResult[0];

    return NextResponse.json({
      success: true,
      message: 'Cuenta creada exitosamente.',
      user: newUser
    });

  } catch (error) {
    console.error('Error en ruta de registro (Neon):', error);
    return NextResponse.json({ error: 'Error interno del servidor al crear la cuenta.' }, { status: 500 });
  }
}
