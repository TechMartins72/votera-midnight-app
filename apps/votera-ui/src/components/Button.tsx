const Button = ({ value }: { value: string }) => {
  return (
    <button className="w-fit px-8 text-gray-300 rounded-2xl uppercase font-bold cursor-pointer py-2 hover:text-white transition-all duration-200">
      {value}
    </button>
  );
};

export default Button;
