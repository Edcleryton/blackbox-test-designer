import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type Props = ComponentPropsWithoutRef<"span"> & {
  tone?: "neutral" | "teal" | "amber" | "red";
};

export function Badge({ className, tone = "neutral", ...props }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1",
        tone === "neutral" && "bg-zinc-900 text-zinc-200 ring-zinc-800",
        tone === "teal" && "bg-teal-500/10 text-teal-200 ring-teal-500/30",
        tone === "amber" && "bg-amber-500/10 text-amber-200 ring-amber-500/30",
        tone === "red" && "bg-red-500/10 text-red-200 ring-red-500/30",
        className
      )}
      {...props}
    />
  );
}

