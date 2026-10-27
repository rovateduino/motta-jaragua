import { appMode } from "@/lib/env";

/**
 * Contas administrativas que o seed antigo criava com senha pública.
 *
 * O seed não as cria mais e o script `scripts/disable-demo-admins.ts` as
 * desativa no banco. Esta lista é a segunda barreira: mesmo que alguém reative
 * a conta por engano (ou restaure um backup antigo), o login continua bloqueado
 * quando `APP_MODE=production`.
 */
export const LEGACY_DEMO_ADMIN_EMAILS: readonly string[] = [
  "admin@motta.test",
  "atendimento@motta.test",
];

export function isLegacyDemoAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return LEGACY_DEMO_ADMIN_EMAILS.includes(normalized);
}

/** Bloqueio aplicado somente em produção; no demo local/testes o acesso continua. */
export function isLegacyDemoAdminBlocked(email: string): boolean {
  return appMode === "production" && isLegacyDemoAdminEmail(email);
}
