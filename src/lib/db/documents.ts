import { createClient } from "@/lib/supabase/server";
import type { KnowledgeDocument } from "@/lib/mock-data/types";

export async function getOrgDocuments(orgId: string): Promise<KnowledgeDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, name, source_type, version, status, updated_at, keywords")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    sourceType: row.source_type as KnowledgeDocument["sourceType"],
    version: row.version,
    status: row.status as KnowledgeDocument["status"],
    updatedAt: row.updated_at,
    keywords: row.keywords ?? [],
  }));
}
