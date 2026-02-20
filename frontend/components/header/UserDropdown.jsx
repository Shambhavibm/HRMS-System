

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { toast } from 'react-toastify';
import { useAuthToken } from '../../hooks/jwtdecode';

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);
  const navigate = useNavigate();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL 
  const { userId, token } = useAuthToken(); 

  useEffect(() => {
  const cachedProfile = localStorage.getItem('user_profile');
  if (cachedProfile) {
    setCurrentUserData(JSON.parse(cachedProfile));
    return; // ✅ Skip API call if cached
  }

  const fetchCurrentUserProfile = async () => {
    if (!userId || !token) return;

    try {
      const res = await axios.get(`${apiBaseUrl}/users/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCurrentUserData(res.data);
      localStorage.setItem('user_profile', JSON.stringify(res.data)); // ✅ Cache it
    } catch (err) {
      console.error("UserDropdown: Error fetching current user profile:", err);
      if (err.response) {
        if (err.response.status === 401) {
          toast.error("Session expired. Please log in again.");
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          navigate("/signin");
        } else {
          toast.error(`Failed to load user profile: ${err.response.statusText || "Unknown error"}`);
        }
      } else {
        toast.error("Failed to load user profile. Network error or server unreachable.");
      }
    }
  };

  fetchCurrentUserProfile();
}, [userId, token, apiBaseUrl, navigate]); // ✅ Combine dependencies

  const displayName = currentUserData?.first_name && currentUserData?.last_name
    ? `${currentUserData.first_name} ${currentUserData.last_name}`
    : currentUserData?.official_email_id || "User";
  const displayEmail = currentUserData?.official_email_id || "N/A";
  const profilePictureUrl = currentUserData?.profile_picture_url
    ? currentUserData.profile_picture_url
    : "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"; 
  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleLogout = async () => {
    const currentToken = localStorage.getItem("token"); // Get token again just before logout attempt
    localStorage.removeItem("userId");
localStorage.removeItem("user_profile"); 
    if (!currentToken) {
      console.warn("🚫 No token found. Already logged out?");
      navigate("/signin"); // Use navigate here (you'll need to re-import it)
      return;
    }

    console.log("🔐 Logging out with token:", currentToken);

    try {
      const res = await axios.post(`${apiBaseUrl}/auth/logout`, {}, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      console.log("✅ Logout successful", res.data);
    } catch (err) {
      console.error("❌ Logout failed", err);
      toast.error("Logout failed. Please try again.");
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      sessionStorage.clear();
      document.cookie = "token=; Max-Age=0; path=/; secure;";
      navigate("/signin"); // Use navigate here
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dropdown-toggle dark:text-gray-400"
      >
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11">
          {/* profile photo */}
          <img
            src={profilePictureUrl}
            alt="User"
            className="object-cover w-full h-full"
            onError={(e) => { e.target.onerror = null; e.target.src = "/images/user/owner.jpg"; }}
          />
        </span>
        <span className="block mr-1 font-medium text-theme-sm">{displayName}</span>
        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {/* user name */}
            {displayName}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {/* user email */}
            {displayEmail}
          </span>
        </div>

        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <svg
                className="fill-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-300"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12ZM12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z" fill="currentColor" />
              </svg>
              Edit profile
            </DropdownItem>
          </li>

          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <svg
                className="fill-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-300"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M19 12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12C5 8.13401 8.13401 5 12 5C15.866 5 19 8.13401 19 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15V12L14 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15V12L14 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Account settings
            </DropdownItem>
          </li>

          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              to="/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <svg
                className="fill-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-300"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9.09 9.09L14.91 14.91" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.91 9.09L9.09 14.91" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Support
            </DropdownItem>
          </li>
        </ul>

        <button
          onClick={() => {
            closeDropdown();
            handleLogout();
          }}
          className="flex w-full items-center gap-3 px-3 py-2 mt-3 font-medium text-left text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          <svg
            className="fill-500 group-hover:fill-gray-700 dark:group-hover:fill-300"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sign out
        </button>
      </Dropdown>
    </div>
  );
}
