import React from "react";

interface ButtonProps {
  value: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
}

const Button: React.FC<ButtonProps> = ({
  value,
  disabled = false,
  onClick,
  className = "",
  type = "button",
}) => {
  const baseClasses =
    "w-fit px-8 text-gray-300 rounded-2xl uppercase font-bold py-2 transition-all duration-200";

  const enabledClasses =
    "bg-[#646cffaa] hover:text-white hover:bg-[#646cffdd] cursor-pointer";

  const disabledClasses =
    "bg-green-600 hover:bg-green-600 cursor-not-allowed opacity-75";

  const buttonClasses = `${baseClasses} ${disabled ? disabledClasses : enabledClasses} ${className}`;

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
    >
      {value}
    </button>
  );
};

export default Button;
