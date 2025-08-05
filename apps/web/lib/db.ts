import { db as drizzleDb } from './db/drizzle';
import { users, organizations } from './db/schema';
import { eq } from 'drizzle-orm';

// Export the drizzle database instance
export const db = drizzleDb;

// Helper function to set organization context (for multi-tenancy)
export async function setOrganizationContext(organizationId: string) {
  // Organization filtering will be done in queries
  // For PostgreSQL, we'll filter by organizationId in each query
  console.log(`Setting organization context: ${organizationId}`);
}

// Helper function to get current user's organization
export async function getCurrentOrganization(userId: string) {
  console.log(`Getting organization for user: ${userId}`);
  
  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) return null;
    
    const org = await db.select().from(organizations).where(eq(organizations.id, user[0].organizationId)).limit(1);
    return org[0] || null;
  } catch (error) {
    console.error('Error getting user organization:', error);
    return null;
  }
}

export type Database = typeof db;
