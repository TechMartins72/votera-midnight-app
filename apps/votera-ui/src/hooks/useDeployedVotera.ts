import { useContext } from "react";
import { type DeployedVoteraAPIProvider } from "../logic";
import { DeployedVoteraContext } from "../contexts/DeployAppContext";
/**
 * Retrieves the currently in-scope deployed boards provider.
 *
 * @returns The currently in-scope {@link DeployedBBoardAPIProvider} implementation.
 *
 * @internal
 */
export const useDeployedVoteraContext = (): DeployedVoteraAPIProvider => {
  const context = useContext(DeployedVoteraContext);

  if (!context) {
    throw new Error("A <DeployedBoardProvider /> is required.");
  }

  return context;
};
