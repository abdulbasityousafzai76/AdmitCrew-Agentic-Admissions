-- Called by the authenticated Edge Function. Creates drafts only.
create or replace function public.create_reminder_drafts()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  student record;
  draft_id uuid;
  created_count integer := 0;
begin
  for student in
    select l.id, l.full_name, l.normalized_phone, l.last_reply_at
    from public.leads as l
    where l.last_reply_at < now() - interval '3 days'
      and l.status <> 'closed'
      and l.is_test = true
      and l.normalized_phone is not null
      and not exists (
        select 1 from public.outbound_messages as previous
        where previous.lead_id = l.id
          and previous.kind = 'reminder'
          and previous.created_at >= l.last_reply_at
      )
    for update of l skip locked
  loop
    draft_id := null;
    insert into public.outbound_messages
      (lead_id, kind, channel, recipient, body, dedupe_key, based_on_last_reply_at)
    values
      (student.id, 'reminder', 'test_chat', student.normalized_phone,
       'Hello ' || coalesce(student.full_name, 'student') ||
       ', just checking in about your study abroad plans. Let us know if you would like help with the next step.',
       'reminder:' || student.id::text || ':' || floor(extract(epoch from student.last_reply_at))::bigint::text,
       student.last_reply_at)
    on conflict do nothing
    returning id into draft_id;

    if draft_id is not null then
      insert into public.audit_log (actor_type, action, entity_type, entity_id, metadata)
      values ('agent', 'draft_created', 'outbound_message', draft_id, '{"kind":"reminder","source":"n8n"}'::jsonb);
      created_count := created_count + 1;
    end if;
  end loop;
  return created_count;
end;
$$;

revoke execute on function public.create_reminder_drafts() from public, anon, authenticated;
grant execute on function public.create_reminder_drafts() to service_role;
