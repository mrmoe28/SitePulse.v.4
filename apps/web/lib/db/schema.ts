import { pgTable, varchar, timestamp, boolean, text, decimal, date, integer, primaryKey, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userTypeEnum = pgEnum('user_type', ['employee', 'contractor', 'client']);
export const jobStatusEnum = pgEnum('job_status', ['pending', 'in_progress', 'completed', 'cancelled', 'on_hold']);
export const jobPriorityEnum = pgEnum('job_priority', ['low', 'medium', 'high', 'urgent']);
export const documentStatusEnum = pgEnum('document_status', ['draft', 'pending', 'signed', 'rejected']);
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'completed', 'cancelled']);

// Organizations table
export const organizations = pgTable('organizations', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Users table
export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  organizationId: varchar('organization_id', { length: 255 }).notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  organizationName: varchar('organization_name', { length: 255 }),
  emailVerified: boolean('email_verified').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Contractors table
export const contractors = pgTable('contractors', {
  id: varchar('id', { length: 255 }).primaryKey(),
  organizationId: varchar('organization_id', { length: 255 }).notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  type: varchar('type', { length: 50 }).default('employee'),
  company: varchar('company', { length: 255 }),
  skills: text('skills').array(),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 50 }).default('active'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Contacts table
export const contacts = pgTable('contacts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  organizationId: varchar('organization_id', { length: 255 }).notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // 'client', 'supplier', 'contractor', 'employee'
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  company: varchar('company', { length: 255 }),
  address: text('address'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Jobs table
export const jobs = pgTable('jobs', {
  id: varchar('id', { length: 255 }).primaryKey(),
  organizationId: varchar('organization_id', { length: 255 }).notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  clientId: varchar('client_id', { length: 255 }).references(() => contacts.id, { onDelete: 'set null' }),
  contactId: varchar('contact_id', { length: 255 }).references(() => contacts.id, { onDelete: 'set null' }), // Added for compatibility
  status: varchar('status', { length: 50 }).default('pending'),
  priority: varchar('priority', { length: 20 }).default('medium'),
  startDate: date('start_date'),
  endDate: date('end_date'),
  dueDate: timestamp('due_date'), // Added for compatibility with current code
  budget: decimal('budget', { precision: 10, scale: 2 }),
  actualCost: decimal('actual_cost', { precision: 10, scale: 2 }),
  location: text('location'),
  notes: text('notes'),
  assignedTo: varchar('assigned_to', { length: 255 }), // Added for compatibility
  companyId: varchar('company_id', { length: 255 }), // Added for compatibility
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Documents table
export const documents = pgTable('documents', {
  id: varchar('id', { length: 255 }).primaryKey(),
  organizationId: varchar('organization_id', { length: 255 }).notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  jobId: varchar('job_id', { length: 255 }).references(() => jobs.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  filePath: varchar('file_path', { length: 500 }),
  fileUrl: varchar('file_url', { length: 500 }),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  category: varchar('category', { length: 100 }),
  status: varchar('status', { length: 50 }).default('draft'),
  uploadedBy: varchar('uploaded_by', { length: 255 }).references(() => users.id, { onDelete: 'set null' }),
  signedAt: timestamp('signed_at'),
  signatureData: text('signature_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tasks table
export const tasks = pgTable('tasks', {
  id: varchar('id', { length: 255 }).primaryKey(),
  organizationId: varchar('organization_id', { length: 255 }).notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  jobId: varchar('job_id', { length: 255 }).references(() => jobs.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  assignedTo: varchar('assigned_to', { length: 255 }).references(() => users.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 50 }).default('pending'),
  priority: varchar('priority', { length: 20 }).default('medium'),
  dueDate: date('due_date'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Job contractors (many-to-many)
export const jobContractors = pgTable('job_contractors', {
  jobId: varchar('job_id', { length: 255 }).notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  contractorId: varchar('contractor_id', { length: 255 }).notNull().references(() => contractors.id, { onDelete: 'cascade' }),
  hoursWorked: decimal('hours_worked', { precision: 10, scale: 2 }).default('0'),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.jobId, table.contractorId] }),
  };
});

// Password reset tokens
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Sessions table (for NextAuth)
export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  sessionToken: varchar('session_token', { length: 255 }).unique().notNull(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Accounts table (for OAuth)
export const accounts = pgTable('accounts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  idToken: text('id_token'),
  sessionState: varchar('session_state', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  contractors: many(contractors),
  contacts: many(contacts),
  jobs: many(jobs),
  documents: many(documents),
  tasks: many(tasks),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  documents: many(documents),
  tasks: many(tasks),
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [jobs.organizationId],
    references: [organizations.id],
  }),
  client: one(contacts, {
    fields: [jobs.clientId],
    references: [contacts.id],
  }),
  contact: one(contacts, {
    fields: [jobs.contactId],
    references: [contacts.id],
  }),
  documents: many(documents),
  tasks: many(tasks),
  jobContractors: many(jobContractors),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [contacts.organizationId],
    references: [organizations.id],
  }),
  jobsAsClient: many(jobs),
}));

// Type exports
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Contractor = typeof contractors.$inferSelect;
export type NewContractor = typeof contractors.$inferInsert;