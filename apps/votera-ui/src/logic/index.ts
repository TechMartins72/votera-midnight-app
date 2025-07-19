import {
  concatMap,
  filter,
  firstValueFrom,
  interval,
  map,
  of,
  take,
  throwError,
  timeout,
  catchError,
  tap,
  Observable,
  BehaviorSubject,
} from "rxjs";
import { pipe as fnPipe } from "fp-ts/function";
import {
  type DAppConnectorAPI,
  type DAppConnectorWalletAPI,
  type ServiceUriConfig,
} from "@midnight-ntwrk/dapp-connector-api";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import {
  type BalancedTransaction,
  type UnbalancedTransaction,
  createBalancedTx,
} from "@midnight-ntwrk/midnight-js-types";
import {
  type CoinInfo,
  Transaction,
  type TransactionId,
} from "@midnight-ntwrk/ledger";
import { Transaction as ZswapTransaction } from "@midnight-ntwrk/zswap";
import semver from "semver";
import {
  getLedgerNetworkId,
  getZswapNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import { type ContractAddress } from "@midnight-ntwrk/compact-runtime";
import {
  VoteraPrivateStateKey,
  type VoteraCircuitKeys,
  type VoteraContractProvider,
} from "@repo/votera-api";
import { VoteraAPI } from "@repo/votera-api";

export type status =
  | "in-progress"
  | "deployed"
  | "failed-with-error"
  | "no-action";

export interface DeployedVoteraAPIProvider {
  readonly resolve: (
    contractAddress?: ContractAddress
  ) => Promise<VoteraAPI | undefined>;
  readonly status$: Observable<status>;
  readonly receive: (deployedContract: VoteraAPI, value: number) => void;
}

export class BrowserDeployedVoteraManager implements DeployedVoteraAPIProvider {
  contractAddress: ContractAddress | null;
  private statusSubject: BehaviorSubject<status>;
  readonly status$: Observable<status>;
  // private deployedContract: undefined

  constructor() {
    this.contractAddress = null;
    this.statusSubject = new BehaviorSubject<status>("no-action");
    this.status$ = this.statusSubject.asObservable();
  }

  async resolve(contractAddress?: ContractAddress) {
    this.statusSubject.next("in-progress");

    try {
      let api;
      if (contractAddress) {
        api = await this.joinDeployment(contractAddress);
      } else {
        api = await this.deployDeployment();
        if (api) {
          this.contractAddress =
            api?.deployedContract.deployTxData.public.contractAddress;
        }
      }

      if (api) {
        this.statusSubject.next("deployed");
      } else {
        this.statusSubject.next("failed-with-error");
      }

      return api;
    } catch (error) {
      this.statusSubject.next("failed-with-error");
      console.log("Error at Resolve" + error);
      return undefined;
    }
  }

  private async deployDeployment(): Promise<VoteraAPI | undefined> {
    let api;
    try {
      const providers = await initializeProviders();
      api = await VoteraAPI.deployVoteraContract(providers);
      return api;
    } catch (error: unknown) {
      console.log(error);
    } finally {
      return api;
    }
  }

  private async joinDeployment(
    contractAddress: ContractAddress
  ): Promise<VoteraAPI | undefined> {
    let api;
    try {
      const providers = await initializeProviders();
      api = await VoteraAPI.join(providers, contractAddress);
      return api;
    } catch (error: unknown) {
      console.log(error);
    } finally {
      return api;
    }
  }

  async receive(deployedContract: VoteraAPI, value: number) {
    try {
      console.log("Processing funds transfer...");
      await VoteraAPI.sentToContract(deployedContract, value);
      console.log("Funds transfer completed.");
    } catch (error) {
      console.log("Unable to recieve funds...: " + error);
    }
  }
}

const initializeProviders = async (): Promise<VoteraContractProvider> => {
  const { wallet, uris } = await connectToWallet();
  const walletState = await wallet.state();

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: VoteraPrivateStateKey,
    }),
    zkConfigProvider: new FetchZkConfigProvider<VoteraCircuitKeys>(
      window.location.origin,
      fetch.bind(window)
    ),
    proofProvider: httpClientProofProvider(uris.proverServerUri),
    publicDataProvider: indexerPublicDataProvider(
      uris.indexerUri,
      uris.indexerWsUri
    ),
    walletProvider: {
      coinPublicKey: walletState.coinPublicKey,
      encryptionPublicKey: walletState.encryptionPublicKey,
      balanceTx(
        tx: UnbalancedTransaction,
        newCoins: CoinInfo[]
      ): Promise<BalancedTransaction> {
        return wallet
          .balanceAndProveTransaction(
            ZswapTransaction.deserialize(
              tx.serialize(getLedgerNetworkId()),
              getZswapNetworkId()
            ),
            newCoins
          )
          .then((zswapTx) =>
            Transaction.deserialize(
              zswapTx.serialize(getZswapNetworkId()),
              getLedgerNetworkId()
            )
          )
          .then(createBalancedTx);
      },
    },
    midnightProvider: {
      submitTx(tx: BalancedTransaction): Promise<TransactionId> {
        return wallet.submitTransaction(tx);
      },
    },
  };
};

