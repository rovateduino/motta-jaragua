"use client";

import { formatQuantity, type SaleUnit } from "@motta/domain";
import { cn, MinusIcon, PlusIcon } from "@motta/ui";

interface QuantityStepperProps {
  value: number;
  min: number;
  max: number;
  step: number;
  unit: SaleUnit;
  productName: string;
  onChange: (next: number) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function QuantityStepper({
  value,
  min,
  max,
  step,
  unit,
  productName,
  onChange,
  disabled = false,
  size = "md",
  className,
}: QuantityStepperProps) {
  const canDecrease = !disabled && value - step >= min;
  const canIncrease = !disabled && value + step <= max;
  const buttonSize = size === "sm" ? "h-9 w-9" : "h-11 w-11";

  return (
    <div
      role="group"
      aria-label={`Quantidade de ${productName}`}
      className={cn(
        "inline-flex items-center rounded-xl border border-motta-gray-300 bg-white",
        className,
      )}
    >
      <button
        type="button"
        aria-label={`Diminuir quantidade de ${productName}`}
        className={cn(
          buttonSize,
          "inline-flex items-center justify-center rounded-l-[11px] text-motta-ink transition-colors hover:bg-motta-gray-100 disabled:cursor-not-allowed disabled:opacity-40",
        )}
        onClick={() => onChange(value - step)}
        disabled={!canDecrease}
      >
        <MinusIcon className="h-4 w-4" />
      </button>
      <span
        aria-live="polite"
        className={cn(
          "inline-flex min-w-20 items-center justify-center border-x border-motta-gray-200 px-2 text-center font-bold text-motta-ink",
          size === "sm" ? "h-9 text-xs" : "h-11 text-sm",
        )}
      >
        {formatQuantity(value, unit)}
      </span>
      <button
        type="button"
        aria-label={`Aumentar quantidade de ${productName}`}
        className={cn(
          buttonSize,
          "inline-flex items-center justify-center rounded-r-[11px] text-motta-ink transition-colors hover:bg-motta-gray-100 disabled:cursor-not-allowed disabled:opacity-40",
        )}
        onClick={() => onChange(value + step)}
        disabled={!canIncrease}
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
