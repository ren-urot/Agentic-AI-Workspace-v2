"use client";

import { useEffect } from "react";
import { toast } from "@/lib/toast";

export function WelcomeToast({ show }: { show: boolean }) {
  useEffect(() => {
    if (show) {
      toast.success(
        "Your admin account is ready",
        "Head to Administration → Users to invite your team.",
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  return null;
}
