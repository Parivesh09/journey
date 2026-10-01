import { APIKeyEncryption } from "@/lib/ai/encryption/api-key-encryption";
import { prisma } from "@/lib/prisma";
import { AIProviderError } from "@/lib/ai/types";

export interface AIKeySecret {
  id: string;
  userId: string;
  providerId: string;
  encryptedApiKey: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class AISecretService {
  static async storeProviderSecret(providerId: string, apiKey: string, userId: string): Promise<AIKeySecret> {
    if (!APIKeyEncryption.validateEncryptionKey()) {
      throw new AIProviderError("Encryption key not configured", {
        code: "ENCRYPTION_KEY_MISSING",
      });
    }

    const { encrypted, iv, tag } = APIKeyEncryption.encrypt(apiKey);

    const secret = await prisma.aIProviderSecret.create({
      data: {
        userId,
        providerId,
        encryptedApiKey: JSON.stringify({ encrypted, iv, tag }),
        version: 1,
      },
    });

    return secret as AIKeySecret;
  }

  static async getProviderSecret(providerId: string, userId: string): Promise<AIKeySecret | null> {
    const secret = await prisma.aIProviderSecret.findFirst({
      where: { providerId, userId },
      orderBy: { version: "desc" },
    });

    return (secret as AIKeySecret) ?? null;
  }

  static async updateProviderSecret(providerId: string, apiKey: string, userId: string): Promise<AIKeySecret> {
    if (!APIKeyEncryption.validateEncryptionKey()) {
      throw new AIProviderError("Encryption key not configured", {
        code: "ENCRYPTION_KEY_MISSING",
      });
    }

    const { encrypted, iv, tag } = APIKeyEncryption.encrypt(apiKey);

    const oldSecret = await this.getProviderSecret(providerId, userId);
    const nextVersion = (oldSecret?.version ?? 0) + 1;

    const secret = await prisma.aIProviderSecret.create({
      data: {
        userId,
        providerId,
        encryptedApiKey: JSON.stringify({ encrypted, iv, tag }),
        version: nextVersion,
      },
    });

    return secret as AIKeySecret;
  }

  static async getDecryptedApiKey(providerId: string, userId: string): Promise<string> {
    const secret = await this.getProviderSecret(providerId, userId);

    if (!secret) {
      throw new AIProviderError("No API key found for provider", {
        code: "API_KEY_MISSING",
      });
    }

    try {
      return APIKeyEncryption.decryptFromStorage(secret.encryptedApiKey);
    } catch (error) {
      throw new AIProviderError("Failed to decrypt API key", {
        code: "DECRYPTION_FAILED",
        originalError: error instanceof Error ? error : undefined,
      });
    }
  }

  static async deleteProviderSecret(providerId: string, userId: string): Promise<void> {
    await prisma.aIProviderSecret.deleteMany({ where: { providerId, userId } });
  }

  static async hasSecret(providerId: string, userId: string): Promise<boolean> {
    return (await this.getProviderSecret(providerId, userId)) !== null;
  }
}
