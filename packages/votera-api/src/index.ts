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
import { randomNonceBytes } from "./utils.js";

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
        };
      }
    );
  }

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
    const deployedVoteraContract = await findDeployedContract<VoteraContract>(
      providers,
      {
        contractAddress,
        contract: voteraContractInstance,
        privateStateId: VoteraPrivateStateKey,
        initialPrivateState: await VoteraAPI.getPrivateState(providers),
      }
    );
    return new VoteraAPI(deployedVoteraContract, providers);
  }

  private static async getPrivateState(
    providers: VoteraContractProvider
  ): Promise<VoteraPrivateState> {
    const existingPrivateState = await providers.privateStateProvider.get(
      VoteraPrivateStateKey
    );
    return (
      existingPrivateState ?? createVoteraPrivateState(randomNonceBytes(32))
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

  static getVoters = async (
    providers: VoteraContractProvider,
    contractAddress: ContractAddress
  ) => {
    const ledger = await this.getVoteraLedgerState(providers, contractAddress);
    if (ledger != null) {
      console.log(ledger?.voters);
      return ledger?.voters;
    } else {
      console.log(
        `Contract Address ${contractAddress}, doesn't seem to contain any voter `
      );
    }
  };

  static getVotes = async (
    providers: VoteraContractProvider,
    contractAddress: ContractAddress
  ) => {
    try {
      const ledger = await this.getVoteraLedgerState(
        providers,
        contractAddress
      );
      if (ledger != null) {
        console.log(ledger?.candidates);
        return ledger?.candidates;
      } else {
        console.log(
          `Contract Address ${contractAddress}, doesn't seem to contain any voter `
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  async vote(candidate: string) {
    try {
      await this.deployedContract.callTx.vote(candidate);
    } catch (error) {
      console.error({ error });
    }
  }
}

export * from "./common-types.js";
export * from "./utils.js";
