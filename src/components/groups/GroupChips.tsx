export function GroupChips({ groups }: { groups: { id: string; name: string }[] }) {
  if (groups.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1">
      {groups.map((g) => (
        <li
          key={g.id}
          className="rounded-full border border-zinc-300 px-2 py-0.5 text-xs text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
        >
          {g.name}
        </li>
      ))}
    </ul>
  );
}
