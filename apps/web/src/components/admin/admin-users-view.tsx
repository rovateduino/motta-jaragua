"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  buttonStyles,
  Card,
  CardBody,
  cn,
  EditIcon,
  PowerIcon,
} from "@motta/ui";
import {
  CreateAdminForm,
  type AssignableRole,
} from "@/components/auth/create-admin-form";
import {
  deactivateAdminsAction,
  setAdminActiveAction,
  updateAdminRolesAction,
} from "@/lib/auth/actions";
import type { AdminUserRecord } from "@/lib/admin-types";
import {
  AdminPageHeader,
  EmptyState,
  Feedback,
} from "@/components/admin/shared";
import { formatAdminDateTime } from "@/lib/admin-format";

type FeedbackState = { tone: "success" | "error"; text: string };

function AdminRolesDialog({
  admin,
  roles,
  onClose,
  onSaved,
}: {
  admin: AdminUserRecord;
  roles: readonly AssignableRole[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [roleIds, setRoleIds] = useState<string[]>([...admin.roleIds]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function toggleRole(roleId: string): void {
    setRoleIds((current) =>
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId],
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await updateAdminRolesAction({
        id: admin.id,
        roleIds,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onSaved(result.message);
    } catch {
      setError("Falha inesperada ao atualizar os papéis.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-roles-title"
        className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="admin-roles-title"
              className="text-lg font-extrabold text-motta-ink"
            >
              Editar papéis
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-motta-gray-500">
              {admin.name} · {admin.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar edição de papéis"
            className={buttonStyles({ variant: "ghost", size: "sm" })}
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
          <fieldset className="space-y-2">
            <legend className="text-xs font-bold text-motta-ink">
              Papéis e permissões
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {roles.map((role) => {
                const checked = roleIds.includes(role.id);
                return (
                  <label
                    key={role.id}
                    className={cn(
                      "flex items-start gap-2 rounded-xl border p-3 text-xs leading-relaxed",
                      checked
                        ? "border-motta-red bg-red-50/60"
                        : "border-motta-gray-200 bg-white",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRole(role.id)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-motta-red"
                    />
                    <span>
                      <strong className="block font-black text-motta-ink">
                        {role.name}
                      </strong>
                      <span className="text-motta-gray-500">
                        {role.description ?? "Sem descrição."}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <p className="text-[11px] leading-relaxed text-motta-gray-500">
            O acesso passa a valer imediatamente, sem recriar a conta. É
            necessário manter ao menos um papel.
          </p>
          {error ? <Feedback tone="error">{error}</Feedback> : null}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting || roleIds.length === 0}
              className={buttonStyles({ variant: "primary" })}
            >
              {submitting ? "Salvando…" : "Salvar papéis"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={buttonStyles({ variant: "outline" })}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminUsersView({
  admins,
  roles,
  currentAdminId,
  canWrite,
}: {
  admins: readonly AdminUserRecord[];
  roles: readonly AssignableRole[];
  currentAdminId: string;
  canWrite: boolean;
}) {
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [bulkPending, setBulkPending] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminUserRecord | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const activeAdmins = admins.filter((admin) => admin.active);
  const eligibleAdmins = activeAdmins.filter(
    (admin) => admin.id !== currentAdminId,
  );

  // Depois de um refresh, usuários desativados deixam de ser elegíveis: a
  // seleção é podada para não tentar desativar quem já está inativo.
  useEffect(() => {
    setSelectedIds((current) => {
      const alive = current.filter((id) =>
        admins.some(
          (admin) =>
            admin.id === id && admin.active && admin.id !== currentAdminId,
        ),
      );
      return alive.length === current.length ? current : alive;
    });
  }, [admins, currentAdminId]);

  const allSelected =
    eligibleAdmins.length > 0 &&
    eligibleAdmins.every((admin) => selectedIds.includes(admin.id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedIds.length > 0 && !allSelected;
    }
  }, [selectedIds.length, allSelected]);

  function toggleSelection(adminId: string): void {
    setSelectedIds((current) =>
      current.includes(adminId)
        ? current.filter((id) => id !== adminId)
        : [...current, adminId],
    );
  }

  function toggleAll(): void {
    setSelectedIds(
      allSelected ? [] : eligibleAdmins.map((admin) => admin.id),
    );
  }

  async function deactivateSelected(): Promise<void> {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    const label =
      ids.length === 1
        ? "1 acesso selecionado"
        : `${ids.length} acessos selecionados`;
    const confirmed = window.confirm(
      `Desativar ${label}? Os usuários perderão o acesso ao painel imediatamente. As contas e o histórico de auditoria serão preservados.`,
    );
    if (!confirmed) return;

    setBulkPending(true);
    setFeedback(null);
    try {
      const result = await deactivateAdminsAction(ids);
      setFeedback({ tone: result.ok ? "success" : "error", text: result.message });
      setSelectedIds([]);
      router.refresh();
    } catch {
      setFeedback({
        tone: "error",
        text: "Falha inesperada ao desativar os usuários.",
      });
    } finally {
      setBulkPending(false);
    }
  }

  async function toggleActive(admin: AdminUserRecord): Promise<void> {
    if (admin.id === currentAdminId) {
      setFeedback({
        tone: "error",
        text: "Você não pode desativar o próprio acesso.",
      });
      return;
    }
    const nextActive = !admin.active;
    if (
      !nextActive &&
      !window.confirm(
        `Desativar o acesso de ${admin.name}? A conta e o histórico de auditoria serão preservados.`,
      )
    ) {
      return;
    }

    setPendingId(admin.id);
    setFeedback(null);
    try {
      const result = await setAdminActiveAction({
        id: admin.id,
        active: nextActive,
      });
      setFeedback({ tone: result.ok ? "success" : "error", text: result.message });
      if (result.ok) router.refresh();
    } catch {
      setFeedback({
        tone: "error",
        text: "Falha inesperada ao alterar o acesso.",
      });
    } finally {
      setPendingId(null);
    }
  }

  function handleRolesSaved(message: string): void {
    setFeedback({ tone: "success", text: message });
    setEditing(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Segurança"
        title="Usuários e papéis"
        description="Crie acessos administrativos, defina permissões e desative contas sem perder o histórico de auditoria."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)] xl:items-start">
        <Card>
          <CardBody className="space-y-4">
            <div>
              <h2 className="text-lg font-extrabold text-motta-ink">
                Novo acesso administrativo
              </h2>
              <p className="text-xs leading-relaxed text-motta-gray-500">
                A senha é armazenada com hash Argon2id e nunca é exibida novamente.
              </p>
            </div>
            <CreateAdminForm roles={[...roles]} />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-2">
            <div>
              <h2 className="text-lg font-extrabold text-motta-ink">
                Papéis disponíveis
              </h2>
              <p className="text-xs text-motta-gray-500">
                Cada papel agrupa um conjunto de permissões do painel.
              </p>
            </div>
            <div className="grid gap-2">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="rounded-xl border border-motta-gray-200 px-3 py-2.5"
                >
                  <p className="text-xs font-black uppercase tracking-wide text-motta-ink">
                    {role.name}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-motta-gray-500">
                    {role.description ?? "Sem descrição."}
                  </p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-motta-ink">Equipe</h2>
              <p className="text-xs text-motta-gray-500">
                {admins.length} acesso(s) cadastrado(s) · {activeAdmins.length}{" "}
                ativo(s).
              </p>
            </div>
            <Badge variant={activeAdmins.length > 0 ? "success" : "danger"}>
              {activeAdmins.length} ativo(s)
            </Badge>
          </div>

          {feedback ? (
            <Feedback tone={feedback.tone}>{feedback.text}</Feedback>
          ) : null}

          {canWrite && selectedIds.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-motta-red/30 bg-red-50 px-3 py-2">
              <strong className="text-xs font-bold text-motta-ink">
                {selectedIds.length} selecionado(s)
              </strong>
              <button
                type="button"
                disabled={bulkPending}
                onClick={() => void deactivateSelected()}
                className={buttonStyles({ variant: "primary", size: "sm" })}
              >
                {bulkPending
                  ? "Desativando…"
                  : `Desativar Selecionados (${selectedIds.length})`}
              </button>
              <button
                type="button"
                disabled={bulkPending}
                onClick={() => setSelectedIds([])}
                className={buttonStyles({ variant: "ghost", size: "sm" })}
              >
                Limpar seleção
              </button>
              <p className="w-full text-[11px] leading-relaxed text-motta-gray-600">
                As contas não são excluídas: o histórico de auditoria é
                preservado. Seu próprio acesso é sempre mantido ativo.
              </p>
            </div>
          ) : null}

          {admins.length === 0 ? (
            <EmptyState
              title="Nenhum acesso administrativo"
              description="Crie o primeiro acesso administrativo pelo formulário acima."
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-motta-gray-200">
              {canWrite ? (
                <div className="flex items-center gap-3 border-b border-motta-gray-200 bg-motta-gray-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-motta-gray-500">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={eligibleAdmins.length === 0}
                    aria-label="Selecionar todos os usuários ativos"
                    className="h-4 w-4 shrink-0 accent-motta-red"
                  />
                  <span className="min-w-0 flex-1">
                    Selecionar todos os ativos
                  </span>
                  <span className="shrink-0">
                    {eligibleAdmins.length} elegível(is)
                  </span>
                </div>
              ) : null}

              <ul className="divide-y divide-motta-gray-200">
                {admins.map((admin) => {
                  const isSelf = admin.id === currentAdminId;
                  const selectable = admin.active && !isSelf;
                  const selected = selectedIds.includes(admin.id);
                  return (
                    <li
                      key={admin.id}
                      className={cn(
                        "flex flex-wrap items-start gap-3 px-4 py-3 transition-colors hover:bg-motta-gray-50 lg:flex-nowrap",
                        selected && "bg-red-50/60",
                      )}
                    >
                      {canWrite ? (
                        <span className="flex h-9 items-center">
                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={!selectable}
                            onChange={() => toggleSelection(admin.id)}
                            aria-label={`Selecionar usuário ${admin.name}`}
                            title={
                              isSelf
                                ? "Você não pode desativar o próprio acesso."
                                : selectable
                                  ? undefined
                                  : "Usuário já está inativo."
                            }
                            className="h-4 w-4 accent-motta-red disabled:opacity-40"
                          />
                        </span>
                      ) : null}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold text-motta-ink">
                            {admin.name}
                          </p>
                          <Badge variant={admin.active ? "success" : "danger"}>
                            {admin.active ? "Ativo" : "Inativo"}
                          </Badge>
                          {isSelf ? (
                            <span className="rounded-md bg-motta-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-motta-gray-700">
                              Você
                            </span>
                          ) : null}
                        </div>
                        <p className="truncate text-[11px] text-motta-gray-500">
                          {admin.email}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {admin.roleNames.length > 0 ? (
                            admin.roleNames.map((roleName) => (
                              <span
                                key={roleName}
                                className="rounded-md bg-motta-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-motta-gray-700"
                              >
                                {roleName}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] font-semibold text-motta-red">
                              Sem papel atribuído
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[10px] text-motta-gray-500">
                          Último login:{" "}
                          {admin.lastLoginAt
                            ? formatAdminDateTime(admin.lastLoginAt)
                            : "nunca"}
                        </p>
                      </div>

                      {canWrite ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={isSelf || pendingId === admin.id}
                            onClick={() => void toggleActive(admin)}
                            aria-label={
                              admin.active
                                ? `Desativar acesso de ${admin.name}`
                                : `Ativar acesso de ${admin.name}`
                            }
                            title={
                              isSelf
                                ? "Você não pode desativar o próprio acesso."
                                : admin.active
                                  ? "Desativar acesso"
                                  : "Ativar acesso"
                            }
                            className={cn(
                              buttonStyles({ variant: "ghost", size: "sm" }),
                              admin.active ? "text-motta-red" : "text-green-700",
                            )}
                          >
                            <PowerIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(admin)}
                            aria-label={`Editar papéis de ${admin.name}`}
                            title="Editar papéis"
                            className={buttonStyles({ variant: "ghost", size: "sm" })}
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <p className="text-[11px] text-motta-gray-500">
            A desativação revoga as sessões abertas, bloqueia novos logins e
            mantém a conta e o histórico de auditoria. Nenhum usuário é
            excluído.
          </p>
        </CardBody>
      </Card>

      {canWrite && editing ? (
        <AdminRolesDialog
          key={editing.id}
          admin={editing}
          roles={roles}
          onClose={() => setEditing(null)}
          onSaved={handleRolesSaved}
        />
      ) : null}
    </div>
  );
}
