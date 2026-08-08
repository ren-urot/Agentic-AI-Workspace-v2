"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Demo mode: the signup form is a live product walkthrough, not real account
// creation. It validates input like a real signup, then drops the visitor
// into the pre-seeded demo workspace -- no Supabase signup/email API is
// ever called, so there is no confirmation email and no rate limit.
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

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: "demo@nexxabyte.com",
    password: process.env.DEMO_ACCOUNT_PASSWORD!,
  });
  if (signInError) {
    redirect("/signup?error=unknown");
  }

  redirect("/dashboard?welcome=1");
}
