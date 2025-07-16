import { createRoot } from "react-dom/client";
import "./index.css";
import "./polyfills.ts";
import App from "./App.tsx";
import { DeployedVoteraProvider } from "./contexts/DeployAppContext.tsx";
import {
  setNetworkId,
  type NetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";

const networkId = import.meta.env.VITE_NETWORK_ID as NetworkId;
// Ensure that the network IDs are set within the Midnight libraries.
setNetworkId(networkId);

createRoot(document.getElementById("root")!).render(
  <DeployedVoteraProvider>
    <App />
  </DeployedVoteraProvider>
);
