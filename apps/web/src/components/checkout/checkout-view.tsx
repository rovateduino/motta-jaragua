"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { formatBRL, formatQuantity } from "@motta/domain";
import {
  ArrowRightIcon,
  Badge,
  buttonStyles,
  Card,
  CardBody,
  Container,
  Input,
} from "@motta/ui";
import type { Address, FulfillmentType, SubstitutionPreference } from "@motta/contracts";
import { useCart } from "@/components/cart/cart-provider";
import { createOrderAction } from "@/lib/orders-actions";
import type { PickupSlotView } from "@/lib/orders-db";

/**
 * Regras de negócio do checkout. Vêm das `Setting` do banco e servem apenas
 * para exibir o resumo; o valor final é recalculado no servidor antes de o
 * pedido ser gravado.
 */
export interface CheckoutRules {
  readonly deliveryEnabled: boolean;
  readonly pickupEnabled: boolean;
  readonly deliveryFeeCents: number;
  readonly freeShippingThresholdCents: number;
  readonly minimumOrderCents: number;
}

const substitutionOptions: ReadonlyArray<{
  value: SubstitutionPreference;
  label: string;
  description: string;
}> = [
  {
    value: "CONTACT_BEFORE",
    label: "Falar comigo antes de substituir",
    description: "A equipe entrará em contato antes de trocar um item.",
  },
  {
    value: "ACCEPT_EQUIVALENT",
    label: "Aceito produto equivalente",
    description: "Permite trocar por outro item de valor e marca semelhantes.",
  },
  {
    value: "DO_NOT_SUBSTITUTE",
    label: "Não substituir",
    description: "Se faltar, o item será removido do pedido.",
  },
  {
    value: "REMOVE_ITEM",
    label: "Remover o item se faltar",
    description: "O item indisponível será removido do pedido sem substituição.",
  },
];

interface CheckoutFormState {
  fulfillmentType: FulfillmentType;
  substitutionPreference: SubstitutionPreference;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  pickupSlot: string;
  notes: string;
}

function buildInitialState(
  pickupSlotId: string,
  city: string,
  state: string,
): CheckoutFormState {
  return {
    fulfillmentType: "DELIVERY",
    substitutionPreference: "CONTACT_BEFORE",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city,
    state,
    pickupSlot: pickupSlotId,
    notes: "",
  };
}

