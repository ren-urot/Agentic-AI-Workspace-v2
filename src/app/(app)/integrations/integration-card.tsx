"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { StatusBadge } from "@/components/shared/status-badge";
import type { Integration } from "@/lib/mock-data/types";

export function IntegrationCard({ integration }: { integration: Integration }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm">{integration.name}</CardTitle>
          <StatusBadge status={integration.status} />
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{integration.description}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setOpen(true)}>
            Configure
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure {integration.name}</DialogTitle>
            <DialogDescription>Category: {integration.category}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input id="api-key" placeholder="sk-••••••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint URL</Label>
              <Input id="endpoint" placeholder="https://api.example.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save connection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
