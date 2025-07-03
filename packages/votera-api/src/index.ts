import {
  convert_bigint_to_Uint8Array,
  type ContractAddress,
} from "@midnight-ntwrk/compact-runtime";
import { combineLatest, map, tap, from, type Observable } from "rxjs";
import {
  type VoteraPrivateState,
  Votera,
  witnesses,
} from "@repo/votera-contract";
import {
  deployContract,
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import {
  assertIsContractAddress,
  toHex,
} from "@midnight-ntwrk/midnight-js-utils";
import {
  DeployedVoteraContract,
  VoteraContract,
  VoteraPrivateStateId,
  VoteraProviders,
  DerivedLedgerState,
} from "./common-types.js";
import {
  Ledger,
  pureCircuits,
} from "../../votera-contract/dist/managed/votera/contract/index.cjs";

export const VoteraContractInstance: VoteraContract = new Votera.Contract(
  witnesses
);

export const deploy = async (
  providers: VoteraProviders,
  privateState: VoteraPrivateState
): Promise<DeployedVoteraContract | undefined> => {
  let deployedVoteraContract;
  try {
    deployedVoteraContract = await deployContract(providers, {
      contract: VoteraContractInstance,
      privateStateId: VoteraPrivateStateId,
      initialPrivateState: privateState,
    });
  } catch (error) {
    console.log(error);
  }
  return deployedVoteraContract;
};

export const joinContract = async (
  providers: VoteraProviders,
  contractAddress: ContractAddress,
  privateState: VoteraPrivateState
): Promise<DeployedVoteraContract | undefined> => {
  let foundContract;
  try {
    assertIsContractAddress(contractAddress);
    foundContract = await findDeployedContract(providers, {
      contractAddress,
      contract: VoteraContractInstance,
      privateStateId: VoteraPrivateStateId,
      initialPrivateState: privateState,
    });
  } catch (error) {
    console.log(error);
  }

  return foundContract;
};

export const getLedgerState = async (
  providers: VoteraProviders,
  contractAddress: ContractAddress
): Promise<Ledger | null> => {
  assertIsContractAddress(contractAddress);
  const ledgerState = await providers.publicDataProvider
    .queryContractState(contractAddress)
    .then((contractState) =>
      contractState != null ? Votera.ledger(contractState.data) : null
    );
  return ledgerState;
};

export const getLedgerStateObs = (
  providers: VoteraProviders,
  contractAddress: ContractAddress
): Observable<Ledger> => {
  assertIsContractAddress(contractAddress);

  const state = combineLatest([
    providers.publicDataProvider
      .contractStateObservable(contractAddress, { type: "latest" })
      .pipe(
        map((contractState) => {
          return Votera.ledger(contractState.data); // Added return statement
        })
      ),
    from(
      providers.privateStateProvider.get(
        VoteraPrivateStateId
      ) as Promise<VoteraPrivateState>
    ),
  ]).pipe(
    map(([publicState, privateState]) => {
      // ✅ New syntax
      const hashedSecretKey = pureCircuits.public_key(
        privateState.secretKey,
        convert_bigint_to_Uint8Array(32, publicState.instance)
      );

      return {
        voters: publicState.voters,
        instance: publicState.instance,
        votes: publicState.votes,
        person: hashedSecretKey,
      };
    })
  );

  return state;
};

export const getPrivateState = async (
  providers: VoteraProviders
): Promise<VoteraPrivateState | null> => {
  const initialPrivateState =
    await providers.privateStateProvider.get(VoteraPrivateStateId);
  return initialPrivateState;
};
