import { useState } from "react";
import PropTypes from "prop-types";

const PhoneInput = ({
  countries,
  placeholder = "+1 (555) 000-0000",
  onChange,
  selectPosition = "start",
}) => {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]?.code || "US");
  const [phoneNumber, setPhoneNumber] = useState(
    countries[0]?.label || "+1"
  );

  const countryCodes = countries.reduce(
    (acc, { code, label }) => ({ ...acc, [code]: label }),
    {}
  );

  const handleCountryChange = (e) => {
    const newCountry = e.target.value;
    const newDialCode = countryCodes[newCountry] || "";
    setSelectedCountry(newCountry);
    setPhoneNumber(newDialCode);
    if (onChange) {
      onChange(newDialCode);
    }
  };

  const handlePhoneNumberChange = (e) => {
    const newPhoneNumber = e.target.value;
    setPhoneNumber(newPhoneNumber);
    if (onChange) {
      onChange(newPhoneNumber);
    }
  };

  return (
    <div className="relative flex w-full">
      {selectPosition === "start" && (
        <div className="absolute left-0 z-10">
          <select
            value={selectedCountry}
            onChange={handleCountryChange}
            className="appearance-none rounded-l-lg border-r border-gray-200 bg-transparent py-3 pl-3.5 pr-8 text-gray-700 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:text-gray-400"
          >
            {countries.map((country) => (
              <option
                key={country.code}
                value={country.code}
                className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
              >
                {country.code}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-700 dark:text-gray-400">
            ▼
          </div>
        </div>
      )}

      <input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
        placeholder={placeholder}
        className={`h-11 w-full rounded-lg border border-gray-300 bg-transparent py-3 px-4 text-sm text-gray-800 shadow-sm placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 ${
          selectPosition === "start" ? "pl-[84px]" : "pr-[84px]"
        }`}
      />

      {selectPosition === "end" && (
        <div className="absolute right-0 z-10">
          <select
            value={selectedCountry}
            onChange={handleCountryChange}
            className="appearance-none rounded-r-lg border-l border-gray-200 bg-transparent py-3 pl-3.5 pr-8 text-gray-700 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:text-gray-400"
          >
            {countries.map((country) => (
              <option
                key={country.code}
                value={country.code}
                className="text-gray-700 dark:bg-gray-900 dark:text-gray-400"
              >
                {country.code}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-700 dark:text-gray-400">
            ▼
          </div>
        </div>
      )}
    </div>
  );
};

PhoneInput.propTypes = {
  countries: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired, // should be dial code like "+91"
    })
  ).isRequired,
  placeholder: PropTypes.string,
  onChange: PropTypes.func,
  selectPosition: PropTypes.oneOf(["start", "end"]),
};

export default PhoneInput;
