# Wardrobe Styling

[![CI](https://github.com/LidorPrototype/wardrobe-styling-app/actions/workflows/ci.yml/badge.svg)](https://github.com/LidorPrototype/wardrobe-styling-app/actions/workflows/ci.yml)

A collaborative styling app: you photograph your wardrobe, open a request
("what should I wear to Sarah's wedding?"), and share a link so friends can
put outfits together from your real clothes, vote, and comment — without
creating an account.

Bilingual from day one: English (LTR) and Hebrew (RTL).

> **Status:** in active development. The owner side (auth, wardrobe,
> styling requests) works; guest collaboration is next. See [Milestones](#milestones).

## Features so far

- **Accounts** — email/password and Google sign-in; each owner gets a profile
  and a default wardrobe on first login.
- **Wardrobe** — upload photos of clothing items, describe them (category,
  color, season, formality, brand, size, free-text tags), filter, archive, delete.
- **Styling requests** — create a request with an occasion, date and notes;
  mark it finished (it becomes read-only) or reopen it.
- **Two languages** — every screen in English and Hebrew, with correct
  right-to-left layout.

## Tech stack

| Area | Choice |
| --- | --- |
| App | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| i18n | next-intl — `/en` and `/he` routes |
| Backend | Supabase — Postgres, Auth, Storage |
| Validation | Zod |
| Tests / CI | Vitest, GitHub Actions |

## How it is built

- **Tenant isolation lives in the database.** Every table has Row Level
  Security policies scoped to the signed-in user, so isolation holds even
  for direct API calls, not just through the UI.
- **Private photo storage.** Images sit in a private bucket and are served
  through short-lived signed URLs, signed in one batch per page.
- **Language-neutral data.** Enum fields store codes (`smart_casual`), and
  labels are translated at render time, so the same wardrobe reads correctly
  in both languages.
- **Rules enforced at every layer.** A finished request is hidden from
  editing in the UI, refused by the server action, *and* rejected by a
  database trigger.

The reasoning behind these and other choices is in
[docs/decisions.md](docs/decisions.md).

## Running locally

Requires Node 22+, pnpm, and a Supabase project.

```bash
pnpm install
cp .env.example .env.local   # then fill in your Supabase URL and keys
pnpm dev                     # http://localhost:3000
```

Apply the SQL files in [`supabase/migrations/`](supabase/migrations) in order,
with `supabase db push` or the Supabase dashboard's SQL editor.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm test` | Run unit tests |
| `pnpm lint` / `pnpm typecheck` | Lint / type-check |
| `pnpm build` | Production build |
| `pnpm sweep:storage` | List photos left behind by deleted accounts (`--apply` deletes them) |

## Milestones

- [x] **0** — Project setup, English/Hebrew routing
- [x] **1** — Supabase auth, profiles, default wardrobe
- [x] **2** — Wardrobe items with photos
- [x] **3** — Styling requests
- [ ] **4** — Invite links
- [ ] **5** — Guest identity and session
- [ ] **6** — Outfit builder workspace
- [ ] **7** — Voting and comments
- [ ] **8** — Outfit status and library
- [ ] **9** — Outfit groups
- [ ] **10** — Polish and hardening
