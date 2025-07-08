import * as Rx from "rxjs";
import { WalletBuilder, type Resource } from "@midnight-ntwrk/wallet";
import { type Wallet } from "@midnight-ntwrk/wallet-api";
import { toHex } from "@midnight-ntwrk/midnight-js-utils";
import { createInterface, type Interface } from "node:readline/promises";
import { type Config } from "./config.js";
import * as api from "@repo/votera-api";
import {
  BalancedTransaction,
  createBalancedTx,
  MidnightProvider,
  UnbalancedTransaction,
  WalletProvider,
} from "@midnight-ntwrk/midnight-js-types";
import { VoteraPrivateStateId } from "@repo/votera-api";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";

import { CoinInfo } from "@midnight-ntwrk/compact-runtime";
import {
  getLedgerNetworkId,
  getZswapNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import {
  nativeToken,
  Transaction,
  TransactionId,
} from "@midnight-ntwrk/ledger";
import { Transaction as ZswapTransaction } from "@midnight-ntwrk/zswap";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { Ledger } from "../../votera-contract/dist/managed/votera/contract/index.cjs";
/**
 * CREATE A WALLET (FRESH OR FROM SEED) AND GET PROVIDERS
 * DEPLOY OR JOIN A CONTRACT
 * FUND WALLET (LOOP: TO MAKE IT QUERY THE STATE CONTINOUSLY TO VIEW WALLET CHANGES)
 */

/**
 * This seed gives access to tokens minted in the genesis block of a local development node - only
 * used in standalone networks to build a wallet with initial funds.
 */
const GENESIS_MINT_WALLET_SEED =
  "0000000000000000000000000000000000000000000000000000000000000001";

const DEPLOY_OR_JOIN_QUESTION = `
  You can do one of the following:
    1. Deploy a new Votera contract
    2. Join an existing Votera contract
    3. Exit
  Which would you like to do? `;

const WALLET_LOOP_QUESTION = `
  You can do one of the following:
    1. Build a fresh wallet
    2. Build wallet from a seed
    3. Exit
  Which would you like to do? `;

const MAIN_LOOP_QUESTION = `
Vote for one of the Enterpreneurs:
  1. Joseph
  2. Elliot
  3. Samir
  4. Exit
Who would you like to do? `;

const buildWallet = async (
  config: Config,
  rli: Interface
): Promise<Wallet | null> => {
  while (true) {
    const choice = await rli.question(WALLET_LOOP_QUESTION);
    switch (choice) {
      case "1":
        return await buildFreshWallet(config);
      case "2":
        return await buildWalletFromSeed(config, rli);
      case "3":
        console.log("Exiting...");
        return null;
      default:
        console.log(`Invalid choice: ${choice}`);
    }
  }
};

export const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
};

const buildFreshWallet = async (config: Config): Promise<Wallet & Resource> =>
  await buildWalletAndWaitForFunds(config, toHex(randomBytes(32)));

const buildWalletAndWaitForFunds = async (
  { indexer, indexerWS, node, proofServer }: Config,
  seed: string
): Promise<Wallet & Resource> => {
  const wallet = await WalletBuilder.build(
    indexer,
    indexerWS,
    proofServer,
    node,
    seed,
    getZswapNetworkId(),
    "warn"
  );
  wallet.start();
  const state = await Rx.firstValueFrom(wallet.state());
  console.log(`Your wallet seed is: ${seed}`);
  console.log(`Your wallet address is: ${state.address}`);
  let balance = state.balances[nativeToken()];
  if (balance === undefined || balance === 0n) {
    console.log(`Your wallet balance is: 0`);
    console.log(`Waiting to receive tokens...`);
    balance = await waitForFunds(wallet);
  }
  console.log(`Your wallet balance is: ${balance}`);
  return wallet;
};

const waitForFunds = (wallet: Wallet) => 
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(10_000),
      Rx.map((s) => s.balances[nativeToken()] ?? 0n),
      Rx.filter((balance) => balance > 0n)
    )
  );

// Prompt for a seed and create the wallet with that.
const buildWalletFromSeed = async (
  config: Config,
  rli: Interface
): Promise<Wallet & Resource> => {
  const seed = await rli.question("Enter your wallet seed: ");
  return await buildWalletAndWaitForFunds(config, seed);
};

