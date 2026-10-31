import { describe, expect, it } from "vitest";
import {
  canDeleteComment,
  COMMENT_MAX,
  CommentSchema,
  isMine,
  sortSuggestions,
  type Author,
  type Viewer,
} from "@/lib/activity/rules";

const alice: Author = { kind: "guest", guestIdentityId: "a", nickname: "Alice" };
const bob: Author = { kind: "guest", guestIdentityId: "b", nickname: "Bob" };
const owner: Author = { kind: "owner", name: "Dana" };

const asAlice: Viewer = { kind: "guest", guestIdentityId: "a" };
const asOwner: Viewer = { kind: "owner" };

describe("comment permissions", () => {
  it("lets a guest edit and delete only their own comments", () => {
    expect([isMine(asAlice, alice), canDeleteComment(asAlice, alice)]).toEqual([true, true]);
    expect([isMine(asAlice, bob), canDeleteComment(asAlice, bob)]).toEqual([false, false]);
    expect([isMine(asAlice, owner), canDeleteComment(asAlice, owner)]).toEqual([false, false]);
  });

  it("lets the owner delete any comment but edit only their own", () => {
    expect([isMine(asOwner, alice), canDeleteComment(asOwner, alice)]).toEqual([false, true]);
    expect([isMine(asOwner, owner), canDeleteComment(asOwner, owner)]).toEqual([true, true]);
  });
});

describe("comment body", () => {
  it("trims, and rejects blank or over-long text", () => {
    expect(CommentSchema.parse({ body: "  nice  " }).body).toBe("nice");
    expect(CommentSchema.safeParse({ body: "   " }).error?.issues[0].message).toBe("emptyComment");
    expect(CommentSchema.safeParse({ body: "x".repeat(COMMENT_MAX + 1) }).error?.issues[0].message).toBe("tooLong");
  });
});

describe("sortSuggestions", () => {
  const s = (id: string, createdAt: string, likes: number) => ({ id, createdAt, likes: Array(likes).fill(alice) });
  const list = [s("old-popular", "2026-10-01", 2), s("new", "2026-10-03", 0), s("mid-popular", "2026-10-02", 2)];

  it("puts newest first by default, and most liked first (newest on ties) when asked", () => {
    expect(sortSuggestions(list, "newest").map((x) => x.id)).toEqual(["new", "mid-popular", "old-popular"]);
    expect(sortSuggestions(list, "liked").map((x) => x.id)).toEqual(["mid-popular", "old-popular", "new"]);
  });
});
