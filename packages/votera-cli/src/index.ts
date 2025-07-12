import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { stdin as input, stdout as output } from "node:process";
import { createInterface, Interface } from "node:readline/promises";
import { convertToUintArray, VoteraAPI } from "@repo/votera-api";
import { toHex } from "@midnight-ntwrk/midnight-js-utils";
import { type Config } from "./config.js";
import {
  getLedgerNetworkId,
  getZswapNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import * as Rx from "rxjs";
import { type Wallet } from "@midnight-ntwrk/wallet-api";
import { type Resource, WalletBuilder } from "@midnight-ntwrk/wallet";
import { Transaction as ZswapTransaction } from "@midnight-ntwrk/zswap";
import {
  nativeToken,
  Transaction,
  type CoinInfo,
  type TransactionId,
} from "@midnight-ntwrk/ledger";
import {
  type MidnightProvider,
  type WalletProvider,
  type UnbalancedTransaction,
  createBalancedTx,
  type BalancedTransaction,
  PrivateStateId,
} from "@midnight-ntwrk/midnight-js-types";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import * as fs from "node:fs";
import { streamToString } from "testcontainers/build/common/streams.js";
import { webcrypto } from "node:crypto";
import { Ledger } from "../../contract/dist/managed/votera/contract/index.cjs";
import {
  DeployedVoteraContract,
  VoteraContractProvider,
} from "../../votera-api/dist/common-types.js";
import { getPerson } from "./utils.js";

const DEPLOY_OR_JOIN_QUESTION = `
    You can do one of the following:
    1. Deploy a Votera contract
    2. Join an existing one
    3. Exit
`;

const GENESIS_MINT_WALLET_SEED =
  "0000000000000000000000000000000000000000000000000000000000000001";

const WALLET_LOOP_QUESTION = `
You can do one of the following:
  1. Build a fresh wallet
  2. Build wallet from a seed
  3. Exit
Which would you like to do? `;

const CANDIDATE_VOTE = `
You can check either of three candidate's vote:
1. Joseph
2. Elliot
3. Samir
4. Exit
Whose vote count would you like to see?
`;

// Updated menu with new option
const CIRCUIT_MAIN_LOOP_QUESTION = `
You can do one of the following:
  1. Vote
  2. View Ledger State
  3. View Voter's List
  4. View Each Candidate's Votes
  5. Check if a user has voted
  6. Exit
Which would you like to do? `;

const VOTE_CANDIDATE_LOOP_QUESTION = `
You can vote for either of the following:
  1. Joseph Martins
  2. Elliot Lucky
  3. Samir Samir
  4. Exit
Who would you like to vote for? `;

const resolve = async (
  providers: VoteraContractProvider,
  rli: Interface
): Promise<VoteraAPI | null> => {
  let api: VoteraAPI | null = null;

  while (true) {
    const choice = await rli.question(DEPLOY_OR_JOIN_QUESTION);
    switch (choice) {
      case "1":
        try {
          api = await VoteraAPI.deployVoteraContract(providers);
          console.log(
            `Deployed contract at address: ${api.deployedContractAddress}`
          );
          return api;
        } catch (error) {
          console.log(error);
        }

      case "2":
        try {
          api = await VoteraAPI.join(
            providers,
            await rli.question("What is the contract address (in hex)?")
          );
          console.log(
            `Joined contract at address: ${api.deployedContractAddress}`
          );
          return api;
        } catch (error) {
          console.error(error);
        }
    }
  }
};

const displayLedgerState = async (
  providers: VoteraContractProvider,
  deployedStateraContract: DeployedVoteraContract
): Promise<void> => {
  const contractAddress =
    deployedStateraContract.deployTxData.public.contractAddress;
  const ledgerState = await VoteraAPI.getVoteraLedgerState(
    providers,
    contractAddress
  );
  if (ledgerState === null) {
    console.log(
      `There is no token mint contract deployed at ${contractAddress}`
    );
  } else {
    console.log(ledgerState);
  }
};

const circuit_main_loop = async (
  wallet: Wallet & Resource,
  providers: VoteraContractProvider,
  rli: Interface
): Promise<void> => {
  const voteraApi = await resolve(providers, rli);
  if (voteraApi === null) return;

  let currentState: Ledger | undefined;
  const stateObserver = {
    next: (state: Ledger) => {
      currentState = state;
    },
  };

  const subscription = voteraApi.state$.subscribe(stateObserver);

  try {
    while (true) {
      const choice = await rli.question(CIRCUIT_MAIN_LOOP_QUESTION);
      switch (choice) {
        case "1": {
          const input = await rli.question(VOTE_CANDIDATE_LOOP_QUESTION);
          switch (input) {
            case "1": {
              try {
                await voteraApi.vote("joseph");
                await getPerson(providers, voteraApi.deployedContractAddress);
              } catch (error) {
                console.log(error);
              }

              break;
            }
            case "2": {
              try {
                await voteraApi.vote("elliot");
                await getPerson(providers, voteraApi.deployedContractAddress);
              } catch (error) {
                console.log(error);
              }
              break;
            }
            case "3": {
              try {
                await voteraApi.vote("samir");
                const person = await getPerson(
                  providers,
                  voteraApi.deployedContractAddress
                );
                console.log(person);
              } catch (error) {
                console.log(error);
              }
              break;
            }
            case "4": {
              rli.addListener("close", () => console.log("cli Exiting"));
              rli.close();
              break;
            }
            default: {
              console.log(`${input}, is not a valid input`);
            }
          }
        }
        case "2": {
          const ledgerState = currentState;
          console.log(ledgerState);
          break;
        }
        case "3": {
          const result = await VoteraAPI.getVoters(
            providers,
            voteraApi.deployedContractAddress
          );

          const voters = result?.[Symbol.iterator]();
          Iterator<Uint8Array>;
          console.log({ voters });
          break;
        }
        case "4": {
          const votes = await VoteraAPI.getVotes(
            providers,
            voteraApi.deployedContractAddress
          );

          const input = await rli.question(CANDIDATE_VOTE);
          let voteCount;
          switch (input) {
            case "1": {
              voteCount = Number(votes?.lookup("joseph").read());
              console.log(voteCount);
            }
            case "2": {
              voteCount = Number(votes?.lookup("elliot").read());
              console.log(voteCount);
              break;
            }
            case "3": {
              voteCount = Number(votes?.lookup("samir").read());
              console.log(voteCount);
              break;
            }
            case "4": {
              rli.addListener("close", () => console.log("cli Exiting"));
              rli.close();
              break;
            }
          }

          break;
        }
        case "5": {
          let checkAddress = await rli.question(
            "enter the user's public address to see if he has voted"
          );
          const AddressBuffer = convertToUintArray(checkAddress);
          const hasVoted = (
            await VoteraAPI.getVoters(
              providers,
              voteraApi.deployedContractAddress
            )
          )?.member(AddressBuffer);
          console.log(hasVoted);
        }
        case "6": {
          rli.addListener("close", () => console.log("CLI Exiting"));
          rli.close();
          break;
        }
      }
    }
  } finally {
    subscription.unsubscribe();
  }
};

export const createWalletAndMidnightProvider = async (
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
        .then((tx) => wallet.proveTransaction(tx))
        .then((zswapTx) =>
          Transaction.deserialize(
            zswapTx.serialize(getZswapNetworkId()),
            getLedgerNetworkId()
          )
        )
        .then(createBalancedTx);
    },
    submitTx(tx: BalancedTransaction): Promise<TransactionId> {
      return wallet.submitTransaction(tx);
    },
  };
};

