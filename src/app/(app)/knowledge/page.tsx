import { getDocuments } from "@/lib/mock-data/knowledge";
import { isNewOrg } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { UploadDialog } from "./upload-dialog";
import { KnowledgeWorkspace } from "./knowledge-workspace";

export default async function KnowledgeBasePage() {
  const [documents, newOrg] = await Promise.all([getDocuments(), isNewOrg()]);

  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        description="Manage the documents and data sources your agents are trained on."
        actions={<UploadDialog />}
      />
      <KnowledgeWorkspace initialDocuments={newOrg ? [] : documents} />
    </div>
  );
}
