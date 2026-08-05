import { Toast } from "@base-ui/react/toast";

export const toastManager = Toast.createToastManager();

type ToastType = "success" | "error" | "info" | "warning";

function show(type: ToastType, title: string, description?: string) {
  toastManager.add({ type, title, description });
}

export const toast = {
  success: (title: string, description?: string) => show("success", title, description),
  error: (title: string, description?: string) => show("error", title, description),
  info: (title: string, description?: string) => show("info", title, description),
  warning: (title: string, description?: string) => show("warning", title, description),
};
