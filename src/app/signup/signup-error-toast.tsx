"use client";

import { useEffect } from "react";
import { toast } from "@/lib/toast";

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Fill in every field to create your account.",
  email: "Enter a valid work email.",
  password: "Password must be at least 8 characters.",
  mismatch: "Passwords don't match.",
  exists: "This email has already been used to sign up. Try signing in instead.",
  unknown: "Couldn't reach the server. Check your connection and try again.",
};

export function SignupErrorToast({ error }: { error?: string }) {
  useEffect(() => {
    if (error && ERROR_MESSAGES[error]) {
      toast.error("Couldn't create account", ERROR_MESSAGES[error]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  return null;
}
