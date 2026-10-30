# Design decisions

Short records of choices that aren't obvious from the code, and why they
were made. Newest milestone last.

---

## Tenant isolation is enforced by Row Level Security (M1)

Every table has RLS enabled, with policies comparing `owner_id` to
`auth.uid()`. The app also filters by owner, but that is a convenience, not
the protection: Supabase exposes the database through a public API, so a
check that lives only in application code can be skipped by calling the API
directly. Cross-owner access was tested with two real accounts — read,
update, delete and insert-as-someone-else all fail at the database.

## The session gate is cached per request (M1)

Next.js renders a layout and its page concurrently. Before this was fixed,
a new user's dashboard queried their wardrobe before the layout had finished
creating it, and showed it as missing. `requireUser()` — which checks the
session and creates the profile and default wardrobe on first login — is
wrapped in React's `cache()`, so the layout and the page share one run of it
and the page can safely await it before querying.

## Enum fields store codes, not labels (M2)

Category, color, season, formality and occasion are stored as
language-neutral codes (`smart_casual`) and translated when rendered, so one
wardrobe reads correctly in English and Hebrew. The canonical lists are
TypeScript constants validated with Zod rather than database CHECK
constraints: adding an option is then a code change plus a translation, not a
migration. A unit test fails if any code lacks a label.

## Photos are private, signed in batches (M2)

Wardrobe photos are personal, so the bucket is private and images are
served through signed URLs that expire after an hour. A wardrobe page signs
all its images in a single request instead of one per card. The storage path
starts with the owner's id, which is what the storage policies check.

## Deleted accounts' photos are cleaned up through the Storage API

Deleting a user cascades through their database rows, but not their files.
`pnpm sweep:storage` finds photo folders whose owner no longer exists and
deletes them through the Storage API — deleting rows from `storage.objects`
with SQL would only remove the index entry and leave the file behind.

## A finished request is read-only, enforced three times (M3)

The UI hides the Edit action, the server action refuses the update with a
readable message, and a database trigger rejects any update to a request
that is finished and staying finished. The trigger is the real guarantee;
the other two exist so a user never sees a raw database error. Reopening
(finished → open) is allowed, so mistakes can be corrected. `status` is the
one enum with a CHECK constraint, because the trigger depends on its values.

## Event times are wall-clock times (M3)

`event_at` is a `timestamp`, not a `timestamptz`. "The wedding starts at
19:30" is a fact about the venue's clock, not an instant, and it should read
19:30 for every guest wherever they are. The catch is that a timestamp
without an offset gets interpreted in whatever time zone the code runs in,
so the server and the browser could render different times.
`src/lib/requests/eventDate.ts` pins both parsing and formatting to UTC, and
a unit test renders the same value under several runtime zones and requires
identical output.

## Failed form submissions keep what the user typed

React 19 resets a form after its action completes, even when the action
returns validation errors. Every server action returns the submitted values,
and the form uses them as default values, so a failed submit doesn't wipe
the user's input. Passwords are never echoed back.

## Migrations are plain SQL files, applicable without the CLI

Schema changes live in `supabase/migrations/` and work with
`supabase db push`. Each one is also written to apply cleanly in the
Supabase dashboard's SQL editor, for networks that block the Postgres port.

## pnpm is the only package manager

`pnpm-lock.yaml` records package hashes but not download URLs, so it doesn't
reveal which registry the developer's machine uses. Other lockfiles do. CI
fails if a second lockfile or an `.npmrc` is committed.
