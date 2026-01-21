import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type Props = ComponentPropsWithoutRef<"div">;

export function Card({ className, ...props }: Props) {
  return <div className={cn("rounded-2xl bg-zinc-950 ring-1 ring-zinc-800", className)} {...props} />;
}

