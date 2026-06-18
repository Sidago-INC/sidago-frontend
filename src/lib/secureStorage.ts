const SECRET_KEY = import.meta.env.VITE_STORAGE_SECRET_KEY;

function getSubtleCrypto() {
  return globalThis.crypto?.subtle ?? null;
}

function canEncrypt() {
  return Boolean(getSubtleCrypto() && SECRET_KEY);
}

async function getKey() {
  const subtle = getSubtleCrypto();

  if (!subtle) {
    return null;
  }

  if (!SECRET_KEY) {
    return null;
  }

  const enc = new TextEncoder();
  // Derive a 256-bit key via SHA-256 so any-length secret is valid
  const keyMaterial = await subtle.digest("SHA-256", enc.encode(SECRET_KEY));
  return subtle.importKey("raw", keyMaterial, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encrypt(data: string) {
  if (!globalThis.crypto || !canEncrypt()) {
    return data;
  }

  const key = await getKey();
  if (!key) {
    return data;
  }

  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));

  const encoded = new TextEncoder().encode(data);

  const subtle = getSubtleCrypto();

  if (!subtle) {
    return data;
  }

  const ciphertext = await subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded,
  );

  return JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(ciphertext)),
  });
}

export async function decrypt(payload: string) {
  try {
    if (!canEncrypt()) {
      return payload;
    }

    const { iv, data } = JSON.parse(payload);
    const key = await getKey();
    const subtle = getSubtleCrypto();

    if (!key || !subtle) {
      return payload;
    }

    const decrypted = await subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      new Uint8Array(data),
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    return payload;
  }
}
