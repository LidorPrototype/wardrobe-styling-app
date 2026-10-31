-- Milestone 6b — the owner's head photo, shown above every outfit.
-- Replaces the planned full-body backdrop; the column was never used.
-- Stored privately at {owner_id}/profile/head.<ext>, which the existing
-- wardrobe-items storage policies already scope to the owner.

alter table public.profiles rename column background_photo_path to head_photo_path;
