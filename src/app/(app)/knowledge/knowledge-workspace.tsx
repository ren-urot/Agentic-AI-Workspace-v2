"use client";

import { useTransition } from "react";
import { DocumentsTable } from "./documents-table";
import { ApprovalQueue } from "./approval-queue";
import { setDocumentStatus } from "./actions";
import { toast } from "@/lib/toast";
import type { DocumentStatus, KnowledgeDocument } from "@/lib/mock-data/types";

export function KnowledgeWorkspace({ documents }: { documents: KnowledgeDocument[] }) {
  const [, startTransition] = useTransition();
  const pending = documents.filter((d) => d.status === "pending");

  function handleDecision(id: string, status: DocumentStatus) {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;
    startTransition(async () => {
      try {
        await setDocumentStatus(id, status, doc.name);
        if (status === "approved") {
          toast.success("Document approved", doc.name);
        } else if (status === "rejected") {
          toast.error("Document rejected", doc.name);
        }
      } catch {
        toast.error("Couldn't update document", "Please try again.");
      }
    });
  }

  return (
    <div className="space-y-8">
      <ApprovalQueue documents={pending} onDecision={handleDecision} />
      <DocumentsTable documents={documents} />
    </div>
  );
}
