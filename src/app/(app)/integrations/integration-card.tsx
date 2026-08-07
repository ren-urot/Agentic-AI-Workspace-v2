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
import { toast } from "@/lib/toast";
import type { Integration } from "@/lib/mock-data/types";

function isValidEndpointUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
}: {
  integration: Integration;
  onConnect: (id: string) => Promise<void>;
  onDisconnect: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [endpointError, setEndpointError] = useState<string | null>(null);

  function reset() {
    setApiKey("");
    setEndpoint("");
    setApiKeyError(null);
    setEndpointError(null);
  }

  async function handleSave() {
    const trimmedKey = apiKey.trim();
    const trimmedEndpoint = endpoint.trim();

    const nextApiKeyError = !trimmedKey ? "API key is required." : null;
    const nextEndpointError = !trimmedEndpoint
      ? "Endpoint URL is required."
      : !isValidEndpointUrl(trimmedEndpoint)
        ? "Enter a valid http:// or https:// URL."
        : null;

    setApiKeyError(nextApiKeyError);
    setEndpointError(nextEndpointError);
    if (nextApiKeyError || nextEndpointError) {
      toast.error("Couldn't save connection", "Fix the highlighted fields and try again.");
      return;
    }

    try {
      await onConnect(integration.id);
      toast.success(`${integration.name} connected`, trimmedEndpoint);
      setOpen(false);
      reset();
    } catch {
      toast.error(`Couldn't connect ${integration.name}`, "Please try again.");
    }
  }

  async function handleDisconnect() {
    try {
      await onDisconnect(integration.id);
      toast.success(`${integration.name} disconnected`);
    } catch {
      toast.error(`Couldn't disconnect ${integration.name}`, "Please try again.");
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm">{integration.name}</CardTitle>
          <StatusBadge status={integration.status} />
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{integration.description}</p>
          <div className="mt-3 flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              Configure
            </Button>
            {integration.status === "connected" && (
              <Button variant="ghost" size="sm" onClick={handleDisconnect}>
                Disconnect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure {integration.name}</DialogTitle>
            <DialogDescription>Category: {integration.category}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                placeholder="sk-••••••••••••"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                aria-invalid={apiKeyError ? true : undefined}
              />
              {apiKeyError && <p className="text-xs text-destructive">{apiKeyError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint URL</Label>
              <Input
                id="endpoint"
                placeholder="https://api.example.com"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                aria-invalid={endpointError ? true : undefined}
              />
              {endpointError && <p className="text-xs text-destructive">{endpointError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save connection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
