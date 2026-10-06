# SDE Command Center - Project Documentation

## Overview

The **SDE Command Center** is a sophisticated multi-user software development preparation and accountability application designed to help Software Development Engineers (SDEs) systematically learn new technologies, track their progress, and stay on schedule. Every user receives their own personalized copy of roadmap templates with strict data isolation, ensuring no user's progress affects another.

## What It Does

### For Individual Learners:

- **Structured Learning Paths**: Follow guided roadmaps from basics to advanced topics
- **Progress Tracking**: Monitor completion rates across milestones and phases
- **Daily Planning**: Create and manage daily study tasks
- **Study Sessions**: Log time and activities
- **Goal Setting**: Set and achieve learning objectives
- **Visual Analytics**: See progress through charts and visualizations

### For Team Managers:

- **Multi-user Support**: Each user has isolated data and preferences
- **Notification System**: Send reminders, updates, and summaries
- **Progress Reports**: View team-wide progress analytics
- **Roadmap Management**: Create and customize learning paths

## Technical Architecture

### Core Components:

1. **Frontend** (`app/`): Next.js application with React
   - Main application pages and components
   - Authentication flows (login, signup, settings)
   - Real-time notifications and reminders
   - Dashboard and progress tracking interfaces

2. **Backend API** (`app/api/`): Next.js server-side handlers
   - Authentication and session management
   - User data operations (tasks, progress, settings)
   - Notification system with multiple channels
   - Roadmap visualization generation

3. **Business Logic** (`lib/`): Application services
   - Roadmap templates and phase management
   - Progress calculation algorithms
   - Reminder scheduling and delivery
   - AI integrations for roadmap generation

4. **Database** (PostgreSQL):
   - User accounts and authentication
   - Task tracking and completion status
   - Roadmap templates and user progress
   - Notification preferences and history

5. **External Services**:
   - Email delivery (SMTP)
   - SMS/WhatsApp (via Linq)
   - Telegram notifications
   - AI providers for roadmap and task generation

### Data Flow:

```
Master Roadmaps → User Roadmaps → Tasks & Progress → Notifications
   ↓                  ↓               ↓              ↓
Template Structure   User Instance    Daily Planning  Reminder System
(immutable)         (editable)       (manageable)   (multi-channel)
```

## User Experience

### Authentication:

- **Secure**: Signed, expiring HTTP-only session cookies
- **User-friendly**: Simple sign-up and login flows
- **Persistent**: Maintains session across browser sessions
- **Admin access**: Special development user for testing

### Roadmap Navigation:

1. **Browse**: View available roadmaps (e.g., "Full Stack Web Development")
2. **Activate**: Join a roadmap to receive personalized tasks
3. **Track Progress**: Monitor completion across phases and milestones
4. **Daily Tasks**: Manage daily study plans
5. **Visualize**: Generate and view progress diagrams

### Progress Tracking:

- **Milestone-based**: Track completion of major learning goals
- **Phase tracking**: Monitor progress through structured learning phases
- **Daily planning**: Create and complete daily study tasks
- **Analytics**: View detailed progress reports and statistics
- **Notifications**: Receive reminders and progress updates

## Key Features

### 1. Roadmap System

- **Multiple Roadmaps**: Available templates include:
  - Full Stack Web Development (HTML/CSS/JS → React → Node → Databases → Deployment)
  - SDE Master Roadmap (comprehensive software development track)
- **Structured Learning**: Each roadmap broken into phases, topics, and tasks
- **Estimated Time**: Each task includes estimated completion time (days/hours)
- **Difficulty Levels**: Tasks marked as easy, medium, or hard
- **Task Types**: Practice, implementation, and concept-based tasks

### 2. Multi-User Architecture

- **Complete Isolation**: Each user's data never touches others
- **Personalized Experience**: Every user gets their own copy of roadmaps
- **Permission Controls**: Users can only access their own data
- **Role-based Access**: Different permissions for different users

### 3. Notification System

- **Multi-channel**: Email, SMS, Telegram, and in-browser notifications
- **Automated**: Scheduled cron jobs for reminders
- **Configurable**: Users control which channels receive which notifications
- **Smart Scheduling**: Timezone-aware, deduplicated reminders

### 4. Progress Analytics

- **Visual Dashboards**: Progress charts and graphs
- **Milestone Tracking**: Completion percentages
- **Daily Planning**: Calendar and task management
- **Study Session Tracking**: Time spent and activities logged

### 5. AI Integrations

- **Roadmap Generation**: AI creates personalized learning paths
- **Task Generation**: AI generates relevant learning tasks
- **Archify Diagrams**: AI creates visualization diagrams
- **Multiple Providers**: OpenAI, FreeLLMAPI, and other AI services supported

## Technology Stack

### Frontend:

