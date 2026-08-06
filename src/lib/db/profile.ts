import { createClient } from "@/lib/supabase/server";

export interface CurrentProfile {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, org_id, name, email, role, status")
    .eq("id", user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // no matching row — legitimate "no profile"
    throw new Error(`Failed to load current profile: ${error.message}`);
  }
  if (!data) return null;

  return {
    id: data.id,
    orgId: data.org_id,
    name: data.name,
    email: data.email,
    role: data.role,
    status: data.status,
  };
}
