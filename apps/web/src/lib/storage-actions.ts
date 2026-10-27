"use server";

import "server-only";

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAction } from "@/lib/auth/session";

const BUCKET = "product-images";
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export type UploadProductImageResult =
  | { readonly ok: true; readonly url: string; readonly path: string }
  | { readonly ok: false; readonly message: string };

interface DetectedImage {
  readonly extension: "jpg" | "png" | "webp";
  readonly contentType: "image/jpeg" | "image/png" | "image/webp";
}

/**
 * Identifica o formato pelos bytes do arquivo, em vez de confiar apenas no
 * `Content-Type` ou na extensão enviados pelo navegador.
 */
function detectImage(bytes: Uint8Array): DetectedImage | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return { extension: "jpg", contentType: "image/jpeg" };
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { extension: "png", contentType: "image/png" };
  }

  if (bytes.length >= 12) {
    const riff = String.fromCharCode(...bytes.slice(0, 4));
    const webp = String.fromCharCode(...bytes.slice(8, 12));
    if (riff === "RIFF" && webp === "WEBP") {
      return { extension: "webp", contentType: "image/webp" };
    }
  }

  return null;
}

/**
 * Upload de imagem de produto para o bucket público `product-images` do
 * Supabase Storage.
 *
 * A validação acontece no servidor: exige `products.write`, limita a 2 MB e
 * confere os bytes reais do arquivo (JPG, PNG ou WebP). O nome é gerado com
 * UUID para nunca reaproveitar/sobrescrever imagens existentes.
 */
export async function uploadProductImageAction(
  formData: FormData,
): Promise<UploadProductImageResult> {
  await requireAdminAction("products.write");

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return { ok: false, message: "Selecione uma imagem para enviar." };
  }
  if (file.size === 0) {
    return { ok: false, message: "O arquivo selecionado está vazio." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, message: "A imagem deve ter no máximo 2 MB." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectImage(bytes);
  if (!detected) {
    return {
      ok: false,
      message: "Envie uma imagem JPG, PNG ou WebP válida.",
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Upload de imagem indisponível: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.",
    );
    return {
      ok: false,
      message: "O storage de imagens não está configurado no servidor.",
    };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const date = new Date();
  const folder = `products/${date.getUTCFullYear()}-${String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
  const path = `${folder}/${randomUUID()}.${detected.extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType: detected.contentType,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    console.error("Falha ao enviar imagem ao Supabase Storage", error);
    return {
      ok: false,
      message: "Não foi possível enviar a imagem. Tente novamente.",
    };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!data.publicUrl) {
    return {
      ok: false,
      message: "A imagem foi enviada, mas a URL pública não pôde ser gerada.",
    };
  }

  return { ok: true, url: data.publicUrl, path };
}
