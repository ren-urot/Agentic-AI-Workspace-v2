"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toastManager } from "@/lib/toast";

const TYPE_STYLES: Record<string, string> = {
  success:
    "border-emerald-500/30 bg-emerald-50 text-emerald-900 [&_svg]:text-emerald-600 dark:bg-emerald-950 dark:text-emerald-100 dark:[&_svg]:text-emerald-400",
  error:
    "border-destructive/30 bg-red-50 text-red-900 [&_svg]:text-red-600 dark:bg-red-950 dark:text-red-100 dark:[&_svg]:text-red-400",
  warning:
    "border-amber-500/30 bg-amber-50 text-amber-900 [&_svg]:text-amber-600 dark:bg-amber-950 dark:text-amber-100 dark:[&_svg]:text-amber-400",
  info: "border-blue-500/30 bg-blue-50 text-blue-900 [&_svg]:text-blue-600 dark:bg-blue-950 dark:text-blue-100 dark:[&_svg]:text-blue-400",
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager();

  return (
    <>
      {toasts.map((t) => {
        const Icon = TYPE_ICONS[t.type ?? "info"] ?? Info;
        return (
          <ToastPrimitive.Root
            key={t.id}
            toast={t}
            className={cn(
              "relative flex w-[356px] items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-200",
              "data-[starting-style]:translate-x-[calc(100%+1rem)] data-[starting-style]:opacity-0",
              "data-[ending-style]:translate-x-[calc(100%+1rem)] data-[ending-style]:opacity-0",
              TYPE_STYLES[t.type ?? "info"]
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <ToastPrimitive.Content className="flex-1 space-y-0.5">
              {t.title && <ToastPrimitive.Title className="text-sm font-medium">{t.title}</ToastPrimitive.Title>}
              {t.description && (
                <ToastPrimitive.Description className="text-xs opacity-80">{t.description}</ToastPrimitive.Description>
              )}
            </ToastPrimitive.Content>
            <ToastPrimitive.Close
              className="shrink-0 rounded-md opacity-60 transition-opacity hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        );
      })}
    </>
  );
}

export function Toaster() {
  return (
    <ToastPrimitive.Provider toastManager={toastManager}>
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-100 flex flex-col gap-2 outline-none">
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  );
}
