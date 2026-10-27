import "server-only";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

type Attempt = {
  failures: number;
  firstFailureAt: number;
  blockedUntil?: number;
};

const globalForAttempts = globalThis as unknown as {
  mottaLoginAttempts?: Map<string, Attempt>;
};

const attempts = globalForAttempts.mottaLoginAttempts ?? new Map<string, Attempt>();

if (process.env.NODE_ENV !== "production") {
  globalForAttempts.mottaLoginAttempts = attempts;
}

export function loginRetryAfterSeconds(key: string): number {
  const attempt = attempts.get(key);
  if (!attempt) return 0;

  const now = Date.now();
  if (attempt.blockedUntil && attempt.blockedUntil > now) {
    return Math.ceil((attempt.blockedUntil - now) / 1000);
  }

  if (now - attempt.firstFailureAt > WINDOW_MS) {
    attempts.delete(key);
  }

  return 0;
}

export function recordLoginFailure(key: string): void {
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || now - current.firstFailureAt > WINDOW_MS) {
    attempts.set(key, { failures: 1, firstFailureAt: now });
    return;
  }

  const failures = current.failures + 1;
  attempts.set(key, {
    failures,
    firstFailureAt: current.firstFailureAt,
    blockedUntil: failures >= MAX_FAILURES ? now + WINDOW_MS : undefined,
  });
}

export function clearLoginFailures(key: string): void {
  attempts.delete(key);
}
