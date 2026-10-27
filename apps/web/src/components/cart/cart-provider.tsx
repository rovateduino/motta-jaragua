"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  calculateCartTotals,
  clampQuantityMilli,
  type CartTotals,
} from "@motta/domain";
import {
  getMaxQuantityMilli,
  isProductAvailable,
  type PricedCatalogProduct,
} from "@/lib/catalog-core";

const STORAGE_KEY = "motta-demo-cart-v1";

interface StoredCartItem {
  readonly productId: string;
  readonly quantityMilli: number;
}

export interface CartItem {
  readonly product: PricedCatalogProduct;
  readonly quantityMilli: number;
  readonly lineSubtotalCents: number;
}

interface CartContextValue {
  readonly items: readonly CartItem[];
  readonly hydrated: boolean;
  readonly lineCount: number;
  readonly totalQuantityMilli: number;
  readonly subtotalCents: number;
  readonly addItem: (productId: string, quantityMilli: number) => void;
  readonly updateQuantity: (productId: string, quantityMilli: number) => void;
  readonly removeItem: (productId: string) => void;
  readonly clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function clampForProduct(product: PricedCatalogProduct, quantityMilli: number): number {
  return clampQuantityMilli(quantityMilli, {
    min: product.minQuantityMilli,
    max: getMaxQuantityMilli(product),
    step: product.stepQuantityMilli,
  });
}

type ProductResolver = (id: string) => PricedCatalogProduct | undefined;

function normalizeStoredItems(
  value: unknown,
  resolveProduct: ProductResolver,
): StoredCartItem[] {
  if (!Array.isArray(value)) return [];

  const merged = new Map<string, number>();

  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) continue;
    const candidate = entry as Partial<StoredCartItem>;
    if (typeof candidate.productId !== "string") continue;
    if (
      typeof candidate.quantityMilli !== "number" ||
      !Number.isInteger(candidate.quantityMilli) ||
      candidate.quantityMilli <= 0
    ) {
      continue;
    }

    const product = resolveProduct(candidate.productId);
    if (!product || !isProductAvailable(product)) continue;

    const current = merged.get(product.id) ?? 0;
    const quantity = clampForProduct(product, current + candidate.quantityMilli);
    if (quantity > 0) merged.set(product.id, quantity);
  }

  return Array.from(merged, ([productId, quantityMilli]) => ({
    productId,
    quantityMilli,
  }));
}

function readStoredCart(resolveProduct: ProductResolver): StoredCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return normalizeStoredItems(JSON.parse(raw), resolveProduct);
  } catch {
    return [];
  }
}

function writeStoredCart(items: readonly StoredCartItem[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // O carrinho continua funcionando apenas na sessão atual.
  }
}

function buildCart(
  items: readonly StoredCartItem[],
  resolveProduct: ProductResolver,
): {
  items: CartItem[];
  totals: CartTotals;
} {
  const lines = items.flatMap((item) => {
    const product = resolveProduct(item.productId);
    if (!product || !isProductAvailable(product)) return [];

    return [
      {
        productId: product.id,
        unitPriceCents: product.priceCents,
        quantity: item.quantityMilli,
        quantityScale: 1000,
        availableQuantity: getMaxQuantityMilli(product),
        maxQuantityPerOrder: getMaxQuantityMilli(product),
      },
    ];
  });

  const totals = calculateCartTotals({ lines });
  const subtotalByProduct = new Map(
    totals.lines.map((line) => [line.productId, line.subtotalCents]),
  );

  const cartItems = lines.flatMap((line) => {
    const product = resolveProduct(line.productId);
    if (!product) return [];
    return [
      {
        product,
        quantityMilli: line.quantity,
        lineSubtotalCents: subtotalByProduct.get(product.id) ?? 0,
      },
    ];
  });

  return { items: cartItems, totals };
}

export function CartProvider({
  products,
  children,
}: {
  /** Produtos do catálogo carregado do banco, usados para resolver o carrinho. */
  products: readonly PricedCatalogProduct[] | null;
  children: ReactNode;
}) {
  const productById = useMemo(() => {
    const map = new Map<string, PricedCatalogProduct>();
    for (const product of products ?? []) map.set(product.id, product);
    return map;
  }, [products]);

  const getPricedProductById = useCallback(
    (id: string) => productById.get(id),
    [productById],
  );
  const [storedItems, setStoredItems] = useState<StoredCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const resolverRef = useRef<ProductResolver>(getPricedProductById);

  useEffect(() => {
    resolverRef.current = getPricedProductById;
  }, [getPricedProductById]);

  useEffect(() => {
    setStoredItems(readStoredCart(resolverRef.current));
    setHydrated(true);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setStoredItems(readStoredCart(resolverRef.current));
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (hydrated) writeStoredCart(storedItems);
  }, [hydrated, storedItems]);

  const { items, totals } = useMemo(
    () => buildCart(storedItems, getPricedProductById),
    [storedItems, getPricedProductById],
  );

  const addItem = useCallback(
    (productId: string, quantityMilli: number) => {
      const product = getPricedProductById(productId);
      if (!product || !isProductAvailable(product)) return;

      setStoredItems((current) => {
        const existing = current.find((item) => item.productId === productId);
        const nextQuantity = clampForProduct(
          product,
          (existing?.quantityMilli ?? 0) + quantityMilli,
        );
        if (nextQuantity <= 0) return current;

        if (!existing) {
          return [...current, { productId, quantityMilli: nextQuantity }];
        }

        return current.map((item) =>
          item.productId === productId
            ? { productId, quantityMilli: nextQuantity }
            : item,
        );
      });
    },
    [getPricedProductById],
  );

  const updateQuantity = useCallback(
    (productId: string, quantityMilli: number) => {
      const product = getPricedProductById(productId);
      if (!product) return;

      setStoredItems((current) => {
        const quantity = clampForProduct(product, quantityMilli);
        if (quantity <= 0) {
          return current.filter((item) => item.productId !== productId);
        }

        return current.map((item) =>
          item.productId === productId
            ? { productId, quantityMilli: quantity }
            : item,
        );
      });
    },
    [getPricedProductById],
  );

  const removeItem = useCallback((productId: string) => {
    setStoredItems((current) =>
      current.filter((item) => item.productId !== productId),
    );
  }, []);

  const clearCart = useCallback(() => {
    setStoredItems([]);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      hydrated,
      lineCount: totals.lineCount,
      totalQuantityMilli: items.reduce((sum, item) => sum + item.quantityMilli, 0),
      subtotalCents: totals.subtotalCents,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items, hydrated, totals, addItem, updateQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de CartProvider.");
  }
  return context;
}
