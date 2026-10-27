export const appMode = process.env.APP_MODE === "production" ? "production" : "demo";

export const isDemo = appMode === "demo";

export const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Mercado Motta Jaraguá";
