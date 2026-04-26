<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AfriSommelier

Your personal master sommelier — a Vite + React 19 + TypeScript app
deployed on Vercel. Auth is handled by [Clerk](https://clerk.com) and
data lives in [Supabase](https://supabase.com) (Postgres + RLS).
AI features are powered by Gemini / OpenRouter.

## Run locally

**Prerequisites:** Node.js 18+

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the values:

   - `VITE_CLERK_PUBLISHABLE_KEY` — from <https://dashboard.clerk.com>
   - `VITE_SUPABASE_URL` — from your Supabase project settings
   - `VITE_SUPABASE_ANON_KEY` — from your Supabase project settings
   - `GEMINI_API_KEY` — Gemini API key
   - `OPENROUTER_API_KEY` — OpenRouter API key

3. Run the migration in your Supabase SQL editor:
   `supabase/migrations/0001_init.sql`

4. In Clerk, enable **Google** under Social Connections and create a
   JWT template named **`supabase`** signed with your Supabase JWT
   secret. Full walkthrough: [docs/clerk-supabase-vercel-setup.md](docs/clerk-supabase-vercel-setup.md).

5. Start the dev server:

   ```bash
   npm run dev
   ```

## Project structure

| Path                                          | Purpose                                       |
|-----------------------------------------------|-----------------------------------------------|
| `src/main.tsx`                                | Mounts `<ClerkProvider>` + `<App>`            |
| `src/lib/clerk.ts`                            | Clerk config + `supabase` JWT template name   |
| `src/lib/supabase.ts`                         | `useSupabase()` hook + camel/snake helpers    |
| `src/utils/supabaseErrorHandler.ts`           | PostgrestError → friendly messages            |
| `src/components/LoginScreen.tsx`              | Clerk Google OAuth flow                       |
| `supabase/migrations/0001_init.sql`           | Tables + RLS policies + realtime publication  |
| `docs/clerk-supabase-vercel-setup.md`         | Vercel + Clerk + Supabase setup guide         |

## Available scripts

- `npm run dev` – start Vite dev server on port 3000
- `npm run build` – production build
- `npm run preview` – preview the production build
- `npm run lint` – `tsc --noEmit` type-check
