import { sql } from '@vercel/postgres';
import { InferModel, relations } from 'drizzle-orm';
import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  timestamp, 
  boolean,
  primaryKey,
} from 'drizzle-orm/pg-core';

// Users schema
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User profiles schema with tags
export const userProfiles = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id).notNull(),
  
  // Required tags
  jobType: varchar('job_type', { length: 50 }).notNull(), // DA/DS/DE
  experienceLevel: varchar('experience_level', { length: 50 }).notNull(), // 应届/1-3年/3年+
  
  // Optional tags
  targetCompany: varchar('target_company', { length: 255 }),
  targetIndustry: varchar('target_industry', { length: 255 }),
  
  // Required practice content
  technicalInterview: boolean('technical_interview').default(false),
  behavioralInterview: boolean('behavioral_interview').default(false),
  caseAnalysis: boolean('case_analysis').default(false),
  
  // Contact information (revealed after match)
  email: varchar('email', { length: 255 }),
  wechat: varchar('wechat', { length: 255 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Matches schema
export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  user1Id: serial('user1_id').references(() => users.id).notNull(),
  user2Id: serial('user2_id').references(() => users.id).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, accepted, rejected
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    // Ensure unique matches between users
    uniqMatch: primaryKey({ columns: [table.user1Id, table.user2Id] }),
  };
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  matchesAsUser1: many(matches, {
    fields: [users.id],
    references: [matches.user1Id],
  }),
  matchesAsUser2: many(matches, {
    fields: [users.id],
    references: [matches.user2Id],
  }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  user1: one(users, {
    fields: [matches.user1Id],
    references: [users.id],
  }),
  user2: one(users, {
    fields: [matches.user2Id],
    references: [users.id],
  }),
}));

// Types
export type User = InferModel<typeof users>;
export type UserProfile = InferModel<typeof userProfiles>;
export type Match = InferModel<typeof matches>; 