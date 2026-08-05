"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface SidebarCollapseContextValue {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarCollapseContext = createContext<SidebarCollapseContextValue | null>(null);

export function SidebarCollapseProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarCollapseContext.Provider value={{ collapsed, toggle: () => setCollapsed((c) => !c) }}>
      {children}
    </SidebarCollapseContext.Provider>
  );
}

export function useSidebarCollapse(): SidebarCollapseContextValue {
  const ctx = useContext(SidebarCollapseContext);
  if (!ctx) {
    throw new Error("useSidebarCollapse must be used within a SidebarCollapseProvider");
  }
  return ctx;
}
