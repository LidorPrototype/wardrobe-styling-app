import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

// OWASP's recommended scrypt cost. Stored with each hash so it can be raised
// later without invalidating existing passphrases.
const PARAMS = { N: 2 ** 17, r: 8, p: 1 };
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

function derive(passphrase: string, salt: Buffer, params: typeof PARAMS): Promise<Buffer> {
  // Node's default memory cap (32 MB) is below what N=2^17 needs (128 MB).
  const options: ScryptOptions = { ...params, maxmem: 256 * 1024 * 1024 };
  return new Promise((resolve, reject) =>
    scrypt(passphrase.normalize("NFKC"), salt, KEY_LENGTH, options, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
}

export async function hashPassphrase(passphrase: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(passphrase, salt, PARAMS);
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassphrase(passphrase: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, saltB64, keyB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !keyB64) return false;

  const expected = Buffer.from(keyB64, "base64");
  const actual = await derive(passphrase, Buffer.from(saltB64, "base64"), {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
