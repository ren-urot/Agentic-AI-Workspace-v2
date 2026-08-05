"use client";

import { useEffect } from "react";
import { toast } from "@/lib/toast";

export function LoginErrorToast({ hasError }: { hasError: boolean }) {
  useEffect(() => {
    if (hasError) {
      toast.error("Sign in failed", "Enter both an email and password.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasError]);

  return null;
}
