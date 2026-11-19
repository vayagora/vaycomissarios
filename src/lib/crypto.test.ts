import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "./crypto";

const key = randomBytes(32).toString("base64");

describe("cifra das senhas", () => {
  it("cifra e decifra", () => {
    const enc = encryptSecret("minha senha ç 123", key);
    expect(enc).not.toContain("minha");
    expect(enc.startsWith("v1:")).toBe(true);
    expect(decryptSecret(enc, key)).toBe("minha senha ç 123");
  });
  it("cada cifra é diferente (IV aleatório)", () => {
    expect(encryptSecret("x", key)).not.toBe(encryptSecret("x", key));
  });
  it("chave errada ou texto adulterado falham", () => {
    const enc = encryptSecret("segredo", key);
    expect(() => decryptSecret(enc, randomBytes(32).toString("base64"))).toThrow();
    const parts = enc.split(":");
    parts[3] = Buffer.from("outra coisa").toString("base64");
    expect(() => decryptSecret(parts.join(":"), key)).toThrow();
  });
  it("vazio continua vazio", () => {
    expect(encryptSecret("", key)).toBe("");
    expect(decryptSecret("", key)).toBe("");
  });
  it("exige chave de 32 bytes", () => {
    expect(() => encryptSecret("x", "")).toThrow(/CREDENTIALS_KEY/);
    expect(() => encryptSecret("x", Buffer.from("curta").toString("base64"))).toThrow(/32 bytes/);
  });
});

describe("senha provisória", () => {
  it("12 caracteres legíveis, sem 0/O/1/l/I, e diferentes a cada vez", async () => {
    const { tempPassword } = await import("./crypto");
    const a = tempPassword();
    expect(a).toMatch(/^[A-HJ-NP-Za-km-np-z2-9]{12}$/);
    expect(new Set(Array.from({ length: 50 }, () => tempPassword())).size).toBe(50);
  });
});

describe("senha inicial", () => {
  it("primeiro nome minúsculo, sem acento, + 123", async () => {
    const { initialPassword } = await import("./crypto");
    expect(initialPassword("Gabriel Zaidan Guimaraes")).toBe("gabriel123");
    expect(initialPassword("Flávia De Oliveira")).toBe("flavia123");
    expect(initialPassword("  Marco Aurelio  Faleiro")).toBe("marco123");
    expect(initialPassword("Ana")).toBe("ana123");
    expect(initialPassword("")).toMatch(/^[A-Za-z2-9]{12}$/);
  });
});