export const waitForSync = (wallet: Wallet) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(5_000),
      Rx.tap((state) => {
        const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
        const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
        console.log(
          `Waiting for funds. Backend lag: ${sourceGap}, wallet lag: ${applyGap}, transactions=${state.transactionHistory.length}`
        );
      }),
      Rx.filter((state) => {
        // Let's allow progress only if wallet is synced fully
        return state.syncProgress !== undefined && state.syncProgress.synced;
      })
    )
  );

export const waitForSyncProgress = async (wallet: Wallet) =>
  await Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(5_000),
      Rx.tap((state) => {
        const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
        const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
        console.log(
          `Waiting for funds. Backend lag: ${sourceGap}, wallet lag: ${applyGap}, transactions=${state.transactionHistory.length}`
        );
      }),
      Rx.filter((state) => {
        // Let's allow progress only if syncProgress is defined
        return state.syncProgress !== undefined;
      })
    )
  );

export const waitForFunds = (wallet: Wallet) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(10_000),
      Rx.tap((state) => {
        const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
        const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
        console.log(
          `Waiting for funds. Backend lag: ${sourceGap}, wallet lag: ${applyGap}, transactions=${state.transactionHistory.length}`
        );
      }),
      Rx.filter((state) => {
        // Let's allow progress only if wallet is synced
        return state.syncProgress?.synced === true;
      }),
      Rx.map((s) => s.balances[nativeToken()] ?? 0n),
      Rx.filter((balance) => balance > 0n)
    )
  );

