import { Request, Response, NextFunction } from "express";
import { createClerkClient, verifyToken } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

// Extend Express Request to include Clerk auth
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string | null;
        sessionId: string | null;
        getToken: (options?: any) => Promise<string | null>;
      };
    }
  }
}

// Middleware to attach Clerk auth to requests (does not require auth)
export function attachClerkAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        req.auth = { userId: null, sessionId: null, getToken: async () => null };
        return next();
      }

      const token = authHeader.substring(7);
      const sessionClaims = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });
      
      req.auth = {
        userId: sessionClaims.sub,
        sessionId: sessionClaims.sid as string,
        getToken: async () => token,
      };
      
      next();
    } catch (error) {
      req.auth = { userId: null, sessionId: null, getToken: async () => null };
      next();
    }
  };
}

// Middleware to require authentication (blocks unauthenticated requests)
export function requireClerkAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized - No token provided" });
      }

      const token = authHeader.substring(7);
      const sessionClaims = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });
      
      req.auth = {
        userId: sessionClaims.sub,
        sessionId: sessionClaims.sid as string,
        getToken: async () => token,
      };
      
      next();
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
  };
}

export { clerkClient };
