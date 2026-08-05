"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import type { OrgUser, UserRole } from "@/lib/mock-data/types";

const ROLES: UserRole[] = ["Admin", "Manager", "Operator", "Viewer"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteUserDialog({ onInvite }: { onInvite: (user: OrgUser) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("Viewer");
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  function handleInvite() {
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
    if (nextNameError || nextEmailError) return;

    onInvite({
      id: crypto.randomUUID(),
      name: trimmedName,
      email: trimmedEmail,
      role,
      status: "invited",
    });
    toast.success("Invitation sent", `${trimmedEmail} has been invited as ${role}.`);
    setName("");
    setEmail("");
    setRole("Viewer");
    setNameError(null);
    setEmailError(null);
    setOpen(false);
  }

  return (
    <>
      <Button size="sm" className="h-auto p-4 text-[14px]" onClick={() => setOpen(true)}>
        <UserPlus className="mr-2 h-4 w-4" />
        Invite user
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a user</DialogTitle>
            <DialogDescription>Send an invitation to join this workspace.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Name</Label>
              <Input
                id="invite-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={nameError ? true : undefined}
              />
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={emailError ? true : undefined}
              />
              {emailError && <p className="text-xs text-destructive">{emailError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite}>Send invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
