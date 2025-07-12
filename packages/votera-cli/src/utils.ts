import { ContractAddress } from "@midnight-ntwrk/compact-runtime";
import {
  uint8ArrayToHex,
  VoteraAPI,
  VoteraContractProvider,
} from "@repo/votera-api";

export const getPerson = async (
  providers: VoteraContractProvider,
  contractAddress: ContractAddress
) => {
  try {
    const personBuffer = (
      await VoteraAPI.getVoteraLedgerState(providers, contractAddress)
    )?.person;
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