const createWalletAndMidnightProvider = async (
  wallet: Wallet
): Promise<WalletProvider & MidnightProvider> => {
  const state = await Rx.firstValueFrom(wallet.state());
  return {
    coinPublicKey: state.coinPublicKey,
    encryptionPublicKey: state.encryptionPublicKey,
    balanceTx(
      tx: UnbalancedTransaction,
      newCoins: CoinInfo[]
    ): Promise<BalancedTransaction> {
      return wallet
        .balanceTransaction(
          ZswapTransaction.deserialize(
            tx.serialize(getLedgerNetworkId()),
            getZswapNetworkId()
          ),
          newCoins
        )
        .then(async (recipe) => {
          if (recipe.type === "NothingToProve") {
            // Already balanced and proven, just convert
            return createBalancedTx(
              Transaction.deserialize(
                recipe.transaction.serialize(getZswapNetworkId()),
                getLedgerNetworkId()
              )
            );
          } else {
            // Needs proving
            const zswapTx = await wallet.proveTransaction(recipe);
            return createBalancedTx(
              Transaction.deserialize(
                zswapTx.serialize(getZswapNetworkId()),
                getLedgerNetworkId()
              )
            );
          }
        });
    },
    submitTx(tx: BalancedTransaction): Promise<TransactionId> {
      return wallet.submitTransaction(tx);
    },
  };
};

const deployOrJoin = async (provider: api.VoteraProviders, ril: Interface) => {
  let deployedContract: api.DeployedVoteraContract | undefined;
  while (true) {
    const input = await ril.question(DEPLOY_OR_JOIN_QUESTION);
    switch (input) {
      case "1":
        deployedContract = await api.deploy(provider);
        return deployedContract;
      case "2":
        deployedContract = await api.joinContract(
          provider,
          await ril.question("Enter the Contract Address")
        );
        return deployedContract;
      case "3":
        console.log("Exiting...");
        break;
      default:
        console.log(`${input} is a wrong input!. Exiting...`);
        break;
    }
  }
};

const mainLoop = async (
  providers: api.VoteraProviders,
  rli: Interface 
): Promise<void> => {
  const voteraApi = await deployOrJoin(providers, rli);
  if (voteraApi === null) {
    return;
  }
  const contractAddress = voteraApi?.deployTxData.public.contractAddress;
  let currentState: api.DerivedLedgerState | undefined;
  const stateObserver = {
    next: (state: Ledger) =>
      (currentState = state as unknown as api.DerivedLedgerState),
  };
  let subscription;
  if (contractAddress != undefined) {
    subscription = api
      .getLedgerStateObs(providers, contractAddress)
      .subscribe(stateObserver);
  }
  try {
    while (true) {
      const candidate = await rli.question(MAIN_LOOP_QUESTION);
      switch (candidate) {
        case "1":
          voteraApi?.callTx.vote(0);
          break;
        case "2":
          voteraApi?.callTx.vote(1);
          break;
        case "3":
          voteraApi?.callTx.vote(2);
          break;
        default:
          console.log(`This Candidate, ${candidate}, does not exist!.`);
      }
    }
  } finally {
    subscription?.unsubscribe();
  }
};

export const run = async (config: Config) => {
  const rli = createInterface({ input: process.stdin, output: process.stdout });

  const wallet = await buildWallet(config, rli);

  try {
    if (wallet != null) {
      const walletAndMidnightProvider =
        await createWalletAndMidnightProvider(wallet);

      const providers = {
        privateStateProvider: levelPrivateStateProvider<
          typeof VoteraPrivateStateId
        >({
          privateStateStoreName: config.privateStateStoreName,
        }),
        publicDataProvider: indexerPublicDataProvider(
          config.indexer,
          config.indexerWS
        ),
        zkConfigProvider: new NodeZkConfigProvider<"vote">(config.zkConfigPath),
        proofProvider: httpClientProofProvider(config.proofServer),
        walletProvider: walletAndMidnightProvider,
        midnightProvider: walletAndMidnightProvider,
      };

      await mainLoop(providers, rli);
    }
  } catch (error) {}
};
