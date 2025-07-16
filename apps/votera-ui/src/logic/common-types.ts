import { type DAppConnectorWalletAPI } from "@midnight-ntwrk/dapp-connector-api";
import { type ServiceUriConfig } from "@midnight-ntwrk/dapp-connector-api";
import { type VoteraContractProvider } from "@repo/votera-api";

export interface WalletAndProvider {
  readonly wallet: DAppConnectorWalletAPI;
  readonly uris: ServiceUriConfig;
  readonly providers: VoteraContractProvider;
}

export type voters = {
  name: string;
  count: number;
};
