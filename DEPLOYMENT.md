# Iron Protocol - Deployment Guide

This guide covers deploying Iron Protocol to Vercel with a Supabase backend.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Supabase Setup](#supabase-setup)
- [Vercel Deployment](#vercel-deployment)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)
- [Local Development](#local-development)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Node.js 18+ or Bun runtime
- Supabase account (free tier available)
- Vercel account (free tier available)
- Git repository access

---

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────────────────────────┐
│     Vercel      │     │            Supabase                   │
│  ┌───────────┐  │     │  ┌─────────────┐  ┌──────────────┐  │
│  │   React   │◄─┼─────┼──┤  PostgREST  │  │  PostgreSQL  │  │
│  │   (Vite)  │  │     │  └─────────────┘  └──────────────┘  │
│  └───────────┘  │     │  ┌─────────────┐  ┌──────────────┐  │
│                 │     │  │    Auth     │  │   Realtime   │  │
│                 │     │  └─────────────┘  └──────────────┘  │
└─────────────────┘     └──────────────────────────────────────┘
```

**Stack:**
- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS + shadcn/ui
- Backend: Supabase (PostgreSQL + Auth + Realtime)
- State: TanStack Query + Zustand
- Hosting: Vercel (static/SSR)

---

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Choose organization, name, database password, and region
4. Wait for project to provision (~2 minutes)

### 2. Run Database Migrations

The database schema is defined in `supabase/migrations/`. Apply them in order:

**Option A: Using Supabase CLI**
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Push migrations
supabase db push
```

**Option B: Manual SQL**
1. Go to Supabase Dashboard > SQL Editor
2. Run migrations in order from `supabase/migrations/`
3. Start with `20260115034727_*.sql` and proceed chronologically

### 3. Database Schema Summary

**Core Tables (37 total):**

| Table | Purpose |
|-------|---------|
| `profiles` | User identity, stats, leaderboard |
| `exercises` | Exercise library |
| `missions` | Workout mission templates |
| `mission_exercises` | Mission-exercise junction |
| `workout_sessions` | Active/completed workout sessions |
| `workout_sets` | Individual set logs |
| `collections` | Campaigns/collections of missions |
| `weekly_bosses` | Weekly boss raid system |
| `weekly_boss_damage` | User damage contributions |
| `squads` | Training groups |
| `squad_members` | Squad membership |
| `mission_assignments` | Handler-assigned missions |
| `user_roles` | Role-based access (user/handler) |
| `notifications` | In-app notification system |
| `personal_records` | PR tracking |
| `achievements` | Achievement definitions |
| `user_achievements` | Unlocked achievements |
| `milestones` | Progress milestones |
| `user_milestones` | User milestone progress |
| `cosmetics` | Unlockable cosmetics |
| `rivalries` | Rival tracking |

**Views:**
- `global_leaderboard` - Top players by score
- `mission_leaderboard` - Per-mission rankings
- `weekly_boss_leaderboard` - Boss damage rankings
- `rival_weekly_stats` - Weekly rival comparisons
- `war_report_current_week` - Campaign analytics

**Key Database Functions:**
- `handle_new_user()` - Creates profile on signup
- `apply_boss_damage()` - Processes boss raid damage
- `rotate_weekly_boss()` - Weekly boss rotation
- `emit_notification()` - Notification system
- `get_user_assignments()` - Fetch user's assignments
- `has_role()` - Check user roles (SECURITY DEFINER)

### 4. Row Level Security (RLS)

All tables have RLS enabled with 104+ policies. Key patterns:

- **Public read, owner write**: profiles, exercises, missions
- **Owner only**: workout_sessions, personal_records, notifications
- **Role-based**: squads (handler), mission_assignments (handler)
- **Membership-based**: squad_members, collection_missions

### 5. Authentication Configuration

1. Go to Authentication > Settings
2. **Email Auth**: Enabled by default
3. **Confirm email**: Recommended for production
4. **Site URL**: Set to your production domain
5. **Redirect URLs**: Add your domains

```
https://your-domain.com/*
https://your-domain.vercel.app/*
http://localhost:5173/*  (dev only)
```

### 6. Triggers (Auto-created)

```sql
-- Profile creation on signup
on_auth_user_created → handle_new_user()

-- Updated_at timestamps
update_profiles_updated_at → update_updated_at_column()
update_exercises_updated_at → update_updated_at_column()
update_missions_updated_at → update_updated_at_column()

-- Profile stats aggregation
update_profile_stats_trigger → update_profile_stats_on_session()

-- Milestone progress
update_milestone_progress_trigger → update_milestone_progress()

-- Notifications
notify_mission_assigned_trigger → notify_mission_assigned()
notify_squad_invite_accepted_trigger → notify_squad_invite_accepted()
notify_rival_invite_accepted_trigger → notify_rival_invite_accepted()
notify_feedback_submitted_trigger → notify_feedback_submitted()

-- Mission popularity
update_mission_popularity_trigger → update_mission_popularity()
```

---

## Vercel Deployment

### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Vercel auto-detects Vite configuration

### 2. Configure Build Settings

Settings should auto-detect, but verify:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 3. Environment Variables

In Vercel Dashboard > Settings > Environment Variables:

```bash
# Required
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Optional
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

**Important:** Only use the `anon` key, never the `service_role` key in client-side code.

### 4. Deploy

Click "Deploy" - Vercel handles the rest.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon/public key |
| `VITE_SUPABASE_PROJECT_ID` | ❌ | Project ID (for reference) |
| `VITE_GA_MEASUREMENT_ID` | ❌ | Google Analytics 4 ID |

---

## Post-Deployment

### 1. Update Supabase Auth Settings

Add your production URLs:
- Site URL: `https://your-domain.com`
- Redirect URLs: `https://your-domain.com/*`

### 2. Seed Initial Data (Optional)

Run `supabase/seed.sql` if you have seed data:

```bash
supabase db seed
# or
psql YOUR_DATABASE_URL < supabase/seed.sql
```

### 3. Create Admin User

After first signup, promote a user to handler:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('USER_UUID_HERE', 'handler');
```

### 4. Verify Deployment

- [ ] Auth flow works (signup, login, logout)
- [ ] Profiles created on signup
- [ ] Exercises and missions load
- [ ] Workout sessions save correctly
- [ ] Leaderboard displays
- [ ] Weekly boss system active

---

## Local Development

### Quick Start

```bash
# Clone repository
git clone YOUR_REPO_URL
cd iron-protocol

# Install dependencies
npm install
# or
bun install

# Copy environment file
cp .env.example .env

# Fill in your Supabase credentials in .env

# Start development server
npm run dev
# or
bun dev
```

### Development Commands

```bash
npm run dev      # Start dev server (port 8080)
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint check
npm run typecheck # TypeScript check (if configured)
```

### Using Supabase Local (Optional)

```bash
# Start local Supabase
supabase start

# Use local URLs in .env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJ... (local anon key)
```

---

## Troubleshooting

### "RLS policy violation"
- User not authenticated
- Policy doesn't cover the operation
- Check `auth.uid()` matches record ownership

### "relation does not exist"
- Migrations not run
- Check `supabase/migrations/` order

### "Failed to fetch"
- CORS issues - check Site URL in Supabase
- Network issues - check Supabase status

### "Invalid JWT"
- Wrong API key (using service role instead of anon)
- Expired token - refresh page

### Build fails on Vercel
- Check environment variables are set
- Verify `VITE_` prefix on all client variables
- Check build logs for TypeScript errors

---

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Service role key NOT in client code
- [ ] Auth redirect URLs configured
- [ ] Email confirmation enabled (production)
- [ ] Rate limiting considered
- [ ] CORS origins restricted

---

## External Services

This project uses:
- **Supabase**: Database, Auth, Realtime
- **Vercel**: Hosting
- **Google Analytics** (optional): Analytics

No other external API keys required for core functionality.

---

## Support

For issues:
1. Check Supabase Dashboard logs
2. Check Vercel deployment logs
3. Open GitHub issue with reproduction steps
