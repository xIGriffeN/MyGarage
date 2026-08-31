-- JIGGY 1.7 Public Profile backend
-- In Supabase: SQL Editor -> New query -> kompletten Inhalt ausführen.

create extension if not exists pgcrypto;

create table if not exists public.vehicle_profiles (
  slug text primary key,
  owner_secret_hash text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.vehicle_profiles enable row level security;

drop policy if exists "Public profiles are readable" on public.vehicle_profiles;
create policy "Public profiles are readable"
on public.vehicle_profiles for select
to anon, authenticated
using (true);

create or replace function public.publish_vehicle_profile(
  p_slug text,
  p_secret text,
  p_payload jsonb
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_hash text;
  incoming_hash text;
begin
  if p_slug is null or p_slug !~ '^[a-z0-9-]{6,64}$' then
    raise exception 'Invalid profile slug';
  end if;
  if p_secret is null or length(p_secret) < 24 then
    raise exception 'Invalid owner secret';
  end if;
  if octet_length(p_payload::text) > 1500000 then
    raise exception 'Profile payload is too large';
  end if;

  incoming_hash := encode(digest(p_secret, 'sha256'), 'hex');
  select owner_secret_hash into existing_hash
  from public.vehicle_profiles where slug = p_slug;

  if existing_hash is not null and existing_hash <> incoming_hash then
    raise exception 'Profile ownership check failed';
  end if;

  insert into public.vehicle_profiles(slug, owner_secret_hash, payload, updated_at)
  values(p_slug, incoming_hash, p_payload, now())
  on conflict(slug) do update
    set payload = excluded.payload,
        updated_at = now();

  return p_slug;
end;
$$;

create or replace function public.delete_vehicle_profile(
  p_slug text,
  p_secret text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  incoming_hash text;
begin
  incoming_hash := encode(digest(p_secret, 'sha256'), 'hex');
  delete from public.vehicle_profiles
  where slug = p_slug and owner_secret_hash = incoming_hash;
  return found;
end;
$$;

revoke all on function public.publish_vehicle_profile(text,text,jsonb) from public;
revoke all on function public.delete_vehicle_profile(text,text) from public;
grant execute on function public.publish_vehicle_profile(text,text,jsonb) to anon, authenticated;
grant execute on function public.delete_vehicle_profile(text,text) to anon, authenticated;

grant select on public.vehicle_profiles to anon, authenticated;
