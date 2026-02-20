// components/form/input/DateField.jsx
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Label from "../Label";

export default function DateField({ label, name, value, onChange }) {
  const selectedDate = value ? new Date(value) : null;

  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <DatePicker
        id={name}
        selected={selectedDate}
        onChange={onChange}
        dateFormat="yyyy-MM-dd"
        className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-white"
        placeholderText="Select date"
      />
    </div>
  );
}
