"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatBRL, formatQuantity, type SaleUnit } from "@motta/domain";
import { buttonStyles, Card, CardBody, Input } from "@motta/ui";
import {
  deleteAdminProduct,
  deleteProductsAction,
  saveAdminProduct,
  setAdminProductActive,
} from "@/lib/admin-actions";
import { uploadProductImageAction } from "@/lib/storage-actions";
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

const inputBaseClass =
  "h-11 w-full rounded-xl border border-motta-gray-300 bg-white px-3 text-sm text-motta-ink focus-visible:border-motta-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-motta-red/30";
const fieldClass = `mt-1 ${inputBaseClass}`;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

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
  readonly imageUrl: string;
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
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageFile(
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = event.target.files?.[0];
    // Permite selecionar o mesmo arquivo novamente após um erro.
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      setError("A imagem deve ter no máximo 2 MB.");
      return;
    }
    if (
      file.type &&
      !ALLOWED_IMAGE_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
      )
    ) {
      setError("Envie uma imagem JPG, PNG ou WebP.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    setError(null);
    try {
      const result = await uploadProductImageAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setImageUrl(result.url);
    } catch {
      setError("Falha inesperada ao enviar a imagem.");
    } finally {
      setUploading(false);
    }
  }

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
    const trimmedImageUrl = imageUrl.trim();
    if (trimmedImageUrl && !/^https?:\/\//i.test(trimmedImageUrl)) {
      setError("A URL da imagem deve começar com http:// ou https://.");
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
      imageUrl: trimmedImageUrl,
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

  const imagePreview = /^https?:\/\//i.test(imageUrl.trim()) ? imageUrl.trim() : null;

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
      <div className="text-xs font-bold text-motta-ink sm:col-span-2">
        <label htmlFor="product-image-url" className="block">
          URL da imagem (opcional)
        </label>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row">
          <input
            id="product-image-url"
            type="url"
            inputMode="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://exemplo.com/foto-do-produto.jpg"
            className={inputBaseClass}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => void handleImageFile(event)}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || submitting}
            className={`${buttonStyles({ variant: "outline" })} shrink-0 whitespace-nowrap`}
          >
            {uploading ? "Enviando…" : "Escolher do computador"}
          </button>
        </div>
        <span className="mt-1 block text-[11px] font-normal text-motta-gray-500">
          JPG, PNG ou WebP até 2 MB. O upload preenche a URL automaticamente;
          você também pode colar um endereço público (http/https). Sem foto, a
          loja mostra o emoji do departamento.
        </span>
      </div>
      {imagePreview ? (
        <div className="flex items-center gap-3 rounded-xl border border-motta-gray-200 p-2 sm:col-span-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- prévia de URL externa; sem storage/otimização ainda. */}
          <img src={imagePreview} alt="Prévia da imagem do produto" loading="lazy" className="h-16 w-16 rounded-lg object-cover" />
          <span className="text-xs text-motta-gray-500">Prévia da foto que aparecerá na loja.</span>
        </div>
      ) : null}
      {error ? <div className="sm:col-span-2"><Feedback tone="error">{error}</Feedback></div> : null}
      <div className="flex gap-2 sm:col-span-2">
        <button disabled={submitting || uploading || categories.length === 0} type="submit" className={buttonStyles({ variant: "primary" })}>
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
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [bulkPending, setBulkPending] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
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

  // A seleção em massa vale só para o que está visível: trocar qualquer filtro
  // limpa a seleção para não excluir itens escondidos por engano.
  useEffect(() => {
    setSelectedIds([]);
  }, [search, categoryFilter, statusFilter]);

  // Depois de um refresh os produtos podem ter saído da lista (exclusão):
  // descarta da seleção os ids que não existem mais.
  useEffect(() => {
    setSelectedIds((current) => {
      const alive = current.filter((id) =>
        products.some((product) => product.id === id),
      );
      return alive.length === current.length ? current : alive;
    });
  }, [products]);

  const allSelected =
    filtered.length > 0 &&
    filtered.every((product) => selectedIds.includes(product.id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedIds.length > 0 && !allSelected;
    }
  }, [selectedIds.length, allSelected]);

  function toggleSelection(productId: string): void {
    setSelectedIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }

  function toggleAll(): void {
    setSelectedIds(allSelected ? [] : filtered.map((product) => product.id));
  }

  async function removeSelected(): Promise<void> {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const label =
      ids.length === 1 ? "1 produto selecionado" : `${ids.length} produtos selecionados`;
    const confirmed = window.confirm(
      `Excluir ${label}? Produtos com estoque reservado ou histórico de pedidos não serão excluídos.`,
    );
    if (!confirmed) return;

    setBulkPending(true);
    setFeedback(null);
    try {
      const result = await deleteProductsAction(ids);
      setFeedback({ tone: result.ok ? "success" : "error", text: result.message });
      setSelectedIds([]);
      // `refresh` atualiza a lista do servidor sem perder o feedback na tela
      // (um reload limparia a mensagem de sucesso/erro).
      router.refresh();
    } catch {
      setFeedback({ tone: "error", text: "Falha inesperada ao excluir os produtos." });
    } finally {
      setBulkPending(false);
    }
  }

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
        <div className="space-y-2">
          {canWrite ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-motta-gray-200 bg-motta-gray-50 px-3 py-2">
              <label className="flex items-center gap-2 text-xs font-bold text-motta-ink">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Selecionar todos os produtos listados"
                  className="h-4 w-4 accent-motta-red"
                />
                Selecionar todos
              </label>
              <span className="text-xs text-motta-gray-500">
                {selectedIds.length > 0
                  ? `${selectedIds.length} de ${filtered.length} selecionado(s)`
                  : `${filtered.length} produto(s) na lista`}
              </span>
            </div>
          ) : null}
          {canWrite && selectedIds.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-motta-red/30 bg-red-50 px-3 py-2">
              <strong className="text-xs font-bold text-motta-ink">
                {selectedIds.length} selecionado(s)
              </strong>
              <button
                type="button"
                disabled={bulkPending}
                onClick={() => void removeSelected()}
                className={buttonStyles({ variant: "primary", size: "sm" })}
              >
                {bulkPending ? "Excluindo…" : `Excluir Selecionados (${selectedIds.length})`}
              </button>
              <button
                type="button"
                disabled={bulkPending}
                onClick={() => setSelectedIds([])}
                className={buttonStyles({ variant: "ghost", size: "sm" })}
              >
                Limpar seleção
              </button>
            </div>
          ) : null}
          {filtered.map((product) => {
            const availableMilli = Math.max(
              0,
              product.stockQuantityMilli - product.reservedQuantityMilli,
            );
            const selected = selectedIds.includes(product.id);
            return (
              <Card
                key={product.id}
                data-testid="admin-product-card"
                className={selected ? "ring-2 ring-motta-red/30" : undefined}
              >
                <CardBody className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 p-3 sm:flex sm:flex-wrap sm:items-center sm:p-4">
                  <div className="row-span-2 flex flex-col items-center gap-2 sm:row-span-1 sm:flex-row">
                    {canWrite ? (
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelection(product.id)}
                        aria-label={`Selecionar ${product.name}`}
                        className="h-4 w-4 shrink-0 accent-motta-red"
                      />
                    ) : null}
                    {product.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element -- foto externa cadastrada no painel; sem storage/otimização ainda. */
                      <img
                        src={product.imageUrl}
                        alt=""
                        loading="lazy"
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="text-2xl" aria-hidden="true">{product.emoji}</span>
                    )}
                  </div>
                  <div className="min-w-0 sm:min-w-[12rem] sm:flex-1"><p className="break-words font-bold leading-snug text-motta-ink">{product.name}</p><p className="break-all text-xs text-motta-gray-500">{product.sku} · {product.categoryName} · {formatBRL(product.basePriceCents)}</p></div>
                  <div className="col-span-2 flex min-w-0 items-center gap-2 text-xs sm:col-span-1"><StockBar quantityMilli={availableMilli} /><span>{formatQuantity(availableMilli, product.unit)} disponíveis{product.reservedQuantityMilli > 0 ? ` (${formatQuantity(product.reservedQuantityMilli, product.unit)} reservados)` : ""}</span></div>
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
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
