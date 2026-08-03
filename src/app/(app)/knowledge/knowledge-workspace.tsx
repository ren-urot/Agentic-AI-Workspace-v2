"use client";

import { useState } from "react";
import type { DocumentStatus, KnowledgeDocument } from "@/lib/mock-data/types";
import { DocumentsTable } from "./documents-table";
import { ApprovalQueue } from "./approval-queue";

export function KnowledgeWorkspace({ initialDocuments }: { initialDocuments: KnowledgeDocument[] }) {
  const [documents, setDocuments] = useState(initialDocuments);

  function updateStatus(id: string, status: DocumentStatus) {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
  }

  const pending = documents.filter((d) => d.status === "pending");

  return (
    <div className="space-y-8">
      <ApprovalQueue documents={pending} onDecision={updateStatus} />
      <DocumentsTable documents={documents} />
    </div>
  );
}
