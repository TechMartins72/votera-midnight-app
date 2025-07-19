export const generateRandomBytes32 = (): Uint8Array => {
  const newBytes = new Uint8Array(32);
  crypto.getRandomValues(newBytes);
  return newBytes;
};

export const generateBytes32FromString = (input: string): Uint8Array => {
  const text = new TextEncoder().encode(input);
  return text;
};

export const convertToUintArray = (publicAddress: string): Uint8Array => {
  const encoder = new TextEncoder();
  return encoder.encode(publicAddress);
};

export function uint8ArrayToHex(uint8Array: Uint8Array) {
  return Array.from(uint8Array)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
