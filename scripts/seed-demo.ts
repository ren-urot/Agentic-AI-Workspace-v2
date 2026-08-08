import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_EMAIL = "demo@nexxabyte.com";
const DEMO_PASSWORD = process.env.DEMO_ACCOUNT_PASSWORD!;

const AGENT_KEYS = [
  "sales",
  "customer-service",
  "hr",
  "recruitment",
  "procurement",
  "finance",
  "compliance",
  "operations",
  "executive-assistant",
  "knowledge-assistant",
  "it-helpdesk",
];

const INTEGRATION_STATUSES: Record<string, string> = {
  "1": "connected",
  "2": "connected",
  "3": "connected",
  "4": "disconnected",
  "5": "error",
  "6": "connected",
  "7": "disconnected",
  "8": "disconnected",
  "9": "connected",
  "10": "connected",
};

const PERMISSION_KEYS = [
  "manage_agents",
  "manage_workflows",
  "manage_integrations",
  "manage_users",
  "view_audit_logs",
  "manage_knowledge_base",
];

const ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
  Admin: Object.fromEntries(PERMISSION_KEYS.map((k) => [k, true])),
  Manager: { manage_agents: true, manage_workflows: true, manage_integrations: true, manage_users: false, view_audit_logs: true, manage_knowledge_base: true },
  Operator: { manage_agents: true, manage_workflows: true, manage_integrations: false, manage_users: false, view_audit_logs: false, manage_knowledge_base: true },
  Viewer: { manage_agents: false, manage_workflows: false, manage_integrations: false, manage_users: false, view_audit_logs: true, manage_knowledge_base: false },
};

function zeroPerformance(seed: number) {
  return Array.from({ length: 7 }).map((_, i) => ({ label: `Day ${i + 1}`, value: Math.round(60 + ((seed + i) * 7) % 40) }));
}

