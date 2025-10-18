import {
  type Prop,
  type InsertProp,
  type Booking,
  type InsertBooking,
  type Event,
  type InsertEvent,
  type GameSession,
  type InsertGameSession,
  type Vendor,
  type InsertVendor,
  type Payout,
  type InsertPayout,
  type User,
  type UpsertUser,
  props,
  bookings,
  events,
  gameSessions,
  vendors,
  payouts,
  users,
} from "@shared/schema";
import { db } from "./db";
import { eq, sql as drizzleSql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Props
  getAllProps(): Promise<Prop[]>;
  getProp(id: string): Promise<Prop | undefined>;
  createProp(prop: InsertProp): Promise<Prop>;
  updateProp(id: string, prop: Partial<Prop>): Promise<Prop | undefined>;

  // Bookings
  getAllBookings(): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByOrganizer(wallet: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<Booking>): Promise<Booking | undefined>;

  // Events
  getAllEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  getEventsByOrganizer(wallet: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<void>;

  // Game Sessions
  getAllGameSessions(): Promise<GameSession[]>;
  getGameSession(id: string): Promise<GameSession | undefined>;
  getGameSessionsByEvent(eventId: string): Promise<GameSession[]>;
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  updateGameSession(id: string, session: Partial<GameSession>): Promise<GameSession | undefined>;

  // Vendors
  getAllVendors(): Promise<Vendor[]>;
  getVendor(id: string): Promise<Vendor | undefined>;
  getVendorByWallet(walletAddress: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, vendor: Partial<Vendor>): Promise<Vendor | undefined>;
  updateVendorBalance(id: string, amount: string, operation: 'add' | 'subtract'): Promise<Vendor | undefined>;

  // Payouts
  getAllPayouts(): Promise<Payout[]>;
  getPayout(id: string): Promise<Payout | undefined>;
  getPayoutsByVendor(vendorId: string): Promise<Payout[]>;
  createPayout(payout: InsertPayout): Promise<Payout>;
  updatePayout(id: string, payout: Partial<Payout>): Promise<Payout | undefined>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Seed database with sample data on first run
    this.seedDatabase();
  }

  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  private async seedDatabase() {
    try {
      // Check if we already have props seeded
      const existingProps = await db.select().from(props).limit(1);
      if (existingProps.length > 0) {
        return; // Already seeded
      }

      // Sample Props
      const sampleProps: InsertProp[] = [
        {
          name: "Giant Inflatable Llama",
          description: "A massive 15-foot tall inflatable llama perfect for festivals and outdoor events. Eye-catching and Instagram-worthy!",
          category: "inflatable",
          dailyRate: "250.00",
          depositAmount: "500.00",
          location: "Los Angeles, CA",
          locationLat: "34.0522",
          locationLng: "-118.2437",
          photos: [
            { url: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800&h=600&fit=crop", isPrimary: true },
            { url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop", isPrimary: false },
          ],
          status: "active",
          vendorName: "Party Props LA",
        },
        {
          name: "Neon LED Sculpture",
          description: "Modern geometric LED sculpture with customizable colors. Creates an amazing ambiance for night events.",
          category: "sculpture",
          dailyRate: "180.00",
          depositAmount: "350.00",
          location: "Miami, FL",
          locationLat: "25.7617",
          locationLng: "-80.1918",
          photos: [
            { url: "https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=800&h=600&fit=crop", isPrimary: true },
          ],
          status: "active",
          vendorName: "Neon Dreams Miami",
        },
        {
          name: "Branded Photo Booth",
          description: "Professional photo booth with custom branding options. Includes instant prints and digital sharing.",
          category: "booth",
          dailyRate: "350.00",
          depositAmount: "700.00",
          location: "New York, NY",
          locationLat: "40.7128",
          locationLng: "-74.0060",
          photos: [
            { url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop", isPrimary: true },
          ],
          status: "active",
          vendorName: "NYC Event Rentals",
        },
        {
          name: "Giant Inflatable Unicorn",
          description: "Magical 12-foot inflatable unicorn. Perfect for kids' events and fantasy-themed parties.",
          category: "inflatable",
          dailyRate: "200.00",
          depositAmount: "400.00",
          location: "Austin, TX",
          locationLat: "30.2672",
          locationLng: "-97.7431",
          photos: [
            { url: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800&h=600&fit=crop", isPrimary: true },
          ],
          status: "active",
          vendorName: "Austin Party Supply",
        },
        {
          name: "Vintage Carnival Games",
          description: "Collection of 5 vintage-style carnival games including ring toss, balloon darts, and more.",
          category: "giant_props",
          dailyRate: "450.00",
          depositAmount: "900.00",
          location: "Chicago, IL",
          locationLat: "41.8781",
          locationLng: "-87.6298",
          photos: [
            { url: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=600&fit=crop", isPrimary: true },
          ],
          status: "active",
          vendorName: "Chicago Carnival Co",
        },
        {
          name: "LED Dance Floor",
          description: "Interactive LED dance floor with color-changing tiles. Creates an unforgettable party atmosphere.",
          category: "branded",
          dailyRate: "800.00",
          depositAmount: "1600.00",
          location: "Las Vegas, NV",
          locationLat: "36.1699",
          locationLng: "-115.1398",
          photos: [
            { url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop", isPrimary: true },
          ],
          status: "active",
          vendorName: "Vegas Event Pros",
        },
      ];

      await db.insert(props).values(sampleProps);
      console.log("Database seeded with sample props");
    } catch (error) {
      console.error("Error seeding database:", error);
    }
  }

  // Props
  async getAllProps(): Promise<Prop[]> {
    return await db.select().from(props);
  }

  async getProp(id: string): Promise<Prop | undefined> {
    const [prop] = await db.select().from(props).where(eq(props.id, id));
    return prop || undefined;
  }

  async createProp(insertProp: InsertProp): Promise<Prop> {
    const [prop] = await db.insert(props).values(insertProp).returning();
    return prop;
  }

  async updateProp(id: string, updates: Partial<Prop>): Promise<Prop | undefined> {
    const [updated] = await db
      .update(props)
      .set(updates)
      .where(eq(props.id, id))
      .returning();
    return updated || undefined;
  }

  // Bookings
  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getBookingsByOrganizer(wallet: string): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .where(eq(bookings.organizerWallet, wallet));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | undefined> {
    const [updated] = await db
      .update(bookings)
      .set(updates)
      .where(eq(bookings.id, id))
      .returning();
    return updated || undefined;
  }

  // Events
  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async getEventsByOrganizer(wallet: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.organizerWallet, wallet));
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event | undefined> {
    const [updated] = await db
      .update(events)
      .set(updates)
      .where(eq(events.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // Game Sessions
  async getAllGameSessions(): Promise<GameSession[]> {
    return await db.select().from(gameSessions);
  }

  async getGameSession(id: string): Promise<GameSession | undefined> {
    const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, id));
    return session || undefined;
  }

  async getGameSessionsByEvent(eventId: string): Promise<GameSession[]> {
    return await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.eventId, eventId));
  }

  async createGameSession(insertSession: InsertGameSession): Promise<GameSession> {
    const [session] = await db.insert(gameSessions).values(insertSession).returning();
    return session;
  }

  async updateGameSession(id: string, updateData: Partial<GameSession>): Promise<GameSession | undefined> {
    const [updated] = await db
      .update(gameSessions)
      .set(updateData)
      .where(eq(gameSessions.id, id))
      .returning();
    return updated || undefined;
  }

  // Vendors
  async getAllVendors(): Promise<Vendor[]> {
    return await db.select().from(vendors);
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor || undefined;
  }

  async getVendorByWallet(walletAddress: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.walletAddress, walletAddress));
    return vendor || undefined;
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const [vendor] = await db.insert(vendors).values(insertVendor).returning();
    return vendor;
  }

  async updateVendor(id: string, updates: Partial<Vendor>): Promise<Vendor | undefined> {
    const [updated] = await db
      .update(vendors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    return updated || undefined;
  }

  async updateVendorBalance(id: string, amount: string, operation: 'add' | 'subtract'): Promise<Vendor | undefined> {
    const vendor = await this.getVendor(id);
    if (!vendor) return undefined;

    const currentBalance = parseFloat(vendor.pendingBalance || '0');
    const changeAmount = parseFloat(amount);
    const newBalance = operation === 'add' ? currentBalance + changeAmount : currentBalance - changeAmount;

    const currentEarnings = parseFloat(vendor.totalEarnings || '0');
    const newEarnings = operation === 'add' ? currentEarnings + changeAmount : currentEarnings;

    return await this.updateVendor(id, {
      pendingBalance: newBalance.toFixed(2),
      totalEarnings: newEarnings.toFixed(2),
    });
  }

  // Payouts
  async getAllPayouts(): Promise<Payout[]> {
    return await db.select().from(payouts);
  }

  async getPayout(id: string): Promise<Payout | undefined> {
    const [payout] = await db.select().from(payouts).where(eq(payouts.id, id));
    return payout || undefined;
  }

  async getPayoutsByVendor(vendorId: string): Promise<Payout[]> {
    return await db
      .select()
      .from(payouts)
      .where(eq(payouts.vendorId, vendorId));
  }

  async createPayout(insertPayout: InsertPayout): Promise<Payout> {
    const [payout] = await db.insert(payouts).values(insertPayout).returning();
    return payout;
  }

  async updatePayout(id: string, updates: Partial<Payout>): Promise<Payout | undefined> {
    const [updated] = await db
      .update(payouts)
      .set(updates)
      .where(eq(payouts.id, id))
      .returning();
    return updated || undefined;
  }
}

export const storage = new DatabaseStorage();
