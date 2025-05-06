// src/lib/db/index.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // In production environments or CI/CD, DATABASE_URL might be directly set
  // without a .env file. We check if it's missing altogether.
  if (!process.env.CI && process.env.NODE_ENV !== 'production') {
    console.error('Error: DATABASE_URL environment variable is not set.');
    console.error('Please ensure you have a .env.local file with DATABASE_URL=your_connection_string');
    console.error('Or that the DATABASE_URL environment variable is set in your deployment environment.');
  }
  throw new Error('DATABASE_URL is not defined in the environment.');
}

// Use process.env.DATABASE_URL directly as it could be set outside of .env.local
const conn = neon(databaseUrl);

// Enable logger only in development
const enableLogger = process.env.NODE_ENV === 'development';

export const db = drizzle(conn, { schema, logger: enableLogger });

// Optional: Export individual tables for easier access
export * from './schema';
