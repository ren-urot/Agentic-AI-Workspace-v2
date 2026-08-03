"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Webhook } from "@/lib/mock-data/types";

export function WebhookList({ initialWebhooks }: { initialWebhooks: Webhook[] }) {
  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const [url, setUrl] = useState("");
  const [event, setEvent] = useState("");

  function addWebhook() {
    if (!url.trim() || !event.trim()) return;
    setWebhooks((prev) => [
      { id: crypto.randomUUID(), url: url.trim(), event: event.trim(), createdAt: new Date().toISOString() },
      ...prev,
    ]);
    setUrl("");
    setEvent("");
  }

  function removeWebhook(id: string) {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Webhooks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="https://your-endpoint.com/webhook"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Input
            placeholder="Event (e.g. agent.task.completed)"
            value={event}
            onChange={(e) => setEvent(e.target.value)}
            className="sm:max-w-xs"
          />
          <Button onClick={addWebhook} disabled={!url.trim() || !event.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
        {webhooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No webhooks configured.</p>
        ) : (
          <div className="space-y-2">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div>
                  <p className="font-medium">{webhook.url}</p>
                  <p className="text-xs text-muted-foreground">{webhook.event}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeWebhook(webhook.id)} aria-label="Delete webhook">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
