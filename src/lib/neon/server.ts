import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Missing NEON_DATABASE_URL or DATABASE_URL for Neon server queries');
}

export const sql = neon(databaseUrl);
