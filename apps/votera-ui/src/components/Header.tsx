import { FaCopy } from "react-icons/fa";
import { loadWalletConnection } from "../hooks/loadWallet";
import Button from "./Button";
import { useRef, useState } from "react";

const Header = () => {
  const handleConnectWallet = async () => {
    try {
      const connectWallet = await loadWalletConnection();
      await connectWallet();
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  };
  const [showAddress, setShowAddress] = useState(false);
  const addressRef = useRef(null);
  const toggleAddress = () => {
    setShowAddress((showAddress) => !showAddress);
  };

  return (
    <div className="w-full py-6 fixed top-0 right-0 px-20 flex justify-between">
      <div onClick={handleConnectWallet}>
        <Button value="Connect Wallet" />
      </div>
      <ul className="flex gap-6 flex-row-reverse">
        <li className="cursor-pointer text-gray-300 hover:text-white transition-all hover:-translate-x-1.5 relative">
          <p onClick={toggleAddress}>Support</p>
          <div
            className={` ${showAddress != true ? "hidden" : "flex text-gray-400 text-nowrap gap-6 justify-center items-center absolute top[-130%] translate-y-2 right-0 bg-[#1a1a1a] w-fit px-6 py-3 rounded-md"}`}
          >
            <p ref={addressRef}>contract wallet address to send to...</p>
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
