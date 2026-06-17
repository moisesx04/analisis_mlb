import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { username, email, amount, reference, method, message } = await request.json();

    if (!username || !email || !amount || !reference || !method) {
      return NextResponse.json({ error: 'Faltan campos obligatorios para registrar el depósito.' }, { status: 400 });
    }

    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    let notifiedDiscord = false;
    let notifiedTelegram = false;

    // 1. Enviar notificación a Discord Webhook si está configurado
    if (discordWebhookUrl) {
      try {
        const discordResponse = await fetch(discordWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'MLB Analista Notificaciones',
            avatar_url: 'https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png',
            embeds: [
              {
                title: '💰 NUEVO DEPÓSITO REGISTRADO',
                color: 3066993, // Verde esmeralda
                timestamp: new Date().toISOString(),
                fields: [
                  { name: 'Usuario', value: `👤 ${username}`, inline: true },
                  { name: 'Correo', value: `📧 ${email}`, inline: true },
                  { name: 'Monto', value: `💵 $${amount} USD`, inline: true },
                  { name: 'Método', value: `💳 ${method}`, inline: true },
                  { name: 'Referencia', value: `🔢 ${reference}`, inline: true },
                  { name: 'Mensaje adicional', value: message || 'Sin comentarios.', inline: false }
                ],
                footer: {
                  text: 'Analista MLB App • Control de Pagos'
                }
              }
            ]
          })
        });

        if (discordResponse.ok) {
          notifiedDiscord = true;
        } else {
          console.error('Error al enviar webhook de Discord:', await discordResponse.text());
        }
      } catch (err) {
        console.error('Error de red en webhook de Discord:', err);
      }
    }

    // 2. Enviar notificación a Telegram Bot si está configurado
    if (telegramBotToken && telegramChatId) {
      try {
        const text = `💰 *NUEVO DEPÓSITO REGISTRADO*\n\n` +
          `👤 *Usuario:* ${username}\n` +
          `📧 *Correo:* ${email}\n` +
          `💵 *Monto:* $${amount} USD\n` +
          `💳 *Método:* ${method}\n` +
          `🔢 *Referencia:* \`${reference}\`\n` +
          `💬 *Mensaje:* ${message || 'Sin comentarios.'}`;

        const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: text,
            parse_mode: 'Markdown'
          })
        });

        if (telegramResponse.ok) {
          notifiedTelegram = true;
        } else {
          console.error('Error al enviar mensaje de Telegram:', await telegramResponse.text());
        }
      } catch (err) {
        console.error('Error de red en Telegram Bot:', err);
      }
    }

    // Registrar en logs del servidor
    console.log(`[DEPOSIT REGISTERED] User: ${username}, Amount: $${amount}, Ref: ${reference}, Method: ${method}`);

    return NextResponse.json({
      success: true,
      message: 'Comprobante registrado correctamente en el servidor.',
      notified: {
        discord: notifiedDiscord,
        telegram: notifiedTelegram
      }
    });

  } catch (error) {
    console.error('Error en ruta de soporte/depósito:', error);
    return NextResponse.json({ error: 'Error interno del servidor al procesar la notificación.' }, { status: 500 });
  }
}
