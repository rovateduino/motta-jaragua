"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { formatBRL, formatQuantity, type SaleUnit } from "@motta/domain";
import { buttonStyles, Card, CardBody, Input } from "@motta/ui";
import {
  deleteAdminProduct,
  saveAdminProduct,
  setAdminProductActive,
} from "@/lib/admin-actions";
import {
  LOW_STOCK_THRESHOLD_MILLI,
  type AdminCategoryRecord,
  type AdminProductRecord,
} from "@/lib/admin-types";
import {
  AdminPageHeader,
  EmptyState,
  Feedback,
  StockBar,
} from "@/components/admin/shared";
import { formatAdminDateTime } from "@/lib/admin-format";

const fieldClass =
  "mt-1 h-11 w-full rounded-xl border border-motta-gray-300 bg-white px-3 text-sm text-motta-ink focus-visible:border-motta-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-motta-red/30";

interface ProductDraft {
  readonly id?: string;
  readonly sku: string;
  readonly name: string;
  readonly brand: string;
  readonly description: string;
  readonly categoryId: string;
  readonly unit: SaleUnit;
  readonly basePriceCents: number;
  readonly stockQuantityMilli: number;
  readonly active: boolean;
}

function parseMoney(value: string): number {
  const normalized = value.trim().replace(/[^\d,.-]/g, "");
  const decimal = normalized.includes(",")
    ? normalized.replace(/\./g, "").replace(",", ".")
    : normalized;
  return Math.round(Number(decimal) * 100);
}

function parseQuantity(value: string): number {
  return Math.round(Number(value.replace(",", ".")) * 1000);
}

