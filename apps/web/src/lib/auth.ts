/**
 * Lightweight JWT verifier for the Next.js /api/evaluate route.
 * Uses the Web Crypto API (available in both Node.js 18+ and Edge runtime).
 * Expects HS256-signed tokens using the same JWT_SECRET as the Fastify API.
 */

export interface JWTPayload {
  sub: string;
  tenantId: string;
  roles: string[];
  exp?: number;
  iat?: number;
}

function base64UrlDecode(input: string): ArrayBuffer {
  // Replace URL-safe chars and add padding
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const buf = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buf;
}

export async function verifyJWT(token: string): Promise<JWTPayload> {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");

  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT structure");

  const [headerB64, payloadB64, signatureB64] = parts as [string, string, string];

  // Import the HMAC key
  const keyData = new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  // Verify signature
  const signingInput = `${headerB64}.${payloadB64}`;
  const signature = base64UrlDecode(signatureB64);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    new TextEncoder().encode(signingInput)
  );

  if (!valid) throw new Error("JWT signature verification failed");

  // Decode payload
  const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
  const payload = JSON.parse(payloadJson) as JWTPayload;

  // Check expiry
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("JWT has expired");
  }

  return payload;
}
