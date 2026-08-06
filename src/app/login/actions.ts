"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NEW_ORG_COOKIE, NEW_ORG_NAME_COOKIE, SESSION_COOKIE } from "@/lib/auth";

export async function login(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password) {
    redirect("/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, String(email), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  cookieStore.delete(NEW_ORG_COOKIE);
  cookieStore.delete(NEW_ORG_NAME_COOKIE);

  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(NEW_ORG_COOKIE);
  cookieStore.delete(NEW_ORG_NAME_COOKIE);
  redirect("/login");
}
