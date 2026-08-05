"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "@/lib/toast";
import type { DocumentStatus, KnowledgeDocument } from "@/lib/mock-data/types";

export function ApprovalQueue({
  documents,
  onDecision,
}: {
  documents: KnowledgeDocument[];
  onDecision: (id: string, status: DocumentStatus) => void;
}) {
  if (documents.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Content Approval Queue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.id} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">{doc.name}</p>
              <p className="text-xs text-muted-foreground">
                {doc.sourceType} · v{doc.version}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={doc.status} />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onDecision(doc.id, "rejected");
                  toast.error("Document rejected", doc.name);
                }}
              >
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onDecision(doc.id, "approved");
                  toast.success("Document approved", doc.name);
                }}
              >
                Approve
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
