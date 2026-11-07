# Wardrobe Styling — Product and Engineering Plan

The design behind the app: what it does, how it is built, and what is left.
Remaining work is tracked as [GitHub milestones and issues](https://github.com/LidorPrototype/wardrobe-styling-app/milestones);
the database migrations in [`supabase/migrations`](../supabase/migrations) are
the source of truth for the schema.

## 1. Summary

A responsive, multi-user web app for collaborative outfit selection. An owner
uploads their wardrobe, creates a styling request ("Date tonight", "Wedding
next week"), and sends a private invite link. Friends join without an
account, build outfit suggestions from the owner's clothes, like and comment
on them, and the owner decides what to wear.

> Your wardrobe, styled by people you trust.

The app is multi-tenant from the first milestone: any number of owners sign
up, and Row Level Security keeps each owner's data isolated.

### Core flow

1. Owner uploads wardrobe items.
2. Owner creates a styling request.
3. Owner shares one reusable private invite link.
4. Guests join with a nickname and passphrase.
5. Guests (and the owner) build outfit suggestions, like and comment.
6. Owner marks an outfit chosen, worn, favorite or rejected.
7. Chosen, worn and favorite outfits are kept in the outfit library and can
   be sorted into groups.

## 2. Tech stack

- Next.js (App Router, Server Components, Server Functions), React, TypeScript
- Tailwind CSS
- next-intl — English (LTR) and Hebrew (RTL)
- Supabase — Auth (email/password, Google), Postgres with RLS, Storage
- Zod for validation, Vitest for unit tests
- pnpm, GitHub Actions, release-please
- Vercel for hosting (planned, Milestone 11)

## 3. Scope

### In the MVP

- Owner sign-up and login (email/password; Google wired, finished in M11).
- One wardrobe per owner (the schema allows more later).
- Clothing items with a photo and metadata. Closed-list fields (category,
  subcategory, color, season, formality) are stored as language-neutral codes
  and translated on screen; free-text fields (name, brand, size, notes, tags)
  are stored as typed.
- Wardrobe browsing and filtering.
- Styling requests: open or finished (finished is read-only).
- One reusable invite link per request; regenerating revokes the old one.
- Guests join with nickname + passphrase; no account.
- Outfit builder with slots (top, bottom, shoes, outerwear, accessory,
  other), tap or drag to fill; a preview draws the outfit under the owner's
  head photo.
- Likes (one per person per outfit, never your own) and comments on an
  outfit or on the whole request.
- Owner decisions: chosen, worn, favorite, rejected. Chosen, worn and
  favorite save a new library entry every time, so repeat wears keep their
  own date and notes.
- Outfit groups ("Work", "Weddings", "Summer"); one entry can be in many.
- Every screen in English and Hebrew; responsive on phone and desktop.

### Out of scope for the MVP

AI outfit generation or tagging, background removal, virtual try-on, native
mobile app, persistent stylist accounts, wardrobe-level permissions,
payments, social feed, shopping recommendations, calendar or weather
integration, notifications. See Milestone 12.

## 4. Users and permissions

**Owner** (Supabase Auth account): manages their wardrobe, profile and head
photo; creates, edits, finishes and reopens requests; manages the invite
link; suggests outfits on their own requests; likes and comments; deletes
any comment on their request; decides on outfits; manages the library and
groups.

**Guest** (no account, one identity per request): joins through a valid
invite link with a nickname (case-insensitive) and passphrase; can come back
later on any device. On an open request a guest can suggest outfits, like
other people's outfits, comment, and edit or delete their own comments and
delete their own suggestions. On a finished request, guests who already
joined keep read-only access; new joins are blocked. Guests never see the
owner's email, the library, or anything outside their request.

## 5. Internationalization

- Routes `/en/...` and `/he/...`; `lang` and `dir` set on the layout.
- Logical CSS utilities (`ms-*`, `ps-*`, `text-start`) instead of left/right.
- Messages in `messages/en.json` and `messages/he.json`; a test checks both
  files have the same keys and that every stored code has a label.

## 6. Routes

Public: `/[locale]`, `/[locale]/login`, `/[locale]/signup`.

Owner (signed in):

```txt
/[locale]/app
/[locale]/app/wardrobe            /new   /[itemId]
/[locale]/app/requests            /new   /[requestId]   /[requestId]/edit   /[requestId]/suggest
/[locale]/app/library             /[entryId]
/[locale]/app/library/groups      /[groupId]
/[locale]/app/profile
```

Guest: `/[locale]/invite/[token]`, `/[locale]/guest/request/[requestId]`,
`/[locale]/guest/request/[requestId]/suggest` — a small shell with a
language switcher and an exit button, no owner navigation.

## 7. Data model

| Table | Holds |
|---|---|
| `profiles` | Owner display name and head photo path |
| `wardrobes` | One per owner (more allowed later) |
| `clothing_items`, `clothing_item_tags` | Items with coded metadata and free-text tags |
| `styling_requests` | Title, occasion, event date, notes, open/finished |
| `invite_tokens` | SHA-256 hash of the invite token; one active per request |
| `guest_identities`, `guest_sessions` | Guest nickname + passphrase hash; hashed session tokens |
| `outfit_suggestions`, `outfit_suggestion_items` | Outfits by a guest or the owner, items by slot, owner's decision |
| `votes`, `comments` | Likes, and comments on an outfit or the request |
| `outfit_library_entries`, `outfit_library_items` | One row per chosen/worn/favorite occurrence, with a snapshot of its items |
| `outfit_groups`, `outfit_group_memberships` | Owner's groups; many-to-many with library entries |

Rules enforced in the database, not only in the app: exactly one author
(guest or owner) per suggestion, like and comment; one like per person per
outfit; no liking your own outfit; finished requests are read-only;
suggestion items must come from the request's wardrobe; group names are
unique per owner ignoring case and spaces.

## 8. Storage

Private bucket `wardrobe-items`, read through short-lived signed URLs.

```txt
{owner_id}/{wardrobe_id}/{item_id}/original.{ext}
{owner_id}/profile/head.{ext}
```

A maintenance script (`pnpm sweep:storage`) removes folders of deleted owners.

## 9. Security model

- **Owners** use Supabase Auth. Every table has RLS; owners reach only their
  own rows. Column grants limit what can change (for example, an owner can
  change a suggestion's status but not its author).
- **Guests** have no Supabase session. Guest tables are deny-all for browser
  roles; all guest reads and writes go through Server Functions that check
  the guest session cookie first and then use the secret key, scoped to that
  guest. SQL triggers back the same rules for every client.
- **Invite tokens**: 32 random bytes, only the hash is stored; revoked or
  finished-request links fail.
- **Passphrases**: scrypt with per-hash salt; at least 6 characters; 10 wrong
  tries lock a nickname for 15 minutes.
- **Secrets**: the secret key is server-only; nothing secret reaches the
  browser.

## 10. Milestones

Each milestone ships as one pull request, reviewed and tested before the
next starts. Versions are listed on the
[releases page](https://github.com/LidorPrototype/wardrobe-styling-app/releases).

| # | Milestone | Status |
|---|---|---|
| 0 | Project setup, English/Hebrew routing | Done |
| 1 | Supabase auth, profiles, default wardrobe | Done |
| 2 | Wardrobe items with photos | Done |
| 3 | Styling requests | Done |
| 4 | Invite links | Done |
| 5 | Guest identity and session | Done |
| 6 | Outfit builder and head-photo preview | Done |
| 7 | Likes and comments | Done |
| 8 | Outfit status and library | Done |
| 9 | Outfit groups | Done |
| 10a | Hardening | Next |
| 10b | Polish | Planned |
| 11 | Deployment and Google sign-in | Planned |
| 12 | Future work (backlog) | Not scheduled |

### 10a — Hardening

Loading, error and not-found states on every page; no swallowed database
errors; a permission sweep of owner and guest routes; a committed security
test suite (RLS, triggers, cross-owner and guest isolation) running in CI
against a local Supabase; security headers; fixes for open dependency
alerts; cleanup of expired guest sessions; forms that keep their input after
a failed submit; "Mark worn" defaulting to the owner's local day.

### 10b — Polish

A useful owner home page; a mobile navigation menu; editing outfit
suggestions; more builder filters (subcategory, color, formality, season);
clear handling when a wardrobe item used in an outfit is deleted; an
accessibility pass; RTL and phone QA of every page. Optional: an end-to-end
browser test in CI, generated database types, image thumbnails.

### 11 — Deployment and Google sign-in

Vercel production and preview deployments; Supabase production settings
(site URL, redirect URLs, email templates); Google OAuth end to end;
verify Hebrew is picked from the browser language.

### 12 — Future work

- Request visibility rules: show guests only some items (by category, tag or
  hand-picked).
- Archived requests: hide old requests from the list.
- Account deletion and data export.
- Background removal for clothing photos.
- AI outfit suggestions and tagging.
- Notifications for new suggestions, comments and likes.
- Trusted stylist accounts; wardrobe-level invitations.
- Weather and calendar awareness, packing lists, cost-per-wear, laundry status.
- Native mobile app.

## 11. Testing

- **Unit tests** (Vitest) for the rules that matter — validation, slot
  capacity, permissions, sorting, translations. Each is checked by breaking
  the rule and watching the test fail.
- **Database security checks** with real owner and guest roles for every
  milestone (cross-owner access, guest isolation, finished requests, column
  limits); committed and run in CI from Milestone 10a.
- **Browser checks** in English and Hebrew, desktop and phone, before each
  pull request.
