-- Organizations (also serves as "org settings": name/timezone/locale live here directly)
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'America/New_York',
  locale text not null default 'en-US',
  created_at timestamptz not null default now()
);

-- Profiles extend auth.users with org membership + role
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('Admin', 'Manager', 'Operator', 'Viewer')),
  status text not null check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null default now()
);

create table agent_deployments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  agent_key text not null,
  status text not null default 'idle' check (status in ('active', 'idle', 'error')),
  tasks_completed int not null default 0,
  success_rate int not null default 0,
  avg_latency_ms int not null default 0,
  last_active timestamptz not null default now(),
  system_prompt text,
  tool_permissions jsonb,
  short_term_memory jsonb not null default '[]',
  long_term_memory jsonb not null default '[]',
  performance jsonb not null default '[]',
  deployed_at timestamptz not null default now(),
  unique (org_id, agent_key)
);

create table workflows (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  status text not null check (status in ('active', 'draft', 'paused')),
  last_run timestamptz,
  success_rate int not null default 0,
  created_at timestamptz not null default now()
);

create table workflow_agents (
  workflow_id uuid not null references workflows(id) on delete cascade,
  agent_key text not null,
  primary key (workflow_id, agent_key)
);

create table integrations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  integration_key text not null,
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error')),
  unique (org_id, integration_key)
);

create table webhooks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  url text not null,
  event text not null,
  created_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  source_type text not null,
  version int not null default 1,
  status text not null default 'pending' check (status in ('approved', 'pending', 'rejected')),
  updated_at timestamptz not null default now(),
  keywords text[] not null default '{}'
);

create table role_permissions (
  org_id uuid not null references organizations(id) on delete cascade,
  role text not null,
  permission_key text not null,
  allowed boolean not null default false,
  primary key (org_id, role, permission_key)
);

create table security_policies (
  org_id uuid not null references organizations(id) on delete cascade,
  policy_key text not null,
  enabled boolean not null default false,
  primary key (org_id, policy_key)
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  actor_name text not null,
  action text not null,
  resource text not null,
  created_at timestamptz not null default now()
);

-- Row-Level Security -------------------------------------------------------

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table agent_deployments enable row level security;
alter table workflows enable row level security;
alter table workflow_agents enable row level security;
alter table integrations enable row level security;
alter table webhooks enable row level security;
alter table documents enable row level security;
alter table role_permissions enable row level security;
alter table security_policies enable row level security;
alter table audit_logs enable row level security;

create policy "members can select own org" on organizations
  for select using (id in (select org_id from profiles where id = auth.uid()));
create policy "members can update own org" on organizations
  for update using (id in (select org_id from profiles where id = auth.uid()));

create policy "select own org profiles" on profiles
  for select using (
    id = auth.uid() or org_id in (select org_id from profiles where id = auth.uid())
  );
create policy "update own org profiles" on profiles
  for update using (org_id in (select org_id from profiles where id = auth.uid()));

create policy "org select agent_deployments" on agent_deployments
  for select using (org_id in (select org_id from profiles where id = auth.uid()));
create policy "org write agent_deployments" on agent_deployments
  for all using (org_id in (select org_id from profiles where id = auth.uid()))
  with check (org_id in (select org_id from profiles where id = auth.uid()));

create policy "org select workflows" on workflows
  for select using (org_id in (select org_id from profiles where id = auth.uid()));
create policy "org write workflows" on workflows
  for all using (org_id in (select org_id from profiles where id = auth.uid()))
  with check (org_id in (select org_id from profiles where id = auth.uid()));

create policy "org select workflow_agents" on workflow_agents
  for select using (
    workflow_id in (select id from workflows where org_id in (select org_id from profiles where id = auth.uid()))
  );
create policy "org write workflow_agents" on workflow_agents
  for all using (
    workflow_id in (select id from workflows where org_id in (select org_id from profiles where id = auth.uid()))
  )
  with check (
    workflow_id in (select id from workflows where org_id in (select org_id from profiles where id = auth.uid()))
  );

create policy "org select integrations" on integrations
  for select using (org_id in (select org_id from profiles where id = auth.uid()));
create policy "org write integrations" on integrations
  for all using (org_id in (select org_id from profiles where id = auth.uid()))
  with check (org_id in (select org_id from profiles where id = auth.uid()));

create policy "org select webhooks" on webhooks
  for select using (org_id in (select org_id from profiles where id = auth.uid()));
create policy "org write webhooks" on webhooks
  for all using (org_id in (select org_id from profiles where id = auth.uid()))
  with check (org_id in (select org_id from profiles where id = auth.uid()));

create policy "org select documents" on documents
  for select using (org_id in (select org_id from profiles where id = auth.uid()));
create policy "org write documents" on documents
  for all using (org_id in (select org_id from profiles where id = auth.uid()))
  with check (org_id in (select org_id from profiles where id = auth.uid()));

create policy "org select role_permissions" on role_permissions
  for select using (org_id in (select org_id from profiles where id = auth.uid()));
create policy "org write role_permissions" on role_permissions
  for all using (org_id in (select org_id from profiles where id = auth.uid()))
  with check (org_id in (select org_id from profiles where id = auth.uid()));

create policy "org select security_policies" on security_policies
  for select using (org_id in (select org_id from profiles where id = auth.uid()));
create policy "org write security_policies" on security_policies
  for all using (org_id in (select org_id from profiles where id = auth.uid()))
  with check (org_id in (select org_id from profiles where id = auth.uid()));

create policy "org select audit_logs" on audit_logs
  for select using (org_id in (select org_id from profiles where id = auth.uid()));
create policy "org insert audit_logs" on audit_logs
  for insert with check (org_id in (select org_id from profiles where id = auth.uid()));

-- New-user trigger: self-signup creates a new org; invited users join an
-- existing one. Runs as SECURITY DEFINER so it can bypass RLS to create the
-- very first rows for a brand-new org.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_org_id uuid;
  meta jsonb := new.raw_user_meta_data;
begin
  if meta->>'signup_type' = 'invited' then
    insert into public.profiles (id, org_id, name, email, role, status)
    values (
      new.id,
      (meta->>'org_id')::uuid,
      coalesce(meta->>'name', split_part(new.email, '@', 1)),
      new.email,
      coalesce(meta->>'role', 'Viewer'),
      'invited'
    );
  else
    insert into public.organizations (name, timezone, locale)
    values (coalesce(meta->>'org_name', coalesce(meta->>'name', 'New') || '''s Organization'), 'America/New_York', 'en-US')
    returning id into new_org_id;

    insert into public.profiles (id, org_id, name, email, role, status)
    values (new.id, new_org_id, coalesce(meta->>'name', new.email), new.email, 'Admin', 'active');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
