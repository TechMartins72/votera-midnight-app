interface FormProps {
  onclick: () => void;
  value: number;
  setValue: (value: number) => void;
  waitingFunds: boolean;
}

const Form: React.FC<FormProps> = ({
  value,
  setValue,
  onclick,
  waitingFunds,
}) => {
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue(Number(value));
  };

  return (
    <form onSubmit={onclick} className="w-full flex flex-col gap-4">
      <div className="w-full flex justify-between">
        <label htmlFor="amount">Amount to send:</label>
        <span>
          <p className="text-sm text-gray-400">tDUST: {" " + 1}</p>
        </span>
      </div>
      <input
        type="text"
        onChange={(e) => handleInput(e)}
        id="amount"
        value={value}
        placeholder="Enter amount"
        min="0.05"
        step="0.1"
        className="outline-none rounded-xl border-[1px] px-4 py-2 text-white"
      />
      <button
        onClick={onclick}
        disabled={waitingFunds}
        className="!bg-[#646cffaa] !outline text-white transition-all cursor-pointer w-full"
      >
        {!waitingFunds ? "Send to Contract" : "Receiving funds..."}
      </button>
      <button
        onClick={onclick}
        disabled={waitingFunds}
        className="!bg-[#646cffaa] !outline text-white transition-all cursor-pointer w-full"
      >
        {!waitingFunds ? "Collect Funds" : "Collecting funds..."}
      </button>
    </form>
  );
};

export default Form;
