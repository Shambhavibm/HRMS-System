import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A utility function to conditionally join class names.
 * It merges Tailwind CSS classes without conflicts.
 * @param {...(string|Object|Array)} inputs - The class names to combine.
 * @returns {string} The combined class names.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}