

// frontend/pages/AuthPages/InviteEmployee.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { ChevronLeftIcon } from "../../icons";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

export default function InviteEmployee() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    official_email_id: "",
    role: "member", // Default role
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const postUrl = `${apiBaseUrl}/users/invite`; // New protected route
    console.log("📡 Sending user invitation POST request to:", postUrl);
    console.log("📦 Payload being sent:", formData);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You are not logged in. Please sign in first.");
        navigate("/signin");
        return;
      }

      const response = await axios.post(postUrl, formData, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // Include the JWT for authentication
        },
      });

      console.log("✅ User invitation successful", response.data);
      setSuccess("Employee invited successfully! A password setup link has been sent to their email.");
      setFormData({ // Reset form after success
        first_name: "",
        last_name: "",
        official_email_id: "",
        role: "member",
      });
    } catch (err) {
      console.error("❌ User invitation failed:", err);
      if (err.response) {
        console.error("🔎 Server responded with:", err.response.status, err.response.data);
        setError(err.response.data?.message || "Something went wrong. Please try again.");
      } else if (err.request) {
        setError("No response received from server. Check network or server status.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400"
        >
          <ChevronLeftIcon className="size-5" />
          Back to Dashboard
        </Link>
      </div>

      {/* Form Section */}
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Invite New Employee
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Fill in the details to invite a new employee or manager to your organization.
            </p>
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-500">{error}</p>
          )}
          {success && (
            <p className="mb-4 text-sm text-green-500">{success}</p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <Label htmlFor="first_name">
                  First Name <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="first_name"
                  name="first_name"
                  type="text"
                  placeholder="Enter first name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">
                  Last Name <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="last_name"
                  name="last_name"
                  type="text"
                  placeholder="Enter last name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="official_email_id">
                  Official Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="official_email_id"
                  name="official_email_id"
                  type="email"
                  placeholder="employee@yourcompany.com"
                  value={formData.official_email_id}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">
                  Role <span className="text-error-500">*</span>
                </Label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div>
                <Button className="w-full" size="sm" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Inviting..." : "Invite Employee"}
                </Button>
              </div>
            </div>
          </form>

          {/* Back to Sign In */}
          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
              <Link
                to="/dashboard"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Back to Dashboard
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}