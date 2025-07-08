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

export type VoteraCircuitKeys = Exclude<
  keyof VoteraContract["impureCircuits"],
  number | symbol
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
