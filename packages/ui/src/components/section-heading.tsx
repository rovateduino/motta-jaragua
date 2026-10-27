import type { ReactNode } from "react";
import { cn } from "../cn";

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  id?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
  id,
}: SectionHeadingProps) {
  return (
    <div className={cn("mb-5 flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-widest text-motta-red">{eyebrow}</p>
        ) : null}
        <h2 id={id} className="text-xl font-extrabold tracking-tight text-motta-ink sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-motta-gray-500">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
