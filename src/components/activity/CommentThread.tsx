import { getFormatter, getTranslations } from "next-intl/server";
import type { CommentView } from "@/lib/suggestions/data";
import { canDeleteComment, isMine, type Author, type Viewer } from "@/lib/activity/rules";
import {
  addGuestComment,
  addOwnerComment,
  deleteGuestComment,
  deleteOwnerComment,
  editGuestComment,
  editOwnerComment,
} from "@/lib/actions/activity";
import { CommentForm } from "@/components/activity/CommentForm";
import { CommentItem } from "@/components/activity/CommentItem";

export async function authorLabel(author: Author): Promise<string> {
  const t = await getTranslations("activity");
  if (author.kind === "guest") return author.nickname;
  return author.name ? t("ownerNamed", { name: author.name }) : t("owner");
}

export async function CommentThread({
  comments,
  viewer,
  locale,
  requestId,
  suggestionId,
  finished,
}: {
  comments: CommentView[];
  viewer: Viewer;
  locale: string;
  requestId: string;
  // null: the conversation about the request as a whole.
  suggestionId: string | null;
  finished: boolean;
}) {
  const t = await getTranslations("activity");
  const format = await getFormatter();
  const now = new Date();
  const asGuest = viewer.kind === "guest";

  const items = await Promise.all(
    comments.map(async (c) => ({
      comment: c,
      author: await authorLabel(c.author),
      meta: [format.relativeTime(new Date(c.createdAt), now), c.edited ? t("edited") : null]
        .filter(Boolean)
        .join(" · "),
    })),
  );

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">{t("noComments")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map(({ comment: c, author, meta }) => (
            <CommentItem
              key={c.id}
              author={author}
              meta={meta}
              body={c.body}
              editAction={
                !finished && isMine(viewer, c.author)
                  ? (asGuest ? editGuestComment : editOwnerComment).bind(null, locale, requestId, c.id)
                  : null
              }
              deleteAction={
                !finished && canDeleteComment(viewer, c.author)
                  ? (asGuest ? deleteGuestComment : deleteOwnerComment).bind(null, locale, requestId, c.id)
                  : null
              }
            />
          ))}
        </ul>
      )}
      {!finished && (
        <CommentForm
          action={(asGuest ? addGuestComment : addOwnerComment).bind(null, locale, requestId, suggestionId)}
        />
      )}
    </div>
  );
}
