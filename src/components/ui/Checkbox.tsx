import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type Props = ComponentPropsWithoutRef<"input"> & {
  label: string;
};

export function Checkbox({ label, className, ...props }: Props) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-2 text-sm", className)}>
      <input type="checkbox" className="size-4 accent-teal-500" {...props} />
      <span className="text-zinc-100">{label}</span>
    </label>
  );
}

