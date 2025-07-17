import { Contract, VoteraPrivateState } from "@repo/votera-contract";
import {
  type ImpureCircuitId,
  MidnightProviders,
} from "@midnight-ntwrk/midnight-js-types";
import {
  DeployedContract,
  FoundContract,
} from "@midnight-ntwrk/midnight-js-contracts";

export const VoteraPrivateStateKey: string = "voteraPrivateState";

export type VoteraContract = Contract<VoteraPrivateState>;

export type VoteraCircuits = ImpureCircuitId<Contract<VoteraPrivateState>>;

export declare const toHex: (bytes: Uint8Array) => string;

export type VoteraCircuitKeys = Exclude<
  keyof VoteraContract["impureCircuits"],
  number | symbol
>;

export type VoteraContractProvider = MidnightProviders<
  VoteraCircuits,
  typeof VoteraPrivateStateKey,
  VoteraPrivateState
>;

export type DeployedVoteraContract =
  | DeployedContract<VoteraContract>
  | FoundContract<VoteraContract>;

export type derivedLedgerState = {
  voters: string[];
  candidates: {
    name: string,
    vote_count: number
  }
};
