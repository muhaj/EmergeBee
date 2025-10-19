/**
 * Algorand Smart Contract Routes
 * Handles rental escrow contract deployment and interactions
 */

import type { Express } from "express";
import { spawn } from "child_process";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import { storage } from "./storage";
import path from "path";

// Validation schemas
const deployContractSchema = z.object({
  bookingId: z.string(),
  organizerAddress: z.string(),
  vendorAddress: z.string(),
  depositAmountAlgo: z.number(),
  rentalFeeAlgo: z.number(),
  leaseStartTimestamp: z.number(),
  leaseEndTimestamp: z.number(),
});

const payDepositSchema = z.object({
  bookingId: z.string(),
  userMnemonic: z.string(),
  appId: z.number(),
});

const confirmActionSchema = z.object({
  bookingId: z.string(),
  userMnemonic: z.string(),
  appId: z.number(),
});

const getContractStateSchema = z.object({
  appId: z.number(),
});

/**
 * Execute a Python script and return the result
 */
function executePythonScript(
  scriptPath: string,
  args: string[] = [],
  env: NodeJS.ProcessEnv = process.env
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn("python", [scriptPath, ...args], {
      env: { ...process.env, ...env },
      cwd: path.join(__dirname, ".."),
    });

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Python script failed: ${stderr || stdout}`));
      }
    });

    pythonProcess.on("error", (error) => {
      reject(error);
    });
  });
}

/**
 * Register Algorand smart contract routes
 */
export function registerAlgorandRoutes(app: Express) {
  // ============================================================================
  // DEPLOY SMART CONTRACT
  // ============================================================================
  
  app.post("/api/algorand/deploy-contract", async (req, res) => {
    try {
      const validated = deployContractSchema.parse(req.body);

      // Get deployer mnemonic from environment
      const deployerMnemonic = process.env.ALGORAND_DEPLOYER_MNEMONIC;
      if (!deployerMnemonic) {
        return res.status(500).json({ 
          error: "ALGORAND_DEPLOYER_MNEMONIC not configured. Please set it in environment secrets." 
        });
      }

      // Convert ALGO to microALGOs (1 ALGO = 1,000,000 microALGOs)
      const depositMicroAlgos = Math.floor(validated.depositAmountAlgo * 1_000_000);
      const rentalFeeMicroAlgos = Math.floor(validated.rentalFeeAlgo * 1_000_000);

      // Execute Python deployment script
      const scriptPath = path.join(__dirname, "..", "contracts", "deploy.py");
      
      // Create a temporary module to call deployment function
      const deployScript = `
import sys
import json
from contracts.deploy import deploy_rental_escrow

result = deploy_rental_escrow(
    deployer_mnemonic="${deployerMnemonic}",
    organizer_addr="${validated.organizerAddress}",
    vendor_addr="${validated.vendorAddress}",
    deposit_amount=${depositMicroAlgos},
    rental_fee=${rentalFeeMicroAlgos},
    lease_start=${validated.leaseStartTimestamp},
    lease_end=${validated.leaseEndTimestamp}
)

print(json.dumps(result))
`;

      // Write temp script and execute
      const { spawn } = await import("child_process");
      const python = spawn("python", ["-c", deployScript]);

      let stdout = "";
      let stderr = "";

      python.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      python.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      await new Promise<void>((resolve, reject) => {
        python.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Deployment failed: ${stderr}`));
          }
        });
      });

      // Parse result from stdout (last line should be JSON)
      const lines = stdout.trim().split("\n");
      const resultJson = lines[lines.length - 1];
      const result = JSON.parse(resultJson);

      if (!result.success) {
        return res.status(500).json({ error: result.error || "Deployment failed" });
      }

      // Update booking with contract info
      await storage.updateBooking(validated.bookingId, {
        contractAppId: result.app_id.toString(),
        contractAddress: result.address,
        deploymentTxId: result.tx_id,
        vendorWallet: validated.vendorAddress,
      });

      res.json({
        success: true,
        appId: result.app_id,
        contractAddress: result.address,
        txId: result.tx_id,
        explorerUrl: `https://testnet.algoexplorer.io/application/${result.app_id}`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      console.error("Error deploying contract:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to deploy contract" });
    }
  });

  // ============================================================================
  // PAY DEPOSIT TO CONTRACT
  // ============================================================================
  
  app.post("/api/algorand/pay-deposit", async (req, res) => {
    try {
      const validated = payDepositSchema.parse(req.body);

      // Get booking to retrieve amounts
      const booking = await storage.getBooking(validated.bookingId);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      const depositMicroAlgos = Math.floor(parseFloat(booking.depositAmount) * 1_000_000);
      const rentalFeeMicroAlgos = Math.floor(parseFloat(booking.rentalFee) * 1_000_000);

      // Execute Python interaction script
      const interactScript = `
import sys
import json
from contracts.interact import pay_deposit

result = pay_deposit(
    user_mnemonic="${validated.userMnemonic}",
    app_id=${validated.appId},
    deposit_amount=${depositMicroAlgos},
    rental_fee=${rentalFeeMicroAlgos}
)

print(json.dumps(result))
`;

      const python = spawn("python", ["-c", interactScript]);

      let stdout = "";
      let stderr = "";

      python.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      python.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      await new Promise<void>((resolve, reject) => {
        python.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Payment failed: ${stderr}`));
          }
        });
      });

      const lines = stdout.trim().split("\n");
      const resultJson = lines[lines.length - 1];
      const result = JSON.parse(resultJson);

      if (!result.success) {
        return res.status(500).json({ error: result.error || "Payment failed" });
      }

      // Update booking
      await storage.updateBooking(validated.bookingId, {
        depositTxId: result.tx_id,
        status: "confirmed",
      });

      res.json({
        success: true,
        txId: result.tx_id,
        explorerUrl: `https://testnet.algoexplorer.io/tx/${result.tx_id}`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      console.error("Error paying deposit:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to pay deposit" });
    }
  });

  // ============================================================================
  // CONFIRM DELIVERY
  // ============================================================================
  
  app.post("/api/algorand/confirm-delivery", async (req, res) => {
    try {
      const validated = confirmActionSchema.parse(req.body);

      const deliveryScript = `
import sys
import json
from contracts.interact import confirm_delivery

result = confirm_delivery(
    vendor_mnemonic="${validated.userMnemonic}",
    app_id=${validated.appId}
)

print(json.dumps(result))
`;

      const python = spawn("python", ["-c", deliveryScript]);

      let stdout = "";
      let stderr = "";

      python.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      python.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      await new Promise<void>((resolve, reject) => {
        python.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Delivery confirmation failed: ${stderr}`));
          }
        });
      });

      const lines = stdout.trim().split("\n");
      const resultJson = lines[lines.length - 1];
      const result = JSON.parse(resultJson);

      if (!result.success) {
        return res.status(500).json({ error: result.error || "Delivery confirmation failed" });
      }

      // Update booking
      await storage.updateBooking(validated.bookingId, {
        deliveryTxId: result.tx_id,
        status: "active",
      });

      res.json({
        success: true,
        txId: result.tx_id,
        explorerUrl: `https://testnet.algoexplorer.io/tx/${result.tx_id}`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      console.error("Error confirming delivery:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to confirm delivery" });
    }
  });

  // ============================================================================
  // CONFIRM RETURN
  // ============================================================================
  
  app.post("/api/algorand/confirm-return", async (req, res) => {
    try {
      const validated = confirmActionSchema.parse(req.body);

      const returnScript = `
import sys
import json
from contracts.interact import confirm_return

result = confirm_return(
    organizer_mnemonic="${validated.userMnemonic}",
    app_id=${validated.appId}
)

print(json.dumps(result))
`;

      const python = spawn("python", ["-c", returnScript]);

      let stdout = "";
      let stderr = "";

      python.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      python.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      await new Promise<void>((resolve, reject) => {
        python.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Return confirmation failed: ${stderr}`));
          }
        });
      });

      const lines = stdout.trim().split("\n");
      const resultJson = lines[lines.length - 1];
      const result = JSON.parse(resultJson);

      if (!result.success) {
        return res.status(500).json({ error: result.error || "Return confirmation failed" });
      }

      // Update booking
      await storage.updateBooking(validated.bookingId, {
        returnTxId: result.tx_id,
        status: "returned",
      });

      res.json({
        success: true,
        txId: result.tx_id,
        explorerUrl: `https://testnet.algoexplorer.io/tx/${result.tx_id}`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: fromError(error).toString() });
      }
      console.error("Error confirming return:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to confirm return" });
    }
  });

  // ============================================================================
  // GET CONTRACT STATE
  // ============================================================================
  
  app.get("/api/algorand/contract-state/:appId", async (req, res) => {
    try {
      const appId = parseInt(req.params.appId);
      
      if (isNaN(appId)) {
        return res.status(400).json({ error: "Invalid app ID" });
      }

      const stateScript = `
import sys
import json
from contracts.interact import get_contract_state

result = get_contract_state(${appId})
print(json.dumps(result))
`;

      const python = spawn("python", ["-c", stateScript]);

      let stdout = "";
      let stderr = "";

      python.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      python.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      await new Promise<void>((resolve, reject) => {
        python.on("close", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Failed to get contract state: ${stderr}`));
          }
        });
      });

      const lines = stdout.trim().split("\n");
      const resultJson = lines[lines.length - 1];
      const result = JSON.parse(resultJson);

      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to get contract state" });
      }

      res.json(result.state);
    } catch (error) {
      console.error("Error getting contract state:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to get contract state" });
    }
  });
}
