import { NextResponse } from 'next/server';
import { encrypt } from '../../../../lib/crypto';

export async function POST(request) {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 });
    }

    // Generar código aleatorio de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Enviar el correo usando la API REST de Resend directamente
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.log(`[AUTH DEBUG] Código para ${email}: ${code}`);
      return NextResponse.json({ 
        error: 'Falta la variable de entorno RESEND_API_KEY en Vercel. Se usará el código de pruebas.',
        devCode: code
      }, { status: 500 });
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Analista MLB <onboarding@resend.dev>',
        to: [email],
        subject: `${code} es tu código de verificación de Analista MLB`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background-color: #030712; color: #f9fafb; border-radius: 12px; border: 1px solid #1f2937; text-align: center;">
            <h2 style="color: #3b82f6; margin-bottom: 8px;">Código de Verificación</h2>
            <p style="color: #9ca3af; font-size: 14px; margin-bottom: 24px;">Gracias por registrarte en el Analista de Jugadas MLB. Introduce el código en el formulario de la aplicación para activar tu cuenta.</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ffffff; background-color: rgba(59, 130, 246, 0.1); border: 1px solid #3b82f6; padding: 12px; border-radius: 8px; font-family: monospace; display: inline-block; margin: 16px 0;">
              ${code}
            </div>
            <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">Este código expirará en 10 minutos por razones de seguridad.</p>
          </div>
        `
      })
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Error de Resend API:', errorData);
      return NextResponse.json({ 
        error: 'No se pudo enviar el correo de verificación. Detalle: ' + (errorData.message || 'Error de la API de Resend.')
      }, { status: 500 });
    }

    // Generar el token criptográfico firmado
    const payload = JSON.stringify({
      username,
      email,
      password,
      code,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutos
    });

    const token = encrypt(payload);

    return NextResponse.json({ 
      success: true, 
      message: 'Código enviado correctamente.', 
      token 
    });

  } catch (error) {
    console.error('Error en send-code route:', error);
    return NextResponse.json({ error: 'Error interno del servidor al procesar el código.' }, { status: 500 });
  }
}
