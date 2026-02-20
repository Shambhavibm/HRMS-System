
import React from "react";

const Select = ({
  // Props for being a controlled component
  value,
  onChange,
  id,
  name,

  // Props for generating options
  options,
  children,
  
  // Props for styling and display
  placeholder = "Select an option",
  className = "",
  ...props // Pass through any other native select attributes
}) => {

  // We no longer need internal state, as this is now a controlled component.
  // The parent component will provide the `value` and handle changes via `onChange`.

  const selectClassName = `h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${
    // The component's text color is now based on the `value` prop from the parent
    value
      ? "text-gray-800 dark:text-white/90"
      : "text-gray-400 dark:text-gray-400"
  } ${className}`;

  return (
    <select
      id={id}
      name={name}
      className={selectClassName}
      value={value || ""} // Use the controlled value from the parent
      onChange={onChange} // Use the onChange handler from the parent
      {...props}
    >
      {/* Your placeholder logic is preserved */}
      {placeholder && (
        <option
          value=""
          disabled
          className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
        >
          {placeholder}
        </option>
      )}

      {/* The component now intelligently renders what you give it */}
      
      {/* 1. If you pass <option>s as children, it will render them */}
      {children}

      {/* 2. If you don't pass children, it will check for an `options` array and render from that */}
      {!children && Array.isArray(options) && options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;