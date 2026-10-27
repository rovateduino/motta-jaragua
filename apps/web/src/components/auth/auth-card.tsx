import type { ReactNode } from "react";
import Link from "next/link";
import { Card, CardBody, ShieldCheckIcon } from "@motta/ui";

export function AuthCard({
  title,
  description,
  eyebrow,
  children,
  footer,
}: {
  title: string;
  description: string;
  eyebrow: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-motta-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mx-auto mb-6 flex w-fit flex-col items-center leading-none"
          aria-label="Voltar para a loja"
        >
          <span className="text-[10px] font-bold tracking-[0.32em] text-motta-gray-500">
            MERCADO
          </span>
          <span className="mt-1 text-4xl font-black italic tracking-tight text-motta-red">
            MOTTA
          </span>
          <span className="mt-1 h-1 w-12 rounded-full bg-motta-yellow" />
        </Link>

        <Card className="overflow-hidden">
          <div className="h-1.5 bg-motta-red" />
          <CardBody className="p-6 sm:p-8">
            <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-motta-red">
              <ShieldCheckIcon className="h-4 w-4" />
              {eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-motta-ink">
              {title}
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-motta-gray-500">
              {description}
            </p>
            <div className="mt-6">{children}</div>
          </CardBody>
        </Card>

        {footer ? (
          <div className="mt-5 text-center text-xs leading-relaxed text-motta-gray-500">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
