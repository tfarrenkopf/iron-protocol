# Iron Protocol - Local Development Setup

Quick guide to get the app running locally.

## Prerequisites

- Node.js 18+ (or Bun)
- Git

## Quick Start

```bash
# 1. Clone the repository
git clone YOUR_REPO_URL
cd iron-protocol

# 2. Install dependencies
npm install
# or: bun install

# 3. Create environment file
cp .env.example .env

# 4. Add your Supabase credentials to .env
# Get these from your Supabase project dashboard

# 5. Start development server
npm run dev
# or: bun dev
```

The app will be available at `http://localhost:8080`

## Environment Variables

Required in `.env`:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── components/        # React components
│   ├── ui/           # shadcn/ui components
│   └── profile/      # Profile-related components
├── hooks/            # Custom React hooks
├── pages/            # Page components
├── integrations/     # Supabase client & types
├── lib/              # Utilities
├── stores/           # Zustand stores
├── types/            # TypeScript types
└── data/             # Static data

supabase/
├── migrations/       # Database migrations
├── schema.sql        # Complete schema export
├── rls-policies.sql  # RLS policies
├── functions.sql     # Database functions
└── seed.sql          # Seed data
```

## Tech Stack

- **React 18** + TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **TanStack Query** - Data fetching
- **Zustand** - State management
- **Supabase** - Backend (DB, Auth, Realtime)
- **Framer Motion** - Animations

## Supabase Local Development (Optional)

To run Supabase locally:

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Update .env to use local URLs
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=[local-anon-key]

# Apply migrations
supabase db push

# Seed data
supabase db seed
```

## Common Issues

### "relation does not exist"
Run database migrations in the correct order.

### "RLS policy violation"  
Ensure you're authenticated. Check that auth tokens are valid.

### Port 8080 in use
Kill the process or change the port in `vite.config.ts`.

## Testing Auth Locally

1. Sign up with any email
2. If email confirmation is disabled, you can login immediately
3. Check Supabase Auth dashboard for users

## Need Help?

See `DEPLOYMENT.md` for full deployment instructions.
