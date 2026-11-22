# SENTINEL

SENTINEL is a React, TypeScript, and Vite app for exploring text sentiment and language signals in social media posts. The public Demo Access workspace uses synthetic sample data and browser-local demo history. Signed-in users can use their own separate browser-local history. Results are not diagnoses or evidence of a person's mental state.

## Environment variables

Set these values in an ignored local `.env.local` file for `vercel dev`, and in the Vercel project's Environment Variables before deployment:

| Variable | Where it is used | Required |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Normal account authentication and API token verification | Required only for normal account auth |
| `VITE_SUPABASE_ANON_KEY` | Normal account authentication and API token verification; browser-safe anon key only | One of these two keys for normal auth |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Alternative browser-safe project key | One of these two keys for normal auth |
| `GEMINI_API_KEY` | Server-side analysis functions only | Optional for demo entry; required for Gemini analysis |
| `GEMINI_MODEL` | Server-side model override; defaults to `gemini-3.5-flash-lite` | No |

Never name the model key `VITE_GEMINI_API_KEY`: Vite exposes `VITE_` variables to browser code. Never use a Supabase service-role key in this app. `.env.example` contains placeholders only.

## Local development

The regular Vite command serves the frontend but does not execute Vercel functions:

```sh
npm run dev
```

To test `/api/demo-analyze` and `/api/analyze` locally, use Vercel's development server after signing in to the Vercel CLI and linking the project if prompted. The plain Vite server does not provide API routes; Demo Access itself works without API routes:

```sh
npx vercel dev
```

Provide the environment values above in the ignored `.env.local` file or Vercel's server environment. One-click Demo Access requires no environment variables. If Gemini is unavailable, the demo displays an explicitly labeled illustrative sample and does not save it as an analysis. Never commit real environment files.

## Supabase database migration

`supabase/migrations/202611230001_sentinel_foundation.sql` extends the existing PreScribe `profiles` table and adds SENTINEL consent and analysis tables. Apply and verify migrations for the intended Supabase project before using the database foundation. The current sign-in flow falls back to the auth user's display name if the SENTINEL profile migration or profile row is unavailable; the analysis demo history does not currently use the database tables.

## Vercel preparation

Vercel builds the Vite frontend with `npm run build` and automatically detects TypeScript functions in the root `/api` directory. `vercel.json` preserves the SPA fallback and assigns analysis functions a 30-second maximum duration. Set `GEMINI_API_KEY` server-side to enable Gemini analysis. Supabase environment values are needed for normal account sign-in, not Demo Access. Confirm the Supabase Site URL and allowed email redirect URLs match the hosted app.

To deploy later, link the repository to a Vercel project, add the environment variables, then deploy from the Vercel dashboard or with:

```sh
npx vercel --prod
```

No deployment is performed by this repository setup.

## Current scope and limitations

- Analysis accepts text only. The image picker remains visible, but images are not uploaded or sent to Gemini.
- Demo analysis history uses the `sentinel_demo_history` localStorage key; signed-in account histories use separate keys scoped by Supabase user ID. Each is limited to the newest 50 results and does not sync across devices. Reset Demo Data removes only the demo key.
- Dashboard metrics, emotion distribution, recent results, and seven-day trends use saved real analyses when available. Otherwise, any displayed illustrative examples are labeled as sample data.
- Behavioral signals are text observations and must not be treated as diagnoses or proof of an ongoing state.
- Password recovery sends a Supabase recovery email; a dedicated password-update screen is not part of this phase.
- Existing PreScribe pages, services, and Edge Functions remain outside the active SENTINEL routes.
