import React from "react";
import "./button.scss";

interface ButtonProps {
  name: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ name, onClick, icon }) => {
  return (
    <button onClick={onClick} className="button-with-icon">
      {icon && <span className="button-icon">{icon}</span>}
      {name}
    </button>
  );
};

export default Button;
