"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ProfileForm() {
  const [name, setName] = useState("Admin User");
  const [email, setEmail] = useState("admin@nexxabyte.com");
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  function handleSave() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    const nextNameError = !trimmedName ? "Name is required." : null;
    const nextEmailError = !trimmedEmail
      ? "Email is required."
      : !EMAIL_PATTERN.test(trimmedEmail)
        ? "Enter a valid email address."
        : null;

    setNameError(nextNameError);
    setEmailError(nextEmailError);

    if (nextNameError || nextEmailError) {
      toast.error("Couldn't save profile", "Fix the highlighted fields and try again.");
      return;
    }

    toast.success("Profile saved", "Your account details have been updated.");
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="profile-name">Name</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={nameError ? true : undefined}
        />
        {nameError && <p className="text-xs text-destructive">{nameError}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-email">Email</Label>
        <Input
          id="profile-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={emailError ? true : undefined}
        />
        {emailError && <p className="text-xs text-destructive">{emailError}</p>}
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" onClick={handleSave}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
