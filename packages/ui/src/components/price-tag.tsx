import { cn } from "../cn";

export interface PriceTagProps {
  /** Preço já formatado (ex.: "R$ 24,90"). */
  price: string;
  /** Preço original riscado, quando houver oferta. */
  originalPrice?: string;
  unitLabel?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const priceSizes = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
} as const;

export function PriceTag({
  price,
  originalPrice,
  unitLabel,
  size = "md",
  className,
}: PriceTagProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {originalPrice ? (
        <span className="text-xs font-medium text-motta-gray-500 line-through" aria-label="Preço original">
          {originalPrice}
        </span>
      ) : null}
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className={cn("font-extrabold leading-none text-motta-red", priceSizes[size])}>
          {price}
        </span>
        {unitLabel ? (
          <span className="text-xs font-medium text-motta-gray-500">{unitLabel}</span>
        ) : null}
      </span>
    </div>
  );
}
