-- Identity & multi-tenancy foundation.
--
-- Ownership model:
--   * Tables are owned by the migration role (postgres). The owner bypasses RLS, so it is
--     never used at runtime.
--   * core-api connects as `krinly_app`: not an owner, NOBYPASSRLS. Every query runs inside a
--     transaction that sets `app.user_id` (transaction-local), which the policies below read.
--   * core-worker connects as `krinly_worker`, which can only read and mark outbox events.
--   * Supabase Data API roles (anon, authenticated, service_role) get no access to these tables.
--
-- Login passwords for the runtime roles are set out-of-band (never in a migration):
--   alter role krinly_app with login password '...';
--   alter role krinly_worker with login password '...';

-- ---------------------------------------------------------------------------
-- Roles and schemas
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'krinly_app') then
    create role krinly_app nologin noinherit nobypassrls;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'krinly_worker') then
    create role krinly_worker nologin noinherit nobypassrls;
  end if;
end
$$;

-- Helper functions live outside `public` so the Supabase Data API never exposes them.
create schema app;
revoke all on schema app from public;
grant usage on schema app to krinly_app, krinly_worker;
grant usage on schema public to krinly_app, krinly_worker;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique check (email = lower(email)),
  full_name text check (char_length(full_name) <= 200),
  -- Krinly staff flag. Only changeable by the migration/owner role (see column grants).
  is_platform_operator boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$'),
  status text not null default 'active' check (status in ('active', 'suspended', 'closed')),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Roles are platform-defined. Organization-specific custom roles are not supported yet.
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z_]+$'),
  name text not null,
  description text not null,
  -- false for roles that can never be granted through invitations (e.g. owner).
  is_assignable boolean not null,
  created_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z_]+\.[a-z_]+$'),
  description text not null
);

create table public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);
create index role_permissions_permission_id_idx on public.role_permissions (permission_id);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'suspended', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index organization_memberships_user_id_idx on public.organization_memberships (user_id);
create index organization_memberships_role_id_idx on public.organization_memberships (role_id);

create table public.organization_settings (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  timezone text not null default 'Asia/Kolkata',
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  locale text not null default 'en-IN',
  updated_at timestamptz not null default now()
);

create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null check (email = lower(email)),
  role_id uuid not null references public.roles (id) on delete restrict,
  -- SHA-256 of the bearer token. The raw token is shown to the inviter once and never stored.
  token_hash bytea not null unique check (octet_length(token_hash) = 32),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_by uuid not null references public.profiles (id) on delete restrict,
  expires_at timestamptz not null,
  accepted_by uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at),
  check ((status = 'accepted') = (accepted_at is not null))
);
-- At most one live invitation per email per organization.
create unique index organization_invitations_pending_email_idx
  on public.organization_invitations (organization_id, email)
  where status = 'pending';
create index organization_invitations_role_id_idx on public.organization_invitations (role_id);

-- Time-boxed, merchant-approved access for Krinly operators to one organization.
create table public.operator_access_grants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  operator_user_id uuid not null references public.profiles (id) on delete cascade,
  granted_by uuid not null references public.profiles (id) on delete restrict,
  reason text not null check (char_length(reason) between 10 and 500),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (operator_user_id <> granted_by),
  -- Grants are short-lived by policy: at most 7 days.
  check (expires_at > created_at and expires_at <= created_at + interval '7 days'),
  check ((revoked_at is null) = (revoked_by is null))
);
create index operator_access_grants_operator_idx
  on public.operator_access_grants (operator_user_id, organization_id);
create index operator_access_grants_organization_idx
  on public.operator_access_grants (organization_id);

-- Append-only. The runtime role has INSERT and SELECT only.
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete restrict,
  actor_user_id uuid references public.profiles (id) on delete set null,
  actor_type text not null check (actor_type in ('user', 'operator', 'system')),
  action text not null check (action ~ '^[a-z_]+\.[a-z_]+$'),
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  request_id text,
  created_at timestamptz not null default now()
);
create index audit_logs_organization_created_idx on public.audit_logs (organization_id, created_at desc);

