"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { signup_type: "self", name } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      redirect("/signup?error=exists");
    }
    redirect("/signup?error=unknown");
  }

  redirect("/dashboard?welcome=1");
}
