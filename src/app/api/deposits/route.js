import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function GET() {
  try {
    const deposits = await query(
      'SELECT id, username, email, amount, reference, method, notes, status, created_at FROM deposits ORDER BY created_at DESC'
    );
    return NextResponse.json({ success: true, deposits });
  } catch (error) {
    console.error('Error en GET /api/deposits (Neon):', error);
    return NextResponse.json({ error: 'Error al obtener los depósitos.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { username, email, amount, reference, method, notes } = await request.json();

    if (!username || !email || !amount || !reference || !method) {
      return NextResponse.json({ error: 'Todos los campos obligatorios del depósito deben completarse.' }, { status: 400 });
    }

    const result = await query(
      'INSERT INTO deposits (username, email, amount, reference, method, notes, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, email, amount, reference, method, notes, status, created_at',
      [username, email.toLowerCase(), parseFloat(amount), reference, method, notes || '', 'pending']
    );

    const newDeposit = result[0];

    return NextResponse.json({ success: true, deposit: newDeposit });
  } catch (error) {
    console.error('Error en POST /api/deposits (Neon):', error);
    return NextResponse.json({ error: 'Error al registrar el depósito.' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { deposit_id, status } = await request.json();

    if (!deposit_id || !status) {
      return NextResponse.json({ error: 'Faltan parámetros para procesar el depósito.' }, { status: 400 });
    }

    if (status === 'approved') {
      // 1. Obtener detalles del depósito
      const depositsResult = await query(
        'SELECT email, amount, status FROM deposits WHERE id = $1 LIMIT 1',
        [deposit_id]
      );

      if (!depositsResult || depositsResult.length === 0) {
        return NextResponse.json({ error: 'No se encontró el depósito.' }, { status: 404 });
      }

      const deposit = depositsResult[0];
      if (deposit.status !== 'pending') {
        return NextResponse.json({ error: 'Este depósito ya ha sido procesado anteriormente.' }, { status: 400 });
      }

      // 2. Obtener créditos actuales del usuario
      const usersResult = await query(
        'SELECT credits FROM users WHERE email = $1 LIMIT 1',
        [deposit.email]
      );

      if (!usersResult || usersResult.length === 0) {
        return NextResponse.json({ error: 'No se encontró el usuario para acreditar los fondos.' }, { status: 404 });
      }

      const currentCredits = parseFloat(usersResult[0].credits || 0);
      const addedCredits = parseFloat(deposit.amount);
      const newCredits = (currentCredits + addedCredits).toFixed(2);

      // 3. Acreditar saldo en users
      await query(
        'UPDATE users SET credits = $1 WHERE email = $2',
        [newCredits, deposit.email]
      );

      // 4. Marcar depósito como aprobado
      await query(
        'UPDATE deposits SET status = \'approved\' WHERE id = $1',
        [deposit_id]
      );

      return NextResponse.json({
        success: true,
        message: 'Depósito aprobado y saldo acreditado con éxito.'
      });

    } else if (status === 'rejected') {
      // Marcar depósito como rechazado
      await query(
        'UPDATE deposits SET status = \'rejected\' WHERE id = $1',
        [deposit_id]
      );
      
      return NextResponse.json({
        success: true,
        message: 'Depósito rechazado.'
      });
    } else {
      return NextResponse.json({ error: 'Estado de aprobación inválido.' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error en PUT /api/deposits (Neon):', error);
    return NextResponse.json({ error: 'Error al procesar el depósito.' }, { status: 500 });
  }
}
