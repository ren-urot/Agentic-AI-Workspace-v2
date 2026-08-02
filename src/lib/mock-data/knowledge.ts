import { delay } from "@/lib/mock-data/delay";
import type { DocumentSourceType, DocumentStatus, KnowledgeDocument } from "@/lib/mock-data/types";

const SOURCES: DocumentSourceType[] = ["PDF", "Word", "Excel", "CSV", "Website", "SharePoint", "Google Drive", "Notion", "Confluence", "Database"];
const STATUSES: DocumentStatus[] = ["approved", "approved", "pending", "approved", "rejected"];

const DOCUMENTS: KnowledgeDocument[] = [
  "Employee Handbook 2026", "Sales Playbook Q3", "ERP Integration Spec", "Compliance Policy — GDPR", "Vendor Onboarding Guide",
  "Customer Support FAQ", "Product Catalog Export", "HR Benefits Summary", "Incident Response Runbook", "Procurement Approval Matrix",
].map((name, i) => ({
  id: String(i + 1),
  name,
  sourceType: SOURCES[i % SOURCES.length],
  version: 1 + (i % 4),
  status: STATUSES[i % STATUSES.length],
  updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
  keywords: name.toLowerCase().split(" ").filter((w) => w.length > 3),
}));

export async function getDocuments(): Promise<KnowledgeDocument[]> {
  return delay(DOCUMENTS);
}
