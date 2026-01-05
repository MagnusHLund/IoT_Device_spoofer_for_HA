import React, { useState } from "react";
import "./dropDown.scss";

interface DropDownProps<T> {
  items: T[];
  onSelect: (selected: T) => void;
  getLabel: (item: T) => string;
  placeholder?: string;
}

export const DropDown = <T,>({
  items,
  onSelect,
  getLabel,
  placeholder = "Select an item",
}: DropDownProps<T>) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const index = parseInt(e.target.value, 10);
    setSelectedIndex(index);
    if (index >= 0) {
      onSelect(items[index]);
    }
  };

  return (
    <select value={selectedIndex} onChange={handleChange}>
      <option value={-1}>{placeholder}</option>
      {items.map((item, index) => (
        <option key={index} value={index}>
          {getLabel(item)}
        </option>
      ))}
    </select>
  );
};
