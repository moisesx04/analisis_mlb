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

export async function PUT(request) {
  try {
    const { userId, credits, role } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'Falta el ID del usuario.' }, { status: 400 });
    }

    if (credits !== undefined) {
      await query(
        'UPDATE users SET credits = $1 WHERE id = $2',
        [parseFloat(credits), userId]
      );
    }

    if (role !== undefined) {
      await query(
        'UPDATE users SET role = $1 WHERE id = $2',
        [role, userId]
      );
    }

    return NextResponse.json({ success: true, message: 'Usuario actualizado correctamente.' });
  } catch (error) {
    console.error('Error en PUT /api/users (Neon):', error);
    return NextResponse.json({ error: 'Error al actualizar el usuario.' }, { status: 500 });
  }
}

