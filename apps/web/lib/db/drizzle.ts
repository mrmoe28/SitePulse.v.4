import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

// Create the drizzle database instance
export const db = drizzle(sql, { schema });

// Export all schema elements for easy access
export * from './schema';

// Helper to generate IDs (you can replace with UUID if preferred)
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}