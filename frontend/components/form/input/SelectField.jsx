export default function SelectField({ id, name, value, onChange, options = [], children, ...rest }) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
                 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
      {...rest}
    >
      <option value="" disabled>
        Select...
      </option>
      {children && children.length > 0
        ? children
        : options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
    </select>
  );
}
