// used to decoked the jwt token and get userId
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify'; 
import { useNavigate } from 'react-router-dom'; 
/**
 * Decodes a JWT token and extracts the userId.
 * Handles token expiry/errors and logs out the user if necessary.
 * @returns {number | null} The userId from the token, or null if the token is invalid/missing.
 */
export const getUserIdFromToken = () => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate(); 

  if (!token) {
    console.warn("No token found.");
    return null;
  }

  try {
    const decodedToken = jwtDecode(token);
    return decodedToken.userId;
  } catch (error) {
    console.error("Error decoding token:", error);
    toast.error("Invalid session. Please log in again.");
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    // The component calling this utility should handle navigation on null return.
    return null;
  }
};


/**
 * A hook to get user ID and handle token-related navigation.
 * Use this in your components.
 */
import { useEffect, useState } from 'react'; 
export const useAuthToken = () => {
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);
  const navigate = useNavigate(); 

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);

    if (!storedToken) {
      console.warn("No token found. Redirecting to signin.");
      navigate("/signin");
      return;
    }

    try {
      const decodedToken = jwtDecode(storedToken);
      const userIdFromToken = decodedToken.userId;
      
      // Optional: Add token expiration check here
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp < currentTime) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        navigate("/signin");
        return;
      }

      setUserId(userIdFromToken);
    } catch (error) {
      console.error("Error decoding token or token invalid:", error);
      toast.error("Invalid session. Please log in again.");
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      navigate("/signin");
    }
  }, [navigate]); // navigate should be in dependency array

  return { userId, token };
};