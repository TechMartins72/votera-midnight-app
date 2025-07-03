import { Votera, VoteraPrivateState } from "@repo/votera-contract";
import {
  type ImpureCircuitId,
  MidnightProviders,
} from "@midnight-ntwrk/midnight-js-types";
import {
  DeployedContract,
  FoundContract,
} from "@midnight-ntwrk/midnight-js-contracts";

export const VoteraPrivateStateId: string = "voteraPrivateState";

export type VoteraContract = Votera.Contract<VoteraPrivateState>;

export type VoteraCircuits = ImpureCircuitId<
  Votera.Contract<VoteraPrivateState>
>;

export type VoteraProviders = MidnightProviders<
  VoteraCircuits,
  typeof VoteraPrivateStateId,
  VoteraPrivateState
>;

type Canditate = {
  key: bigint;
};

export type DerivedLedgerState = {
  voters: Uint8Array[];
  instance: bigint;
  votes: Canditate[];
  person: Uint8Array;
};

export type DeployedVoteraContract =
  | DeployedContract<VoteraContract>
  | FoundContract<VoteraContract>;

// import { type MidnightProviders } from "@midnight-ntwrk/midnight-js-types";
// import { type FoundContract } from "@midnight-ntwrk/midnight-js-contracts";
// import type {
//   VoteraPrivateState,
//   Contract,
//   Witnesses,
// } from "@repo/votera-contract";

// export const voteraPrivateStateKey = "VoteraPrivateState";
// export type PrivateStateId = typeof voteraPrivateStateKey;

// export type PrivateStates = {
//   readonly voteraPrivateState: VoteraPrivateState;
// };

// export type VoteraContract = Contract<
//   VoteraPrivateState,
//   Witnesses<VoteraPrivateState>
// >;

// export type VoteraCircuitKeys = Exclude<
//   keyof VoteraContract["impureCircuits"],
//   number | symbol
// >;

// export type VoteraProviders = MidnightProviders<
//   VoteraCircuitKeys,
//   PrivateStateId,
//   VoteraPrivateState
// >;

// export type DeployedVoteraContract = FoundContract<VoteraContract>;

// type votetype = {
//   string: number;
// };

// export type VoteraDerivedState = {
//   readonly voters: Set<"string">;
//   readonly instance: bigint;
//   readonly votes: votetype[];
//   readonly person: string;
// };
