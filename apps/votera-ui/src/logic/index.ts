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
import {
  getLedgerNetworkId,
  getZswapNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import {
  type DeployedVoteraContract,
  type VoteraProviders,
} from "@repo/votera-api";

import {
  type DAppConnectorAPI,
  type DAppConnectorWalletAPI,
  type ServiceUriConfig,
} from "@midnight-ntwrk/dapp-connector-api";
import {
  firstValueFrom,
  of,
  take,
  timeout,
  concatMap,
  throwError,
  catchError,
  interval,
  map,
  filter,
} from "rxjs";
import { pipe as fnPipe } from "fp-ts/function";
import semver from "semver";

const connectToWallet = (): Promise<{
  wallet: DAppConnectorWalletAPI;
  uris: ServiceUriConfig;
}> => {
  const COMPATIBLE_CONNECTOR_API_VERSION = "1.x";

  return firstValueFrom(
    fnPipe(
      interval(100),
      map(() => window.midnight?.Lace),
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

export const initializeProviders = async (): Promise<VoteraProviders> => {
  const { wallet, uris } = await connectToWallet();
  const walletState = await wallet.state();

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: "bboard-private-state",
    }),
    zkConfigProvider: new FetchZkConfigProvider(
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
          .then((transaction) => createBalancedTx(transaction));
      },
    },
    midnightProvider: {
      submitTx(tx: BalancedTransaction): Promise<TransactionId> {
        return wallet.submitTransaction(tx);
      },
    },
  };
};
