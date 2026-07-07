import crypto from "crypto";

// Encrypts Application.data at rest (contains ИИН/БИН, contact details, financial figures).
// AES-256-GCM, key derived from APPLICATION_DATA_KEY (set it in production; the dev fallback
// below only exists so local seeding/demo works without extra setup).

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.APPLICATION_DATA_KEY ?? "eppb-dev-only-key-do-not-use-in-production";
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptString(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${authTag.toString("base64")}:${ciphertext.toString("base64")}`;
}

export function decryptString(value: string): string {
  const parts = value.split(":");
  if (parts.length !== 4 || parts[0] !== "v1") return value; // not encrypted (legacy/plain), pass through
  const [, ivB64, tagB64, dataB64] = parts;
  try {
    const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const plain = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
    return plain.toString("utf8");
  } catch {
    return value;
  }
}

// Masks an ИИН/БИН (or similar identifier) to its last 4 digits for logs/audit trails.
export function maskId(value: string | null | undefined): string {
  if (!value) return "";
  if (value.length <= 4) return "*".repeat(value.length);
  return "*".repeat(value.length - 4) + value.slice(-4);
}

// Redacts known-sensitive keys from a payload before it's persisted to a log table.
const SENSITIVE_KEYS = ["iin", "bin", "value", "applicant_bin", "contact_phone", "contact_email"];

export function maskPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(payload)) {
    if (SENSITIVE_KEYS.includes(key) && typeof val === "string") {
      masked[key] = maskId(val);
    } else {
      masked[key] = val;
    }
  }
  return masked;
}
