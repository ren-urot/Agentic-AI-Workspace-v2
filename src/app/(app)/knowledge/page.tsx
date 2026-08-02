import { getDocuments } from "@/lib/mock-data/knowledge";
import { PageHeader } from "@/components/shared/page-header";
import { UploadDialog } from "./upload-dialog";
import { DocumentsTable } from "./documents-table";

export default async function KnowledgeBasePage() {
  const documents = await getDocuments();

  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        description="Manage the documents and data sources your agents are trained on."
        actions={<UploadDialog />}
      />
      <DocumentsTable documents={documents} />
    </div>
  );
}
