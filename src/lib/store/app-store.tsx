"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  Agent,
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
}

export interface AppStoreSeed {
  workflows: WorkflowSummary[];
  deployedAgentIds: string[];
  integrations: Integration[];
  webhooks: Webhook[];
  users: OrgUser[];
  documents: KnowledgeDocument[];
  rolePermissions: RolePermissions[];
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
  children,
}: {
  seed: AppStoreSeed;
  agents: Agent[];
  sessionKey: string;
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState((prev) => ({ ...prev, ...parsed }));
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
      return { ...prev, workflows: [workflow, ...prev.workflows], deployedAgentIds, agentOverrides };
    });
  }, []);

  const setWorkflowStatus = useCallback((id: string, status: WorkflowStatus) => {
    setState((prev) => ({
      ...prev,
      workflows: prev.workflows.map((wf) => (wf.id === id ? { ...wf, status } : wf)),
    }));
  }, []);

  const setAgentOverride = useCallback((id: string, override: Partial<AgentOverride>) => {
    setState((prev) => ({
      ...prev,
      agentOverrides: { ...prev.agentOverrides, [id]: { ...prev.agentOverrides[id], ...override } },
    }));
  }, []);

  const setIntegrationStatus = useCallback((id: string, status: IntegrationStatus) => {
    setState((prev) => ({
      ...prev,
      integrations: prev.integrations.map((i) => (i.id === id ? { ...i, status } : i)),
    }));
  }, []);

  const addWebhook = useCallback((webhook: Webhook) => {
    setState((prev) => ({ ...prev, webhooks: [webhook, ...prev.webhooks] }));
  }, []);

  const removeWebhook = useCallback((id: string) => {
    setState((prev) => ({ ...prev, webhooks: prev.webhooks.filter((w) => w.id !== id) }));
  }, []);

  const addUser = useCallback((user: OrgUser) => {
    setState((prev) => ({ ...prev, users: [user, ...prev.users] }));
  }, []);

  const setUserRole = useCallback((id: string, role: UserRole) => {
    setState((prev) => ({ ...prev, users: prev.users.map((u) => (u.id === id ? { ...u, role } : u)) }));
  }, []);

  const setUserStatus = useCallback((id: string, status: UserStatus) => {
    setState((prev) => ({ ...prev, users: prev.users.map((u) => (u.id === id ? { ...u, status } : u)) }));
  }, []);

  const addDocument = useCallback((doc: KnowledgeDocument) => {
    setState((prev) => ({ ...prev, documents: [doc, ...prev.documents] }));
  }, []);

  const setDocumentStatus = useCallback((id: string, status: DocumentStatus) => {
    setState((prev) => ({ ...prev, documents: prev.documents.map((d) => (d.id === id ? { ...d, status } : d)) }));
  }, []);

  const toggleRolePermission = useCallback((role: UserRole, key: string) => {
    setState((prev) => ({
      ...prev,
      rolePermissions: prev.rolePermissions.map((entry) =>
        entry.role === role
          ? { ...entry, permissions: { ...entry.permissions, [key]: !entry.permissions[key] } }
          : entry,
      ),
    }));
  }, []);

  const setSecurityPolicy = useCallback((id: keyof SecurityPolicies, checked: boolean) => {
    setState((prev) => ({ ...prev, securityPolicies: { ...prev.securityPolicies, [id]: checked } }));
  }, []);

  const setOrgSettings = useCallback((settings: OrgSettings) => {
    setState((prev) => ({ ...prev, orgSettings: settings }));
  }, []);

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
