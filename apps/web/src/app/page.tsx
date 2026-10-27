import Link from "next/link";
import {
  ArrowRightIcon,
  Badge,
  buttonStyles,
  Card,
  CardBody,
  cn,
  Container,
  HeadsetIcon,
  SectionHeading,
  ShieldCheckIcon,
  StoreIcon,
  TruckIcon,
} from "@motta/ui";
import { formatBRL } from "@motta/domain";
import { CategoryCard } from "@/components/category-card";
import { CatalogMaintenance } from "@/components/catalog/catalog-maintenance";
import { HomeStoreSections } from "@/components/home/store-sections";
import { findStoreProduct, getStoreCatalog } from "@/lib/catalog-db";
import { hasPromotion, resolveProductImageUrl } from "@/lib/catalog-core";

export const dynamic = "force-dynamic";

const trustItems = [
  {
    icon: TruckIcon,
    title: "Entrega em domicílio",
    description: "Consulte as condições de entrega ao finalizar seu pedido.",
  },
  {
    icon: StoreIcon,
    title: "Retirada na loja",
    description: "Escolha uma janela disponível para retirar seu pedido.",
  },
  {
    icon: HeadsetIcon,
    title: "Atendimento próximo",
    description: "Encontre as informações de contato da loja no rodapé.",
  },
];

export default async function HomePage() {
  const catalog = await getStoreCatalog();
  const featured = catalog
    ? findStoreProduct(catalog, "arroz-tipo-1-5kg")
    : undefined;
  const featuredImageUrl = featured
    ? resolveProductImageUrl(featured)
    : null;
  const featuredCategory = catalog?.categories.find(
    (category) => category.slug === featured?.categorySlug,
  );

  return (
    <>
      <section
        aria-labelledby="hero-title"
        className="relative overflow-hidden bg-gradient-to-br from-motta-red via-motta-red to-motta-red-dark text-white"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-16 h-64 w-64 rounded-full bg-motta-yellow/20 blur-3xl"
        />

        <Container className="relative grid gap-8 py-10 sm:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="animate-fade-up">
            <span className="inline-flex items-center rounded-md bg-motta-yellow px-3 py-1 text-[11px] font-black uppercase tracking-widest text-motta-ink">
              Ofertas da semana
            </span>
            <h1
              id="hero-title"
              className="mt-4 text-4xl font-black uppercase italic leading-[0.92] tracking-tight sm:text-5xl lg:text-6xl"
            >
              Preços
              <br />
              imperdíveis!
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white sm:text-base">
              Do hortifruti ao pet shop, o Mercado Motta Jaraguá está perto de
              você. Explore os departamentos, busque produtos e monte seu carrinho
              com praticidade.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/ofertas"
                className={cn(buttonStyles({ variant: "secondary", size: "lg" }), "group")}
              >
                Ver ofertas
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/catalogo"
                className={cn(
                  buttonStyles({ variant: "outline", size: "lg" }),
                  "border-white/30 bg-white/10 text-white hover:border-white hover:bg-white hover:text-motta-red",
                )}
              >
                Explorar catálogo
              </Link>
            </div>
          </div>

          {featured ? (
            <div aria-hidden="true" className="relative hidden lg:block">
              <div className="relative mx-auto max-w-sm rotate-2 rounded-3xl bg-white p-5 pb-16 text-motta-ink shadow-2xl">
                <div className="flex items-center justify-between">
                  <Badge variant="offer">
                    {hasPromotion(featured) ? "Oferta" : "Destaque"}
                  </Badge>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-motta-gray-500">
                    Destaque da loja
                  </span>
                </div>
                <div className="mt-3 flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-white text-8xl">
                  {featuredImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URLs públicas de imagens cadastradas.
                    <img
                      src={featuredImageUrl}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    featured.emoji
                  )}
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-motta-gray-500">
                  {featuredCategory?.name ?? "Produto"}
                </p>
                <p className="text-base font-bold">{featured.name}</p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-3xl font-extrabold leading-none text-motta-red">
                    {formatBRL(featured.priceCents)}
                  </span>
                  {featured.originalPriceCents ? (
                    <span className="pb-1 text-xs text-motta-gray-500 line-through">
                      {formatBRL(featured.originalPriceCents)}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="absolute -right-3 top-16 rotate-6 rounded-2xl bg-motta-ink px-4 py-3 text-white shadow-xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-motta-yellow">
                  Entrega
                </p>
                <p className="text-sm font-bold">e retirada</p>
              </div>
            </div>
          ) : null}
        </Container>
      </section>

      <Container className="relative z-10 -mt-5 sm:-mt-7">
        <div className="grid gap-3 sm:grid-cols-3">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="flex items-start gap-3">
                <CardBody className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-motta-red/10 text-motta-red">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold text-motta-ink">{item.title}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-motta-gray-500">
                      {item.description}
                    </p>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </Container>

      <Container className="mt-10 sm:mt-14">
        {catalog ? (
          <>
            <section aria-labelledby="departamentos-title">
              <SectionHeading
                id="departamentos-title"
                eyebrow="Navegue por setor"
                title="Departamentos"
                description="Tudo o que você precisa para a casa, organizado do jeito que você encontra na loja."
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {catalog.categories.map((category) => (
                  <CategoryCard key={category.slug} category={category} />
                ))}
              </div>
            </section>

            <HomeStoreSections
              products={catalog.products}
              categories={catalog.categories}
            />
          </>
        ) : (
          <CatalogMaintenance />
        )}

        <section className="mt-12 sm:mt-16" aria-labelledby="operacao-title">
          <div className="overflow-hidden rounded-3xl bg-motta-ink text-white">
            <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-widest text-motta-yellow">
                  Por trás da loja
                </p>
                <h2 id="operacao-title" className="mt-1 text-2xl font-extrabold sm:text-3xl">
                  Um painel para toda a operação
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  Acompanhe pedidos, atualize produtos e preços, gerencie o estoque
                  e consulte relatórios em um só lugar.
                </p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/60">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheckIcon className="h-4 w-4 text-motta-yellow" />
                    Acesso por papel
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <StoreIcon className="h-4 w-4 text-motta-yellow" />
                    Estoque por loja
                  </span>
                </div>
              </div>
              <Link
                href="/painel"
                className={buttonStyles({ variant: "secondary", size: "lg" })}
              >
                Abrir painel
              </Link>
            </div>
          </div>
        </section>
      </Container>
    </>
  );
}