- **Framework**: Next.js 16.3.5 with React 19.2.8
- **Styling**: Tailwind CSS 4.3.3
- **State Management**: React-Redux Toolkit
- **Icons**: Lucide React
- **Form Handling**: Zod for validation
- **Routing**: Next.js file-based routing

### Backend:

- **Runtime**: Node.js 20+
- **Framework**: Next.js (server-side rendering)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Prisma adapter
- **Email**: NodeMailer for SMTP
- **Security**: bcryptjs for password hashing

### DevOps:

- **Containerization**: Docker with PostgreSQL and Redis
- **Deployment**: CI/CD pipeline (implied)
- **Testing**: Vitest with coverage
- **Linting**: ESLint with Next.js config
- **Type Checking**: TypeScript

## User Journey

### Step 1: Initial Setup

1. Visit `http://localhost:3000`
2. Create an account or log in
3. Complete onboarding process (if applicable)

### Step 2: Choose a Roadmap

1. Browse available roadmaps
2. Read descriptions and structure
3. Click "Activate" to join

### Step 3: Navigate the Dashboard

1. View personal roadmap with progress
2. Access daily tasks and plans
3. Check notifications and reminders
4. Generate progress visualizations

### Step 4: Daily Learning

1. Review today's tasks
2. Mark tasks as completed
3. Log study session time
4. Receive progress reminders

### Step 5: Progress Monitoring

1. View milestone completion
2. Generate visualizations
3. Review analytics
4. Adjust learning pace

## Development Guide

### Running Locally:

1. **Install Requirements**: Node.js 20+, Docker, npm
2. **Setup Environment**:
   ```bash
   cp .env.example .env
   ```
3. **Start Database**:
   ```bash
   docker compose up -d
   ```
4. **Apply Migrations**:
   ```bash
   npm run db:migrate:deploy
   ```
5. **Seed Database** (optional for dev):
   ```bash
   npm run seed
   ```
6. **Start Development Server**:
   ```bash
   npm run dev
   ```

### Key Development Commands:

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run lint`: Run linting checks
- `npm test`: Run test suite
- `npm run db:migrate:deploy`: Apply database migrations
- `npm run seed`: Seed database with default data

### API Testing:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/notifications/remind?dryRun=true
```

## Production Deployment

### Environment Variables Required:

- `AUTH_SECRET`: Authentication secret
- `CRON_SECRET`: Cron job authorization
- `DATABASE_URL`: PostgreSQL connection string

### Deployment Steps:

1. Set environment variables
2. Apply database migrations
3. Build the application
4. Start the production server
5. Configure reverse proxy (nginx/Apache)

### Security Considerations:

- Never commit `.env` file
- Use strong secrets for authentication
- Rotate API keys regularly
- Enable HTTPS in production
- Regular database backups

## Troubleshooting Common Issues

### Database Connection:

- **Problem**: Cannot connect to PostgreSQL
- **Solution**: Ensure Docker containers are running and check `.env` file

### Migration Errors:

- **Problem**: Migration fails
- **Solution**: Run `npx prisma generate` and check database connection

### Port Conflicts:

- **Problem**: Port 3000 already in use
- **Solution**: Use different port: `PORT=3001 npm run dev`

### Build Errors:

- **Problem**: Build fails
- **Solution**: Run `npx tsc --noEmit` and `npm run lint` to identify issues

## Future Enhancements

### Planned Features:

1. **Real-time Collaboration**: Shared roadmaps for teams
2. **Gamification**: Points, badges, and leaderboards
3. **Mobile App**: Native iOS and Android applications
4. **Advanced Analytics**: Machine learning for personalized recommendations
5. **Integration**: Calendar sync (Google, Outlook)

### Technical Roadmap:

1. **Redis Integration**: For rate limiting and queues
2. **WebSocket Support**: Real-time updates
3. **GraphQL API**: Alternative to REST API
4. **Microservices**: Separated services for better scalability

## Contact and Support

### For Questions:

1. Check the troubleshooting section above
2. Review project documentation
3. Check browser console and server logs
4. Verify environment variables are set correctly

### Support Resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Docker Documentation](https://docs.docker.com)
- Project README (`README.md`) for additional details

## Documentation Summary

This project provides a comprehensive solution for software development career preparation. It combines structured learning paths, progress tracking, and multi-user collaboration in a secure, isolated environment. The application is designed to scale from individual learning to team-based development preparation, with robust administrative controls and comprehensive analytics.

Key highlights:

- **Zero data leakage** between users
- **Multi-channel notifications** with smart scheduling
- **AI-powered** roadmap and task generation
- **Visual progress tracking** and analytics
- **Enterprise-grade** security and isolation
- **Developer-friendly** architecture with extensive documentation

The SDE Command Center is suitable for individual learners preparing for software development roles, educational institutions teaching software development, and teams managing learning and development programs.
