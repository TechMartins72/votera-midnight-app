import Button from "./Button";

interface FormProps {
  onclick: () => void; // Fixed: form submit handler needs event parameter
  value: number;
  setValue: (value: number) => void; // Fixed: added type annotation
  waitingFunds: boolean;
}

const Form: React.FC<FormProps> = ({
  value,
  setValue,
  onclick,
  waitingFunds,
}) => {
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Fixed: missing closing >
    const value = e.target.value;
    setValue(Number(value)); // Fixed: convert string to number
  };

  return (
    <form
      onSubmit={onclick}
      className="w-full flex flex-col items-center gap-4"
    >
      <label htmlFor="amount">Amount to send:</label>
      <input
        type="number"
        onChange={(e) => handleInput(e)} // Fixed: use onChange instead of onInput
        id="amount"
        value={value}
        placeholder="Enter amount"
        min="0.05"
        step="0.1"
        className="outline-none rounded-xl border-[1px] px-4 py-2 text-white"
      />
      <Button
        value={!waitingFunds ? "Send to Contract" : "Getting funds..."}
        onClick={onclick}
        disabled={waitingFunds}
      />
    </form>
  );
};

export default Form;
