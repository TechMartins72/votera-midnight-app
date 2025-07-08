const Button = ({ value }: { value: string }) => {
  return (
    <button className="cursor-not-allowed w-fit px-8 text-gray-300 rounded-2xl bg-[#646cffaa] uppercase font-bold py-2 hover:text-white transition-all duration-200">
      {value}
    </button>
  );
};

export default Button;