export const isAnotherChain = async (wallet: Wallet, offset: number) => {
  await waitForSyncProgress(wallet);
  // Here wallet does not expose the offset block it is synced to, that is why this workaround
  const walletOffset = Number(JSON.parse(await wallet.serializeState()).offset);
  if (walletOffset < offset - 1) {
    console.log(
      `Your offset offset is: ${walletOffset} restored offset: ${offset} so it is another chain`
    );
    return true;
  } else {
    console.log(
      `Your offset offset is: ${walletOffset} restored offset: ${offset} ok`
    );
    return false;
  }
};

export const waitForTokenBalance = (
  wallet: Wallet,
  tokenType: string,
  minimumAmount: bigint,
  timeoutMs: number = 30000
): Promise<bigint> =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(2_000),
      Rx.tap((state) => {
        const balance = state.balances[tokenType] ?? 0n;
        const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
        const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
        console.log(
          `Waiting for ${tokenType} balance. Current: ${balance}, Target: ${minimumAmount}, Backend lag: ${sourceGap}, Wallet lag: ${applyGap}`
        );
      }),
      Rx.filter((state) => {
        const balance = state.balances[tokenType] ?? 0n;
        return state.syncProgress?.synced === true && balance >= minimumAmount;
      }),
      Rx.map((state) => state.balances[tokenType] ?? 0n),
      Rx.timeout(timeoutMs)
    )
  );

// Enhanced function to wait for wallet sync after operations
export const waitForWalletSyncAfterOperation = async (
  wallet: Wallet,
  timeoutMs: number = 30000
): Promise<void> => {
  try {
    await Rx.firstValueFrom(
      wallet.state().pipe(
        Rx.throttleTime(1_000),
        Rx.tap((state) => {
          const applyGap = state.syncProgress?.lag.applyGap ?? 0n;
          const sourceGap = state.syncProgress?.lag.sourceGap ?? 0n;
          console.log(
            `Syncing after operation. Backend lag: ${sourceGap}, Wallet lag: ${applyGap}`
          );
        }),
        Rx.filter((state) => {
          return state.syncProgress?.synced === true;
        }),
        Rx.timeout(timeoutMs)
      )
    );
    console.log("Wallet sync completed after operation");
  } catch (error) {
    console.warn(`Wallet sync timeout after ${timeoutMs}ms`);
  }
};

export const buildEnhancedWalletAndWaitForFunds = async (
  config: Config,
  seed: string,
  filename: string
): Promise<Wallet & Resource> => {
  // ... (keep existing wallet building logic)
  const wallet = await buildWalletAndWaitForFunds(config, seed, filename);

  // Set up continuous state monitoring
  const stateSubscription = wallet
    .state()
    .pipe(Rx.throttleTime(60_000))
    .subscribe({
      next: (state) => {
        console.log("Wallet state changed - balances updated");
        Object.entries(state.balances).forEach(([tokenType, balance]) => {
          if (balance > 0n) {
            console.log(`${tokenType}: ${balance}`);
          }
        });
      },
    });

  // Store subscription reference for cleanup
  (wallet as any).__stateSubscription = stateSubscription;

  return wallet;
};

