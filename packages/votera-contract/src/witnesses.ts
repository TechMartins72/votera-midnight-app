import { Ledger } from "./managed/votera/contract/index.cjs";
import { WitnessContext } from "@midnight-ntwrk/compact-runtime";

export type VoteraPrivateState = {
  readonly secretKey: Uint8Array;
};

export const createVoteraPrivateState = (secretKey: Uint8Array) => ({
  secretKey,
});

export const witnesses = {
  local_secret_key: (
    state: WitnessContext<Ledger, VoteraPrivateState>
  ): [VoteraPrivateState, Uint8Array] => {
    state.privateState.secretKey;
    return [state.privateState, state.privateState.secretKey];
  },
};
