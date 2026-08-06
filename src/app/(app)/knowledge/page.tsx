import { PageHeader } from "@/components/shared/page-header";
import { UploadDialog } from "./upload-dialog";
import { KnowledgeWorkspace } from "./knowledge-workspace";

export default function KnowledgeBasePage() {
  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        description="Manage the documents and data sources your agents are trained on."
        actions={<UploadDialog />}
      />
      <KnowledgeWorkspace />
    </div>
  );
}
