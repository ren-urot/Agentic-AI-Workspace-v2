"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NEW_ORG_COOKIE, NEW_ORG_NAME_COOKIE, SESSION_COOKIE } from "@/lib/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!name || !email || !password || !confirmPassword) {
    redirect("/signup?error=missing");
  }
  if (!EMAIL_PATTERN.test(email)) {
    redirect("/signup?error=email");
  }
  if (password.length < 8) {
    redirect("/signup?error=password");
  }
  if (password !== confirmPassword) {
    redirect("/signup?error=mismatch");
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  cookieStore.set(NEW_ORG_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  cookieStore.set(NEW_ORG_NAME_COOKIE, name, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/dashboard?welcome=1");
}
