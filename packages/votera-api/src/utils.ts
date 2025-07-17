export const generateRandomBytes32Node = () => {
  const bytes = new Uint8Array(32);
  return new Uint8Array(crypto.getRandomValues(bytes));
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
