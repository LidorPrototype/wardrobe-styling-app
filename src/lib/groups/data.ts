import "server-only";

import { createClient } from "@/lib/supabase/server";

// Owner-only, through RLS: another owner's groups simply aren't returned.

export type GroupView = { id: string; name: string; description: string | null; entryCount: number };

type GroupRow = { id: string; name: string; description: string | null; outfit_group_memberships: { count: number }[] };

const GROUP_SELECT = "id, name, description, outfit_group_memberships(count)";

function toView(g: GroupRow): GroupView {
  return { id: g.id, name: g.name, description: g.description, entryCount: g.outfit_group_memberships[0]?.count ?? 0 };
}

export async function listGroups(): Promise<GroupView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outfit_groups")
    .select(GROUP_SELECT)
    .order("name_key")
    .returns<GroupRow[]>();
  if (error) throw new Error(`group lookup failed: ${error.message}`);
  return data.map(toView);
}

export async function getGroup(groupId: string): Promise<GroupView | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outfit_groups")
    .select(GROUP_SELECT)
    .eq("id", groupId)
    .returns<GroupRow[]>()
    .maybeSingle();
  if (error) throw new Error(`group lookup failed: ${error.message}`);
  return data ? toView(data) : null;
}
