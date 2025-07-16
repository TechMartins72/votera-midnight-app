import React, { useCallback, useRef, useState } from "react";
import { FaCopy, FaVoteYea } from "react-icons/fa";

import Button from "./Button";
import type { VoteraAPI } from "@repo/votera-api";
import type { status } from "../logic";

interface HeaderProps {
  handleDeployment: () => void;
  status: status;
}

const Header: React.FC<HeaderProps> = ({ handleDeployment, status }) => {
  // const addressRef = useRef<HTMLParagraphElement>(null);
  // const [showSupportMenu, setShowSupportMenu] = useState(false);
  // const [showVotingMenu, setShowVotingMenu] = useState(false);

  // Copy address to clipboard
  // const handleCopyAddress = useCallback(async () => {
  //   if (contractState.deployedAddress) {
  //     try {
  //       await navigator.clipboard.writeText(contractState.deployedAddress);
  //       // You might want to show a toast notification here
  //     } catch (error) {
  //       console.error("Failed to copy address:", error);
  //     }
  //   }
  // }, [contractState.deployedAddress]);

  // Toggle support menu
  // const toggleSupportMenu = useCallback(() => {
  //   setShowSupportMenu((prev) => !prev);
  // }, []);

  // Toggle voting menu
  // const toggleVotingMenu = useCallback(() => {
  //   setShowVotingMenu((prev) => !prev);
  // }, []);

  // Render wallet connection button

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
      <ul className="flex gap-6 flex-row-reverse">
        <li className="cursor-pointer text-gray-300 hover:text-white transition-all hover:-translate-x-1.5 relative">
          <p>Support</p>
          <div
            className={`hidden text-gray-400 text-nowrap gap-6 justify-center items-center absolute top[-130%] translate-y-2 right-0 bg-[#1a1a1a] w-fit px-6 py-3 rounded-md`}
          >
            <p>contract wallet address to send to...</p>
            <span className="hover:text-white transition-all">
              <FaCopy />
            </span>
          </div>
        </li>
        <li className="cursor-pointer text-gray-300 hover:text-white transition-all hover:-translate-x-1.5">
          Voters
        </li>
      </ul>
    </div>
  );
};

export default Header;
