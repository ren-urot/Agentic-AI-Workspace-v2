"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/lib/toast";
import { useAppStore } from "@/lib/store/app-store";

const EVENT_PATTERN = /^[a-z]+(\.[a-z]+)+$/;

function isValidWebhookUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function WebhookList() {
  const { webhooks, addWebhook, removeWebhook } = useAppStore();
  const [url, setUrl] = useState("");
  const [event, setEvent] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);

  function handleAdd() {
    const trimmedUrl = url.trim();
    const trimmedEvent = event.trim();

    const nextUrlError = !trimmedUrl
      ? "URL is required."
      : !isValidWebhookUrl(trimmedUrl)
        ? "Enter a valid http:// or https:// URL."
        : null;
    const nextEventError = !trimmedEvent
      ? "Event is required."
      : !EVENT_PATTERN.test(trimmedEvent)
        ? "Use lowercase, dot-separated segments, e.g. agent.task.completed."
        : null;

    setUrlError(nextUrlError);
    setEventError(nextEventError);
    if (nextUrlError || nextEventError) return;

    addWebhook({ id: crypto.randomUUID(), url: trimmedUrl, event: trimmedEvent, createdAt: new Date().toISOString() });
    setUrl("");
    setEvent("");
    setUrlError(null);
    setEventError(null);
    toast.success("Webhook added", trimmedUrl);
  }

  function handleRemove(id: string) {
    removeWebhook(id);
    toast.success("Webhook removed");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Webhooks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex-1 space-y-1">
            <Input
              placeholder="https://your-endpoint.com/webhook"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-invalid={urlError ? true : undefined}
            />
            {urlError && <p className="text-xs text-destructive">{urlError}</p>}
          </div>
          <div className="space-y-1 sm:max-w-xs sm:flex-1">
            <Input
              placeholder="Event (e.g. agent.task.completed)"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              aria-invalid={eventError ? true : undefined}
            />
            {eventError && <p className="text-xs text-destructive">{eventError}</p>}
          </div>
          <Button onClick={handleAdd}>
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
                  <p className="text-xs text-muted-foreground">
                    {new Date(webhook.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleRemove(webhook.id)} aria-label="Delete webhook">
                  <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
