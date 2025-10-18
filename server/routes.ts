import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertPropSchema,
  insertBookingSchema,
  insertEventSchema,
  insertGameSessionSchema,
  type SignedVoucher,
  type VoucherData,
} from "@shared/schema";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import { randomBytes, createHash } from "crypto";
import * as ed25519 from "@noble/ed25519";

// CRITICAL: Configure SHA-512 for Ed25519 v3.0.0
// The library exports 'hashes' which must have sha512 set
// @ts-ignore
ed25519.hashes.sha512 = (message: Uint8Array) => {
  return Uint8Array.from(createHash('sha512').update(message).digest());
};

// Mock Ed25519 keypair for voucher signing (in production, use secure key management)
// Convert hex string to Uint8Array (32 bytes)
const VOUCHER_PRIVATE_KEY_HEX = "0000000000000000000000000000000000000000000000000000000000000001";
const VOUCHER_PRIVATE_KEY = Buffer.from(VOUCHER_PRIVATE_KEY_HEX, 'hex');

// Derive public key (will be initialized on first use)
let VOUCHER_PUBLIC_KEY: Uint8Array | null = null;
async function initVoucherKeys() {
  if (!VOUCHER_PUBLIC_KEY) {
    try {
      VOUCHER_PUBLIC_KEY = await ed25519.getPublicKey(VOUCHER_PRIVATE_KEY);
    } catch (error) {
      console.error("Failed to initialize voucher keys:", error);
      throw new Error("Ed25519 key initialization failed");
    }
  }
}

