# Heartway

A responsive dating web app (Tinder / Bumble / Hinge–style) built with **Next.js**, deployable on **Vercel**, with **English**, **Mongolian (Cyrillic)**, and **Inner Mongolian (traditional script)** via editable JSON locale files.

## Features

- **Discover** — swipe pass / like / super like with optional comment (Hinge-style)
- **Profile prompts** — answer prompts on your profile
- **Matches & messaging** — real-time polling chat; optional **women message first** (Bumble-style)
- **Safety** — report users (harassment, spam, fake profile, etc.)
- **Blog** — articles on dating, living abroad, and community life (EN / MN / traditional)
- **Forum** — users post topics and replies; admins pin, lock, or moderate at `/[locale]/admin/forum`
- **Admin CMS** — blog at `/[locale]/admin/blog`, hub at `/[locale]/admin`
- **i18n** — all UI strings in `src/messages/*.json` for proofreading
- **PWA-ready** — installable on phones from the browser (`public/manifest.json`)

## Tech stack

| Layer | Choice |
|--------|--------|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL + Prisma |
| Auth | Auth.js (NextAuth v5) with credentials |
| i18n | next-intl |
| Styling | Tailwind CSS 4 |

## Getting started

### 1. Environment

Copy `.env.example` to `.env` and set:

```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="..."   # openssl rand -base64 32
ADMIN_EMAILS="you@example.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Database

Use [Vercel Postgres](https://vercel.com/storage/postgres), [Neon](https://neon.tech), or [Supabase](https://supabase.com) and paste the connection string into `DATABASE_URL`.

```bash
npm run db:push      # apply schema (dev)
# or
npm run db:migrate   # migrations (production)

npm run db:seed      # default prompts + sample blog posts
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000/en` (or `/mn`, `/mn-Inner`).

### 4. Deploy on Vercel

1. Push this repo to GitHub and import in Vercel.
2. Add environment variables: `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAILS`, `NEXT_PUBLIC_APP_URL` (your production URL).
3. Deploy — `vercel.json` runs `prisma generate` before build.

After deploy, run migrations against production DB:

```bash
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

## Editing translations

All user-facing copy lives in:

- `src/messages/en.json` — English
- `src/messages/mn.json` — Mongolian (Cyrillic)
- `src/messages/mn-Inner.json` — Inner Mongolian (traditional Mongolian script, Unicode)

Edit these files and redeploy; no code changes required for text updates.

Prompt labels use the `prompts` namespace; profile prompt keys are seeded in `prisma/seed.ts`.

## Admin blog

1. Sign up with an email listed in `ADMIN_EMAILS`.
2. Visit `/en/admin/blog` (or any locale prefix).
3. Create articles with Markdown content per locale (`en`, `mn`, `mn-Inner`).

## Mobile app: one project or two?

**Recommendation: start with this web app only.**

| Approach | Pros | Cons |
|----------|------|------|
| **PWA (this repo)** | Same codebase, instant Vercel deploy, i18n already done | No App Store presence; limited push notifications |
| **Expo / React Native (later)** | App Store & Play Store; native feel | Separate UI codebase; reuse only APIs |
| **Capacitor wrapper** | Wrap this site in a native shell | Middle ground; still mostly web UX |

When you want a store app, create a **second repo** (e.g. `heartway-mobile`) that calls the same REST APIs (`/api/*`). Keep **one database** and **one backend** (this Next.js app on Vercel) to avoid duplicating auth and security logic.

## Project structure

```
src/
  messages/          # i18n JSON (edit for proofreading)
  app/
    [locale]/        # Localized pages
    api/             # REST API routes
  components/
  lib/
prisma/
  schema.prisma      # Users, profiles, swipes, matches, messages, reports, blog
```

## Security notes

- Passwords hashed with bcrypt (cost 12).
- JWT sessions via Auth.js.
- Protected routes enforced in `src/middleware.ts`.
- Admin routes require `ADMIN_EMAILS` or `UserRole.ADMIN`.
- Use HTTPS in production; set strong `AUTH_SECRET`.
- For production photos, integrate [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) or S3 instead of raw image URLs.

## License

Private — your project.
