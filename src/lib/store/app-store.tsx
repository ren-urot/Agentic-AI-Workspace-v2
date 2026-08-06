"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  Agent,
  AuditLogEntry,
  ChartPoint,
  Integration,
  IntegrationStatus,
  KnowledgeDocument,
  DocumentStatus,
  MemoryEntry,
  OrgUser,
  RolePermissions,
  ToolPermission,
  UserRole,
  UserStatus,
  Webhook,
  WorkflowStatus,
  WorkflowSummary,
} from "@/lib/mock-data/types";

export interface AgentOverride {
  systemPrompt?: string;
  toolPermissions?: ToolPermission[];
  shortTermMemory?: MemoryEntry[];
  longTermMemory?: MemoryEntry[];
  status?: Agent["status"];
  tasksCompleted?: number;
  successRate?: number;
  avgLatencyMs?: number;
  lastActive?: string;
  performance?: ChartPoint[];
}

export interface SecurityPolicies {
  mfa: boolean;
  sso: boolean;
  "session-timeout": boolean;
  ip: boolean;
}

export interface OrgSettings {
  orgName: string;
  timezone: string;
  locale: string;
}

interface StoredState {
  workflows: WorkflowSummary[];
  deployedAgentIds: string[];
  agentOverrides: Record<string, AgentOverride>;
  integrations: Integration[];
  webhooks: Webhook[];
  users: OrgUser[];
  documents: KnowledgeDocument[];
  rolePermissions: RolePermissions[];
  securityPolicies: SecurityPolicies;
  orgSettings: OrgSettings;
  auditLogs: AuditLogEntry[];
}

export interface AppStoreSeed {
  workflows: WorkflowSummary[];
  deployedAgentIds: string[];
  integrations: Integration[];
  webhooks: Webhook[];
  users: OrgUser[];
  documents: KnowledgeDocument[];
  rolePermissions: RolePermissions[];
  auditLogs: AuditLogEntry[];
}

const DEFAULT_SECURITY_POLICIES: SecurityPolicies = { mfa: true, sso: false, "session-timeout": true, ip: false };
const DEFAULT_ORG_SETTINGS: OrgSettings = { orgName: "Acme Corp", timezone: "America/New_York", locale: "en-US" };

function zeroPerformance(): ChartPoint[] {
  return Array.from({ length: 7 }).map((_, i) => ({ label: `Day ${i + 1}`, value: 0 }));
}

function freshDeployOverride(): AgentOverride {
  return {
    status: "idle",
    tasksCompleted: 0,
    successRate: 0,
    avgLatencyMs: 0,
    lastActive: new Date().toISOString(),
    shortTermMemory: [],
    longTermMemory: [],
    performance: zeroPerformance(),
  };
}

function withAuditLog(prev: StoredState, actor: string, action: string, resource: string): AuditLogEntry[] {
  const entry: AuditLogEntry = { id: crypto.randomUUID(), actor, action, resource, timestamp: new Date().toISOString() };
  return [entry, ...prev.auditLogs];
}

function buildInitialState(seed: AppStoreSeed): StoredState {
  return {
    workflows: seed.workflows,
    deployedAgentIds: seed.deployedAgentIds,
    agentOverrides: {},
    integrations: seed.integrations,
    webhooks: seed.webhooks,
    users: seed.users,
    documents: seed.documents,
    rolePermissions: seed.rolePermissions,
    securityPolicies: DEFAULT_SECURITY_POLICIES,
    orgSettings: DEFAULT_ORG_SETTINGS,
    auditLogs: seed.auditLogs,
  };
}

interface AppStoreValue {
  agents: Agent[];
  workflows: WorkflowSummary[];
  deployedAgentIds: string[];
  agentOverrides: Record<string, AgentOverride>;
  integrations: Integration[];
  webhooks: Webhook[];
  users: OrgUser[];
  documents: KnowledgeDocument[];
  rolePermissions: RolePermissions[];
  securityPolicies: SecurityPolicies;
  orgSettings: OrgSettings;
  auditLogs: AuditLogEntry[];

  addWorkflow: (workflow: WorkflowSummary) => void;
  setWorkflowStatus: (id: string, status: WorkflowStatus) => void;
  deployAgent: (id: string) => void;
  setAgentOverride: (id: string, override: Partial<AgentOverride>) => void;

  setIntegrationStatus: (id: string, status: IntegrationStatus) => void;
  addWebhook: (webhook: Webhook) => void;
  removeWebhook: (id: string) => void;

  addUser: (user: OrgUser) => void;
  setUserRole: (id: string, role: UserRole) => void;
  setUserStatus: (id: string, status: UserStatus) => void;

  addDocument: (doc: KnowledgeDocument) => void;
  setDocumentStatus: (id: string, status: DocumentStatus) => void;

