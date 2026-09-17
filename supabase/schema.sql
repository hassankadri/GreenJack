-- ============================================================
-- DIGITAL HEROES
-- DATABASE SCHEMA
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================

do $$
begin
  create type public.app_role as enum ('user', 'admin');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.subscription_interval as enum ('monthly', 'yearly');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.subscription_status as enum (
    'incomplete',
    'incomplete_expired',
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.payment_status as enum (
    'pending',
    'paid',
    'failed',
    'refunded'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.draw_mode as enum ('random', 'algorithmic');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.draw_status as enum ('draft', 'published');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.verification_status as enum (
    'pending',
    'approved',
    'rejected'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.payout_status as enum (
    'pending',
    'paid'
  );
exception
  when duplicate_object then null;
end
$$;

-- ============================================================
-- 2. PROFILES
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role public.app_role not null default 'user',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx
  on public.profiles(role);

create index if not exists profiles_active_idx
  on public.profiles(is_active);

-- ============================================================
-- 3. CHARITIES
-- ============================================================

create table if not exists public.charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null,
  image_url text,
  website_url text,
  featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists charities_active_idx
  on public.charities(is_active);

create index if not exists charities_featured_idx
  on public.charities(featured);

-- ============================================================
-- 4. SUBSCRIPTION PLANS
-- ============================================================

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  interval public.subscription_interval not null unique,
  price_amount integer not null check (price_amount > 0),
  currency text not null default 'INR',
  stripe_price_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 5. SUBSCRIPTIONS
-- ============================================================

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid references public.subscription_plans(id) on delete set null,

  stripe_customer_id text,
  stripe_subscription_id text unique,

  status public.subscription_status not null default 'incomplete',

  current_period_start timestamptz,
  current_period_end timestamptz,

  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_idx
  on public.subscriptions(user_id);

create index if not exists subscriptions_status_idx
  on public.subscriptions(status);

create unique index if not exists subscriptions_active_user_idx
  on public.subscriptions(user_id)
  where status in ('active', 'trialing');

-- ============================================================
-- 6. CHARITY PREFERENCES
-- ============================================================

create table if not exists public.charity_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  charity_id uuid not null references public.charities(id) on delete restrict,

  contribution_percent numeric(5,2) not null default 10.00
    check (
      contribution_percent >= 10.00
      and contribution_percent <= 100.00
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists charity_preferences_charity_idx
  on public.charity_preferences(charity_id);

-- ============================================================
-- 7. GOLF SCORES
-- ============================================================

create table if not exists public.golf_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,

  score smallint not null
    check (score between 1 and 45),

  played_on date not null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint golf_scores_one_per_date
    unique (user_id, played_on)
);

create index if not exists golf_scores_user_idx
  on public.golf_scores(user_id);

create index if not exists golf_scores_user_date_idx
  on public.golf_scores(user_id, played_on desc);

-- ============================================================
-- 8. SUBSCRIPTION PAYMENTS
-- ============================================================

create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,

  stripe_invoice_id text unique,

  amount integer not null check (amount >= 0),
  currency text not null default 'INR',

  status public.payment_status not null default 'pending',

  paid_at timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists subscription_payments_user_idx
  on public.subscription_payments(user_id);

create index if not exists subscription_payments_status_idx
  on public.subscription_payments(status);

-- ============================================================
-- 9. CHARITY CONTRIBUTIONS
-- ============================================================

create table if not exists public.charity_contributions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references public.profiles(id) on delete cascade,
  charity_id uuid not null references public.charities(id) on delete restrict,
  subscription_payment_id uuid
    references public.subscription_payments(id)
    on delete set null,

  subscription_amount integer not null
    check (subscription_amount >= 0),

  contribution_percent numeric(5,2) not null
    check (
      contribution_percent >= 10.00
      and contribution_percent <= 100.00
    ),

  contribution_amount integer not null
    check (contribution_amount >= 0),

  period_start timestamptz,
  period_end timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists charity_contributions_user_idx
  on public.charity_contributions(user_id);

create index if not exists charity_contributions_charity_idx
  on public.charity_contributions(charity_id);

-- ============================================================
-- 10. INDEPENDENT CHARITY DONATIONS
-- ============================================================

create table if not exists public.charity_donations (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references public.profiles(id) on delete cascade,
  charity_id uuid not null references public.charities(id) on delete restrict,

  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text unique,

  amount integer not null check (amount > 0),
  currency text not null default 'INR',
  status public.payment_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists charity_donations_user_idx
  on public.charity_donations(user_id);

create index if not exists charity_donations_charity_idx
  on public.charity_donations(charity_id);

-- ============================================================
-- 11. PLATFORM SETTINGS
-- ============================================================

create table if not exists public.platform_settings (
  id boolean primary key default true,

  prize_pool_percent numeric(5,2) not null default 30.00
    check (
      prize_pool_percent > 0
      and prize_pool_percent <= 100
    ),

  minimum_charity_percent numeric(5,2) not null default 10.00
    check (
      minimum_charity_percent >= 10.00
      and minimum_charity_percent <= 100.00
    ),

  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id)
values (true)
on conflict (id) do nothing;

-- ============================================================
-- 11. DRAW TIER RULES
-- ============================================================

create table if not exists public.draw_tier_rules (
  match_count smallint primary key
    check (match_count in (3, 4, 5)),

  pool_share_percent numeric(5,2) not null
    check (
      pool_share_percent > 0
      and pool_share_percent <= 100
    ),

  jackpot_rollover boolean not null default false
);

insert into public.draw_tier_rules (
  match_count,
  pool_share_percent,
  jackpot_rollover
)
values
  (5, 40.00, true),
  (4, 35.00, false),
  (3, 25.00, false)
on conflict (match_count) do nothing;

-- ============================================================
-- 12. TICKET VALIDATION FUNCTION
-- ============================================================

create or replace function public.is_valid_ticket(numbers integer[])
returns boolean
language sql
immutable
as $$
  select
    numbers is not null
    and cardinality(numbers) = 5
    and (
      select count(*)
      from unnest(numbers) as number
      where number between 1 and 45
    ) = 5
    and (
      select count(distinct number)
      from unnest(numbers) as number
    ) = 5;
$$;

-- ============================================================
-- 13. DRAWS
-- ============================================================

create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),

  draw_month date not null unique,

  mode public.draw_mode not null,

  status public.draw_status not null default 'draft',

  winning_numbers integer[],

  active_subscriber_count integer not null default 0,

  prize_pool_amount integer not null default 0,

  jackpot_carried_in integer not null default 0,

  jackpot_carried_out integer not null default 0,

  created_by uuid references public.profiles(id) on delete set null,

  created_at timestamptz not null default now(),

  published_at timestamptz,

  constraint valid_draw_numbers
    check (
      winning_numbers is null
      or public.is_valid_ticket(winning_numbers)
    ),

  constraint valid_draw_month
    check (
      draw_month = date_trunc('month', draw_month)::date
    )
);

create index if not exists draws_status_idx
  on public.draws(status);

create index if not exists draws_month_idx
  on public.draws(draw_month desc);

-- ============================================================
-- 14. DRAW ENTRIES
-- ============================================================

create table if not exists public.draw_entries (
  id uuid primary key default gen_random_uuid(),

  draw_id uuid not null references public.draws(id) on delete cascade,

  user_id uuid not null references public.profiles(id) on delete cascade,

  ticket_numbers integer[] not null,

  created_at timestamptz not null default now(),

  constraint draw_entries_one_per_user
    unique (draw_id, user_id),

  constraint draw_entries_valid_ticket
    check (public.is_valid_ticket(ticket_numbers))
);

create index if not exists draw_entries_draw_idx
  on public.draw_entries(draw_id);

create index if not exists draw_entries_user_idx
  on public.draw_entries(user_id);

-- ============================================================
-- 15. WINNERS
-- ============================================================

create table if not exists public.winners (
  id uuid primary key default gen_random_uuid(),

  draw_id uuid not null references public.draws(id) on delete cascade,

  user_id uuid not null references public.profiles(id) on delete cascade,

  match_count smallint not null
    check (match_count in (3, 4, 5)),

  matched_numbers integer[] not null default '{}',

  prize_amount integer not null default 0
    check (prize_amount >= 0),

  verification public.verification_status
    not null default 'pending',

  proof_path text,

  proof_uploaded_at timestamptz,

  payout public.payout_status
    not null default 'pending',

  reviewed_by uuid references public.profiles(id) on delete set null,

  reviewed_at timestamptz,

  review_notes text,

  payout_completed_at timestamptz,

  created_at timestamptz not null default now(),

  constraint winners_one_tier_per_user
    unique (draw_id, user_id, match_count)
);

create index if not exists winners_draw_idx
  on public.winners(draw_id);

create index if not exists winners_user_idx
  on public.winners(user_id);

create index if not exists winners_verification_idx
  on public.winners(verification);

create index if not exists winners_payout_idx
  on public.winners(payout);

-- ============================================================
-- 16. UPDATED_AT FUNCTION
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 17. UPDATED_AT TRIGGERS
-- ============================================================

drop trigger if exists profiles_updated_at on public.profiles;

create trigger profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists charities_updated_at on public.charities;

create trigger charities_updated_at
before update on public.charities
for each row
execute function public.set_updated_at();

drop trigger if exists subscription_plans_updated_at
on public.subscription_plans;

create trigger subscription_plans_updated_at
before update on public.subscription_plans
for each row
execute function public.set_updated_at();

drop trigger if exists subscriptions_updated_at
on public.subscriptions;

create trigger subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();

drop trigger if exists charity_preferences_updated_at
on public.charity_preferences;

create trigger charity_preferences_updated_at
before update on public.charity_preferences
for each row
execute function public.set_updated_at();

drop trigger if exists golf_scores_updated_at
on public.golf_scores;

create trigger golf_scores_updated_at
before update on public.golf_scores
for each row
execute function public.set_updated_at();

create or replace function public.validate_golf_score()
returns trigger
language plpgsql
as $$
begin
  if new.played_on > current_date then
    raise exception 'Score date cannot be in the future.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_golf_score
on public.golf_scores;

create trigger validate_golf_score
before insert or update on public.golf_scores
for each row
execute function public.validate_golf_score();

drop trigger if exists platform_settings_updated_at
on public.platform_settings;

create trigger platform_settings_updated_at
before update on public.platform_settings
for each row
execute function public.set_updated_at();

-- ============================================================
-- 18. AUTO-CREATE PROFILE AFTER SIGNUP
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ============================================================
-- 19. ADMIN CHECK FUNCTION
-- ============================================================

create or replace function public.is_admin(user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_uuid
      and role = 'admin'
      and is_active = true
  );
$$;

-- ============================================================
-- 20. ATOMIC DRAW PUBLICATION
-- ============================================================

create or replace function public.publish_draw(p_draw_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  draw_record public.draws%rowtype;
  entry_record public.draw_entries%rowtype;
  target_match_count smallint;
  match_count smallint;
  tier_winner_count integer;
  tier_share numeric;
  tier_rollover boolean;
  tier_pool integer;
  prize_per_winner integer;
  undistributed_units integer;
  winner_index integer;
  jackpot_rollover integer := 0;
  matched_numbers integer[];
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only administrators can publish draws.';
  end if;

  select *
  into draw_record
  from public.draws
  where id = p_draw_id
  for update;

  if not found then
    raise exception 'Draw not found.';
  end if;

  -- A published draw is already complete. This makes retries safe.
  if draw_record.status = 'published' then
    return;
  end if;

  if not public.is_valid_ticket(draw_record.winning_numbers) then
    raise exception 'Draw must have five valid winning numbers before publishing.';
  end if;

  -- Any prior draft winners are stale and are replaced atomically below.
  delete from public.winners where draw_id = draw_record.id;

  for target_match_count in 3..5 loop
    select pool_share_percent, jackpot_rollover
    into tier_share, tier_rollover
    from public.draw_tier_rules
    where draw_tier_rules.match_count = target_match_count;

    if not found then
      raise exception 'Prize tier rule for % matches is missing.', target_match_count;
    end if;

    select count(*)
    into tier_winner_count
    from public.draw_entries
    where draw_id = draw_record.id
      and (
        select count(*)
        from unnest(ticket_numbers) as ticket_number
        where ticket_number = any(draw_record.winning_numbers)
      ) = target_match_count;

    if tier_winner_count = 0 then
      if target_match_count = 5 and tier_rollover then
        jackpot_rollover :=
          coalesce(draw_record.jackpot_carried_in, 0)
          + round(draw_record.prize_pool_amount * tier_share / 100)::integer;
      end if;
      continue;
    end if;

    tier_pool := round(draw_record.prize_pool_amount * tier_share / 100)::integer;
    if target_match_count = 5 then
      tier_pool := tier_pool + coalesce(draw_record.jackpot_carried_in, 0);
    end if;

    prize_per_winner := floor(tier_pool::numeric / tier_winner_count)::integer;
    undistributed_units := mod(tier_pool, tier_winner_count);
    winner_index := 0;

    for entry_record in
      select * from public.draw_entries where draw_id = draw_record.id
    loop
      select count(*)
      into match_count
      from unnest(entry_record.ticket_numbers) as ticket_number
      where ticket_number = any(draw_record.winning_numbers);

      if match_count = target_match_count then
        matched_numbers := array(
          select ticket_number
          from unnest(draw_record.winning_numbers) as ticket_number
          where ticket_number = any(entry_record.ticket_numbers)
        );

        insert into public.winners (
          draw_id, user_id, match_count, matched_numbers, prize_amount
        ) values (
          draw_record.id,
          entry_record.user_id,
          match_count,
          matched_numbers,
          prize_per_winner + case when winner_index < undistributed_units then 1 else 0 end
        );

        winner_index := winner_index + 1;
      end if;
    end loop;
  end loop;

  update public.draws
  set status = 'published',
      jackpot_carried_out = jackpot_rollover,
      published_at = now()
  where id = draw_record.id;
end;
$$;

revoke all on function public.publish_draw(uuid) from public;
grant execute on function public.publish_draw(uuid) to authenticated;

-- ============================================================
-- 21. ACTIVE SUBSCRIBER CHECK FUNCTION
-- ============================================================

create or replace function public.is_active_subscriber(user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions
    where user_id = user_uuid
      and status in ('active', 'trialing')
      and (
        current_period_end is null
        or current_period_end > now()
      )
  );
$$;

-- ============================================================
-- 21. KEEP ONLY LATEST FIVE SCORES
-- ============================================================

create or replace function public.keep_latest_five_scores()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.golf_scores
  where id in (
    select id
    from public.golf_scores
    where user_id = new.user_id
    order by played_on desc, created_at desc
    offset 5
  );

  return new;
end;
$$;

drop trigger if exists keep_latest_five_scores
on public.golf_scores;

create trigger keep_latest_five_scores
after insert on public.golf_scores
for each row
execute function public.keep_latest_five_scores();

-- ============================================================
-- 22. ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.charities enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.charity_preferences enable row level security;
alter table public.golf_scores enable row level security;
alter table public.subscription_payments enable row level security;
alter table public.charity_contributions enable row level security;
alter table public.charity_donations enable row level security;
alter table public.platform_settings enable row level security;
alter table public.draw_tier_rules enable row level security;
alter table public.draws enable row level security;
alter table public.draw_entries enable row level security;
alter table public.winners enable row level security;

-- ============================================================
-- 23. PROFILES POLICIES
-- ============================================================

drop policy if exists "profiles_select_own"
on public.profiles;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists "profiles_update_own"
on public.profiles;

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.is_admin(auth.uid())
)
with check (
  id = auth.uid()
  or public.is_admin(auth.uid())
);

-- ============================================================
-- 24. CHARITY POLICIES
-- ============================================================

drop policy if exists "charities_public_read"
on public.charities;

create policy "charities_public_read"
on public.charities
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "charities_admin_manage"
on public.charities;

create policy "charities_admin_manage"
on public.charities
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- ============================================================
-- 25. PLAN POLICIES
-- ============================================================

drop policy if exists "subscription_plans_public_read"
on public.subscription_plans;

create policy "subscription_plans_public_read"
on public.subscription_plans
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "subscription_plans_admin_manage"
on public.subscription_plans;

create policy "subscription_plans_admin_manage"
on public.subscription_plans
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- ============================================================
-- 26. SUBSCRIPTION POLICIES
-- ============================================================

drop policy if exists "subscriptions_select_own"
on public.subscriptions;

create policy "subscriptions_select_own"
on public.subscriptions
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists "subscriptions_admin_manage"
on public.subscriptions;

create policy "subscriptions_admin_manage"
on public.subscriptions
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- ============================================================
-- 27. CHARITY PREFERENCE POLICIES
-- ============================================================

drop policy if exists "charity_preferences_own"
on public.charity_preferences;

create policy "charity_preferences_own"
on public.charity_preferences
for all
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
)
with check (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

-- ============================================================
-- 28. SCORE POLICIES
-- ============================================================

drop policy if exists "scores_select_own"
on public.golf_scores;

create policy "scores_select_own"
on public.golf_scores
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists "scores_insert_own"
on public.golf_scores;

create policy "scores_insert_own"
on public.golf_scores
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.is_active_subscriber(auth.uid())
);

drop policy if exists "scores_update_own"
on public.golf_scores;

create policy "scores_update_own"
on public.golf_scores
for update
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
)
with check (
  (user_id = auth.uid()
    and public.is_active_subscriber(auth.uid()))
  or public.is_admin(auth.uid())
);

