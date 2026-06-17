import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export async function POST(request) {
  try {
    const { email, game_id } = await request.json();

    if (!email || !game_id) {
      return NextResponse.json(
        { error: 'Faltan parámetros obligatorios (email, game_id).' },
        { status: 400 }
      );
    }

    const lowerEmail = email.toLowerCase();
    const gameIdStr = game_id.toString();

    // 1. Obtener los créditos actuales del usuario
    const userResult = await query(
      'SELECT id, credits FROM users WHERE email = $1 LIMIT 1',
      [lowerEmail]
    );

    if (!userResult || userResult.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró el usuario especificado.' },
        { status: 404 }
      );
    }

    const user = userResult[0];
    const currentCredits = parseFloat(user.credits || 0);

    // Costo de desbloqueo: 10 créditos
    const UNLOCK_COST = 10.00;

    if (currentCredits < UNLOCK_COST) {
      return NextResponse.json({
        success: false,
        error: 'Créditos insuficientes. Por favor recarga tu saldo en el chat de soporte.'
      });
    }

    const newCredits = parseFloat((currentCredits - UNLOCK_COST).toFixed(2));

    // 2. Descontar créditos al usuario en la base de datos
    await query(
      'UPDATE users SET credits = $1 WHERE email = $2',
      [newCredits, lowerEmail]
    );

    // 3. Registrar el desbloqueo del partido
    await query(
      'INSERT INTO unlocked_predictions (email, game_id) VALUES ($1, $2) ON CONFLICT (email, game_id) DO NOTHING',
      [lowerEmail, gameIdStr]
    );

    return NextResponse.json({
      success: true,
      message: 'Partido desbloqueado correctamente.',
      credits: newCredits
    });

  } catch (error) {
    console.error('Error en POST /api/predictions/unlock:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar el desbloqueo.' },
      { status: 500 }
    );
  }
}
