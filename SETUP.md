# SDE Command Center - Setup Guide

Complete setup guide for running the SDE Command Center application from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Development Commands](#development-commands)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** 20 or higher
- **npm** 9 or higher (comes with Node.js)
- **Docker** 20.10 or higher
- **Docker Compose** 2.0 or higher

### Optional (for development)

- **Git** for cloning the repository
- **Postman** or **curl** for API testing
- **VS Code** with recommended extensions

### Verification

Check your installed versions:

```bash
node --version  # Should be >= 20
npm --version   # Should be >= 9
docker --version
docker compose version
```

---

## Project Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd roadmap
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages from `package.json`, including:
- Next.js 16.3.5
- React 19.2.8
- Prisma 6.19.3
- TypeScript 5
- Tailwind CSS 4.3.3
- And other dependencies listed in package.json

### 3. Environment Setup

Copy the environment template:

```bash
cp .env.example .env
```

---

## Environment Configuration

### Required Environment Variables

Edit `.env` file and configure these required settings:

```bash
# PostgreSQL Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/sde_command_center?schema=public"

# Authentication Secret (REQUIRED in production)
# Generate a strong secret: openssl rand -base64 32
AUTH_SECRET="your-strong-random-secret-here"

# Cron Secret (for scheduled reminder endpoint)
# Generate a strong secret: openssl rand -base64 32
CRON_SECRET="your-cron-secret-here"
```

### Optional Environment Variables

#### Development Seed User

Creates a dev-only user (ignored in production signups):

```bash
SEED_USER_EMAIL="user@sdecommand.center"
SEED_USER_PASSWORD="your-password"
SEED_USER_TIMEZONE="UTC"
```

#### Email Notifications (SMTP)

Configure for email reminders:

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="your-email@gmail.com"
```

#### Telegram Notifications

```bash
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
```

#### SMS/WhatsApp (Linq Provider)

```bash
LINQ_ENABLED="false"
LINQ_API_KEY="your-linq-api-key"
LINQ_API_BASE_URL="https://api.linqapp.com/api/partner/v3"
LINQ_WEBHOOK_SECRET="your-webhook-secret"
```

#### AI Provider Configuration

Configure AI providers for features like roadmap generation, archify diagrams, etc.:

```bash
# Default provider
AI_DEFAULT_PROVIDER=openai

# Fallback providers (comma-separated)
AI_FALLBACK_PROVIDERS=freellmapi

# Request timeout and retry settings
AI_TIMEOUT_MS=60000
AI_MAX_RETRIES=3

# OpenAI Configuration
OPENAI_ENABLED=true
OPENAI_API_KEY="your-openai-api-key"
OPENAI_MODEL=gpt-4o
OPENAI_BASE_URL=https://api.openai.com/v1

# FreeLLMAPI Configuration
FREELLMAPI_ENABLED=false
FREELLMAPI_BASE_URL=http://localhost:3001/v1
FREELLMAPI_API_KEY="your-freellmapi-key"
FREELLMAPI_MODEL=auto
```

### Feature-Specific AI Configuration

```bash
# Archify Diagram Generation
ARCHIFY_PROVIDER=openai
ARCHIFY_MODEL=
ARCHIFY_TEMPERATURE=0.2
ARCHIFY_MAX_TOKENS=8192
ARCHIFY_TIMEOUT_MS=120000

# Roadmap Generation
ROADMAP_PROVIDER=openai
ROADMAP_MODEL=
ROADMAP_TEMPERATURE=0.5
ROADMAP_MAX_TOKENS=8192

# Task Generation
TASK_PROVIDER=openai
TASK_MODEL=
TASK_TEMPERATURE=0.4
TASK_MAX_TOKENS=4096
```

**Note:** Legacy configuration keys (AI_PROVIDER, AI_MODEL, etc.) are deprecated but kept for compatibility.

---

## Database Setup

### 1. Start Database Services

Start PostgreSQL and Redis containers:

```bash
docker compose up -d
```

This will:
- Start PostgreSQL on port 5433
- Start Redis on port 6379
- Create persistent volumes for data

### 2. Verify Database is Running

```bash
docker compose ps
```

You should see both services running.

### 3. Apply Database Migrations

Generate Prisma client (runs automatically on `npm install`):

```bash
npm run prisma generate
```

Apply all migrations:

```bash
npm run db:migrate:deploy
```

Or for development with auto-creation:

```bash
npm run prisma migrate dev
```

### 4. Seed Database (Optional)

Creates the default SDE roadmap and dev user:

```bash
npm run seed
```

This will:
- Create a default user (email: `user@sdecommand.center`)
- Seed the master SDE roadmap template
- Create default notification preferences

**Note:** The seed user is only used during development. In production, users sign up normally.

---

## Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
```

The application will be available at:
- **Local:** http://localhost:3000
- **Network:** http://<your-ip>:3000

### Production Mode

Build and start the production server:

```bash
npm run build
npm start
```

Or use a single command:

```bash
npm run build && npm start
```

---

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint checks |
| `npm test` | Run tests with Vitest |
| `npx tsc --noEmit` | Type check without emitting files |
| `npm run prisma generate` | Generate Prisma client |
| `npm run db:migrate:deploy` | Apply migrations in production |
| `npm run prisma migrate dev` | Create and apply migrations (dev) |
| `npm run seed` | Seed database with default data |

### Testing Commands

Run tests with coverage:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test -- --watch
```

Run a specific test file:

```bash
npm test -- path/to/test-file.test.ts
```

### Database Commands

View database status:

```bash
npx prisma studio
```

This opens a web interface to explore your database.

Reset database (⚠️ WARNING: deletes all data):

```bash
npx prisma migrate reset
```

---

## Production Deployment

### Environment Requirements

- Node.js 20+
- PostgreSQL 16+ (Docker or cloud)
- Redis 7+ (Docker or cloud)
- Strong `AUTH_SECRET` and `CRON_SECRET`

### Deployment Steps

1. **Set Environment Variables**
   - Set `AUTH_SECRET` and `CRON_SECRET` to strong random values
   - Configure `DATABASE_URL` to production database
   - Set up email/SMS/Telegram credentials if needed
   - Configure AI providers with production API keys

2. **Database Setup**
   - Ensure database migrations are applied
   - Verify database connection

3. **Build Application**
   ```bash
   npm run build
   ```

4. **Start Application**
   ```bash
   npm start
   ```

### Recommended Production Setup

#### Using Docker Compose

Create a `docker-compose.prod.yml`:

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: sde_command_center
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  postgres_data:
  redis_data:
```

Run with:

```bash
docker compose -f docker-compose.prod.yml up -d
```

#### Using PM2 (Process Manager)

Install PM2:

```bash
npm install -g pm2
```

Start application:

```bash
pm2 start npm --name "sde-command-center" -- start
```

Save PM2 process list:

```bash
pm2 save
pm2 startup
```

---

## Troubleshooting

### Database Connection Issues

**Problem:** Cannot connect to PostgreSQL

**Solutions:**
1. Ensure Docker containers are running:
   ```bash
   docker compose ps
   ```
2. Check database URL in `.env`:
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/sde_command_center?schema=public"
   ```
3. Restart database:
   ```bash
   docker compose restart postgres
   ```

### Prisma Client Issues

**Problem:** Prisma client not found or outdated

**Solution:**
```bash
npx prisma generate
npm install
```

### Port Already in Use

**Problem:** Port 3000 is already in use

**Solutions:**
1. Use a different port:
   ```bash
   PORT=3001 npm run dev
   ```
2. Or kill the process using port 3000:
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

### Migrations Fail

**Problem:** Migration fails with errors

**Solutions:**
1. Check database connection:
   ```bash
   npx prisma db push
   ```
2. Reset database (⚠️ WARNING: deletes all data):
   ```bash
   npx prisma migrate reset
   ```

### Build Fails

**Problem:** Build fails with TypeScript or lint errors

**Solutions:**
1. Run type check:
   ```bash
   npx tsc --noEmit
   ```
2. Run linter:
   ```bash
   npm run lint
   ```
3. Fix errors and rebuild:
   ```bash
   npm run build
   ```

### Redis Not Required

**Problem:** Redis is not working but app still runs

**Note:** Redis is provisioned for future rate-limiting/queue work. It is not required for the current reminder flow (which uses HTTP cron). The app will run without Redis, but future features may require it.

### AI Provider Issues

**Problem:** AI providers not working

**Solutions:**
1. Check provider is enabled in `.env`:
   ```bash
   OPENAI_ENABLED=true
   ```
2. Verify API key is set correctly
3. Check provider endpoint is accessible
4. Review provider logs in browser console

### Email/SMS Notifications Not Sending

**Problem:** Notifications are queued but not delivered

**Solutions:**
1. Verify credentials are set in `.env`
2. Check provider status (e.g., SMTP, Linq)
3. Enable the notification channel in user settings
4. Use dry-run mode to test:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" \
     http://localhost:3000/api/notifications/remind?dryRun=true
   ```

---

## Getting Started Checklist

- [ ] Node.js 20+ installed
- [ ] Docker and Docker Compose installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created from `.env.example`
- [ ] Required environment variables set
- [ ] Database containers started (`docker compose up -d`)
- [ ] Migrations applied (`npm run db:migrate:deploy`)
- [ ] Seed database (optional) (`npm run seed`)
- [ ] Development server running (`npm run dev`)
- [ ] Application accessible at http://localhost:3000

---

## Additional Resources

- **Next.js Documentation:** https://nextjs.org/docs
- **Prisma Documentation:** https://www.prisma.io/docs
- **Docker Documentation:** https://docs.docker.com
- **Project README:** See `README.md` for more details

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review project documentation in `README.md`
3. Check logs in browser console and server terminal
4. Verify all environment variables are set correctly

---

## Security Notes

- **Never commit `.env` file** - it contains sensitive credentials
- **Use strong secrets** for `AUTH_SECRET` and `CRON_SECRET`
- **Rotate API keys** regularly
- **Enable HTTPS** in production
- **Use database backups** regularly
- **Review notification settings** to prevent spam
