import { PageHeader } from "@/components/shared/page-header";
import { UploadDialog } from "./upload-dialog";
import { KnowledgeWorkspace } from "./knowledge-workspace";
import { getCurrentProfile } from "@/lib/db/profile";
import { getOrgDocuments } from "@/lib/db/documents";

export default async function KnowledgeBasePage() {
  const profile = await getCurrentProfile();
  const documents = profile ? await getOrgDocuments(profile.orgId) : [];

  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        description="Manage the documents and data sources your agents are trained on."
        actions={<UploadDialog />}
      />
      <KnowledgeWorkspace documents={documents} />
    </div>
  );
}
