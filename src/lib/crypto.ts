// Cifra das senhas dos programas guardadas pelo comissário (AES-256-GCM).
// A chave fica só no servidor (CREDENTIALS_KEY, 32 bytes em base64). Formato: v1:<iv>:<tag>:<cifrado>.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function key(raw = process.env.CREDENTIALS_KEY): Buffer {
  if (!raw) throw new Error("CREDENTIALS_KEY não configurada.");
  const k = Buffer.from(raw, "base64");
  if (k.length !== 32) throw new Error("CREDENTIALS_KEY precisa ter 32 bytes em base64.");
  return k;
}

export function encryptSecret(plain: string, rawKey?: string): string {
  if (!plain) return "";
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(rawKey), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), ct.toString("base64")].join(":");
}

export function decryptSecret(enc: string, rawKey?: string): string {
  if (!enc) return "";
  const [v, iv, tag, ct] = enc.split(":");
  if (v !== "v1" || !iv || !tag || ct === undefined) throw new Error("Formato de senha cifrada inválido.");
  const d = createDecipheriv("aes-256-gcm", key(rawKey), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(ct, "base64")), d.final()]).toString("utf8");
}
