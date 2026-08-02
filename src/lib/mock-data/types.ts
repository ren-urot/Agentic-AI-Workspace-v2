export type AgentStatus = "active" | "idle" | "error";

export type AgentType =
  | "sales"
  | "customer-service"
  | "hr"
  | "recruitment"
  | "procurement"
  | "finance"
  | "compliance"
  | "operations"
  | "executive-assistant"
  | "knowledge-assistant"
  | "it-helpdesk";

export interface ToolPermission {
  tool: string;
  enabled: boolean;
}

export interface MemoryEntry {
  key: string;
  value: string;
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  description: string;
  lastActive: string;
  tasksCompleted: number;
  successRate: number;
  avgLatencyMs: number;
  systemPrompt: string;
  toolPermissions: ToolPermission[];
  shortTermMemory: MemoryEntry[];
  longTermMemory: MemoryEntry[];
  performance: ChartPoint[];
}

export type TrendDirection = "up" | "down" | "flat";

export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  delta: number;
  trend: TrendDirection;
}

export interface ActivityItem {
  id: string;
  agentName: string;
  action: string;
  timestamp: string;
}

export type AlertSeverity = "info" | "warning" | "critical";

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export type DocumentSourceType =
  | "PDF"
  | "Word"
  | "Excel"
  | "CSV"
  | "Website"
  | "SharePoint"
  | "Google Drive"
  | "Notion"
  | "Confluence"
  | "Database";

export type DocumentStatus = "approved" | "pending" | "rejected";

export interface KnowledgeDocument {
  id: string;
  name: string;
  sourceType: DocumentSourceType;
  version: number;
  status: DocumentStatus;
  updatedAt: string;
  keywords: string[];
}

export type WorkflowStatus = "active" | "draft" | "paused";

export interface WorkflowSummary {
  id: string;
  name: string;
  status: WorkflowStatus;
  lastRun: string;
  successRate: number;
}

export type IntegrationCategory = "CRM" | "ERP" | "Communication" | "Identity" | "Custom API";
export type IntegrationStatus = "connected" | "disconnected" | "error";

export interface Integration {
  id: string;
  name: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  description: string;
}

export type UserRole = "Admin" | "Manager" | "Operator" | "Viewer";
export type UserStatus = "active" | "invited" | "disabled";

export interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  resource: string;
  timestamp: string;
}
