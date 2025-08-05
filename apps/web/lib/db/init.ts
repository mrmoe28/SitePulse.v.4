import { sql } from '@vercel/postgres';

export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Execute SQL commands separately to avoid prepared statement issues
    
    // Enable UUID extension
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    
    // Organizations table
    await sql`
      CREATE TABLE IF NOT EXISTS organizations (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Index for organizations
    await sql`CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug)`;
    
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          organization_id VARCHAR(255) NOT NULL,
          organization_name VARCHAR(255),
          email_verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
      )
    `;
    
    // Indexes for users
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id)`;
    
    // Jobs table
    await sql`
      CREATE TABLE IF NOT EXISTS jobs (
          id VARCHAR(255) PRIMARY KEY,
          organization_id VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          client_id VARCHAR(255),
          contact_id VARCHAR(255),
          status VARCHAR(50) DEFAULT 'pending',
          priority VARCHAR(20) DEFAULT 'medium',
          start_date DATE,
          end_date DATE,
          due_date TIMESTAMP,
          budget DECIMAL(10, 2),
          actual_cost DECIMAL(10, 2),
          location TEXT,
          notes TEXT,
          assigned_to VARCHAR(255),
          company_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
      )
    `;
    
    // Indexes for jobs
    await sql`CREATE INDEX IF NOT EXISTS idx_jobs_organization_id ON jobs(organization_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)`;
    
    console.log('Database initialized successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error initializing database:', error);
    
    // If tables already exist, that's fine
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('Database tables already exist');
      return { success: true, message: 'Tables already exist' };
    }
    
    throw error;
  }
}

// Alternative: Initialize only specific tables if they don't exist
export async function ensureTablesExist() {
  try {
    // Check if tables exist by trying to query them
    await sql`SELECT 1 FROM organizations LIMIT 1`;
    console.log('Database tables already exist');
    return { success: true, exists: true };
  } catch (error) {
    console.log('Tables do not exist, creating...');
    return initializeDatabase();
  }
}