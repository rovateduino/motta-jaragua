import Link from "next/link";
import { cn } from "@motta/ui";

export interface LogoProps {
  inverted?: boolean;
  className?: string;
}

export function Logo({ inverted = false, className }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="Mercado Motta Jaraguá — página inicial"
      className={cn("inline-flex flex-col leading-none", className)}
    >
      <span
        className={cn(
          "text-[10px] font-bold tracking-[0.38em]",
          inverted ? "text-white/90" : "text-motta-ink",
        )}
      >
        MERCADO
      </span>
      <span className="text-3xl font-black italic tracking-tight text-motta-red sm:text-4xl">
        MOTTA
      </span>
      <span
        className={cn(
          "mt-0.5 text-[9px] font-semibold tracking-[0.14em]",
          inverted ? "text-white/70" : "text-motta-gray-500",
        )}
      >
        JARAGUÁ • PERTO DE VOCÊ
      </span>
    </Link>
  );
}
