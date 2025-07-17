import React, { useState } from "react";

import Button from "./Button";
import type { status } from "../logic";
import Form from "./Form";
import type { VoteraAPI } from "@repo/votera-api";
import { useDeployedVoteraContext } from "../hooks";

interface HeaderProps {
  handleDeployment: () => void;
  status: status;
  api: VoteraAPI | undefined;
}

const Header: React.FC<HeaderProps> = ({ handleDeployment, status, api }) => {
  const [showForm, setShowForm] = useState(false);
  const [value, setValue] = useState(0);
  const [waitingFunds, setWaitingFunds] = useState(false);
  const voteraApiProvider = useDeployedVoteraContext();

  const handleReceiveFunds = () => {
    setWaitingFunds(true);
    try {
      if (api == undefined || waitingFunds) {
        return;
      }
      if (value! > 0.1) {
        throw new Error("Value must be greater than 0.1 ");
      }
      voteraApiProvider.receive(api, value);
    } catch (error) {
      console.error(error);
    } finally {
      setWaitingFunds(false);
    }
  };

  const btnValue = () => {
    if (status === "in-progress") {
      return "Connecting...";
    } else if (status === "failed-with-error" || status === "no-action") {
      return "Connect Wallet";
    } else {
      return "Connected";
    }
  };

  return (
    <div className="w-full py-6 fixed top-0 right-0 px-20 flex justify-between">
      <div>
        <Button value={btnValue()} onClick={handleDeployment} />
      </div>
      {status === "deployed" && (
        <ul className="flex gap-6 flex-row-reverse">
          <li className="cursor-pointer text-gray-300 relative">
            <p
              onClick={() => setShowForm(!showForm)}
              className="hover:text-white transition-all hover:-translate-x-1.5"
            >
              Support
            </p>
            <div
              className={`${showForm ? "flex text-gray-400 absolute top[-130%] translate-y-2 right-0 bg-[#1a1a1a] w-fit px-6 py-3 rounded-md" : "hidden"} `}
            >
              <Form
                value={value}
                setValue={setValue}
                onclick={handleReceiveFunds}
                waitingFunds={waitingFunds}
              />
            </div>
          </li>
          <li className="cursor-pointer text-gray-300 hover:text-white transition-all hover:-translate-x-1.5">
            Voters
          </li>
        </ul>
      )}
    </div>
  );
};

export default Header;