function ProductForm({
  product,
  categories,
  onCancel,
}: {
  product?: AdminProductRecord;
  categories: readonly AdminCategoryRecord[];
  onCancel: () => void;
}) {
  const [sku, setSku] = useState(product?.sku ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [unit, setUnit] = useState<SaleUnit>(product?.unit ?? "UNIT");
  const [price, setPrice] = useState(
    product ? (product.basePriceCents / 100).toFixed(2).replace(".", ",") : "",
  );
  const [stock, setStock] = useState(
    product ? String(product.stockQuantityMilli / 1000) : "0",
  );
  const [active, setActive] = useState(product?.active ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const basePriceCents = parseMoney(price);
    const stockQuantityMilli = parseQuantity(stock);
    if (!Number.isSafeInteger(basePriceCents) || basePriceCents <= 0) {
      setError("Informe um preço válido.");
      return;
    }
    if (!Number.isSafeInteger(stockQuantityMilli) || stockQuantityMilli < 0) {
      setError("Informe uma quantidade de estoque válida.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const draft: ProductDraft = {
      ...(product ? { id: product.id } : {}),
      sku,
      name,
      brand,
      description,
      categoryId,
      unit,
      basePriceCents,
      stockQuantityMilli,
      active,
    };
    try {
      const result = await saveAdminProduct(draft);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      window.location.reload();
    } catch {
      setError("Falha inesperada ao salvar o produto.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2" noValidate>
      <label className="text-xs font-bold text-motta-ink">
        Nome *
        <input required value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
      </label>
      <label className="text-xs font-bold text-motta-ink">
        SKU *
        <input required value={sku} onChange={(event) => setSku(event.target.value)} className={fieldClass} />
      </label>
      <label className="text-xs font-bold text-motta-ink">
        Marca
        <input value={brand} onChange={(event) => setBrand(event.target.value)} className={fieldClass} />
      </label>
      <label className="text-xs font-bold text-motta-ink">
        Departamento *
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={fieldClass}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </label>
      <label className="text-xs font-bold text-motta-ink">
        Unidade de venda
        <select value={unit} onChange={(event) => setUnit(event.target.value as SaleUnit)} className={fieldClass}>
          {(["UNIT", "KG", "G", "L", "ML", "PACK"] as const).map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </label>
      <label className="text-xs font-bold text-motta-ink">
        Preço base (R$) *
        <input required inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} className={fieldClass} />
      </label>
      <label className="text-xs font-bold text-motta-ink">
        Estoque (unidade × 1000) *
        <input required inputMode="decimal" value={stock} onChange={(event) => setStock(event.target.value)} className={fieldClass} />
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold text-motta-ink">
        <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
        Produto ativo e visível na loja
      </label>
      <label className="text-xs font-bold text-motta-ink sm:col-span-2">
        Descrição
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-motta-gray-300 p-3 text-sm" />
      </label>
      {error ? <div className="sm:col-span-2"><Feedback tone="error">{error}</Feedback></div> : null}
      <div className="flex gap-2 sm:col-span-2">
        <button disabled={submitting || categories.length === 0} type="submit" className={buttonStyles({ variant: "primary" })}>
          {submitting ? "Salvando…" : product ? "Salvar alterações" : "Criar produto"}
        </button>
        <button type="button" onClick={onCancel} className={buttonStyles({ variant: "outline" })}>Cancelar</button>
      </div>
    </form>
  );
}

export function AdminProductsView({
  products,
  categories,
  canWrite,
}: {
  products: readonly AdminProductRecord[];
  categories: readonly AdminCategoryRecord[];
  canWrite: boolean;
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "LOW">("ALL");
  const [formMode, setFormMode] = useState<"NONE" | "CREATE" | string>("NONE");
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return products.filter((product) => {
      if (categoryFilter !== "ALL" && product.categorySlug !== categoryFilter) return false;
      if (statusFilter === "ACTIVE" && !product.active) return false;
      if (statusFilter === "INACTIVE" && product.active) return false;
      if (
        statusFilter === "LOW" &&
        (!product.active ||
          product.stockQuantityMilli - product.reservedQuantityMilli > LOW_STOCK_THRESHOLD_MILLI)
      ) return false;
      return !term || `${product.name} ${product.sku} ${product.brand}`.toLocaleLowerCase("pt-BR").includes(term);
    });
  }, [products, search, categoryFilter, statusFilter]);
  const editing = products.find((product) => product.id === formMode);

  async function toggle(product: AdminProductRecord) {
    try {
      const result = await setAdminProductActive(product.id, !product.active);
      setFeedback({ tone: result.ok ? "success" : "error", text: result.message });
      if (result.ok) window.location.reload();
    } catch {
      setFeedback({ tone: "error", text: "Falha inesperada ao alterar o produto." });
    }
  }

  async function remove(product: AdminProductRecord) {
    if (!window.confirm(`Excluir ${product.name}?`)) return;
    try {
      const result = await deleteAdminProduct(product.id);
      setFeedback({ tone: result.ok ? "success" : "error", text: result.message });
      if (result.ok) window.location.reload();
    } catch {
      setFeedback({ tone: "error", text: "Falha inesperada ao excluir o produto." });
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Catálogo"
        title="Produtos e estoque"
        description="Produtos, preços e estoque são persistidos no PostgreSQL e usados imediatamente pela loja."
        actions={canWrite ? <button type="button" onClick={() => setFormMode("CREATE")} className={buttonStyles({ variant: "primary" })}>Novo produto</button> : undefined}
      />
      {feedback ? <Feedback tone={feedback.tone}>{feedback.text}</Feedback> : null}
      {canWrite && formMode !== "NONE" ? (
        <Card><CardBody className="space-y-4">
          <h2 className="text-lg font-extrabold">{editing ? `Editar ${editing.name}` : "Novo produto"}</h2>
          <ProductForm key={formMode} product={editing} categories={categories} onCancel={() => setFormMode("NONE")} />
        </CardBody></Card>
      ) : null}
      <Card><CardBody className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-bold">Buscar<Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Buscar produtos" placeholder="Nome, SKU ou marca" /></label>
        <label className="text-xs font-bold">Departamento<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className={fieldClass}><option value="ALL">Todos</option>{categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}</select></label>
        <label className="text-xs font-bold">Situação<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className={fieldClass}><option value="ALL">Todos</option><option value="ACTIVE">Ativos</option><option value="INACTIVE">Inativos</option><option value="LOW">Estoque baixo</option></select></label>
      </CardBody></Card>
      {filtered.length === 0 ? <EmptyState title="Nenhum produto encontrado" description="Crie um produto ou ajuste os filtros." action={canWrite ? <button type="button" onClick={() => setFormMode("CREATE")} className={buttonStyles({ variant: "primary" })}>Novo produto</button> : undefined} /> : (
        <div className="space-y-2">{filtered.map((product) => (
          <Card key={product.id} data-testid="admin-product-card"><CardBody className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 p-3 sm:flex sm:flex-wrap sm:items-center sm:p-4">
            <span className="row-span-2 text-2xl sm:row-span-1" aria-hidden="true">{product.emoji}</span>
            <div className="min-w-0 sm:min-w-[12rem] sm:flex-1"><p className="break-words font-bold leading-snug text-motta-ink">{product.name}</p><p className="break-all text-xs text-motta-gray-500">{product.sku} · {product.categoryName} · {formatBRL(product.basePriceCents)}</p></div>
            <div className="col-span-2 flex min-w-0 items-center gap-2 text-xs sm:col-span-1"><StockBar quantityMilli={product.stockQuantityMilli - product.reservedQuantityMilli} /><span>{formatQuantity(product.stockQuantityMilli - product.reservedQuantityMilli, product.unit)} disponíveis{product.reservedQuantityMilli > 0 ? ` (${formatQuantity(product.reservedQuantityMilli, product.unit)} reservados)` : ""}</span></div>
            <span className={`col-start-2 row-start-2 justify-self-start rounded-full px-2 py-1 text-[10px] font-bold sm:static ${product.active ? "bg-green-100 text-green-800" : "bg-motta-gray-100 text-motta-gray-700"}`}>{product.active ? "Ativo" : "Inativo"}</span>
            <div className="col-span-2 flex flex-wrap gap-1 sm:ml-auto sm:col-span-1">
              <Link href={`/produto/${product.slug}`} className={buttonStyles({ variant: "ghost", size: "sm" })}>Ver loja</Link>
              {canWrite ? <>
                <button type="button" onClick={() => setFormMode(product.id)} className={buttonStyles({ variant: "outline", size: "sm" })}>Editar</button>
                <button type="button" onClick={() => void toggle(product)} className={buttonStyles({ variant: "ghost", size: "sm" })}>{product.active ? "Desativar" : "Ativar"}</button>
                <button type="button" onClick={() => void remove(product)} className={`${buttonStyles({ variant: "ghost", size: "sm" })} text-motta-red hover:bg-red-50 hover:text-motta-red-dark`}>Excluir</button>
              </> : null}
            </div>
            {product.movements.length > 0 ? <p className="col-span-2 w-full text-[11px] text-motta-gray-500">Último ajuste: {product.movements[0]?.note ?? "Ajuste de estoque"}{product.movements[0]?.createdAt ? ` · ${formatAdminDateTime(product.movements[0].createdAt)}` : ""}</p> : null}
          </CardBody></Card>
        ))}</div>
      )}
    </div>
  );
}
