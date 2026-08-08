alter table workflows
  add column trigger_type text not null default 'manual'
  check (trigger_type in ('manual', 'scheduled', 'event', 'webhook'));
