import React, { type PropsWithChildren, createContext } from "react";
import {
  type DeployedVoteraAPIProvider,
  BrowserDeployedVoteraManager,
} from "../logic/index";

/**
 * Encapsulates a deployed boards provider as a context object.
 */
export const DeployedVoteraContext = createContext<
  DeployedVoteraAPIProvider | undefined
>(undefined);

export const DeployedVoteraProvider: React.FC<Readonly<PropsWithChildren>> = ({
  children,
}) => {
  const contextValue: DeployedVoteraAPIProvider =
    new BrowserDeployedVoteraManager();
  return (
    <DeployedVoteraContext.Provider value={contextValue}>
      {children}
    </DeployedVoteraContext.Provider>
  );
};