const connectToWallet = (): Promise<{
  wallet: DAppConnectorWalletAPI;
  uris: ServiceUriConfig;
}> => {
  const COMPATIBLE_CONNECTOR_API_VERSION = "1.x";
  return firstValueFrom(
    fnPipe(
      interval(100),
      map(() => window.midnight?.mnLace),
      tap((connectorAPI) => {
        console.info(connectorAPI, "Check for wallet connector API");
      }),
      filter(
        (connectorAPI): connectorAPI is DAppConnectorAPI => !!connectorAPI
      ),
      concatMap((connectorAPI) =>
        semver.satisfies(
          connectorAPI.apiVersion,
          COMPATIBLE_CONNECTOR_API_VERSION
        )
          ? of(connectorAPI)
          : throwError(() => {
              console.error(
                {
                  expected: COMPATIBLE_CONNECTOR_API_VERSION,
                  actual: connectorAPI.apiVersion,
                },
                "Incompatible version of wallet connector API"
              );

              return new Error(
                `Incompatible version of Midnight Lace wallet found. Require '${COMPATIBLE_CONNECTOR_API_VERSION}', got '${connectorAPI.apiVersion}'.`
              );
            })
      ),
      tap((connectorAPI) => {
        console.info(
          connectorAPI,
          "Compatible wallet connector API found. Connecting."
        );
      }),
      take(1),
      timeout({
        first: 1_000,
        with: () =>
          throwError(() => {
            console.error("Could not find wallet connector API");

            return new Error(
              "Could not find Midnight Lace wallet. Extension installed?"
            );
          }),
      }),
      concatMap(async (connectorAPI) => {
        const isEnabled = await connectorAPI.isEnabled();

        console.info(isEnabled, "Wallet connector API enabled status");

        return connectorAPI;
      }),
      timeout({
        first: 5_000,
        with: () =>
          throwError(() => {
            console.error("Wallet connector API has failed to respond");

            return new Error(
              "Midnight Lace wallet has failed to respond. Extension enabled?"
            );
          }),
      }),
      concatMap(async (connectorAPI) => ({
        walletConnectorAPI: await connectorAPI.enable(),
        connectorAPI,
      })),
      catchError((error, apis) =>
        error
          ? throwError(() => {
              console.error("Unable to enable connector API");
              return new Error("Application is not authorized");
            })
          : apis
      ),
      concatMap(async ({ walletConnectorAPI, connectorAPI }) => {
        const uris = await connectorAPI.serviceUriConfig();

        console.info(
          "Connected to wallet connector API and retrieved service configuration"
        );
        return { wallet: walletConnectorAPI, uris };
      })
    )
  );
};
