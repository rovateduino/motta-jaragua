"use client";

import { useEffect, useState } from "react";
import { Button, CheckIcon, PlusIcon } from "@motta/ui";
import { useCart } from "./cart-provider";

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  quantityMilli: number;
  available: boolean;
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline" | "dark";
}

export function AddToCartButton({
  productId,
  productName,
  quantityMilli,
  available,
  label = "Adicionar",
  className,
  size = "sm",
  variant = "outline",
}: AddToCartButtonProps) {
  const { addItem, hydrated } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setAdded(false);
  }, [productId, quantityMilli]);

  if (!available) {
    return (
      <Button size={size} variant="outline" className={className} disabled>
        Indisponível
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={added ? "secondary" : variant}
      className={className}
      disabled={!hydrated}
      aria-label={
        added
          ? `${productName} adicionado ao carrinho`
          : `Adicionar ${productName} ao carrinho`
      }
      onClick={() => {
        addItem(productId, quantityMilli);
        setAdded(true);
      }}
    >
      {added ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
      <span aria-live="polite">{added ? "Adicionado" : label}</span>
    </Button>
  );
}
