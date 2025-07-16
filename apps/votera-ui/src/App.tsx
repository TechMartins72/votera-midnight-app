import { useEffect, useState } from "react";
import "./App.css";
import Header from "./components/Header";
import Card from "./components/Card";
import { useDeployedVoteraContext } from "./hooks";
import type { VoteraAPI } from "@repo/votera-api";
import type { status } from "./logic";
import type { ContractAddress } from "@midnight-ntwrk/compact-runtime";

function App() {
  const voteraApiProvider = useDeployedVoteraContext();
  //MAKE STATUS AN OBSERVABLE AS THE VALUE MIGHT DUE TO THE STATE OF THE DEPLOYMENT
  const [status, setStatus] = useState<status>("no-action");
  const [voteraDeployedApi, setVoteraDeployedApi] = useState<
    VoteraAPI | undefined
  >();
  const [contractAddress, setContractAddress] = useState<ContractAddress>();

  useEffect(() => {
    const addr = import.meta.env.VITE_CONTRACT_ADDRESS;
    console.log({ addr });
    if (!addr) {
      return;
    }
    setContractAddress(addr);
  }, []);

  useEffect(() => {
    const sub = voteraApiProvider.status$.subscribe(setStatus);

    return () => sub.unsubscribe();
  }, [voteraApiProvider.status$]);

  const handleDeployment = async () => {
    try {
      let api;
      if (
        !voteraApiProvider ||
        status === "deployed" ||
        status === "in-progress"
      ) {
        return;
      }

      if (!contractAddress) {
        api = await voteraApiProvider.resolve();
      } else {
        api = await voteraApiProvider.resolve(contractAddress);
      }

      if (api) {
        setVoteraDeployedApi(api);
        setContractAddress(api?.deployedContractAddress);
      }

      console.log({ contractAddress });
    } catch (error) {
      console.log("failed to deploy at handle deployment" + error);
    }
  };

  return (
    <>
      <div>
        <Header handleDeployment={handleDeployment} status={status} />
        {!voteraDeployedApi ? (
          <div>Please Click connect button to join or deploy contract</div>
        ) : (
          <Card api={voteraDeployedApi} />
        )}
      </div>
    </>
  );
}

export default App;
