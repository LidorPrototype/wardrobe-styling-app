-- Milestone 10a — "Mark worn" uses the owner's local date when the request
-- has no event date. Adds p_today to record_outfit_decision; the old
-- two-argument version is dropped so calls aren't ambiguous.

drop function public.record_outfit_decision(uuid, text);

create or replace function public.record_outfit_decision(
  p_suggestion_id uuid,
  p_status text,
  -- The owner's local date; the server's "today" is UTC.
  p_today date default current_date
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  s record;
  new_entry uuid;
begin
  update public.outfit_suggestions
     set status = p_status
   where id = p_suggestion_id
  returning request_id, title into s;

  if not found then
    raise exception 'suggestion not found' using errcode = 'no_data_found';
  end if;

  if p_status not in ('chosen', 'worn', 'favorite') then
    return null;
  end if;

  insert into public.outfit_library_entries (owner_id, source_suggestion_id, title, status, worn_on)
  select r.owner_id, p_suggestion_id, s.title, p_status,
         -- A worn outfit defaults to the event's date, else the owner's today.
         case when p_status = 'worn' then coalesce(r.event_at::date, p_today) end
    from public.styling_requests r
   where r.id = s.request_id
  returning id into new_entry;

  insert into public.outfit_library_items (entry_id, clothing_item_id, item_name, item_category, slot, sort_order)
  select new_entry, ci.id, ci.name, ci.category, osi.slot, osi.sort_order
    from public.outfit_suggestion_items osi
    join public.clothing_items ci on ci.id = osi.clothing_item_id
   where osi.suggestion_id = p_suggestion_id;

  return new_entry;
end;
$$;

revoke execute on function public.record_outfit_decision(uuid, text, date) from public, anon;
grant execute on function public.record_outfit_decision(uuid, text, date) to authenticated;