drop policy if exists "scores_delete_own"
on public.golf_scores;

create policy "scores_delete_own"
on public.golf_scores
for delete
to authenticated
using (
  (user_id = auth.uid()
    and public.is_active_subscriber(auth.uid()))
  or public.is_admin(auth.uid())
);

-- ============================================================
-- 29. PAYMENT POLICIES
-- ============================================================

drop policy if exists "payments_select_own"
on public.subscription_payments;

create policy "payments_select_own"
on public.subscription_payments
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists "payments_admin_manage"
on public.subscription_payments;

create policy "payments_admin_manage"
on public.subscription_payments
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- ============================================================
-- 30. CONTRIBUTION POLICIES
-- ============================================================

drop policy if exists "contributions_select_own"
on public.charity_contributions;

create policy "contributions_select_own"
on public.charity_contributions
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists "contributions_admin_manage"
on public.charity_contributions;

create policy "contributions_admin_manage"
on public.charity_contributions
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- ============================================================
-- 31. DONATION POLICIES
-- ============================================================

drop policy if exists "donations_select_own"
on public.charity_donations;

create policy "donations_select_own"
on public.charity_donations
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists "donations_admin_manage"
on public.charity_donations;

create policy "donations_admin_manage"
on public.charity_donations
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- ============================================================
-- 32. SETTINGS POLICIES
-- ============================================================

