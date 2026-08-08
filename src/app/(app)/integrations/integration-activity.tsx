import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IntegrationActivityEntry } from "@/lib/db/integrations";

const ACTION_COLOR: Record<string, string> = {
  "Connected integration": "bg-emerald-500",
  "Disconnected integration": "bg-muted-foreground",
  "Added webhook": "bg-emerald-500",
  "Removed webhook": "bg-muted-foreground",
};

export function IntegrationActivity({ activity }: { activity: IntegrationActivityEntry[] }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-sm">Integration Activity</CardTitle>
      </CardHeader>
      <CardContent className="mt-1.5 space-y-4">
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No activity yet — connect an integration or add a webhook to see it here.
          </p>
        ) : (
          activity.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <span
                className={`size-2 shrink-0 rounded-full ${ACTION_COLOR[item.action] ?? "bg-muted-foreground"}`}
                aria-hidden="true"
              />
              <div className="flex flex-1 items-center justify-between gap-4">
                <span>
                  <span className="font-medium">{item.actor}</span>{" "}
                  <span className="text-muted-foreground">
                    {item.action.toLowerCase()} <span className="font-medium text-foreground">{item.resource}</span>
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
