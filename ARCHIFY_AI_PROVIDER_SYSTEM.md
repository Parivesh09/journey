# AI Provider System

This document describes the new database-driven AI provider system for the Journey platform.

## Overview

The AI Provider System provides a unified, database-driven architecture for managing AI providers, replacing the previous environment-variable-based approach. This system supports:

- Database-backed provider configuration
- Encrypted API key storage
- Multiple protocols (OpenAI-compatible, Anthropic Messages, etc.)
- System and custom provider types
- Provider management through UI
- Architecture for future AI providers

## Database Schema

### AIProviderDefinition
Provider definitions for system and built-in providers.
- `id`: Unique identifier
- `slug`: Provider identifier (e.g., "openai", "freellmapi")
- `name`: Display name
- `description`: Provider description
- `type`: "SYSTEM" or "CUSTOM"
- `protocol`: Communication protocol ("openai_compatible", "anthropic_messages", "gemini")
- `capabilities`: JSON object with provider capabilities
- `endpoint`: Default endpoint URL
- `apiKeyRequired`: Whether API key is required
- `supportsModelDiscovery`: Whether the provider supports model discovery

### AIProvider
User/admin configured providers stored in the database.
- `id`: Unique identifier
- `name`: Provider display name
- `slug`: Unique identifier (must match a definition slug)
- `type`: "SYSTEM" or "CUSTOM"
- `protocol`: Communication protocol
- `status`: "ENABLED" or "DISABLED"
- `endpoint`: API endpoint URL
- `model`: Default model name
- `capabilities`: Provider capabilities
- `configuration`: Additional configuration metadata
- `metadata`: Any additional metadata
- `isDefault`: Whether this is the default provider
- `isSystem`: Whether this is a system provider (cannot be deleted)
- `isManagedByEnv`: Whether configuration comes from environment variables

### AIProviderSecret
Encrypted API key storage.
- `id`: Unique identifier
- `providerId`: Foreign key to AIProvider
- `encryptedApiKey`: AES-256-GCM encrypted API key
- `version`: Version number for key rotation

## Key Features

### 1. Database-Driven Configuration
- All provider configuration is stored in the database
- Environment variables only used for initial seeding
- Database is the single source of truth

### 2. Encryption
- API keys encrypted at rest using AES-256-GCM
- Authenticated encryption with integrity verification
- Encryption key from environment variable (AI_PROVIDER_ENCRYPTION_KEY)

### 3. Provider Types
- **System Providers**: Built-in providers (OpenAI, FreeLLMAPI)
  - Cannot be deleted
  - Managed from environment variables during seeding
  - Always present in the system

- **Custom Providers**: User/admin-defined providers
  - Can be created, updated, and deleted
  - Can be any protocol
  - Can override endpoints, models, and capabilities

### 4. Protocol Support
- **OpenAI Compatible**: For providers using OpenAI-compatible APIs
- **Anthropic Messages**: For Anthropic Claude models
- **Gemini**: For Google Gemini models
- Extensible for future protocols

### 5. Provider Management
- Create new providers through UI
- Update existing providers
- Enable/disable providers
- Set default provider
- Test provider connections
- Rotate API keys
- Delete custom providers

### 6. Security
- All API keys encrypted at rest
- Never exposed to client-side code
- Never logged
- SSRF protection for custom endpoints
- Request timeouts and response size limits

### 7. Backward Compatibility
- Existing OpenAI and FreeLLMAPI providers are seeded as system providers
- Existing environment variables still work for seeding
- Existing features continue to work without changes

## Architecture

```
                                    ┌─────────────────────┐
                                    │    UI (Admin Panel) │
                                    └─────────┬───────────┘
                                              │
                    ┌───────────────────────────┼───────────────────────────┐
                    │                           │                           │
                    │        ┌───────────────────┼───────────────────┐         │
                    │        │                   │                   │         │
    ┌─────────────┐  │        │       ┌──────────▼──────────┐         │         │
    │  UI Routes  │  │        │       │   API Routes       │         │         │
    │ & Server    │  │        │       │ (REST API)         │         │         │
    │ Actions     │  │        │       └──────────┬──────────┘         │         │
                    │                           │                   │         │
                    │        ┌───────────────────┼───────────────────┐         │
                    │        │                   │                   │         │
                    │   ┌───────────────┐     │     ┌───────────────┐     │         │
                    └─▶│   AI Service   │ ◀───│   Database     │     │         │
                       │   (Business    │     │   (Prisma ORM) │     │         │
                       │     Logic)     │     │                 │     │         │
                    ┌───────────────┐     │     └───────────────┘     │         │
                    │   ┌───────┐   │     │        ┌───────────────┐ │         │
                    │   │   AI  │   │     │        │   AI Provider │ │         │
                    │   │ Prot │   │     │        │    Registry   │ │         │
                    │   │ocol │   │     │        │               │ │         │
                    │   └───────┘   │     │        └───────────────┘ │         │
                    │        ┌──────▼──────┐                        │         │
                    │        │  Protocol  │                        │         │
                    │        │   Adapter  │                        │         │
                    │        └───────┬──────┘                        │         │
                    │               │                               │         │
                    │    ┌──────────▼──────────┐                   │         │
                    │    │  External AI API   │                   │         │
                    │    │ (OpenAI, Anthropic)│                   │         │
                    │    └───────────────────┘                   │         │
                    └───────────────────────────────────────┘         │
```

