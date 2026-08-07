-- Fix: infinite recursion in RLS policies.
--
-- Every policy that scoped access by org used a subquery of the form
-- `org_id in (select org_id from profiles where id = auth.uid())`. Because
-- that subquery selects from `profiles`, Postgres must evaluate `profiles`'
-- own RLS policies to run it — and `profiles`' policies contain the exact
-- same subquery, so evaluating them requires evaluating them again,
-- forever. Postgres detects this and raises "infinite recursion detected
-- in policy for relation profiles" on any read that touches an org-scoped
-- table, including profiles itself.
--
-- Fix: look up the caller's org_id via a SECURITY DEFINER function. Inside
-- a SECURITY DEFINER function, Postgres runs as the function's owner, which
-- bypasses RLS on the inner lookup — so the recursion never starts.

create or replace function public.current_profile_org_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select org_id from public.profiles where id = auth.uid()
$$;

-- organizations
drop policy "members can select own org" on organizations;
create policy "members can select own org" on organizations
  for select using (id = public.current_profile_org_id());
drop policy "members can update own org" on organizations;
create policy "members can update own org" on organizations
  for update using (id = public.current_profile_org_id());

-- profiles
drop policy "select own org profiles" on profiles;
create policy "select own org profiles" on profiles
  for select using (
    id = auth.uid() or org_id = public.current_profile_org_id()
  );
drop policy "update own org profiles" on profiles;
create policy "update own org profiles" on profiles
  for update using (
    org_id = public.current_profile_org_id()
    and id != auth.uid()
  );

-- agent_deployments
drop policy "org select agent_deployments" on agent_deployments;
create policy "org select agent_deployments" on agent_deployments
  for select using (org_id = public.current_profile_org_id());
drop policy "org write agent_deployments" on agent_deployments;
create policy "org write agent_deployments" on agent_deployments
  for all using (org_id = public.current_profile_org_id())
  with check (org_id = public.current_profile_org_id());

-- workflows
drop policy "org select workflows" on workflows;
create policy "org select workflows" on workflows
  for select using (org_id = public.current_profile_org_id());
drop policy "org write workflows" on workflows;
create policy "org write workflows" on workflows
  for all using (org_id = public.current_profile_org_id())
  with check (org_id = public.current_profile_org_id());

-- workflow_agents
drop policy "org select workflow_agents" on workflow_agents;
create policy "org select workflow_agents" on workflow_agents
  for select using (
    workflow_id in (select id from workflows where org_id = public.current_profile_org_id())
  );
drop policy "org write workflow_agents" on workflow_agents;
create policy "org write workflow_agents" on workflow_agents
  for all using (
    workflow_id in (select id from workflows where org_id = public.current_profile_org_id())
  )
  with check (
    workflow_id in (select id from workflows where org_id = public.current_profile_org_id())
  );

-- integrations
drop policy "org select integrations" on integrations;
create policy "org select integrations" on integrations
  for select using (org_id = public.current_profile_org_id());
drop policy "org write integrations" on integrations;
create policy "org write integrations" on integrations
  for all using (org_id = public.current_profile_org_id())
  with check (org_id = public.current_profile_org_id());

-- webhooks
drop policy "org select webhooks" on webhooks;
create policy "org select webhooks" on webhooks
  for select using (org_id = public.current_profile_org_id());
drop policy "org write webhooks" on webhooks;
create policy "org write webhooks" on webhooks
  for all using (org_id = public.current_profile_org_id())
  with check (org_id = public.current_profile_org_id());

-- documents
drop policy "org select documents" on documents;
create policy "org select documents" on documents
  for select using (org_id = public.current_profile_org_id());
drop policy "org write documents" on documents;
create policy "org write documents" on documents
  for all using (org_id = public.current_profile_org_id())
  with check (org_id = public.current_profile_org_id());

-- role_permissions
drop policy "org select role_permissions" on role_permissions;
create policy "org select role_permissions" on role_permissions
  for select using (org_id = public.current_profile_org_id());
drop policy "org write role_permissions" on role_permissions;
create policy "org write role_permissions" on role_permissions
  for all using (org_id = public.current_profile_org_id())
  with check (org_id = public.current_profile_org_id());

-- security_policies
drop policy "org select security_policies" on security_policies;
create policy "org select security_policies" on security_policies
  for select using (org_id = public.current_profile_org_id());
drop policy "org write security_policies" on security_policies;
create policy "org write security_policies" on security_policies
  for all using (org_id = public.current_profile_org_id())
  with check (org_id = public.current_profile_org_id());

-- audit_logs
drop policy "org select audit_logs" on audit_logs;
create policy "org select audit_logs" on audit_logs
  for select using (org_id = public.current_profile_org_id());
drop policy "org insert audit_logs" on audit_logs;
create policy "org insert audit_logs" on audit_logs
  for insert with check (org_id = public.current_profile_org_id());
