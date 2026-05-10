# SRP Real Estate Portal

A full-featured real estate team portal built with Next.js, Supabase, and Vercel. Includes a public marketing website, agent link cards, dynamic forms, transaction tracking, lead CRM, newsletters, and a visual page builder powered by Puck.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, React 19)
- **Database & Auth**: [Supabase](https://supabase.com) (Postgres, RLS, Auth Hooks)
- **UI**: [shadcn/ui](https://ui.shadcn.com) patterns, [Tailwind CSS 4](https://tailwindcss.com), [Framer Motion](https://www.framer.com/motion/), [Lucide icons](https://lucide.dev)
- **Visual Editor**: [Puck](https://github.com/puckeditor/puck) with 18 custom components
- **AI**: [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) via AI SDK
- **Tables**: [TanStack Table v8](https://tanstack.com/table)
- **Drag & Drop**: [dnd-kit](https://dndkit.com)
- **Email**: [Resend](https://resend.com) + [React Email](https://react.email)
- **SMS**: [Twilio](https://www.twilio.com)
- **Testing**: [Vitest](https://vitest.dev) + Testing Library

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- (Optional) [Resend](https://resend.com) API key for email
- (Optional) [Twilio](https://www.twilio.com) credentials for SMS
- (Optional) [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) key for AI features

## Initial Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd srp_portal
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `RESEND_API_KEY` | Resend API key for email delivery |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio sender phone number |
| `VERCEL_AI_GATEWAY_KEY` | Vercel AI Gateway key (for AI content generation) |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (`http://localhost:3000` for dev) |

### 3. Run database migrations

Apply the migrations in order to your Supabase project. You can do this through the Supabase Dashboard SQL Editor or the Supabase CLI. The migration files are in `supabase/migrations/`:

```
001_profiles_and_roles.sql    — User profiles, roles, signup trigger
002_transactions.sql          — Transaction tracking tables
003_leads.sql                 — Lead CRM tables
004_link_cards.sql            — Agent link card versioning
005_forms.sql                 — Form builder with version control
006_newsletters.sql           — Newsletter and subscriber tables
007_website_cms.sql           — Website pages, settings, IDX cache
008_settings_and_config.sql   — Notifications, templates, API config, branding
009_rls_policies.sql          — Row Level Security on all tables
010_auth_hook.sql             — Custom JWT hook for RBAC claims
```

If using the Supabase CLI:

```bash
supabase db push
```

Then run the seed data:

```bash
# Via Supabase Dashboard SQL Editor, paste the contents of:
supabase/seed.sql
```

### 4. Enable the Auth Hook

In the Supabase Dashboard, go to **Authentication > Hooks** and enable the **Custom Access Token** hook pointing to `public.custom_access_token_hook`. This injects the user's role (`super_admin`, `admin`, `user`) into the JWT so the app can enforce RBAC.

### 5. Create the first super admin

Sign up through the app at `/login` (or create a user in the Supabase Dashboard under **Authentication > Users**), then promote that user:

```bash
npm run promote-super-admin jake@tekforge.io
```

This uses the service role key to bypass RLS and set the user's role to `super_admin`. After this, you can promote other users to `admin` or `super_admin` through the portal UI at **Super Admin > Users**.

## Development

```bash
npm run dev
```

Opens [http://localhost:3000](http://localhost:3000).

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run promote-super-admin <email>` | Promote a user to super_admin |

### Project Structure

```
src/
├── actions/          # Server actions (transactions, leads, forms, etc.)
├── app/
│   ├── (auth)/       # Login, OAuth callback
│   ├── (portal)/     # Authenticated portal routes
│   │   └── portal/
│   │       ├── dashboard
│   │       ├── transactions/
│   │       ├── leads/
│   │       ├── forms/
│   │       ├── link-card/
│   │       ├── newsletters/
│   │       ├── website/
│   │       ├── settings/
│   │       └── super-admin/
│   ├── (public)/     # Public marketing site, /c/[slug], /f/[slug]
│   └── api/          # API routes (form submit, newsletter subscribe)
├── components/
│   ├── portal/       # Portal-specific components
│   ├── shared/       # Sidebar, topbar, data-table, brand-provider
│   └── ui/           # Base UI components (button, card, input, etc.)
├── hooks/            # React hooks (useUser, useBrandTheme)
├── lib/
│   ├── ai/           # Vercel AI Gateway client
│   ├── email/        # Resend client, React Email templates
│   ├── forms/        # Schema-to-Zod, sanitization
│   ├── listings/     # IDX Broker / RESO provider abstraction
│   ├── puck/         # Puck editor config, 18 components, AI generator
│   ├── sms/          # Twilio client
│   └── supabase/     # Client, server, admin, middleware helpers
├── types/            # TypeScript types (database schema)
└── __tests__/        # Unit tests
supabase/
├── migrations/       # 10 SQL migration files
└── seed.sql          # Default templates, brand settings, website config
scripts/
└── promote-super-admin.ts
```

### Roles & Permissions

| Role | Access |
|---|---|
| `user` | Dashboard, Transactions, Leads, Forms, Link Card, Settings |
| `admin` | Everything above + Website CMS, Newsletters |
| `super_admin` | Everything above + User management, API keys, Branding |

Roles are enforced at three levels:
1. **JWT claims** — injected by the Supabase Auth Hook
2. **Middleware** — route protection in `middleware.ts`
3. **Row Level Security** — database-level policies on every table

## Deployment (Vercel)

1. Push the repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add all environment variables from `.env.example` to the Vercel project settings.
4. Enable the [AI Gateway integration](https://vercel.com/docs/ai-gateway) if using AI features — this auto-populates `VERCEL_AI_GATEWAY_KEY`.
5. Deploy.

The app uses `force-dynamic` for public pages that fetch from Supabase, so no build-time database access is required.

## License

Private — all rights reserved.
