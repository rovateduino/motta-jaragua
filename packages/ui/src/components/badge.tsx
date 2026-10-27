import type { HTMLAttributes } from "react";
import { cn } from "../cn";

export type BadgeVariant = "offer" | "neutral" | "success" | "danger" | "demo";

const variants: Record<BadgeVariant, string> = {
  offer: "bg-motta-yellow text-motta-ink",
  neutral: "bg-motta-gray-100 text-motta-gray-700",
  success: "bg-green-100 text-green-800",
  danger: "bg-red-100 text-motta-red-dark",
  demo: "bg-motta-ink text-white",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