-- Transactional outbox: written in the same transaction as the state change it describes.
create table public.outbox_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete restrict,
  event_type text not null check (event_type ~ '^[a-z_]+\.[a-z_]+$'),
  aggregate_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  dispatched_at timestamptz,
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  last_error text
);
create index outbox_events_pending_idx on public.outbox_events (next_attempt_at)
  where dispatched_at is null;

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------
insert into public.permissions (key, description) values
  ('organization.read', 'View the organization and its settings'),
  ('organization.update', 'Change organization details and settings'),
  ('members.read', 'View organization members'),
  ('members.invite', 'Invite people to the organization'),
  ('operator_access.manage', 'Grant and revoke Krinly operator access'),
  ('audit.read', 'View the organization audit log'),
  ('ai.use', 'Use AI assistance features');

insert into public.roles (key, name, description, is_assignable) values
  ('owner', 'Owner', 'Full control of the organization', false),
  ('admin', 'Admin', 'Manages the organization and its team', true),
  ('member', 'Member', 'Works within the organization', true);

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on
  r.key = 'owner'
  or (r.key = 'admin' and p.key in (
    'organization.read', 'organization.update', 'members.read', 'members.invite',
    'audit.read', 'ai.use'))
  or (r.key = 'member' and p.key in ('organization.read', 'members.read', 'ai.use'));

-- ---------------------------------------------------------------------------
-- Authorization helpers
-- ---------------------------------------------------------------------------
-- The authenticated user for the current transaction, set by core-api after JWT verification.
create function app.current_user_id() returns uuid
language sql stable
set search_path = ''
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid
$$;

-- SECURITY DEFINER so policies can consult memberships without recursive RLS evaluation.
create function app.is_org_member(p_organization_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = p_organization_id
      and m.user_id = app.current_user_id()
      and m.status = 'active'
      and o.status <> 'closed'
  )
$$;

create function app.has_active_operator_grant(p_organization_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.operator_access_grants g
    join public.profiles p on p.id = g.operator_user_id
    where g.organization_id = p_organization_id
      and g.operator_user_id = app.current_user_id()
      and p.is_platform_operator
      and g.revoked_at is null
      and g.expires_at > now()
  )
$$;

create function app.can_read_org(p_organization_id uuid) returns boolean
language sql stable
set search_path = ''
as $$
  select app.is_org_member(p_organization_id) or app.has_active_operator_grant(p_organization_id)
$$;

create function app.has_org_permission(p_organization_id uuid, p_permission text) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships m
    join public.organizations o on o.id = m.organization_id
    join public.role_permissions rp on rp.role_id = m.role_id
    join public.permissions p on p.id = rp.permission_id
    where m.organization_id = p_organization_id
      and m.user_id = app.current_user_id()
      and m.status = 'active'
      and o.status = 'active'
      and p.key = p_permission
  )
$$;

-- A role may be granted only if it is assignable and every one of its permissions is held by
-- the granting user in that organization. This blocks privilege escalation through invitations.
create function app.can_grant_role(p_organization_id uuid, p_role_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.roles r where r.id = p_role_id and r.is_assignable)
    and not exists (
      select 1
      from public.role_permissions rp
      join public.permissions p on p.id = rp.permission_id
      where rp.role_id = p_role_id
        and not app.has_org_permission(p_organization_id, p.key)
    )
$$;

-- Users who share at least one active organization with the current user.
create function app.shares_org_with(p_user_id uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships mine
    join public.organization_memberships theirs
      on theirs.organization_id = mine.organization_id
    where mine.user_id = app.current_user_id()
      and mine.status = 'active'
      and theirs.user_id = p_user_id
      and theirs.status = 'active'
  )
$$;

-- ---------------------------------------------------------------------------
-- Profile synchronisation from Supabase Auth
-- ---------------------------------------------------------------------------
create function app.sync_profile_from_auth_user() returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, lower(new.email))
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$;

create trigger krinly_sync_profile
after insert or update of email on auth.users
for each row
when (new.email is not null)
execute function app.sync_profile_from_auth_user();

-- ---------------------------------------------------------------------------
-- Privileged operations (bootstrap steps where the caller is not yet a member)
-- ---------------------------------------------------------------------------
create function app.write_audit(
  p_organization_id uuid, p_action text, p_target_type text, p_target_id uuid, p_metadata jsonb
) returns void
language sql security definer
set search_path = ''
as $$
  insert into public.audit_logs (
    organization_id, actor_user_id, actor_type, action, target_type, target_id, metadata, request_id
  ) values (
    p_organization_id, app.current_user_id(), 'user', p_action, p_target_type, p_target_id,
    p_metadata, nullif(current_setting('app.request_id', true), '')
  )
