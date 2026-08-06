import { cookies } from "next/headers";

export const SESSION_COOKIE = "nexxabyte_session";
export const NEW_ORG_COOKIE = "nexxabyte_new_org";
export const NEW_ORG_NAME_COOKIE = "nexxabyte_new_org_name";

export async function isNewOrg(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(NEW_ORG_COOKIE)?.value === "1";
}

export async function getCurrentUser(): Promise<{ email: string; name: string } | null> {
  const cookieStore = await cookies();
  const email = cookieStore.get(SESSION_COOKIE)?.value;
  if (!email) return null;
  const name = cookieStore.get(NEW_ORG_NAME_COOKIE)?.value || email;
  return { email, name };
}
