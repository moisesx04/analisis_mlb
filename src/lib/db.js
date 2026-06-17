import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://placeholder:key@placeholder.neon.tech/neondb';

const sql = neon(databaseUrl);

export async function query(text, params = []) {
  try {
    if (params && params.length > 0) {
      return await sql.query(text, params);
    } else {
      return await sql.query(text);
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
