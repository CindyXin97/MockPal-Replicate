import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Initialize Neon SQL with the database connection string from environment variables
const sql = neon(process.env.DATABASE_URL!);

// Initialize drizzle with the Neon client and schema
export const db = drizzle(sql, { schema });

// Export the schema types
export * from './schema'; 