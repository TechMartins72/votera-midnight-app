import { type DAppConnectorWalletAPI } from "@midnight-ntwrk/dapp-connector-api";
import { type ServiceUriConfig } from "@midnight-ntwrk/dapp-connector-api";
import { type VoteraProviders } from "@repo/votera-api";

export interface WalletAndProvider {
  readonly wallet: DAppConnectorWalletAPI;
  readonly uris: ServiceUriConfig;
  readonly providers: VoteraProviders;
}

export interface WalletAPI {
  wallet: DAppConnectorWalletAPI;
  coinPublicKey: string;
  encryptionPublicKey: string;
  uris: ServiceUriConfig;
}

// export interface StateraDeployment {
//   status: "inprogress" | "deployed" | "failed";
//   api: DeployedStateraAPI;
// }
