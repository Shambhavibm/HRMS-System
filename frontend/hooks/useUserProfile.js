import { useEffect, useState } from "react";
import axios from "axios"; // native axios (no custom instance)

const API_BASE = "http://localhost:5001/api/users";

const userId = localStorage.getItem("userId");
const token = localStorage.getItem("token");

const initialFormData = {
  // Personal
  first_name: "",
  last_name: "",
  official_email_id: "",
  secondary_email_id: "",
  contact_number: "",
  date_of_birth: "",
  gender: "",
  nationality: "",
  marital_status: "",
  blood_group: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  zip_code: "",
  country: "",
  father_name: "",
  mother_name: "",
  bio: "",

  // Emergency
    emergency_contact_email: "",
  emergency_contact_name: "",
  emergency_contact_number: "",
  emergency_contact_relation: "",

  // Employment
  employee_id: "",
  date_of_joining: "",
  designation: "",
  department: "",
  manager_id: "",
  employment_type: "",
  work_location: "",
  notes: "",
  about_me: "",

  // Financial
  bank_name: "",
  bank_account_number: "", 
  ifsc_code: "",
  pan_number: "",
  aadhaar_number: "", 
  voter_id: "",

  // Social
  facebook_url: "",
  x_url: "",
  linkedin_url: "",
  instagram_url: "",
};

const useUserProfile = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch profile data
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!userId || !token) return;

    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/users/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}`,
          },
        });
        console.log("User profile data fetched:", res.data);
        setFormData(res.data);
      } catch (err) {
        console.error("Fetch failed:", err);
        setError("Failed to load user profile.");
      }finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Save updates
  const handleSave = async (updatedData, userId) => {
    setLoading(true);
    const currentToken = localStorage.getItem("token");  
    console.log("useUserProfile handleSave updatedData:", updatedData);
    console.log("useUserProfile handleSave userId:", userId);
    try {
      const res = await axios.put(`${API_BASE}/profile/${userId}`, updatedData, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
       console.log("Update successful:", res.data);
      setFormData((prev) => ({ ...prev, ...updatedData }));
      return res;
    } catch (err) {
      console.error("Update failed:", err);
      setError("Failed to save profile changes.");
    } finally {
      setLoading(false);
    }
  };

  // On field change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return {
    formData,
    setFormData,
    handleChange,
    handleSave,
    loading,
    error,
  };
};

export default useUserProfile;
