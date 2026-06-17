import crypto from 'crypto';

// Clave de cifrado de fallback en caso de que no esté configurada la variable de entorno
const ENCRYPTION_KEY = process.env.AUTH_SECRET || 'fallback_secret_key_32_chars_long!!'; 
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

export function encrypt(text) {
  // Asegurar que la clave tenga exactamente 32 bytes usando SHA-256
  const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text) {
  try {
    const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
    const textParts = text.split(':');
    if (textParts.length < 2) return null;
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Error al descifrar el token:', error);
    return null;
  }
}