## Provider Registry

The provider registry contains definitions for built-in providers:

### OpenAI Provider
- **Protocol**: OpenAI Compatible
- **Endpoint**: `https://api.openai.com/v1`
- **Capabilities**: Structured output, JSON mode, tool calling, streaming, vision
- **Models**: GPT-4o, GPT-4o-mini, GPT-4, GPT-3.5-turbo, etc.

### FreeLLMAPI Provider
- **Protocol**: OpenAI Compatible
- **Endpoint**: Configurable (default: `http://localhost:3001/v1`)
- **Capabilities**: Full OpenAI-compatible capabilities
- **Models**: Auto-routing, GPT models, Claude models, Gemini models, etc.

### Custom Provider
- **Protocol**: User-selectable
- **Endpoint**: User-defined
- **Capabilities**: Configurable based on protocol

## Encryption

API keys are encrypted using AES-256-GCM:

```javascript
const { APIKeyEncryption } = require('@/lib/ai/encryption/api-key-encryption');

// Encrypt an API key
const { encrypted, iv, tag } = APIKeyEncryption.encrypt(apiKey);

// Decrypt an API key
const decrypted = APIKeyEncryption.decrypt(encrypted, iv, tag);
```

The encryption key is stored in the `AI_PROVIDER_ENCRYPTION_KEY` environment variable.

## Provider Management

### Creating a Provider

Through the UI, admins can create providers:

```json
{
  "name": "My Company AI",
  "protocol": "openai_compatible",
  "endpoint": "https://ai.company.com/v1/chat/completions",
  "model": "company-model",
  "apiKey": "••••••••••",
  "enabled": true,
  "isDefault": false,
  "description": "My company's custom AI provider"
}
```

### Testing a Provider Connection

The system tests provider connections:

1. Validates endpoint URL
2. Checks for SSRF vulnerabilities
3. Makes a minimal API request
4. Validates the response format
5. Returns connection status

### API Key Rotation

When replacing an API key:

1. Encrypt the new key
2. Store with a new version number
3. Never expose the old key
4. Update the provider configuration

## Archify Integration

The Archify feature uses the AI provider system:

1. Requests AI generation through the AI Service
2. No provider-specific logic in Archify
3. Uses the configured provider (default or feature-specific)
4. Supports structured output for JSON generation
5. Caches generated diagrams

## Migration

### From Environment Variables to Database

1. Run the new seed script (`scripts/seed-ai-providers.ts`)
2. Existing OpenAI and FreeLLMAPI providers are seeded as system providers
3. API keys are encrypted and stored in the database
4. Environment variables are still used for seeding but not for runtime

### Running the Migration

```bash
npm run seed:ai-providers
```

## Configuration

### Environment Variables

- `AI_PROVIDER_ENCRYPTION_KEY`: 32-byte hex encryption key for API keys
- `AI_DEFAULT_PROVIDER`: Default provider slug (e.g., "openai", "freellmapi")

### Required Setup

1. Set `AI_PROVIDER_ENCRYPTION_KEY` in production
2. Run the AI provider seed script
3. Configure default providers
4. Optionally create custom providers through UI

## Security Considerations

1. **API Keys**: Never exposed to client-side code, always encrypted
2. **Endpoint Validation**: Custom endpoints are validated for SSRF
3. **Request Limits**: Timeouts and response size limits prevent DoS
4. **Rate Limiting**: AI generation requests are rate-limited
5. **Logging**: No API keys or secrets logged anywhere

## Future Extensibility

The architecture supports easy addition of new providers:

1. Add protocol adapter for new API format
2. Add provider definition to registry
3. Update UI for provider creation
4. No database schema changes required for most providers

## Testing

Comprehensive tests are available:

- Encryption unit tests
- Provider registry tests
- Secret service tests
- Database integration tests
- End-to-end integration tests

Run tests with:

```bash
npm test
```

## API Reference

### REST API

- `GET /api/ai/providers`: List all providers
- `POST /api/ai/providers`: Create new provider
- `PUT /api/ai/providers/:id`: Update provider
- `DELETE /api/ai/providers/:id`: Delete provider
- `POST /api/ai/providers/:id/secrets`: Update API key
- `GET /api/ai/providers/:id/test`: Test provider connection

### Server Actions

- `createAIProvider`: Create new provider
- `updateAIProvider`: Update existing provider
- `deleteAIProvider`: Delete provider
- `updateProviderSecret`: Update API key
- `testProviderConnection`: Test provider

## CLI Commands

```bash
# Seed AI providers from environment variables
npx tsx scripts/seed-ai-providers.ts

# List all providers
npx tsx scripts/list-providers.ts

# Test provider connection
npx tsx scripts/test-provider-connection.ts <provider-id>
```

## Conclusion

The new AI Provider System provides a robust, secure, and extensible foundation for AI provider management in the Journey platform. It maintains backward compatibility while enabling future growth and supporting a wide variety of AI providers through a unified protocol-based architecture.
