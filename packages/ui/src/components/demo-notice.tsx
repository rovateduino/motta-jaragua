import { cn } from "../cn";

export interface DemoNoticeProps {
  className?: string;
  compact?: boolean;
}

export function DemoNotice({ className, compact = false }: DemoNoticeProps) {
  return (
    <div
      role="note"
      className={cn(
        "bg-motta-ink text-white",
        compact ? "px-4 py-1.5 text-center text-[11px] font-medium" : "px-4 py-2 text-center text-xs",
        className,
      )}
    >
      <strong className="font-extrabold uppercase tracking-wide text-motta-yellow">Modo demonstração:</strong>{" "}
      dados fictícios, sem cobrança e sem envio real de pedidos.
    </div>
  );
}
