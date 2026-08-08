"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { signup_type: "self", name },
  });

  if (createError) {
    if (createError.message.toLowerCase().includes("already registered")) {
      redirect("/signup?error=exists");
    }
    redirect("/signup?error=unknown");
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    redirect("/login");
  }

  redirect("/dashboard?welcome=1");
}
