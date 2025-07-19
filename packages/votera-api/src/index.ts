import { CoinInfo } from "@midnight-ntwrk/compact-runtime";
import {
  createVoteraPrivateState,
  VoteraPrivateState,
  witnesses,
} from "@repo/votera-contract";
import { Contract, ledger, Ledger, pureCircuits } from "@repo/votera-contract";
import {
  DeployedVoteraContract,
  VoteraContract,
  VoteraContractProvider,
  VoteraPrivateStateKey,
} from "./common-types.js";
import {
  ContractAddress,
  convert_bigint_to_Uint8Array,
} from "@midnight-ntwrk/compact-runtime";
import { combineLatest, from, map, Observable } from "rxjs";
import {
  deployContract,
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import { generateRandomBytes32 } from "./utils.js";
import { encodeTokenType, nativeToken } from "@midnight-ntwrk/ledger";

const voteraContractInstance: VoteraContract = new Contract(witnesses);

export interface DeployedVoteraAPI {
  readonly deployedContractAddress: ContractAddress;
}

export class VoteraAPI implements DeployedVoteraAPI {
  public readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<Ledger>;

  private constructor(
    public readonly deployedContract: DeployedVoteraContract,
    private providers: VoteraContractProvider
  ) {
    this.deployedContractAddress =
      deployedContract.deployTxData.public.contractAddress;
    this.state$ = combineLatest(
      [
        // Combine public (ledger) state with...
        providers.publicDataProvider
          .contractStateObservable(this.deployedContractAddress, {
            type: "all",
          })
          .pipe(map((contractState) => ledger(contractState.data))),
        from(
          providers.privateStateProvider.get(
            VoteraPrivateStateKey
          ) as Promise<VoteraPrivateState>
        ),
      ],
      // ...and combine them to produce the required derived state.
      (ledgerState, privateState) => {
        const hashedPublicKey = pureCircuits.public_key(
          privateState.secretKey,
          convert_bigint_to_Uint8Array(32, ledgerState.instance)
        );

        return {
          instance: ledgerState.instance,
          person: hashedPublicKey,
          voters: ledgerState.voters,
          candidates: ledgerState.candidates,
          totalTokenReceived: ledgerState.totalTokenReceived,
        };
      }
    );
  }

  static sentToContract = async (
    deployedContract: VoteraAPI,
    amount: number
  ) => {
    const coin = {
      nonce: generateRandomBytes32(),
      color: encodeTokenType(nativeToken()),
      value: BigInt(amount),
    };

    await deployedContract.deployedContract.callTx.receiveSupport(coin);
  };

  static async deployVoteraContract(
    providers: VoteraContractProvider
  ): Promise<VoteraAPI> {
    /**
     * Should deploy a new contract to the blockchain
     * Return the newly deployed contract
     * Log the resulting data about of the newly deployed contract using (logger)
     */
    const deployVoteraContract = await deployContract<VoteraContract>(
      providers,
      {
        contract: voteraContractInstance,
        initialPrivateState: await VoteraAPI.getPrivateState(providers),
        privateStateId: VoteraPrivateStateKey,
        args: ["joseph", "elliot", "samir"],
      }
    );
    return new VoteraAPI(deployVoteraContract, providers);
  }

  static async join(
    providers: VoteraContractProvider,
    contractAddress: ContractAddress
  ): Promise<VoteraAPI> {
    console.log("Join Contract - Starting");
    console.log("Contract Address:", contractAddress);

    try {
      const deployedVoteraContract = await findDeployedContract<VoteraContract>(
        providers,
        {
          contractAddress,
          contract: voteraContractInstance,
          privateStateId: VoteraPrivateStateKey,
          initialPrivateState: await VoteraAPI.getPrivateState(providers),
        }
      );
      console.log("Contract found successfully");

      return new VoteraAPI(deployedVoteraContract, providers);
    } catch (error) {
      console.error("Error in VoteraAPI.join:", error);
      throw error;
    }
  }

  private static async getPrivateState(
    providers: VoteraContractProvider
  ): Promise<VoteraPrivateState> {
    const existingPrivateState = await providers.privateStateProvider.get(
      VoteraPrivateStateKey
    );
    return (
      existingPrivateState ?? createVoteraPrivateState(generateRandomBytes32())
    );
  }

  static getVoteraLedgerState = (
    providers: VoteraContractProvider,
    contractAddress: ContractAddress
  ): Promise<Ledger | null> =>
    providers.publicDataProvider
      .queryContractState(contractAddress)
      .then((contractState) =>
        contractState != null ? ledger(contractState.data) : null
      );

  static getVoters = async (state: Ledger | undefined) => {
    try {
      if (state != null) {
        console.log(state?.voters);
        return state?.voters;
      }
    } catch (error) {
      console.log(error);
    }
  };

  static getVotes = async (state: Ledger | undefined) => {
    try {
      if (state != null) {
        console.log(state?.candidates);
        return state?.candidates;
      }
    } catch (error) {
      console.log(error);
    }
  };
}

/**
 * LOGICS TO TRANSFER TO THE CONTRACT ADDRESS
 */

export * from "./common-types.js";
export * from "./utils.js";
