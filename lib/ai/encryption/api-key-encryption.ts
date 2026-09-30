"use strict";

import { randomBytes } from "crypto";
import { createCipheriv, createDecipheriv, KeyObject, BinaryLike } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits for AES-256
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16; // 128 bits authentication tag

export class APIKeyEncryption {
  private static keyCache?: Buffer;

  static getEncryptionKey(): Buffer {
    if (!this.keyCache) {
      const envKey = process.env.AI_PROVIDER_ENCRYPTION_KEY;
      if (envKey) {
        // Use the environment variable if provided
        this.keyCache = Buffer.from(envKey, "hex");
      } else {
        // Generate a key if none exists (should only happen in development)
        this.keyCache = randomBytes(KEY_LENGTH);
        console.warn(
          "AI_PROVIDER_ENCRYPTION_KEY not set. Using a generated key for development. " +
          "This key will not persist across restarts!"
        );
      }
    }
    return this.keyCache;
  }

  static generateKey(): string {
    return randomBytes(KEY_LENGTH).toString("hex");
  }

  static encrypt(plaintext: string): { encrypted: string; iv: string; tag: string } {
    const key = this.getEncryptionKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
    };
  }

  static decrypt(encrypted: string, iv: string, tag: string): string {
    const key = this.getEncryptionKey();
    const decipher = createDecipheriv(
      ALGORITHM, 
      key, 
      Buffer.from(iv, "hex")
    );
    
    decipher.setAuthTag(Buffer.from(tag, "hex"));
    
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  }

  static encryptForStorage(plaintext: string): string {
    const { encrypted, iv, tag } = this.encrypt(plaintext);
    // Store as JSON for easy retrieval
    return JSON.stringify({ encrypted, iv, tag });
  }

  static decryptFromStorage(stored: string): string {
    const { encrypted, iv, tag } = JSON.parse(stored);
    return this.decrypt(encrypted, iv, tag);
  }

  static validateEncryptionKey(): boolean {
    try {
      const key = this.getEncryptionKey();
      return key.length === KEY_LENGTH;
    } catch {
      return false;
    }
  }
}
