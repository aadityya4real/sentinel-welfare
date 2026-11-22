-- SENTINEL single-user profile and social analysis foundation.
-- This extends the existing PreScribe profiles table without editing its migrations.

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists display_name text;

-- Existing PreScribe profile fields remain available; only the legacy role is
-- optional so SENTINEL users do not need a patient/doctor classification.
alter table public.profiles alter column role drop not null;

update public.profiles
set display_name = coalesce(nullif(trim(display_name), ''), nullif(trim(full_name), ''))
where display_name is null or trim(display_name) = '';

create or replace function public.handle_sentinel_user_signup()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name, display_name)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  )
  on conflict (id) do update
    set email = coalesce(excluded.email, public.profiles.email),
        display_name = coalesce(public.profiles.display_name, excluded.display_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_sentinel_profile on auth.users;
create trigger on_auth_user_created_sentinel_profile
  after insert on auth.users
  for each row execute function public.handle_sentinel_user_signup();

create or replace function public.set_sentinel_profile_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists sentinel_profiles_set_updated_at on public.profiles;
create trigger sentinel_profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_sentinel_profile_updated_at();

alter table public.profiles enable row level security;
drop policy if exists "SENTINEL users read own profile" on public.profiles;
create policy "SENTINEL users read own profile"
  on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "SENTINEL users update own profile" on public.profiles;
create policy "SENTINEL users update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists "SENTINEL users create own profile" on public.profiles;
create policy "SENTINEL users create own profile"
  on public.profiles for insert to authenticated with check (id = auth.uid());

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_version text not null check (char_length(trim(consent_version)) > 0),
  accepted boolean not null,
  accepted_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  check (withdrawn_at is null or withdrawn_at >= accepted_at)
);

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text,
  content_text text,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  check (content_text is not null or image_path is not null)
);

create table if not exists public.post_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  sentiment jsonb,
  emotions jsonb,
  behavioral_signals jsonb,
  combined_summary text,
  model_provider text,
  model_name text,
  model_version text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint post_analyses_owned_post_fk foreign key (post_id, user_id)
    references public.social_posts(id, user_id) on delete cascade
);

create index if not exists user_consents_user_created_idx
  on public.user_consents (user_id, accepted_at desc);
create index if not exists social_posts_user_created_idx
  on public.social_posts (user_id, created_at desc);
create index if not exists post_analyses_user_created_idx
  on public.post_analyses (user_id, created_at desc);
create index if not exists post_analyses_post_created_idx
  on public.post_analyses (post_id, created_at desc);
create index if not exists post_analyses_status_created_idx
  on public.post_analyses (status, created_at desc);

create or replace function public.set_social_posts_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists social_posts_set_updated_at on public.social_posts;
create trigger social_posts_set_updated_at before update on public.social_posts
  for each row execute function public.set_social_posts_updated_at();

alter table public.user_consents enable row level security;
alter table public.social_posts enable row level security;
alter table public.post_analyses enable row level security;

create policy "SENTINEL users manage own consents"
  on public.user_consents for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "SENTINEL users read own social posts"
  on public.social_posts for select to authenticated using (user_id = auth.uid());
create policy "SENTINEL users create own social posts"
  on public.social_posts for insert to authenticated with check (user_id = auth.uid());
create policy "SENTINEL users update own social posts"
  on public.social_posts for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "SENTINEL users delete own social posts"
  on public.social_posts for delete to authenticated using (user_id = auth.uid());

-- Analysis rows are deliberately read-only to clients. A trusted Edge Function
-- can be added in a later phase to create/update model-generated results.
create policy "SENTINEL users read own post analyses"
  on public.post_analyses for select to authenticated using (user_id = auth.uid());