async function main() {
  console.log("Creating demo auth user...");
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { signup_type: "self", name: "Jordan Lee", org_name: "Acme Corp" },
  });
  if (createError) throw createError;
  const userId = created.user!.id;

  // The on_auth_user_created trigger already made an organizations + profiles
  // row. Fetch the org id it created.
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", userId).single();
  const orgId = profile!.org_id;
  console.log("Org:", orgId);

  console.log("Deploying agents...");
  await supabase.from("agent_deployments").insert(
    AGENT_KEYS.map((agentKey, i) => ({
      org_id: orgId,
      agent_key: agentKey,
      status: ["active", "active", "active", "idle", "error"][i % 5],
      tasks_completed: 120 + i * 37,
      success_rate: 90 + (i % 8),
      avg_latency_ms: 800 + i * 45,
      last_active: new Date(Date.now() - i * 1000 * 60 * 17).toISOString(),
      short_term_memory: [
        { key: "Current session", value: "Discussing Q3 renewal terms with Acme Corp." },
        { key: "Open task", value: "Awaiting approval on discount threshold." },
      ],
      long_term_memory: [
        { key: "Customer history", value: "12 prior interactions across 3 accounts." },
        { key: "Business preferences", value: "Prefers concise summaries over long reports." },
      ],
      performance: zeroPerformance(i),
    })),
  );

  console.log("Creating workflows...");
  const workflowNames = ["New Lead Qualification", "Invoice Approval Routing", "Employee Offboarding", "Support Ticket Escalation"];
  const workflowStatuses = ["active", "active", "draft", "paused"];
  const workflowTriggerTypes = ["event", "scheduled", "manual", "webhook"];
  const workflowAgents = [["sales"], ["finance"], ["hr"], ["customer-service"]];
  for (let i = 0; i < workflowNames.length; i++) {
    const { data: wf } = await supabase
      .from("workflows")
      .insert({
        org_id: orgId,
        name: workflowNames[i],
        status: workflowStatuses[i],
        trigger_type: workflowTriggerTypes[i],
        success_rate: 92 + i,
        last_run: new Date(Date.now() - i * 3600000).toISOString(),
      })
      .select("id")
      .single();
    await supabase.from("workflow_agents").insert(workflowAgents[i].map((agentKey) => ({ workflow_id: wf!.id, agent_key: agentKey })));
  }

  console.log("Connecting integrations...");
  await supabase.from("integrations").insert(
    Object.entries(INTEGRATION_STATUSES).map(([key, status]) => ({ org_id: orgId, integration_key: key, status })),
  );

  console.log("Adding webhooks...");
  await supabase.from("webhooks").insert([
    { org_id: orgId, url: "https://hooks.client.com/agent-events", event: "agent.task.completed" },
    { org_id: orgId, url: "https://hooks.client.com/approvals", event: "workflow.approval.requested" },
  ]);

  console.log("Adding documents...");
  const documentNames = [
    "Employee Handbook 2026", "Sales Playbook Q3", "ERP Integration Spec", "Compliance Policy GDPR", "Vendor Onboarding Guide",
    "Customer Support FAQ", "Product Catalog Export", "HR Benefits Summary", "Incident Response Runbook", "Procurement Approval Matrix",
  ];
  const sourceTypes = ["PDF", "Word", "Excel", "CSV", "Website", "SharePoint", "Google Drive", "Notion", "Confluence", "Database"];
  const docStatuses = ["approved", "approved", "pending", "approved", "rejected"];
  await supabase.from("documents").insert(
    documentNames.map((name, i) => ({
      org_id: orgId,
      name,
      source_type: sourceTypes[i % sourceTypes.length],
      version: 1 + (i % 4),
      status: docStatuses[i % docStatuses.length],
      keywords: name.toLowerCase().split(" ").filter((w) => w.length > 3),
    })),
  );

  console.log("Adding role permissions...");
  const rolePermRows = Object.entries(ROLE_PERMISSIONS).flatMap(([role, perms]) =>
    Object.entries(perms).map(([permission_key, allowed]) => ({ org_id: orgId, role, permission_key, allowed })),
  );
  await supabase.from("role_permissions").insert(rolePermRows);

  console.log("Adding security policies...");
  await supabase.from("security_policies").insert([
    { org_id: orgId, policy_key: "mfa", enabled: true },
    { org_id: orgId, policy_key: "sso", enabled: false },
    { org_id: orgId, policy_key: "session-timeout", enabled: true },
    { org_id: orgId, policy_key: "ip", enabled: false },
  ]);

  console.log("Adding more users...");
  const extraUsers = [
    { name: "Priya Patel", email: "priya.patel@client.com", role: "Manager", status: "active" },
    { name: "Marcus Chen", email: "marcus.chen@client.com", role: "Operator", status: "invited" },
    { name: "Sofia Ramirez", email: "sofia.ramirez@client.com", role: "Viewer", status: "disabled" },
    { name: "Aisha Khan", email: "aisha.khan@client.com", role: "Admin", status: "active" },
    { name: "Tom Becker", email: "tom.becker@client.com", role: "Manager", status: "active" },
    { name: "Nina Volkov", email: "nina.volkov@client.com", role: "Operator", status: "invited" },
    { name: "Diego Alvarez", email: "diego.alvarez@client.com", role: "Viewer", status: "disabled" },
  ];
  // profiles.id is a foreign key to auth.users(id), so each demo user needs
  // a real (if unused) auth account rather than a bare profiles insert.
  // The trigger always sets status='invited' for signup_type='invited'; for
  // users whose demo status is active/disabled, patch it after creation.
  for (const u of extraUsers) {
    const { data: extraUser } = await supabase.auth.admin.createUser({
      email: u.email,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: { signup_type: "invited", org_id: orgId, name: u.name, role: u.role },
    });
    if (u.status !== "invited" && extraUser.user) {
      await supabase.from("profiles").update({ status: u.status }).eq("id", extraUser.user.id);
    }
  }

  console.log("Adding audit log history...");
  const actions = ["Signed in", "Updated agent prompt", "Approved document", "Changed role", "Disabled user", "Connected integration"];
  await supabase.from("audit_logs").insert(
    Array.from({ length: 10 }).map((_, i) => ({
      org_id: orgId,
      actor_name: extraUsers[i % extraUsers.length].name,
      action: actions[i % actions.length],
      resource: i % 2 === 0 ? "Sales Agent" : "Knowledge Base",
      created_at: new Date(Date.now() - i * 2700000).toISOString(),
    })),
  );

  console.log("Demo org seeded:", orgId);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
