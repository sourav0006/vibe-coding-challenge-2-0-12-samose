import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const ACTIVATION_CODE_SALT_ROUNDS = 10;
export const DEFAULT_ACTIVATION_EXPIRY_HOURS = 24;

/**
 * Generates a cryptographically random, user-friendly activation code.
 * Format: 8-character uppercase hexadecimal (e.g., "A3F8B29D")
 */
export function generateActivationCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

/**
 * Hashes an activation code before storing in the database.
 */
export async function hashActivationCode(code: string): Promise<string> {
  const normalized = code.trim().toUpperCase();
  return bcrypt.hash(normalized, ACTIVATION_CODE_SALT_ROUNDS);
}

/**
 * Verifies a supplied activation code against the stored hash.
 */
export async function verifyActivationCode(code: string, codeHash: string): Promise<boolean> {
  if (!code || !codeHash) {
    return false;
  }
  const normalized = code.trim().toUpperCase();
  return bcrypt.compare(normalized, codeHash);
}

/**
 * Computes the expiration date from the current time.
 */
export function computeActivationExpiration(hours = DEFAULT_ACTIVATION_EXPIRY_HOURS): Date {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + hours);
  return expiresAt;
}