  toggleRolePermission: (role: UserRole, key: string) => void;
  setSecurityPolicy: (id: keyof SecurityPolicies, checked: boolean) => void;
  setOrgSettings: (settings: OrgSettings) => void;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

function storageKeyFor(sessionKey: string) {
  return `nexxabyte-store:${sessionKey}`;
}

export function AppStoreProvider({
  seed,
  agents,
  sessionKey,
  currentUserName,
  children,
}: {
  seed: AppStoreSeed;
  agents: Agent[];
  sessionKey: string;
  currentUserName: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<StoredState>(() => buildInitialState(seed));
  const [hydrated, setHydrated] = useState(false);
  const key = storageKeyFor(sessionKey);

  useEffect(() => {
    // Server-rendered HTML always reflects `seed` (localStorage doesn't exist
    // there), so reading storage during render would mismatch hydration.
    // Deliberately read + sync after mount instead.
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredState>;
        // A saved snapshot means this is a *known* account, not a first-ever
        // load — so any field missing from it (e.g. one added to the store
        // after this snapshot was written) must default to empty, never to
        // the server seed's "returning login" canned data. The cookie-based
        // isNewOrg() signal that produced that seed only reflects the most
        // recent signup/login action, not this account's true history.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState((prev) => ({ ...prev, ...parsed, auditLogs: parsed.auditLogs ?? [] }));
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore quota/storage errors
    }
  }, [state, hydrated, key]);

  const deployAgent = useCallback((id: string) => {
    setState((prev) => {
      if (prev.deployedAgentIds.includes(id)) return prev;
      return {
        ...prev,
        deployedAgentIds: [...prev.deployedAgentIds, id],
        agentOverrides: { ...prev.agentOverrides, [id]: { ...prev.agentOverrides[id], ...freshDeployOverride() } },
      };
    });
  }, []);

  const addWorkflow = useCallback((workflow: WorkflowSummary) => {
    setState((prev) => {
      const deployedAgentIds = [...prev.deployedAgentIds];
      const agentOverrides = { ...prev.agentOverrides };
      for (const id of workflow.agentIds) {
        if (!deployedAgentIds.includes(id)) {
          deployedAgentIds.push(id);
          agentOverrides[id] = { ...agentOverrides[id], ...freshDeployOverride() };
        }
      }
      return {
        ...prev,
        workflows: [workflow, ...prev.workflows],
        deployedAgentIds,
        agentOverrides,
        auditLogs: withAuditLog(prev, currentUserName, "Created workflow", workflow.name),
      };
    });
  }, [currentUserName]);

  const setWorkflowStatus = useCallback((id: string, status: WorkflowStatus) => {
    setState((prev) => {
      const workflow = prev.workflows.find((wf) => wf.id === id);
      return {
        ...prev,
        workflows: prev.workflows.map((wf) => (wf.id === id ? { ...wf, status } : wf)),
        auditLogs: workflow ? withAuditLog(prev, currentUserName, `Changed workflow status to ${status}`, workflow.name) : prev.auditLogs,
      };
    });
  }, [currentUserName]);

  const setAgentOverride = useCallback((id: string, override: Partial<AgentOverride>) => {
    setState((prev) => ({
      ...prev,
      agentOverrides: { ...prev.agentOverrides, [id]: { ...prev.agentOverrides[id], ...override } },
    }));
  }, []);

  const setIntegrationStatus = useCallback((id: string, status: IntegrationStatus) => {
    setState((prev) => {
      const integration = prev.integrations.find((i) => i.id === id);
      return {
        ...prev,
        integrations: prev.integrations.map((i) => (i.id === id ? { ...i, status } : i)),
        auditLogs: integration
          ? withAuditLog(prev, currentUserName, status === "connected" ? "Connected integration" : "Disconnected integration", integration.name)
          : prev.auditLogs,
      };
    });
  }, [currentUserName]);

  const addWebhook = useCallback((webhook: Webhook) => {
    setState((prev) => ({
      ...prev,
      webhooks: [webhook, ...prev.webhooks],
      auditLogs: withAuditLog(prev, currentUserName, "Added webhook", webhook.url),
    }));
  }, [currentUserName]);

  const removeWebhook = useCallback((id: string) => {
    setState((prev) => {
      const webhook = prev.webhooks.find((w) => w.id === id);
      return {
        ...prev,
        webhooks: prev.webhooks.filter((w) => w.id !== id),
        auditLogs: webhook ? withAuditLog(prev, currentUserName, "Removed webhook", webhook.url) : prev.auditLogs,
      };
    });
  }, [currentUserName]);

  const addUser = useCallback((user: OrgUser) => {
    setState((prev) => ({
      ...prev,
      users: [user, ...prev.users],
      auditLogs: withAuditLog(prev, currentUserName, "Invited user", user.email),
    }));
  }, [currentUserName]);

  const setUserRole = useCallback((id: string, role: UserRole) => {
    setState((prev) => {
      const user = prev.users.find((u) => u.id === id);
      return {
        ...prev,
        users: prev.users.map((u) => (u.id === id ? { ...u, role } : u)),
        auditLogs: user ? withAuditLog(prev, currentUserName, `Changed role to ${role}`, user.name) : prev.auditLogs,
      };
    });
  }, [currentUserName]);

  const setUserStatus = useCallback((id: string, status: UserStatus) => {
    setState((prev) => {
      const user = prev.users.find((u) => u.id === id);
      return {
        ...prev,
        users: prev.users.map((u) => (u.id === id ? { ...u, status } : u)),
        auditLogs: user ? withAuditLog(prev, currentUserName, `Changed user status to ${status}`, user.name) : prev.auditLogs,
      };
    });
  }, [currentUserName]);

  const addDocument = useCallback((doc: KnowledgeDocument) => {
    setState((prev) => ({
      ...prev,
      documents: [doc, ...prev.documents],
      auditLogs: withAuditLog(prev, currentUserName, "Uploaded document", doc.name),
    }));
  }, [currentUserName]);

  const setDocumentStatus = useCallback((id: string, status: DocumentStatus) => {
    setState((prev) => {
      const doc = prev.documents.find((d) => d.id === id);
      const action = status === "approved" ? "Approved document" : status === "rejected" ? "Rejected document" : "Updated document status";
      return {
        ...prev,
        documents: prev.documents.map((d) => (d.id === id ? { ...d, status } : d)),
        auditLogs: doc ? withAuditLog(prev, currentUserName, action, doc.name) : prev.auditLogs,
      };
    });
  }, [currentUserName]);

  const toggleRolePermission = useCallback((role: UserRole, key: string) => {
    setState((prev) => ({
      ...prev,
      rolePermissions: prev.rolePermissions.map((entry) =>
        entry.role === role
          ? { ...entry, permissions: { ...entry.permissions, [key]: !entry.permissions[key] } }
          : entry,
      ),
      auditLogs: withAuditLog(prev, currentUserName, "Updated role permissions", role),
    }));
  }, [currentUserName]);

  const setSecurityPolicy = useCallback((id: keyof SecurityPolicies, checked: boolean) => {
    setState((prev) => ({
      ...prev,
      securityPolicies: { ...prev.securityPolicies, [id]: checked },
      auditLogs: withAuditLog(prev, currentUserName, checked ? "Enabled security policy" : "Disabled security policy", id),
    }));
  }, [currentUserName]);

  const setOrgSettings = useCallback((settings: OrgSettings) => {
    setState((prev) => ({
      ...prev,
      orgSettings: settings,
      auditLogs: withAuditLog(prev, currentUserName, "Updated organization settings", settings.orgName),
    }));
  }, [currentUserName]);

  const value = useMemo<AppStoreValue>(
    () => ({
      agents,
      ...state,
      addWorkflow,
      setWorkflowStatus,
      deployAgent,
      setAgentOverride,
      setIntegrationStatus,
      addWebhook,
      removeWebhook,
      addUser,
      setUserRole,
      setUserStatus,
      addDocument,
      setDocumentStatus,
      toggleRolePermission,
      setSecurityPolicy,
      setOrgSettings,
    }),
    [
      agents,
      state,
      addWorkflow,
      setWorkflowStatus,
      deployAgent,
      setAgentOverride,
      setIntegrationStatus,
      addWebhook,
      removeWebhook,
      addUser,
      setUserRole,
      setUserStatus,
      addDocument,
      setDocumentStatus,
      toggleRolePermission,
      setSecurityPolicy,
      setOrgSettings,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error("useAppStore must be used within an AppStoreProvider");
  }
  return ctx;
}

export function resolveAgent(agent: Agent, overrides: Record<string, AgentOverride>): Agent {
  const override = overrides[agent.id];
  if (!override) return agent;
  return {
    ...agent,
    systemPrompt: override.systemPrompt ?? agent.systemPrompt,
    toolPermissions: override.toolPermissions ?? agent.toolPermissions,
    shortTermMemory: override.shortTermMemory ?? agent.shortTermMemory,
    longTermMemory: override.longTermMemory ?? agent.longTermMemory,
    status: override.status ?? agent.status,
    tasksCompleted: override.tasksCompleted ?? agent.tasksCompleted,
    successRate: override.successRate ?? agent.successRate,
    avgLatencyMs: override.avgLatencyMs ?? agent.avgLatencyMs,
    lastActive: override.lastActive ?? agent.lastActive,
    performance: override.performance ?? agent.performance,
  };
}
