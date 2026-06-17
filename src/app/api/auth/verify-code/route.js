import { NextResponse } from 'next/server';
import { decrypt } from '../../../../lib/crypto';

export async function POST(request) {
  try {
    const { code, token } = await request.json();

    if (!code || !token) {
      return NextResponse.json({ error: 'Faltan datos de verificación.' }, { status: 400 });
    }

    // Descifrar el token
    const decryptedPayload = decrypt(token);
    if (!decryptedPayload) {
      return NextResponse.json({ error: 'El token de verificación es inválido o ha sido alterado.' }, { status: 400 });
    }

    const payload = JSON.parse(decryptedPayload);

    // Validar expiración
    if (Date.now() > payload.expiresAt) {
      return NextResponse.json({ error: 'El código de verificación ha expirado. Por favor, solicita uno nuevo.' }, { status: 400 });
    }

    // Validar código
    if (code !== payload.code) {
      return NextResponse.json({ error: 'El código de verificación es incorrecto.' }, { status: 400 });
    }

    // Registro exitoso: retornar datos del usuario
    const newUser = {
      username: payload.username,
      email: payload.email,
      password: payload.password // Retornamos para persistencia local
    };

    return NextResponse.json({ 
      success: true, 
      message: 'Cuenta activada correctamente.', 
      user: newUser 
    });

  } catch (error) {
    console.error('Error en verify-code route:', error);
    return NextResponse.json({ error: 'Error interno del servidor al verificar el código.' }, { status: 500 });
  }
}
