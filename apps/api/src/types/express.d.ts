import type { UserRole, UserStatus } from "@number-reseller/database";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: UserRole;
        status: UserStatus;
        sessionId: string;
      };
    }
  }
}

export {};
