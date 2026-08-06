"use client";

import { useAppStore } from "@/lib/store/app-store";
import { DocumentsTable } from "./documents-table";
import { ApprovalQueue } from "./approval-queue";

export function KnowledgeWorkspace() {
  const { documents, setDocumentStatus } = useAppStore();
  const pending = documents.filter((d) => d.status === "pending");

  return (
    <div className="space-y-8">
      <ApprovalQueue documents={pending} onDecision={setDocumentStatus} />
      <DocumentsTable documents={documents} />
    </div>
  );
}
