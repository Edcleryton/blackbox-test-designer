import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";
import { Field } from "@/components/ui/Field";

type Props = ComponentPropsWithoutRef<"input"> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, className, ...props }: Props) {
  return (
    <Field label={label} hint={hint} error={error}>
      <input
        className={cn(
          "h-9 w-full rounded-lg bg-zinc-900 px-3 text-sm text-zinc-100 ring-1 ring-zinc-800",
          "placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500/60",
          className
        )}
        {...props}
      />
    </Field>
  );
}

