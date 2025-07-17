import { ContractAddress } from "@midnight-ntwrk/compact-runtime";
import { toHex, uint8ArrayToHex } from "@repo/votera-api";
import { Ledger } from "@repo/votera-contract";

export const getPerson = async (state: Ledger | undefined) => {
  try {
    const personBuffer = await state?.person;
    if (personBuffer) {
      const person = uint8ArrayToHex(personBuffer);
      console.log({ person });
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Now TypeScript knows 'error' is an Error object
      if (error.constructor.name === "CompactError") {
        console.log("CompactError caught!");
        console.log("Error message:", error.message);

        // Extract assertion message
        const assertionMatch = error.message.match(/failed assert: (.+)/);
        if (assertionMatch && assertionMatch[1] === "You can't vote twice!") {
          console.log("⚠️ You have already voted and cannot vote again.");
        }
      } else {
        console.log("Other error:", error.message);
      }
    } else {
      // Handle non-Error objects (rare but possible)
      console.log("Unknown error type:", error);
    }
  }
};

export const convertHexToByte = (hex: string) => {
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
};

export const getVotersList = (voters: {
  isEmpty(): boolean;
  size(): bigint;
  member(elem_0: Uint8Array): boolean;
  [Symbol.iterator](): Iterator<Uint8Array>;
}) => {
  const votersList = Array.from(voters).map((voter) => voter);
  console.log(votersList);
};