export function registerRoutes(app: Express): Server {
  // ============================================================================
  // PROPS ENDPOINTS
  // ============================================================================

  // Get all props
  app.get("/api/props", async (_req, res) => {
    try {
      const props = await storage.getAllProps();
      res.json(props);
    } catch (error) {
      console.error("Error fetching props:", error);
      res.status(500).json({ error: "Failed to fetch props" });
    }
  });

  // Get single prop by ID
  app.get("/api/props/:id", async (req, res) => {
    try {
      const prop = await storage.getProp(req.params.id);
      if (!prop) {
        return res.status(404).json({ error: "Prop not found" });
      }
      res.json(prop);
    } catch (error) {
      console.error("Error fetching prop:", error);
      res.status(500).json({ error: "Failed to fetch prop" });
    }
  });

  // Create new prop
  app.post("/api/props", async (req, res) => {
    try {
      const validated = insertPropSchema.parse(req.body);
      const prop = await storage.createProp(validated);
      res.status(201).json(prop);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      console.error("Error creating prop:", error);
      res.status(500).json({ error: "Failed to create prop" });
    }
  });

  // ============================================================================
  // BOOKINGS ENDPOINTS
  // ============================================================================

  // Get all bookings
  app.get("/api/bookings", async (_req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  // Get bookings for current organizer (mock - would use auth in production)
  app.get("/api/bookings/my-bookings", async (_req, res) => {
    try {
      // In production, get wallet from authenticated session
      // For MVP, return all bookings
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  // Get single booking by ID
  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ error: "Failed to fetch booking" });
    }
  });

  // Create new booking
  app.post("/api/bookings", async (req, res) => {
    try {
      const validated = insertBookingSchema.parse(req.body);
      
      // Verify prop exists
      const prop = await storage.getProp(validated.propId);
      if (!prop) {
        return res.status(404).json({ error: "Prop not found" });
      }
      
      // For MVP, allow booking regardless of status
      // In production, implement real date conflict checking

      // Create booking
      const booking = await storage.createBooking(validated);

      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      console.error("Error creating booking:", error);
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  // ============================================================================
  // EVENTS ENDPOINTS
  // ============================================================================

  // Get all events
  app.get("/api/events", async (_req, res) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Get single event by ID
  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  // Create new event
  app.post("/api/events", async (req, res) => {
    try {
      const validated = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(validated);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  // Update event
  app.patch("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.updateEvent(req.params.id, req.body);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  // ============================================================================
  // GAME SESSIONS ENDPOINTS
  // ============================================================================

  // Get game sessions for an event
  app.get("/api/events/:eventId/sessions", async (req, res) => {
    try {
      const sessions = await storage.getGameSessionsByEvent(req.params.eventId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // Submit game score and generate voucher
  app.post("/api/game-sessions", async (req, res) => {
    try {
      const { eventId, zone, score, targetsHit, playerWallet, playerEmail } = req.body;

      // Validate input
      if (!eventId || !zone || typeof score !== "number" || typeof targetsHit !== "number") {
        return res.status(400).json({ error: "Invalid game session data" });
      }

      // Get event
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Determine reward tier
      let rewardTier: "bronze" | "silver" | "gold" | null = null;
      let tierValue: 0 | 1 | 2 | 3 = 0;
      
      if (score >= event.rewards.goldThreshold) {
        rewardTier = "gold";
        tierValue = 3;
      } else if (score >= event.rewards.silverThreshold) {
        rewardTier = "silver";
        tierValue = 2;
      } else if (score >= event.rewards.bronzeThreshold) {
        rewardTier = "bronze";
        tierValue = 1;
      }

      // Create game session
      const session = await storage.createGameSession({
        eventId,
        playerWallet: playerWallet || undefined,
        playerEmail: playerEmail || undefined,
        zone,
        score,
        targetsHit,
        rewardTier: rewardTier || undefined,
        voucherClaimed: false,
      });

      // Update event stats
      await storage.updateEvent(eventId, {
        playerCount: event.playerCount + 1,
        totalScore: event.totalScore + score,
      });

      // Generate voucher if player earned a reward
      let voucher: SignedVoucher | null = null;
      
      if (rewardTier) {
        const wallet = playerWallet || "UNCLAIMED";
        const nonce = randomBytes(16).toString("hex");
        const expirationTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days

        const voucherData: VoucherData = {
          v: 1,
          eventId,
          sessionId: session.id,
          wallet,
          points: score,
          tier: tierValue,
          nonce,
          exp: expirationTime,
        };

        // Create voucher hash
        const voucherJson = JSON.stringify(voucherData);
        const voucherHash = createHash("sha256").update(voucherJson).digest("hex");

        // Initialize keys and sign with Ed25519
        await initVoucherKeys();
        const messageHash = Buffer.from(voucherHash, "hex");
        const signature = await ed25519.sign(messageHash, VOUCHER_PRIVATE_KEY);
        const signatureHex = Buffer.from(signature).toString("hex");

        voucher = {
          voucherData,
          signature: signatureHex,
          voucherHash,
        };
      }

      res.status(201).json({
        session,
        points: score,
        tier: rewardTier,
        voucher,
      });
    } catch (error) {
      console.error("Error creating game session:", error);
      res.status(500).json({ error: "Failed to create game session" });
    }
  });

  // ============================================================================
  // VOUCHER VERIFICATION ENDPOINT
  // ============================================================================

  app.post("/api/vouchers/verify", async (req, res) => {
    try {
      const { voucherData, signature, voucherHash } = req.body as SignedVoucher;

      // Recreate hash
      const voucherJson = JSON.stringify(voucherData);
      const computedHash = createHash("sha256").update(voucherJson).digest("hex");

      if (computedHash !== voucherHash) {
        return res.status(400).json({ valid: false, error: "Hash mismatch" });
      }

      // Verify signature
      await initVoucherKeys();
      const messageHash = Buffer.from(voucherHash, "hex");
      const signatureBytes = Buffer.from(signature, "hex");
      
      const isValid = await ed25519.verify(signatureBytes, messageHash, VOUCHER_PUBLIC_KEY!);

      if (!isValid) {
        return res.status(400).json({ valid: false, error: "Invalid signature" });
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (voucherData.exp < now) {
        return res.status(400).json({ valid: false, error: "Voucher expired" });
      }

      // Verify session exists and hasn't been claimed
      const session = await storage.getGameSession(voucherData.sessionId);
      if (!session) {
        return res.status(404).json({ valid: false, error: "Session not found" });
      }

      if (session.voucherClaimed) {
        return res.status(400).json({ valid: false, error: "Voucher already claimed" });
      }

      res.json({
        valid: true,
        voucherData,
        session,
      });
    } catch (error) {
      console.error("Error verifying voucher:", error);
      res.status(500).json({ valid: false, error: "Verification failed" });
    }
  });

  // ============================================================================
  // REWARD CLAIMING ENDPOINTS
  // ============================================================================

  // Prepare reward claim - generates unsigned Algorand transaction
  app.post("/api/rewards/prepare-claim", async (req, res) => {
    try {
      console.log("Received reward claim request body:", JSON.stringify(req.body, null, 2));
      const { voucherData, signature, voucherHash } = req.body as SignedVoucher;

      // Validate wallet address
      if (!voucherData.wallet || voucherData.wallet === "UNCLAIMED") {
        return res.status(400).json({ 
          error: "Please connect your wallet before claiming rewards",
          needsWallet: true 
        });
      }

      // Recreate hash
      const voucherJson = JSON.stringify(voucherData);
      const computedHash = createHash("sha256").update(voucherJson).digest("hex");

      if (computedHash !== voucherHash) {
        return res.status(400).json({ error: "Invalid voucher: hash mismatch" });
      }

      // Verify signature
      await initVoucherKeys();
      const messageHash = Buffer.from(voucherHash, "hex");
      const signatureBytes = Buffer.from(signature, "hex");
      
      const isValid = await ed25519.verify(signatureBytes, messageHash, VOUCHER_PUBLIC_KEY!);

      if (!isValid) {
        return res.status(400).json({ error: "Invalid voucher: signature verification failed" });
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (voucherData.exp < now) {
        return res.status(400).json({ error: "Voucher expired" });
      }

      // Verify session exists and hasn't been claimed
      const session = await storage.getGameSession(voucherData.sessionId);
      if (!session) {
        return res.status(404).json({ error: "Game session not found" });
      }

      if (session.voucherClaimed) {
        return res.status(400).json({ error: "Reward already claimed" });
      }

      // Get event to retrieve ASA ID
      const event = await storage.getEvent(voucherData.eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Determine which ASA to send based on tier
      let asaId: string | undefined;
      let tierName: string;
      
      switch (voucherData.tier) {
        case 1:
          asaId = event.rewards.bronzeAsaId;
          tierName = "Bronze";
          break;
        case 2:
          asaId = event.rewards.silverAsaId;
          tierName = "Silver";
          break;
        case 3:
          asaId = event.rewards.goldAsaId;
          tierName = "Gold";
          break;
        default:
          return res.status(400).json({ error: "Invalid reward tier" });
      }

      if (!asaId) {
        return res.status(500).json({ error: `${tierName} ASA not configured for this event` });
      }

      // Call Python script to handle opt-in check and transfer
      const { spawn } = await import("child_process");
      
      // Ensure asaId is string
      const asaIdStr = String(asaId);
      const walletAddr = voucherData.wallet;
      
      console.log("Calling Python script with:", { walletAddr, asaIdStr });
      
      const pythonProcess = spawn("python3", [
        "contracts/create_claim_transaction.py",
        walletAddr,
        asaIdStr,
        "1", // Transfer 1 token
      ]);

      let scriptOutput = "";
      let scriptError = "";

      pythonProcess.stdout.on("data", (data) => {
        scriptOutput += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        scriptError += data.toString();
        console.error("Python stderr:", data.toString());
      });

      await new Promise<void>((resolve, reject) => {
        pythonProcess.on("close", (code) => {
          console.log(`Python process exited with code ${code}`);
          console.log("Python stdout:", scriptOutput);
          console.log("Python stderr:", scriptError);
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Python script failed: ${scriptError || 'No error message'}`));
          }
        });
      });

      const result = JSON.parse(scriptOutput);

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      // If needs opt-in, return unsigned transaction for player to sign
      if (result.needs_optin) {
        res.json({
          success: true,
          needsOptin: true,
          unsignedTxn: result.unsigned_txn,
          asaId,
          tierName,
          sessionId: voucherData.sessionId,
        });
      } else {
        // Transfer completed by backend, mark as claimed
        await storage.updateGameSession(voucherData.sessionId, { voucherClaimed: true });
        
        res.json({
          success: true,
          needsOptin: false,
          txId: result.tx_id,
          asaId,
          tierName,
          amount: 1,
          message: `${tierName} medal claimed successfully!`,
        });
      }

    } catch (error) {
      console.error("Error preparing reward claim:", error);
      res.status(500).json({ error: "Failed to prepare reward claim" });
    }
  });

  // Complete reward claim - called after player opts in to ASA
  app.post("/api/rewards/complete-claim", async (req, res) => {
    try {
      const { sessionId, optInTxId, playerWallet, asaId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: "Missing sessionId" });
      }

      // Verify session exists
      const session = await storage.getGameSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Game session not found" });
      }

      if (session.voucherClaimed) {
        return res.status(400).json({ error: "Reward already claimed" });
      }

      // Verify opt-in transaction was submitted (optional verification)
      // In production, you might want to check the transaction on-chain

      // Now transfer the ASA to the player
      const { spawn } = await import("child_process");
      const pythonProcess = spawn("python3", [
        "contracts/create_claim_transaction.py",
        playerWallet,
        asaId,
        "1",
      ]);

      let scriptOutput = "";
      let scriptError = "";

      pythonProcess.stdout.on("data", (data) => {
        scriptOutput += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        scriptError += data.toString();
      });

      await new Promise<void>((resolve, reject) => {
        pythonProcess.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Python script failed: ${scriptError}`));
          }
        });
      });

      const result = JSON.parse(scriptOutput);

      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to transfer ASA" });
      }

      if (result.needs_optin) {
        return res.status(400).json({ error: "ASA opt-in verification failed" });
      }

      // Mark voucher as claimed
      await storage.updateGameSession(sessionId, { voucherClaimed: true });

      res.json({
        success: true,
        message: "Reward claimed successfully!",
        txId: result.tx_id,
        optInTxId,
      });

    } catch (error) {
      console.error("Error completing reward claim:", error);
      res.status(500).json({ error: "Failed to complete reward claim" });
    }
  });

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