export const buildWalletAndWaitForFunds = async (
  { indexer, indexerWS, node, proofServer }: Config,
  seed: string,
  filename: string
): Promise<Wallet & Resource> => {
  const directoryPath = process.env.SYNC_CACHE;
  let wallet: Wallet & Resource;
  if (directoryPath !== undefined) {
    if (fs.existsSync(`${directoryPath}/${filename}`)) {
      console.log(
        `Attempting to restore state from ${directoryPath}/${filename}`
      );
      try {
        const serializedStream = fs.createReadStream(
          `${directoryPath}/${filename}`,
          "utf-8"
        );
        const serialized = await streamToString(serializedStream);
        serializedStream.on("finish", () => {
          serializedStream.close();
        });
        wallet = await WalletBuilder.restore(
          indexer,
          indexerWS,
          proofServer,
          node,
          seed,
          serialized,
          "info"
        );
        wallet.start();
        const stateObject = JSON.parse(serialized);
        if (
          (await isAnotherChain(wallet, Number(stateObject.offset))) === true
        ) {
          console.warn("The chain was reset, building wallet from scratch");
          wallet = await WalletBuilder.build(
            indexer,
            indexerWS,
            proofServer,
            node,
            seed,
            getZswapNetworkId(),
            "info"
          );
          wallet.start();
        } else {
          const newState = await waitForSync(wallet);
          // allow for situations when there's no new index in the network between runs
          if (newState.syncProgress?.synced) {
            console.log("Wallet was able to sync from restored state");
          } else {
            console.log(`Offset: ${stateObject.offset}`);
            console.log(
              `SyncProgress.lag.applyGap: ${newState.syncProgress?.lag.applyGap}`
            );
            console.log(
              `SyncProgress.lag.sourceGap: ${newState.syncProgress?.lag.sourceGap}`
            );
            console.warn(
              "Wallet was not able to sync from restored state, building wallet from scratch"
            );
            wallet = await WalletBuilder.build(
              indexer,
              indexerWS,
              proofServer,
              node,
              seed,
              getZswapNetworkId(),
              "info"
            );
            wallet.start();
          }
        }
      } catch (error: unknown) {
        if (typeof error === "string") {
          console.error(error);
        } else if (error instanceof Error) {
          console.error(error.message);
        } else {
          console.error(error);
        }
        console.warn(
          "Wallet was not able to restore using the stored state, building wallet from scratch"
        );
        wallet = await WalletBuilder.build(
          indexer,
          indexerWS,
          proofServer,
          node,
          seed,
          getZswapNetworkId(),
          "info"
        );
        wallet.start();
      }
    } else {
      console.log("Wallet save file not found, building wallet from scratch");
      wallet = await WalletBuilder.build(
        indexer,
        indexerWS,
        proofServer,
        node,
        seed,
        getZswapNetworkId(),
        "info"
      );
      wallet.start();
    }
  } else {
    console
      .log
      // "File path for save file not found, building wallet from scratch"
      ();
    wallet = await WalletBuilder.build(
      indexer,
      indexerWS,
      proofServer,
      node,
      seed,
      getZswapNetworkId(),
      "info"
    );
    wallet.start();
  }

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

export const randomBytes = (length: number): Uint8Array => {
  const bytes = new Uint8Array(length);
  webcrypto.getRandomValues(bytes);
  return bytes;
};

/**
 * Generate a random see and create the wallet with that.
 */

export const buildFreshWallet = async (
  config: Config
): Promise<Wallet & Resource> =>
  await buildWalletAndWaitForFunds(config, toHex(randomBytes(32)), "");

/**
 * Prompt for a seed and create the wallet with that.
 */
const buildWalletFromSeed = async (
  config: Config,
  rli: Interface
): Promise<Wallet & Resource> => {
  const seed = await rli.question("Enter your wallet seed: ");
  return await buildWalletAndWaitForFunds(config, seed, "");
};

const buildWallet = async (
  config: Config,
  rli: Interface
): Promise<(Wallet & Resource) | null> => {
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
        console.error(`Invalid choice: ${choice}`);
    }
  }
};

export const run = async (config: Config): Promise<void> => {
  const rli = createInterface({ input, output, terminal: true });
  const wallet = await buildWallet(config, rli);
  try {
    if (wallet !== null) {
      const walletAndMidnightProvider =
        await createWalletAndMidnightProvider(wallet);
      const providers = {
        privateStateProvider: levelPrivateStateProvider<PrivateStateId>({
          privateStateStoreName: config.privateStateStoreName as string,
        }),
        publicDataProvider: indexerPublicDataProvider(
          config.indexer,
          config.indexerWS
        ),
        zkConfigProvider: new NodeZkConfigProvider<never>(config.zkConfigPath),
        proofProvider: httpClientProofProvider(config.proofServer),
        walletProvider: walletAndMidnightProvider,
        midnightProvider: walletAndMidnightProvider,
      };
      await circuit_main_loop(wallet, providers, rli);
    }
  } catch (e) {
    if (e instanceof Error) {
      console.error(`Found error '${e.message}'`);
      console.log("Exiting...");
      console.debug(`${e.stack}`);
    } else {
      throw e;
    }
  } finally {
    try {
      rli.close();
      rli.removeAllListeners();
    } catch (e) {
    } finally {
      try {
        if (wallet !== null) {
          await wallet.close();
        }
      } catch (e) {}
    }
  }
};
