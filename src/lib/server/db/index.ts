import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

if (!env.DATABASE_URL) {
	throw new Error('DATABASE_URL tidak ditemukan. Set di file .env');
}

export const db = drizzle(neon(env.DATABASE_URL), { schema });
