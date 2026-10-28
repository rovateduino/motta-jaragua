import Link from "next/link";
import {
  BeefIcon,
  BreadIcon,
  CarrotIcon,
  CheeseIcon,
  ChevronRightIcon,
  CupSodaIcon,
  PawPrintIcon,
  ShoppingBasketIcon,
  SnowflakeIcon,
  SoapDispenserIcon,
  SprayCanIcon,
} from "@motta/ui";
import type { DepartmentIconName, CatalogCategory } from "@/lib/catalog-core";

const departmentIcons = {
  carrot: CarrotIcon,
  beef: BeefIcon,
  bread: BreadIcon,
  cheese: CheeseIcon,
  shoppingBasket: ShoppingBasketIcon,
  cupSoda: CupSodaIcon,
  sprayCan: SprayCanIcon,
  soapDispenser: SoapDispenserIcon,
  snowflake: SnowflakeIcon,
  pawPrint: PawPrintIcon,
} satisfies Record<DepartmentIconName, typeof CarrotIcon>;

export function CategoryCard({ category }: { category: CatalogCategory }) {
  const Icon = departmentIcons[category.iconName];

  return (
    <Link
      href={`/categoria/${category.slug}`}
      className="group flex items-center gap-3 rounded-2xl border border-motta-gray-200 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-motta-red/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-motta-red focus-visible:ring-offset-2"
    >
      <span
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-motta-gray-100 text-motta-red transition-colors group-hover:bg-motta-red/10"
      >
        <Icon className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold leading-tight text-motta-ink">
          {category.name}
        </span>
        <span className="mt-0.5 whitespace-normal break-words text-[11px] leading-snug text-motta-gray-500">
          {category.tagline}
        </span>
      </span>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-motta-gray-300 transition-colors group-hover:text-motta-red" />
    </Link>
  );
}
