import Link from "next/link";
import { Container } from "@motta/ui";
import { footerColumns } from "@/lib/site";
import type { StoreSettings } from "@/lib/orders-db";
import { Logo } from "./logo";

export function SiteFooter({
  storeSettings,
}: {
  storeSettings: StoreSettings | null;
}) {
  const address = storeSettings
    ? [
        storeSettings.addressLine,
        storeSettings.district,
        [storeSettings.city, storeSettings.state].filter(Boolean).join("/"),
        storeSettings.zipCode && `CEP ${storeSettings.zipCode}`,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <footer className="mt-12 bg-motta-ink text-white">
      <Container className="py-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Logo inverted />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              Plataforma de compras online do Mercado Motta Jaraguá, com ofertas,
              produtos e atendimento para toda a família.
            </p>
            {storeSettings ? (
              <address className="mt-4 space-y-2 text-xs not-italic leading-relaxed text-white/70">
                <p className="font-bold text-white">{storeSettings.storeName}</p>
                {address ? <p>{address}</p> : null}
                {storeSettings.phone ? (
                  <p>
                    Telefone:{" "}
                    <a
                      href={`tel:${storeSettings.phone.replace(/[^\d+]/g, "")}`}
                      className="hover:text-white hover:underline"
                    >
                      {storeSettings.phone}
                    </a>
                  </p>
                ) : null}
                {storeSettings.hours ? <p>Horário: {storeSettings.hours}</p> : null}
              </address>
            ) : null}
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h2 className="text-xs font-bold uppercase tracking-widest text-motta-yellow">
                {column.title}
              </h2>
              <ul className="mt-3 space-y-2">
                {column.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/75 transition-colors hover:text-white hover:underline hover:underline-offset-2"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs leading-relaxed text-white/50">
          <p>
            © {new Date().getFullYear()} Mercado Motta Jaraguá. Todos os direitos
            reservados.
          </p>
        </div>
      </Container>
    </footer>
  );
}
