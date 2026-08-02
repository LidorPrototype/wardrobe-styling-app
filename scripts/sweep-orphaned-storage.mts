/**
 * Removes wardrobe-items storage left behind by deleted owner accounts.
 *
 * Deleting a Supabase auth user cascades the database rows (profiles →
 * wardrobes → clothing_items → clothing_item_tags) but never touches storage,
 * so an owner's images survive their account. This reconciles the bucket
 * against `profiles` and deletes anything with no live owner.
 *
 * Runs through the Storage API — deleting `storage.objects` rows with SQL would
 * leave the real files behind in the storage backend.
 *
 *   pnpm sweep:storage            # dry run, lists what would be deleted
 *   pnpm sweep:storage --apply    # actually delete
 */
import { createClient } from "@supabase/supabase-js";
import {
  deleteOwnerStorage,
  findOrphanedOwnerIds,
  listObjectsUnder,
} from "../src/lib/storage/ownerStorage.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!url || !secret) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.\n" +
      "Run via: pnpm sweep:storage",
  );
  process.exit(1);
}

const apply = process.argv.includes("--apply");

// Secret key: bypasses RLS so it can see every owner's objects. Local CLI only.
const supabase = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const orphans = await findOrphanedOwnerIds(supabase);

if (orphans.length === 0) {
  console.log("No orphaned owner folders. Bucket is consistent with profiles.");
  process.exit(0);
}

console.log(
  `Found ${orphans.length} orphaned owner folder(s)${apply ? "" : " (dry run)"}:\n`,
);

let totalObjects = 0;
for (const ownerId of orphans) {
  const paths = await listObjectsUnder(supabase, ownerId);
  totalObjects += paths.length;
  console.log(`  ${ownerId} — ${paths.length} object(s)`);
  for (const p of paths) console.log(`      ${p}`);

  if (apply) {
    const { deleted, error } = await deleteOwnerStorage(supabase, ownerId);
    if (error) {
      console.error(`      FAILED: ${error}`);
      process.exitCode = 1;
    } else {
      console.log(`      deleted ${deleted.length} object(s)`);
    }
  }
}

console.log(
  apply
    ? `\nDone. Removed storage for ${orphans.length} deleted owner(s).`
    : `\nDry run only — ${totalObjects} object(s) would be deleted. Re-run with --apply to delete.`,
);
