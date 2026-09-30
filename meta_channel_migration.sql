-- Facebook contacts do not reveal a phone number. Preserve phone uniqueness for known phones.
alter table public.leads alter column phone drop not null;
alter table public.leads alter column normalized_phone drop not null;

create table if not exists public.channel_contacts (
  channel text not null check (channel in ('facebook','whatsapp')),
  external_id text not null,
  lead_id uuid not null references public.leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (channel, external_id)
);
create index if not exists channel_contacts_lead_idx on public.channel_contacts(lead_id);
alter table public.channel_contacts enable row level security;
revoke all on public.channel_contacts from anon, authenticated;
