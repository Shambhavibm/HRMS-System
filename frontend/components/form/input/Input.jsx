export default function Input({ id, name, type = "text", value, onChange, placeholder = "", ...rest }) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm 
                 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
      {...rest}
    />
  );
}
