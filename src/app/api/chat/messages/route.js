import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chat_id');

    let messages;
    if (chatId) {
      messages = await query(
        'SELECT id, chat_id, sender, sender_name, text, created_at FROM messages WHERE chat_id = $1 ORDER BY created_at ASC',
        [chatId]
      );
    } else {
      messages = await query(
        'SELECT id, chat_id, sender, sender_name, text, created_at FROM messages ORDER BY created_at ASC'
      );
    }

    return NextResponse.json({ success: true, messages });

  } catch (error) {
    console.error('Error en GET /api/chat/messages (Neon):', error);
    return NextResponse.json({ error: 'Error al obtener mensajes.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { chat_id, sender, sender_name, text } = await request.json();

    if (!chat_id || !sender || !sender_name || !text) {
      return NextResponse.json({ error: 'Faltan campos obligatorios para guardar el mensaje.' }, { status: 400 });
    }

    const result = await query(
      'INSERT INTO messages (chat_id, sender, sender_name, text) VALUES ($1, $2, $3, $4) RETURNING id, chat_id, sender, sender_name, text, created_at',
      [chat_id, sender, sender_name, text]
    );

    const newMessage = result[0];

    return NextResponse.json({ success: true, message: newMessage });

  } catch (error) {
    console.error('Error en POST /api/chat/messages (Neon):', error);
    return NextResponse.json({ error: 'Error al enviar mensaje.' }, { status: 500 });
  }
}
