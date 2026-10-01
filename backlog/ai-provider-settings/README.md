# AI provider settings — backlog

Unreachable code parked here on 2026-10-01. Nothing imports it and no route renders it.

## Why it was parked

`hooks/use-ai-providers.ts` is marked `"use client"` but imports `aiProviderService`,
which pulls in `prisma` and `AISecretService` (server-only, holds decrypted credentials).
A browser hook cannot own a `userId`, so once provider secrets became user-scoped the
signature changes had nowhere to send an owner. It was dead weight, not a working path.

The chain was closed with no entry point:

```
components/ai-provider-settings-page.tsx   0 importers
  └─ components/ai-provider-settings.tsx
       └─ hooks/use-ai-provider-settings.ts
            └─ hooks/use-ai-providers.ts
```

## The live replacement

`/settings` → tab "configuration" renders `app/components/ai-provider-settings.tsx`,
which goes through the RTK Query endpoints in `app/api/ai-providers/*`. Those routes all
call `requireUser()` and pass `user.id` down. Use this one.

## If you revive it

Do not reconnect it to `aiProviderService` from the client. Either

1. have it call the `app/api/ai-providers/*` HTTP routes like the live component does, or
2. move the credential lookup to the server and return only `hasApiKey` / `health`.

Also note `checkHealth()` needs a `userId`, since the adapter embeds that user's key.

`backlog/` is excluded from `tsconfig.json` and `eslint.config.mjs`, so nothing here is
type-checked or linted. Fix the imports before restoring any of it.