$$;
revoke all on function app.write_audit(uuid, text, text, uuid, jsonb) from public;

-- Creates an organization, its settings, and exactly one owner membership atomically.
create function app.create_organization(p_name text, p_slug text) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_user_id uuid := app.current_user_id();
  v_org_id uuid;
  v_membership_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  insert into public.organizations (name, slug, created_by)
  values (btrim(p_name), p_slug, v_user_id)
  returning id into v_org_id;

  insert into public.organization_settings (organization_id) values (v_org_id);

  insert into public.organization_memberships (organization_id, user_id, role_id)
  select v_org_id, v_user_id, r.id from public.roles r where r.key = 'owner'
  returning id into v_membership_id;

  perform app.write_audit(v_org_id, 'organization.created', 'organization', v_org_id,
    jsonb_build_object('slug', p_slug));

  insert into public.outbox_events (organization_id, event_type, aggregate_id, payload)
  values (v_org_id, 'organization.created', v_org_id, jsonb_build_object(
    'organizationId', v_org_id, 'ownerUserId', v_user_id, 'membershipId', v_membership_id));

  return v_org_id;
end;
$$;

-- Accepts an invitation for the current user. The conditional UPDATE is the replay guard:
-- only one transaction can move an invitation out of 'pending'.
-- Custom SQLSTATEs: KR404 unknown token, KR410 expired/used/revoked, KR403 wrong recipient,
-- KR409 already a member.
create function app.accept_invitation(p_token_hash bytea) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  v_user_id uuid := app.current_user_id();
  v_email text;
  v_invitation public.organization_invitations%rowtype;
  v_membership_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  select lower(u.email) into v_email
  from auth.users u
  where u.id = v_user_id and u.email_confirmed_at is not null;
  if v_email is null then
    raise exception 'a verified email address is required' using errcode = 'KR403';
  end if;

  update public.organization_invitations i
  set status = 'accepted', accepted_by = v_user_id, accepted_at = now()
  where i.token_hash = p_token_hash
    and i.status = 'pending'
    and i.expires_at > now()
    and i.email = v_email
  returning * into v_invitation;

  if v_invitation.id is null then
    select * into v_invitation from public.organization_invitations i
    where i.token_hash = p_token_hash;
    if v_invitation.id is null then
      raise exception 'invitation not found' using errcode = 'KR404';
    elsif v_invitation.status <> 'pending' or v_invitation.expires_at <= now() then
      raise exception 'invitation is no longer valid' using errcode = 'KR410';
    else
      raise exception 'invitation was issued to a different email address' using errcode = 'KR403';
    end if;
  end if;

  if exists (
    select 1 from public.organization_memberships m
    where m.organization_id = v_invitation.organization_id and m.user_id = v_user_id
  ) then
    raise exception 'already a member of this organization' using errcode = 'KR409';
  end if;

  insert into public.organization_memberships (organization_id, user_id, role_id)
  values (v_invitation.organization_id, v_user_id, v_invitation.role_id)
  returning id into v_membership_id;

  perform app.write_audit(v_invitation.organization_id, 'invitation.accepted', 'invitation',
    v_invitation.id, jsonb_build_object('membershipId', v_membership_id));

  insert into public.outbox_events (organization_id, event_type, aggregate_id, payload)
  values (v_invitation.organization_id, 'membership.created', v_membership_id, jsonb_build_object(
    'organizationId', v_invitation.organization_id, 'userId', v_user_id,
    'membershipId', v_membership_id, 'roleId', v_invitation.role_id));

  return v_invitation.organization_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
-- Functions are executable by PUBLIC by default; restrict them explicitly.
revoke all on all functions in schema app from public;
grant execute on function
  app.current_user_id(),
  app.is_org_member(uuid),
  app.has_active_operator_grant(uuid),
  app.can_read_org(uuid),
  app.has_org_permission(uuid, text),
  app.can_grant_role(uuid, uuid),
  app.shares_org_with(uuid),
  app.create_organization(text, text),
  app.accept_invitation(bytea)
to krinly_app;

-- Supabase grants Data API roles access to new public tables by default. None of these tables
-- are served through the Data API.
revoke all on
  public.profiles, public.organizations, public.roles, public.permissions,
  public.role_permissions, public.organization_memberships, public.organization_settings,
  public.organization_invitations, public.operator_access_grants, public.audit_logs,
  public.outbox_events