drop policy if exists "settings_admin_only"
on public.platform_settings;

create policy "settings_admin_only"
on public.platform_settings
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- ============================================================
-- 32. DRAW TIER POLICIES
-- ============================================================

drop policy if exists "tier_rules_admin_only"
on public.draw_tier_rules;

create policy "tier_rules_admin_only"
on public.draw_tier_rules
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- ============================================================
-- 33. DRAW POLICIES
-- ============================================================

drop policy if exists "draws_public_read_published"
on public.draws;

create policy "draws_public_read_published"
on public.draws
for select
to anon, authenticated
using (
  status = 'published'
  or public.is_admin(auth.uid())
);

drop policy if exists "draws_admin_manage"
on public.draws;

create policy "draws_admin_manage"
on public.draws
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- ============================================================
-- 34. DRAW ENTRY POLICIES
-- ============================================================

drop policy if exists "draw_entries_own"
on public.draw_entries;

create policy "draw_entries_own"
on public.draw_entries
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists "draw_entries_insert_own"
on public.draw_entries;

create policy "draw_entries_insert_own"
on public.draw_entries
for insert
to authenticated
with check (
  (
    user_id = auth.uid()
    and public.is_active_subscriber(auth.uid())
    and exists (
      select 1
      from public.draws
      where id = draw_id
        and status = 'draft'
        and draw_month = date_trunc('month', current_date)::date
    )
  )
  or public.is_admin(auth.uid())
);

drop policy if exists "draw_entries_admin_manage"
on public.draw_entries;

create policy "draw_entries_admin_manage"
on public.draw_entries
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- ============================================================
-- 35. WINNER POLICIES
-- ============================================================

drop policy if exists "winners_select_own"
on public.winners;

create policy "winners_select_own"
on public.winners
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin(auth.uid())
);

drop policy if exists "winners_admin_manage"
on public.winners;

create policy "winners_admin_manage"
on public.winners
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- ============================================================
-- 36. COMMENTS
-- ============================================================

comment on table public.profiles is
'Application profile linked to Supabase Auth user.';

comment on table public.golf_scores is
'Stores each user''s most recent five Stableford scores.';

comment on table public.draw_entries is
'Stores the five-number entry used by a subscriber for a draw.';

comment on table public.winners is
'Stores draw winners, verification status and payout state.';

comment on table public.charity_contributions is
'Records the charity portion of subscription payments for reporting.';
