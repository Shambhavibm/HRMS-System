export const getToken = () => {
  return localStorage.getItem("token");
};

import { jwtDecode } from "jwt-decode";  // named import

export function decodeToken() {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}
