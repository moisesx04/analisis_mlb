import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export async function GET() {
  try {
    // 1. Contar depósitos pendientes
    const depositsResult = await query(
      "SELECT COUNT(*) as count FROM deposits WHERE status = 'pending'"
    );
    const pendingDeposits = parseInt(depositsResult[0]?.count || 0);

    // 2. Contar chats cuyo último mensaje fue enviado por el usuario (sin responder por el admin)
    // Agrupamos por chat_id y obtenemos el último mensaje para cada chat
    const messagesResult = await query(`
      SELECT m1.chat_id, m1.sender 
      FROM messages m1
      INNER JOIN (
        SELECT chat_id, MAX(created_at) as max_date 
        FROM messages 
        GROUP BY chat_id
      ) m2 ON m1.chat_id = m2.chat_id AND m1.created_at = m2.max_date
    `);
    
    const unreadChats = messagesResult.filter(m => m.sender === 'user').length;

    return NextResponse.json({
      success: true,
      pendingDeposits,
      unreadChats,
      total: pendingDeposits + unreadChats
    });

  } catch (error) {
    console.error('Error en /api/admin/notifications:', error);
    return NextResponse.json({ error: 'Error al obtener notificaciones.' }, { status: 500 });
  }
}
