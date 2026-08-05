"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

export function PasswordInput({ id, name }: { id: string; name: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-[calc(100%+19px)] -mx-[9.5px]">
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        placeholder="••••••••"
        required
        className="h-[42px] w-full rounded-[9.6px] pr-10"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
