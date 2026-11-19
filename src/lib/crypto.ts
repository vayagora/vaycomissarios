// Cifra das senhas dos programas guardadas pelo comissário (AES-256-GCM).
// A chave fica só no servidor (CREDENTIALS_KEY). Aceita qualquer senha longa (24+ caracteres),
// transformada numa chave de 32 bytes por SHA-256. Formato do cifrado: v1:<iv>:<tag>:<cifrado>.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export const MIN_KEY_LENGTH = 24;

function key(raw = process.env.CREDENTIALS_KEY): Buffer {
  if (!raw) throw new Error("CREDENTIALS_KEY não configurada.");
  if (raw.length < MIN_KEY_LENGTH) throw new Error(`CREDENTIALS_KEY precisa ter pelo menos ${MIN_KEY_LENGTH} caracteres.`);
  return createHash("sha256").update(raw, "utf8").digest();
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

// Senha provisória legível para mandar pelo WhatsApp (sem caracteres que se confundem: 0/O, 1/l/I).
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
export function tempPassword(length = 12): string {
  const out: string[] = [];
  // Rejeição para não enviesar a distribuição
  while (out.length < length) {
    for (const b of randomBytes(length * 2)) {
      if (b < 256 - (256 % ALPHABET.length)) out.push(ALPHABET[b % ALPHABET.length]);
      if (out.length === length) break;
    }
  }
  return out.join("");
}

// Senha inicial padrão combinada com a Vay: primeiro nome, minúsculo e sem acento, + "123"
// ("Flávia Ruas" → "flavia123"). É previsível: por isso a troca no primeiro acesso é obrigatória.
export function initialPassword(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? "";
  const clean = first.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
  return clean ? `${clean}123` : tempPassword();
}
