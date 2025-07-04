import Button from "./Button";

const Header = () => {
  return (
    <div className="w-full py-6 fixed top-0 right-0 px-20 flex justify-between">
      <Button value="Connect Wallet" />
      <ul className="flex gap-6 flex-row-reverse">
        <li className="cursor-pointer text-gray-300 hover:text-white transition-all hover:-translate-x-1.5">
          Support
        </li>
        <li className="cursor-pointer text-gray-300 hover:text-white transition-all hover:-translate-x-1.5">
          Voters
        </li>
      </ul>
    </div>
  );
};

export default Header;