type FormErrors = Partial<Record<keyof CheckoutFormState, string>>;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function validate(form: CheckoutFormState): FormErrors {
  const errors: FormErrors = {};

  if (form.contactName.trim().length < 2) {
    errors.contactName = "Informe o nome de quem vai receber o pedido.";
  }
  if (digitsOnly(form.contactPhone).length < 10) {
    errors.contactPhone = "Informe um telefone com DDD.";
  }
  if (form.contactEmail.trim() && !form.contactEmail.includes("@")) {
    errors.contactEmail = "E-mail inválido.";
  }

  if (form.fulfillmentType === "DELIVERY") {
    if (digitsOnly(form.zipCode).length !== 8) {
      errors.zipCode = "CEP deve ter 8 dígitos.";
    }
    if (form.street.trim().length < 2) errors.street = "Informe a rua.";
    if (!form.number.trim()) errors.number = "Informe o número.";
    if (form.district.trim().length < 2) errors.district = "Informe o bairro.";
    if (form.city.trim().length < 2) errors.city = "Informe a cidade.";
    if (form.state.trim().length !== 2) errors.state = "Use a sigla do estado.";
  } else if (!form.pickupSlot) {
    errors.pickupSlot = "Escolha uma janela de retirada.";
  }

  return errors;
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string | undefined;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-xs font-bold text-motta-ink">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${htmlFor}-erro`} className="mt-1 text-[11px] font-semibold text-motta-red">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-motta-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}

interface CreatedOrder {
  readonly orderNumber: string;
  readonly totalCents: number;
  readonly fulfillmentType: FulfillmentType;
}

export function CheckoutView({
  rules,
  pickupSlots,
  storeLocation,
}: {
  rules: CheckoutRules;
  pickupSlots: readonly PickupSlotView[];
  storeLocation: { city: string; state: string };
}) {
  const { items, hydrated, subtotalCents, clearCart } = useCart();
  const [form, setForm] = useState<CheckoutFormState>(() =>
    buildInitialState(
      pickupSlots[0]?.id ?? "",
      storeLocation.city,
      storeLocation.state,
    ),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!hydrated) {
    return (
      <Container className="py-10">
        <div
          aria-busy="true"
          aria-live="polite"
          className="mx-auto max-w-2xl rounded-2xl border border-motta-gray-200 bg-white p-8 text-center text-sm text-motta-gray-500"
        >
          Carregando o checkout…
        </div>
      </Container>
    );
  }

  if (createdOrder) {
    return (
      <Container className="py-10 sm:py-16">
        <Card className="mx-auto max-w-2xl text-center">
          <CardBody className="px-6 py-10">
            <span
              aria-hidden="true"
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700"
            >
              ✓
            </span>
            <Badge variant="offer" className="mt-4">
              Pedido registrado no banco
            </Badge>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-motta-ink sm:text-3xl">
              Pedido recebido
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-motta-gray-500">
              Guarde o número abaixo. O pedido foi registrado e já aparece em{" "}
              <strong>Meus Pedidos</strong>.
            </p>
            <p className="mt-4 rounded-xl border border-dashed border-motta-gray-300 bg-motta-gray-50 px-4 py-3 font-mono text-lg font-bold tracking-wider text-motta-ink">
              {createdOrder.orderNumber}
            </p>
            <p className="mt-2 text-xs text-motta-gray-500">
              Total: <strong>{formatBRL(createdOrder.totalCents)}</strong> —{" "}
              {createdOrder.fulfillmentType === "DELIVERY" ? "entrega" : "retirada na loja"}
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={`/pedidos/${createdOrder.orderNumber}`}
                className={buttonStyles({ variant: "primary" })}
              >
                Ver detalhes do pedido
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link href="/pedidos" className={buttonStyles({ variant: "outline" })}>
                Meus pedidos
              </Link>
            </div>
          </CardBody>
        </Card>
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container className="py-10 sm:py-16">
        <Card className="mx-auto max-w-2xl text-center">
          <CardBody className="px-6 py-12">
            <h1 className="text-2xl font-black tracking-tight text-motta-ink">
              Seu carrinho está vazio
            </h1>
            <p className="mt-2 text-sm text-motta-gray-500">
              Adicione produtos ao carrinho para finalizar um pedido.
            </p>
            <div className="mt-6">
              <Link href="/catalogo" className={buttonStyles({ variant: "primary" })}>
                Ver catálogo
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </CardBody>
        </Card>
      </Container>
    );
  }

  const isDelivery = form.fulfillmentType === "DELIVERY";
  const deliveryFeeCents = isDelivery
    ? rules.freeShippingThresholdCents > 0 &&
      subtotalCents >= rules.freeShippingThresholdCents
      ? 0
      : rules.deliveryFeeCents
    : 0;
  const totalCents = subtotalCents + deliveryFeeCents;
  const belowMinimum = subtotalCents < rules.minimumOrderCents;

  function update<K extends keyof CheckoutFormState>(
    key: K,
    value: CheckoutFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const first = document.querySelector<HTMLElement>("[aria-invalid='true']");
      first?.focus();
      return;
    }
    if (belowMinimum) return;

    const address: Address | undefined = isDelivery
      ? {
          recipient: form.contactName.trim(),
          phone: form.contactPhone.trim(),
          zipCode: form.zipCode.trim(),
          street: form.street.trim(),
          number: form.number.trim(),
          ...(form.complement.trim() ? { complement: form.complement.trim() } : {}),
          district: form.district.trim(),
          city: form.city.trim(),
          state: form.state.trim().toUpperCase(),
        }
      : undefined;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createOrderAction({
        fulfillmentType: form.fulfillmentType,
        substitutionPreference: form.substitutionPreference,
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        contactEmail: form.contactEmail.trim(),
        ...(address ? { address } : {}),
        ...(!isDelivery && form.pickupSlot ? { deliverySlotId: form.pickupSlot } : {}),
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
        items: items.map((item) => ({
          productId: item.product.id,
          quantityMilli: item.quantityMilli,
        })),
      });

      if (!result.ok) {
        setSubmitError(result.message);
        return;
      }

      setCreatedOrder({
        orderNumber: result.orderNumber,
        totalCents: result.totalCents,
        fulfillmentType: form.fulfillmentType,
      });
      clearCart();
    } catch {
      setSubmitError("Não foi possível registrar o pedido agora. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container className="py-8 sm:py-10">
      <nav aria-label="Você está aqui" className="mb-4 text-xs text-motta-gray-500">
        <Link href="/" className="hover:text-motta-red hover:underline">
          Início
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/carrinho" className="hover:text-motta-red hover:underline">
          Carrinho
        </Link>
        <span className="mx-1.5">/</span>
        <span aria-current="page" className="font-semibold text-motta-ink">
          Checkout
        </span>
      </nav>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-black tracking-tight text-motta-ink sm:text-4xl">
          Finalizar pedido
        </h1>
      </div>
      <p className="mt-1 max-w-2xl text-sm text-motta-gray-500">
        Escolha entre entrega e retirada, informe seus dados e revise o pedido antes de concluir.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start"
      >
        <div className="space-y-4">
          <Card>
            <CardBody className="space-y-4">
              <h2 className="text-lg font-extrabold text-motta-ink">
                Como quer receber?
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    {
                      value: "DELIVERY",
                      title: "Entrega",
                      description: "Endereço em Jaraguá do Sul e região.",
                    },
                    {
                      value: "PICKUP",
                      title: "Retirada na loja",
                      description: "Escolha uma janela de retirada disponível.",
                    },
                  ] as const
                ).map((option) => (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-xl border p-3 text-sm transition-colors ${
                      form.fulfillmentType === option.value
                        ? "border-motta-red bg-motta-red/5"
                        : "border-motta-gray-200 bg-white hover:border-motta-gray-300"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-bold text-motta-ink">
                      <input
                        type="radio"
                        name="fulfillmentType"
                        value={option.value}
                        checked={form.fulfillmentType === option.value}
                        onChange={() => update("fulfillmentType", option.value)}
                        className="h-4 w-4 accent-motta-red"
                      />
                      {option.title}
                    </span>
                    <span className="mt-1 block pl-6 text-xs text-motta-gray-500">
                      {option.description}
                    </span>
                  </label>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              <h2 className="text-lg font-extrabold text-motta-ink">Seus dados</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nome completo"
                  htmlFor="contactName"
                  error={errors.contactName}
                  className="sm:col-span-2"
                >
                  <Input
                    id="contactName"
                    className={errors.contactName ? "border-red-600 focus-visible:border-red-600 focus-visible:ring-red-500/30" : undefined}
                    value={form.contactName}
                    onChange={(event) => update("contactName", event.target.value)}
                    autoComplete="name"
                    placeholder="Ex.: Maria da Silva"
                    aria-invalid={Boolean(errors.contactName)}
                    aria-describedby={
                      errors.contactName ? "contactName-erro" : undefined
                    }
                  />
                </Field>
                <Field label="Telefone / WhatsApp" htmlFor="contactPhone" error={errors.contactPhone}>
                  <Input
                    id="contactPhone"
                    className={errors.contactPhone ? "border-red-600 focus-visible:border-red-600 focus-visible:ring-red-500/30" : undefined}
                    value={form.contactPhone}
                    onChange={(event) => update("contactPhone", event.target.value)}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(48) 99999-0000"
                    aria-invalid={Boolean(errors.contactPhone)}
                    aria-describedby={
                      errors.contactPhone ? "contactPhone-erro" : undefined
                    }
                  />
                </Field>
                <Field
                  label="E-mail (opcional)"
                  htmlFor="contactEmail"
                  error={errors.contactEmail}
                >
                  <Input
                    id="contactEmail"
                    className={errors.contactEmail ? "border-red-600 focus-visible:border-red-600 focus-visible:ring-red-500/30" : undefined}
                    type="email"
                    value={form.contactEmail}
                    onChange={(event) => update("contactEmail", event.target.value)}
                    autoComplete="email"
                    placeholder="voce@exemplo.com"
                    aria-invalid={Boolean(errors.contactEmail)}
                    aria-describedby={
                      errors.contactEmail ? "contactEmail-erro" : undefined
                    }
                  />
                </Field>
              </div>
            </CardBody>
          </Card>

          {isDelivery ? (
            <Card>
              <CardBody className="space-y-4">
                <div>
                  <h2 className="text-lg font-extrabold text-motta-ink">
                    Endereço de entrega
                  </h2>
                  <p className="mt-1 text-xs text-motta-gray-500">
                    Usado apenas para este pedido.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-6">
                  <Field
                    label="CEP"
                    htmlFor="zipCode"
                    error={errors.zipCode}
                    className="sm:col-span-2"
                  >
                    <Input
                      id="zipCode"
                      className={errors.zipCode ? "border-red-600 focus-visible:border-red-600 focus-visible:ring-red-500/30" : undefined}
                      value={form.zipCode}
                      onChange={(event) => update("zipCode", event.target.value)}
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="89254-000"
                      aria-invalid={Boolean(errors.zipCode)}
                      aria-describedby={errors.zipCode ? "zipCode-erro" : undefined}
                    />
                  </Field>
                  <Field
                    label="Rua"
                    htmlFor="street"
                    error={errors.street}
                    className="sm:col-span-4"
                  >
                    <Input
                      id="street"
                      className={errors.street ? "border-red-600 focus-visible:border-red-600 focus-visible:ring-red-500/30" : undefined}
                      value={form.street}
                      onChange={(event) => update("street", event.target.value)}
                      autoComplete="address-line1"
                      placeholder="Rua das Flores"
                      aria-invalid={Boolean(errors.street)}
                      aria-describedby={errors.street ? "street-erro" : undefined}
                    />
                  </Field>
                  <Field
                    label="Número"
                    htmlFor="number"
                    error={errors.number}
                    className="sm:col-span-2"
                  >
                    <Input
                      id="number"
                      className={errors.number ? "border-red-600 focus-visible:border-red-600 focus-visible:ring-red-500/30" : undefined}
                      value={form.number}
                      onChange={(event) => update("number", event.target.value)}
                      autoComplete="address-line2"
                      placeholder="100"
                      aria-invalid={Boolean(errors.number)}
                      aria-describedby={errors.number ? "number-erro" : undefined}
                    />
                  </Field>
                  <Field
                    label="Complemento (opcional)"
                    htmlFor="complement"
                    className="sm:col-span-4"
                  >
                    <Input
                      id="complement"
                      value={form.complement}
                      onChange={(event) => update("complement", event.target.value)}
                      placeholder="Apto 12, bloco B"
                    />
                  </Field>
                  <Field
                    label="Bairro"
                    htmlFor="district"
                    error={errors.district}
                    className="sm:col-span-3"
                  >
                    <Input
                      id="district"
                      className={errors.district ? "border-red-600 focus-visible:border-red-600 focus-visible:ring-red-500/30" : undefined}
                      value={form.district}
                      onChange={(event) => update("district", event.target.value)}
                      placeholder="Centro"
                      aria-invalid={Boolean(errors.district)}
                      aria-describedby={errors.district ? "district-erro" : undefined}
                    />
                  </Field>
                  <Field
                    label="Cidade"
                    htmlFor="city"
                    error={errors.city}
                    className="sm:col-span-2"
                  >
                    <Input
                      id="city"
                      className={errors.city ? "border-red-600 focus-visible:border-red-600 focus-visible:ring-red-500/30" : undefined}
                      value={form.city}
                      onChange={(event) => update("city", event.target.value)}
                      autoComplete="address-level2"
                      aria-invalid={Boolean(errors.city)}
                      aria-describedby={errors.city ? "city-erro" : undefined}
                    />
                  </Field>
                  <Field label="UF" htmlFor="state" error={errors.state}>
                    <Input
                      id="state"
                      className={errors.state ? "border-red-600 focus-visible:border-red-600 focus-visible:ring-red-500/30" : undefined}
                      value={form.state}
                      onChange={(event) =>
                        update("state", event.target.value.toUpperCase().slice(0, 2))
                      }
                      autoComplete="address-level1"
                      maxLength={2}
                      aria-invalid={Boolean(errors.state)}
                      aria-describedby={errors.state ? "state-erro" : undefined}
                    />
                  </Field>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody className="space-y-4">
                <h2 className="text-lg font-extrabold text-motta-ink">
                  Janela de retirada
                </h2>
                {pickupSlots.length === 0 ? (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold leading-relaxed text-amber-800">
                    Nenhuma janela de retirada disponível no momento. Escolha entrega ou
                    tente novamente mais tarde.
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {pickupSlots.map((slot) => (
                      <label
                        key={slot.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                          form.pickupSlot === slot.id
                            ? "border-motta-red bg-motta-red/5 font-semibold text-motta-ink"
                            : "border-motta-gray-200 text-motta-gray-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="pickupSlot"
                          value={slot.id}
                          checked={form.pickupSlot === slot.id}
                          onChange={() => update("pickupSlot", slot.id)}
                          className="h-4 w-4 accent-motta-red"
                        />
                        {slot.label}
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-[11px] leading-relaxed text-motta-gray-500">
                  Selecione uma das janelas disponíveis para retirar seu pedido.
                </p>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardBody className="space-y-4">
              <h2 className="text-lg font-extrabold text-motta-ink">
                Preferências e observações
              </h2>
              <Field
                label="Se faltar um produto"
                htmlFor="substitutionPreference"
                hint="Registrada junto ao pedido para orientar a equipe."
              >
                <select
                  id="substitutionPreference"
                  value={form.substitutionPreference}
                  onChange={(event) =>
                    update(
                      "substitutionPreference",
                      event.target.value as SubstitutionPreference,
                    )
                  }
                  className="h-11 w-full rounded-xl border border-motta-gray-300 bg-white px-3 text-sm text-motta-ink focus-visible:border-motta-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-motta-red/30"
                >
                  {substitutionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Observações (opcional)"
                htmlFor="notes"
                hint="Enviada junto ao pedido. Evite dados sensíveis."
              >
                <textarea
                  id="notes"
                  value={form.notes}
                  onChange={(event) => update("notes", event.target.value)}
                  rows={3}
                  maxLength={280}
                  placeholder="Ex.: tocar o interfone, deixar na portaria…"
                  className="w-full rounded-xl border border-motta-gray-300 bg-white px-3 py-2 text-sm text-motta-ink placeholder:text-motta-gray-500 focus-visible:border-motta-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-motta-red/30"
                />
              </Field>
            </CardBody>
          </Card>
        </div>

        <Card className="lg:sticky lg:top-36">
          <CardBody className="space-y-4">
            <h2 className="text-lg font-extrabold text-motta-ink">Resumo do pedido</h2>

            <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {items.map((item) => (
                <li
                  key={item.product.id}
                  className="flex items-start justify-between gap-3 text-xs"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-motta-ink">
                      {item.product.name}
                    </span>
                    <span className="text-motta-gray-500">
                      {formatQuantity(item.quantityMilli, item.product.unit)} ×{" "}
                      {formatBRL(item.product.priceCents)}
                    </span>
                  </span>
                  <span className="shrink-0 font-bold text-motta-ink">
                    {formatBRL(item.lineSubtotalCents)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="space-y-2 border-t border-motta-gray-200 pt-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-motta-gray-700">Subtotal</span>
                <strong className="text-motta-ink">{formatBRL(subtotalCents)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-motta-gray-700">
                  {isDelivery ? "Entrega" : "Retirada"}
                </span>
                <span className="font-semibold text-motta-ink">
                  {deliveryFeeCents === 0 ? "Grátis" : formatBRL(deliveryFeeCents)}
                </span>
              </div>
              <div className="flex items-end justify-between border-t border-motta-gray-200 pt-2">
                <span className="text-sm font-bold text-motta-ink">Total</span>
                <span className="text-2xl font-black text-motta-ink">
                  {formatBRL(totalCents)}
                </span>
              </div>
            </div>

            {belowMinimum ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-800">
                Pedido mínimo de {formatBRL(rules.minimumOrderCents)}. Faltam{" "}
                {formatBRL(rules.minimumOrderCents - subtotalCents)}.
              </p>
            ) : null}

            {submitError ? (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-motta-red-dark"
              >
                {submitError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={belowMinimum || submitting}
              className={buttonStyles({ variant: "primary", fullWidth: true })}
            >
              {submitting ? "Registrando pedido…" : "Finalizar pedido"}
              <ArrowRightIcon className="h-4 w-4" />
            </button>

          </CardBody>
        </Card>
      </form>
    </Container>
  );
}
