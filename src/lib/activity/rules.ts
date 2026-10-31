import * as z from "zod";

// Who wrote a suggestion, a comment, or a like. The owner's name is the
// guest-safe display name (never an email), or null when unset.
export type Author =
  | { kind: "guest"; guestIdentityId: string; nickname: string }
  | { kind: "owner"; name: string | null };

// Who is looking at the page.
export type Viewer = { kind: "guest"; guestIdentityId: string } | { kind: "owner" };

export function isMine(viewer: Viewer, author: Author): boolean {
  if (viewer.kind === "owner") return author.kind === "owner";
  return author.kind === "guest" && author.guestIdentityId === viewer.guestIdentityId;
}

// The owner can remove anything said on their request; everyone else only their own.
export function canDeleteComment(viewer: Viewer, author: Author): boolean {
  return viewer.kind === "owner" || isMine(viewer, author);
}

export const COMMENT_MAX = 1000;

// Must match the body CHECK constraint on comments.
export const CommentSchema = z.object({
  body: z.string().trim().min(1, "emptyComment").max(COMMENT_MAX, "tooLong"),
});

export const SORT_ORDERS = ["newest", "liked"] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export function parseSort(value: string | string[] | undefined): SortOrder {
  return value === "liked" ? "liked" : "newest";
}

// Most liked first; ties (and the default order) go newest first.
export function sortSuggestions<T extends { createdAt: string; likes: unknown[] }>(
  suggestions: T[],
  order: SortOrder,
): T[] {
  const newest = (a: T, b: T) => b.createdAt.localeCompare(a.createdAt);
  return [...suggestions].sort(
    order === "liked" ? (a, b) => b.likes.length - a.likes.length || newest(a, b) : newest,
  );
}
