import * as React from "react";
import { cn } from "@/lib/utils";

export function DropdownMenu({ children }) {
  return <div className="relative inline-block text-left">{children}</div>;
}

export function DropdownMenuTrigger({ children, ...props }) {
  return <div {...props}>{children}</div>;
}

export function DropdownMenuContent({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "absolute right-0 z-50 mt-2 w-48 rounded-xl border border-border bg-card p-1 shadow-xl animate-fade-in",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ children, className, onClick, ...props }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
