import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-11 w-full rounded-xl border border-motta-gray-300 bg-white px-4 text-sm text-motta-ink",
        "placeholder:text-motta-gray-500 focus-visible:border-motta-red focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-motta-red/30 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
});
