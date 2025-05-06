// src/lib/db/schema.ts
import { pgTable, serial, text, timestamp, integer, jsonb, varchar, pgEnum, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Enums based on IMPLEMENTATION.md
export const tierEnum = pgEnum('tier', ['None', 'Silver', 'Gold', 'Diamond']);
export const eventTypeEnum = pgEnum('event_type', ['checkin', 'share_promo', 'referral_signup']);
export const couponStatusEnum = pgEnum('coupon_status', ['Active', 'Redeemed', 'Expired']);

// Simplified Users Table for Core Functionality
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(), // Use serial integer primary key
  username: text('username').notNull().unique(),
  fullName: text('full_name').notNull(),
  socialProfile: text('social_profile'),
  address: text('address'),
  rewardScore: integer('reward_score').default(0).notNull(),
  referralCode: text('referral_code').unique(), // Allow null if not generated immediately
  // Add other core fields like currentTier if needed later
  createdAt: timestamp('created_at', { mode: 'date' }).default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).default(sql`now()`).notNull(),
}, (table) => ({
  usernameIdx: uniqueIndex('username_idx').on(table.username),
  userIdIdx: uniqueIndex('user_id_idx').on(table.userId),
}));

// events Table Schema (Optional but Recommended)
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  eventId: text('event_id').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.userId), // Reference integer users.id
  eventType: eventTypeEnum('event_type').notNull(),
  eventDate: timestamp('event_date', { withTimezone: true }).notNull(),
  pointsAwarded: integer('points_awarded'),
  relatedReferralCode: varchar('related_referral_code'),
  details: jsonb('details'), // Store additional info like shared platform or referred user ID
  durationInMinutes: integer('duration_in_minutes').default(0),
  serviceUsed: text('service_used'),
  trainingType: text('training_type'),
  platformShared: text('platform_shared'),
  linkShared: text('link_shared'),
  referralCode: text('referral_code'),
}, (table) => ({
  userIdIdx: index('event_user_id_idx').on(table.userId),
  eventTypeIdx: index('event_type_idx').on(table.eventType),
  eventIdIdx: index('event_event_id_idx').on(table.eventId),
}));

// coupons Table Schema (Optional but Recommended)
export const coupons = pgTable('coupons', {
  couponId: serial('coupon_id').primaryKey(), // Use couponId instead of id for clarity
  couponCode: varchar('coupon_code').notNull().unique(), // Unique, securely generated
  userId: text('user_id').notNull().references(() => users.userId), // Reference text users.userId
  tier: tierEnum('tier').notNull(), // Tier based on score at issuance
  scoreAtIssuance: integer('score_at_issuance').notNull(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).default(sql`now()`).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  status: couponStatusEnum('status').default('Active').notNull(),
  redeemedAt: timestamp('redeemed_at', { withTimezone: true }),
}, (table) => ({
  userIdIdx: index('coupon_user_id_idx').on(table.userId),
  couponCodeIdx: index('coupon_code_idx').on(table.couponCode),
  couponStatusIdx: index('coupon_status_idx').on(table.status),
}));

// Types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Event = InferSelectModel<typeof events>;
export type NewEvent = InferInsertModel<typeof events>;
export type Coupon = InferSelectModel<typeof coupons>;
export type NewCoupon = InferInsertModel<typeof coupons>;
