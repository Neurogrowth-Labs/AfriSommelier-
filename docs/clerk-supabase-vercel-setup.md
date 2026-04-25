# Clerk + Supabase + Vercel setup

AfriSommelier uses [Clerk](https://clerk.com) for authentication and
[Supabase](https://supabase.com) (Postgres + Row Level Security) for
the database. This guide walks through the one-time setup.

## 1. Supabase project

1. Create a new project at <https://app.supabase.com>.
2. From **Settings → API**, copy the **Project URL** and the **anon
   public key**. These map to `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY`.
3. From **Settings → API → JWT Settings**, copy the **JWT Secret**.
   You will paste this into Clerk in the next step.
4. Open **SQL Editor**, paste the contents of
   `supabase/migrations/0001_init.sql`, and run it. This creates
   `users`, `taste_dna`, `wishlist`, `cellar`, `consumption`,
   `events`, enables Row Level Security on each, and registers the
   tables with the realtime publication.
5. (Optional, for the admin override) under **Project Settings →
   Database → Custom Postgres config**, set
   `app.admin_email = '<your-admin-email>'`.

## 2. Clerk application

1. Create an application at <https://dashboard.clerk.com>.
2. Under **User & Authentication → Social Connections**, enable
   **Google**. Use Clerk's built-in OAuth credentials for development
   or your own Google OAuth client for production.
3. Under **API Keys**, copy the **Publishable Key** (starts with
   `pk_`). This is `VITE_CLERK_PUBLISHABLE_KEY`. The **Secret Key**
   (`CLERK_SECRET_KEY`) is only required if you add server-side calls.
4. Under **JWT Templates**, click **New template** and choose
   **Supabase**. Name it exactly `supabase`. In the **Signing key**
   section, paste the Supabase JWT secret you copied above. The
   default claims should look like:

   ```json
   {
     "aud": "authenticated",
     "role": "authenticated",
     "email": "{{user.primary_email_address}}",
     "app_metadata": {},
     "user_metadata": {}
   }
   ```

   The `sub` claim is automatically set to the Clerk user id, which
   is what `auth.jwt() ->> 'sub'` checks against in the RLS policies.
5. Under **Paths**, configure the SSO redirect URL to
   `<your-domain>/sso-callback` for every environment you deploy to
   (e.g. `http://localhost:3000/sso-callback` for dev,
   `https://afrisommelier.vercel.app/sso-callback` for production).

## 3. Local environment

Copy `.env.example` to `.env.local` and fill in the values:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
GEMINI_API_KEY=...
OPENROUTER_API_KEY=...
```

Then:

```bash
npm install
npm run dev
```

## 4. Vercel deployment

In your Vercel project's **Settings → Environment Variables**, add (for
both Preview and Production):

| Name                          | Value                          |
|-------------------------------|--------------------------------|
| `VITE_CLERK_PUBLISHABLE_KEY`  | Clerk publishable key          |
| `VITE_SUPABASE_URL`           | Supabase project URL           |
| `VITE_SUPABASE_ANON_KEY`      | Supabase anon key              |
| `GEMINI_API_KEY`              | (existing) Gemini API key      |
| `OPENROUTER_API_KEY`          | (existing) OpenRouter API key  |

Drop any old `VITE_FIREBASE_*` variables — they are no longer used.

If you add Clerk middleware on the server, also set `CLERK_SECRET_KEY`.

## 5. Verifying the integration

After deploy, open the live URL and:

1. Click **Continue with Google**. You should land on Google's consent
   screen, then be redirected back to `/sso-callback`, then to `/`
   already signed in.
2. Open Profile → your email should be visible.
3. Add a wine to your cellar (Scan or Add Wine) — confirm it appears
   in the Supabase table editor under `public.cellar` with the
   matching `user_id`.
4. Open the same account in two browser tabs and add a wine to the
   wishlist in one tab — it should appear in the other within a
   second (this exercises the realtime subscription).

If RLS denies a read or write, double-check that the Clerk JWT
template is named exactly `supabase` and signed with the Supabase
JWT secret.
