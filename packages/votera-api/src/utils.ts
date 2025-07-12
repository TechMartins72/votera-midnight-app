export const randomNonceBytes = (length: number): Uint8Array => {
  const newBytes = new Uint8Array(length);
  crypto.getRandomValues(newBytes);
  return newBytes;
};

import { ContractAddress } from "@midnight-ntwrk/compact-runtime";
import { VoteraAPI, VoteraContractProvider } from "@repo/votera-api";

export const convertToUintArray = (publicAddress: string): Uint8Array => {
  const encoder = new TextEncoder();
  return encoder.encode(publicAddress);
};

export function uint8ArrayToHex(uint8Array: Uint8Array) {
  return Array.from(uint8Array)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
