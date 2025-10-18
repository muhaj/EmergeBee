import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Props (rental items)
export const props = pgTable("props", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'inflatable', 'sculpture', 'booth', 'branded', 'giant_props'
  dailyRate: decimal("daily_rate", { precision: 10, scale: 2 }).notNull(),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }).notNull(),
  location: text("location").notNull(),
  locationLat: decimal("location_lat", { precision: 10, scale: 8 }),
  locationLng: decimal("location_lng", { precision: 11, scale: 8 }),
  dimensions: jsonb("dimensions").$type<{ height: number; width: number; depth: number; weight: number }>(),
  photos: jsonb("photos").$type<{ url: string; isPrimary: boolean }[]>().notNull(),
  status: text("status").notNull().default('active'), // 'active', 'rented', 'maintenance'
  vendorId: text("vendor_id"),
  vendorName: text("vendor_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPropSchema = createInsertSchema(props).omit({
  id: true,
  createdAt: true,
});

export type InsertProp = z.infer<typeof insertPropSchema>;
export type Prop = typeof props.$inferSelect;

// Bookings
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propId: text("prop_id").notNull(),
  eventId: text("event_id"),
  organizerWallet: text("organizer_wallet").notNull(),
  startDate: text("start_date").notNull(), // ISO date string
  endDate: text("end_date").notNull(),
  rentalFee: decimal("rental_fee", { precision: 10, scale: 2 }).notNull(),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default('pending'), // 'pending', 'confirmed', 'active', 'returned', 'completed'
  escrowTxId: text("escrow_tx_id"), // Mock blockchain transaction ID
  deliveryPhotos: jsonb("delivery_photos").$type<{ url: string; hash: string; timestamp: string }[]>(),
  returnPhotos: jsonb("return_photos").$type<{ url: string; hash: string; timestamp: string }[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Events (AR experiences created by organizers)
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  organizerWallet: text("organizer_wallet").notNull(),
  organizerName: text("organizer_name").notNull(),
  date: text("date").notNull(), // ISO date string
  location: text("location").notNull(),
  gameType: text("game_type").notNull().default('tap_targets'), // 'tap_targets', 'ring_toss', 'scavenger_hunt'
  gameDuration: integer("game_duration").notNull().default(30), // seconds
  rewards: jsonb("rewards").$type<{
    pointsPerTarget: number;
    bronzeThreshold: number;
    silverThreshold: number;
    goldThreshold: number;
  }>().notNull(),
  zones: jsonb("zones").$type<string[]>().notNull().default(sql`'["A1", "A2", "B1", "B2"]'::jsonb`),
  status: text("status").notNull().default('draft'), // 'draft', 'active', 'completed'
  playerCount: integer("player_count").notNull().default(0),
  totalScore: integer("total_score").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  playerCount: true,
  totalScore: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Game Sessions (individual play sessions)
export const gameSessions = pgTable("game_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: text("event_id").notNull(),
  playerWallet: text("player_wallet"),
  playerEmail: text("player_email"),
  zone: text("zone").notNull(),
  score: integer("score").notNull(),
  targetsHit: integer("targets_hit").notNull(),
  rewardTier: text("reward_tier"), // 'bronze', 'silver', 'gold'
  voucherClaimed: boolean("voucher_claimed").notNull().default(false),
  playedAt: timestamp("played_at").defaultNow().notNull(),
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({
  id: true,
  playedAt: true,
});

export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSessions.$inferSelect;

// Vouchers (signed reward claims)
export interface VoucherData {
  v: 1;
  eventId: string;
  sessionId: string;
  wallet: string;
  points: number;
  tier: 0 | 1 | 2 | 3; // 0=none, 1=bronze, 2=silver, 3=gold
  nonce: string; // hex string
  exp: number; // unix timestamp
}

export interface SignedVoucher {
  voucherData: VoucherData;
  signature: string; // hex string
  voucherHash: string; // hex string
}

// Photo Uploads
export interface PhotoUpload {
  id: string;
  url: string;
  hash: string;
  timestamp: string;
  uploadedBy: string;
}