from public, anon, authenticated, service_role;

grant select on public.profiles to krinly_app;
grant update (full_name, updated_at) on public.profiles to krinly_app;
grant select on public.organizations to krinly_app;
grant update (name, updated_at) on public.organizations to krinly_app;
grant select on public.roles, public.permissions, public.role_permissions to krinly_app;
grant select on public.organization_memberships to krinly_app;
grant select on public.organization_settings to krinly_app;
grant update (timezone, currency, locale, updated_at) on public.organization_settings to krinly_app;
grant select, insert on public.organization_invitations to krinly_app;
grant update (status) on public.organization_invitations to krinly_app;
grant select, insert on public.operator_access_grants to krinly_app;
grant update (revoked_at, revoked_by) on public.operator_access_grants to krinly_app;
grant select, insert on public.audit_logs to krinly_app;
grant insert on public.outbox_events to krinly_app;

grant select on public.outbox_events to krinly_worker;
grant update (dispatched_at, attempts, next_attempt_at, last_error) on public.outbox_events
  to krinly_worker;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.organization_settings enable row level security;
alter table public.organization_invitations enable row level security;
alter table public.operator_access_grants enable row level security;
alter table public.audit_logs enable row level security;
alter table public.outbox_events enable row level security;

create policy profiles_select on public.profiles for select to krinly_app
  using (id = app.current_user_id() or app.shares_org_with(id));
create policy profiles_update on public.profiles for update to krinly_app
  using (id = app.current_user_id()) with check (id = app.current_user_id());

create policy organizations_select on public.organizations for select to krinly_app
  using (app.can_read_org(id));
create policy organizations_update on public.organizations for update to krinly_app
  using (app.has_org_permission(id, 'organization.update'))
  with check (app.has_org_permission(id, 'organization.update'));

create policy roles_select on public.roles for select to krinly_app using (true);
create policy permissions_select on public.permissions for select to krinly_app using (true);
create policy role_permissions_select on public.role_permissions for select to krinly_app
  using (true);

create policy memberships_select on public.organization_memberships for select to krinly_app
  using (user_id = app.current_user_id() or app.can_read_org(organization_id));

create policy settings_select on public.organization_settings for select to krinly_app
  using (app.can_read_org(organization_id));
create policy settings_update on public.organization_settings for update to krinly_app
  using (app.has_org_permission(organization_id, 'organization.update'))
  with check (app.has_org_permission(organization_id, 'organization.update'));

create policy invitations_select on public.organization_invitations for select to krinly_app
  using (app.has_org_permission(organization_id, 'members.invite'));
create policy invitations_insert on public.organization_invitations for insert to krinly_app
  with check (
    status = 'pending'
    and invited_by = app.current_user_id()
    and app.has_org_permission(organization_id, 'members.invite')
    and app.can_grant_role(organization_id, role_id)
  );
create policy invitations_revoke on public.organization_invitations for update to krinly_app
  using (status = 'pending' and app.has_org_permission(organization_id, 'members.invite'))
  with check (status = 'revoked');

create policy grants_select on public.operator_access_grants for select to krinly_app
  using (
    operator_user_id = app.current_user_id()
    or app.has_org_permission(organization_id, 'operator_access.manage')
  );
create policy grants_insert on public.operator_access_grants for insert to krinly_app
  with check (
    granted_by = app.current_user_id()
    and revoked_at is null
    and app.has_org_permission(organization_id, 'operator_access.manage')
  );
create policy grants_revoke on public.operator_access_grants for update to krinly_app
  using (app.has_org_permission(organization_id, 'operator_access.manage'))
  with check (revoked_by = app.current_user_id());

create policy audit_select on public.audit_logs for select to krinly_app
  using (app.has_org_permission(organization_id, 'audit.read'));
create policy audit_insert on public.audit_logs for insert to krinly_app
  with check (
    actor_user_id = app.current_user_id()
    and actor_type = 'user'
    and (organization_id is null or app.is_org_member(organization_id))
  );

create policy outbox_insert on public.outbox_events for insert to krinly_app
  with check (organization_id is not null and app.is_org_member(organization_id));
create policy outbox_worker_select on public.outbox_events for select to krinly_worker
  using (true);
create policy outbox_worker_update on public.outbox_events for update to krinly_worker
  using (true) with check (true);
