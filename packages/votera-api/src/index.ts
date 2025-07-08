import {
  convert_bigint_to_Uint8Array,
  type ContractAddress,
} from "@midnight-ntwrk/compact-runtime";
import { combineLatest, map, from, type Observable } from "rxjs";
import {
  type VoteraPrivateState,
  createVoteraPrivateState,
  Votera,
  witnesses,
} from "@repo/votera-contract";
import {
  deployContract,
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import { assertIsContractAddress } from "@midnight-ntwrk/midnight-js-utils";
import {
  DeployedVoteraContract,
  DerivedLedgerState,
  VoteraContract,
  VoteraPrivateStateId,
  VoteraProviders,
} from "./common-types.js";

export const VoteraContractInstance: VoteraContract = new Votera.Contract(
  witnesses
);

export const deploy = async (
  providers: VoteraProviders
): Promise<DeployedVoteraContract | undefined> => {
  let deployedVoteraContract;
  try {
    deployedVoteraContract = await deployContract(providers, {
      contract: VoteraContractInstance,
      privateStateId: VoteraPrivateStateId,
      initialPrivateState: await getPrivateState(providers),
    });
  } catch (error) {
    console.log(error);
  }
  return deployedVoteraContract;
};

export const joinContract = async (
  providers: VoteraProviders,
  contractAddress: ContractAddress
): Promise<DeployedVoteraContract | undefined> => {
  let foundContract;
  try {
    assertIsContractAddress(contractAddress);
    foundContract = await findDeployedContract(providers, {
      contractAddress,
      contract: VoteraContractInstance,
      privateStateId: VoteraPrivateStateId,
      initialPrivateState: await getPrivateState(providers),
    });
  } catch (error) {
    console.log(error);
  }

  return foundContract;
};

export const getLedgerStateObs = (
  providers: VoteraProviders,
  contractAddress: ContractAddress
): Observable<Votera.Ledger> => {
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
      const hashedSecretKey = Votera.pureCircuits.public_key(
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

export const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};

const getPrivateState = async (
  providers: VoteraProviders
): Promise<VoteraPrivateState> => {
  const existingPrivateState =
    await providers.privateStateProvider.get(VoteraPrivateStateId);
  return existingPrivateState ?? createVoteraPrivateState(randomBytes(32));
};

export const vote = async (
  deployedContract: DeployedVoteraContract,
  candidate: number
) => {
  const txData = await deployedContract.callTx.vote(candidate);

  console.log(`
    ${txData.public.txHash},
    ${txData.public.blockHeight}
    ${txData.public.blockHash}
    `);
};

export * from "./common-types.js";
