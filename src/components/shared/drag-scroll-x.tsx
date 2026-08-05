"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

const DRAG_THRESHOLD_PX = 5;

export function DragScrollX({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef({ dragging: false, moved: false, startX: 0, startScrollLeft: 0 });

  function onPointerMove(e: PointerEvent) {
    const el = ref.current;
    if (!el || !state.current.dragging) return;
    const delta = e.clientX - state.current.startX;
    if (Math.abs(delta) > DRAG_THRESHOLD_PX) state.current.moved = true;
    el.scrollLeft = state.current.startScrollLeft - delta;
  }

  function onPointerUp() {
    state.current.dragging = false;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || e.button !== 0) return;
    state.current = { dragging: true, moved: false, startX: e.clientX, startScrollLeft: el.scrollLeft };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (state.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      state.current.moved = false;
    }
  }

  return (
    <div
      ref={ref}
      className={cn(
        "cursor-grab overflow-x-auto overflow-y-hidden [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden",
        className
      )}
      onPointerDown={onPointerDown}
      onClickCapture={onClickCapture}
    >
      {children}
    </div>
  );
}
