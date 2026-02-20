
// frontend/pages/AuthPages/SuperadminOnboarding.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons"; // Assuming these exist
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

export default function SuperadminOnboarding() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
   console.log(import.meta.env);
  const navigate = useNavigate();

  // State for Superadmin Login
  const [superadminUsername, setSuperadminUsername] = useState("");
  const [superadminPassword, setSuperadminPassword] = useState("");
  const [isSuperadminLoggedIn, setIsSuperadminLoggedIn] = useState(false);
  const [superadminLoginError, setSuperadminLoginError] = useState("");
  const [showSuperadminPassword, setShowSuperadminPassword] = useState(false);

  // State for Organization Onboarding Form
  const [organizationFormData, setOrganizationFormData] = useState({
    organization_name: "",
    organization_official_email: "",
    organization_phone_number: "",
    organization_website: "",
    organization_address_line1: "",
    organization_address_line2: "",
    organization_city: "",
    organization_state: "",
    organization_zip_code: "",
    organization_country: "",
    organization_industry_type: "",
    organization_company_size_range: "",
    admin_first_name: "",
    admin_last_name: "",
    admin_email: "",
  });

  const [onboardingError, setOnboardingError] = useState("");
  const [onboardingSuccess, setOnboardingSuccess] = useState("");
  const [isSubmittingOnboarding, setIsSubmittingOnboarding] = useState(false);

  // Check if superadmin token exists in localStorage on component mount
  useEffect(() => {
    const superadminToken = localStorage.getItem('superadmin_token');
    if (superadminToken) {
      try {
        // Optionally verify token validity here (e.g., decode and check expiry)
        // For simplicity, we'll just assume presence means logged in
        setIsSuperadminLoggedIn(true);
      } catch (e) {
        console.error("Superadmin token invalid or expired:", e);
        localStorage.removeItem('superadmin_token');
        setIsSuperadminLoggedIn(false);
      }
    }
  }, []);


  // Handle Superadmin Login
  const handleSuperadminLogin = async (e) => {
    e.preventDefault();
    setSuperadminLoginError("");

    try {
      const res = await axios.post(`${apiBaseUrl}/auth/superadmin-login`, {  
        username: superadminUsername,
        password: superadminPassword,
      });
     

      localStorage.setItem("superadmin_token", res.data.token);
      setIsSuperadminLoggedIn(true);
      setSuperadminLoginError(""); // Clear any previous errors
      setSuperadminPassword(""); // Clear password field
    } catch (err) {
      console.error("❌ Superadmin login failed:", err);
      setSuperadminLoginError(err.response?.data?.message || "Invalid superadmin credentials.");
    }
  };

  // Handle Organization Onboarding Form Changes
  const handleOrganizationFormChange = (e) => {
    const { name, value } = e.target;
    setOrganizationFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle Organization Onboarding Form Submission
  const handleOrganizationOnboardingSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingOnboarding(true);
    setOnboardingError("");
    setOnboardingSuccess("");

    try {
      const superadminToken = localStorage.getItem("superadmin_token");
      if (!superadminToken) {
        setOnboardingError("Superadmin not logged in. Please log in again.");
        setIsSuperadminLoggedIn(false); // Force re-login
        return;
      }

      const response = await axios.post(`${apiBaseUrl}/auth/onboard-organization`, organizationFormData, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${superadminToken}`, // Authenticate superadmin
        },
      });

      setOnboardingSuccess(response.data.message);
      setOrganizationFormData({ // Reset form
        organization_name: "",
        organization_official_email: "",
        organization_phone_number: "",
        organization_website: "",
        organization_address_line1: "",
        organization_address_line2: "",
        organization_city: "",
        organization_state: "",
        organization_zip_code: "",
        organization_country: "",
        organization_industry_type: "",
        organization_company_size_range: "",
        admin_first_name: "",
        admin_last_name: "",
        admin_email: "",
      });
    } catch (err) {
      console.error("❌ Organization onboarding failed:", err);
      setOnboardingError(err.response?.data?.message || "Failed to onboard organization.");
    } finally {
      setIsSubmittingOnboarding(false);
    }
  };

  const handleSuperadminLogout = () => {
    localStorage.removeItem('superadmin_token');
    setIsSuperadminLoggedIn(false);
    setSuperadminUsername("");
    setSuperadminPassword("");
    setSuperadminLoginError("");
    setOnboardingError("");
    setOnboardingSuccess("");
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400"
        >
          <ChevronLeftIcon className="size-5" />
          Back to Sign In
        </Link>
      </div>

      {/* Main Content Section */}
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {isSuperadminLoggedIn ? "Onboard New Organization" : "Superadmin Login"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isSuperadminLoggedIn ? "Enter details for the new organization and its first admin." : "Log in as Superadmin to onboard new companies."}
            </p>
          </div>

          {!isSuperadminLoggedIn ? (
            // Superadmin Login Form
            <form onSubmit={handleSuperadminLogin}>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="superadmin-username">
                    Username <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    id="superadmin-username"
                    type="text"
                    placeholder="superadmin"
                    value={superadminUsername}
                    onChange={(e) => setSuperadminUsername(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="superadmin-password">
                    Password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="superadmin-password"
                      type={showSuperadminPassword ? "text" : "password"}
                      placeholder="Enter superadmin password"
                      value={superadminPassword}
                      onChange={(e) => setSuperadminPassword(e.target.value)}
                      required
                    />
                    <span
                      onClick={() => setShowSuperadminPassword(!showSuperadminPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showSuperadminPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                {superadminLoginError && (
                  <p className="mb-4 text-sm text-red-500">{superadminLoginError}</p>
                )}
                <div>
                  <Button className="w-full" size="sm" type="submit">
                    Superadmin Login
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            // Organization Onboarding Form
            <>
              <div className="mb-4">
                <Button className="w-full" size="sm" type="button" onClick={handleSuperadminLogout}>
                  Logout Superadmin
                </Button>
              </div>
              {onboardingError && (
                <p className="mb-4 text-sm text-red-500">{onboardingError}</p>
              )}
              {onboardingSuccess && (
                <p className="mb-4 text-sm text-green-500">{onboardingSuccess}</p>
              )}
              <form onSubmit={handleOrganizationOnboardingSubmit}>
                <div className="space-y-5">
                  {/* Organization Details */}
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mt-6 mb-3">Organization Details</h2>
                  {Object.entries(organizationFormData).filter(([key]) => key.startsWith('organization_')).map(([field, value]) => (
                    <div key={field}>
                      <Label htmlFor={field}>
                        {field.replace(/organization_/g, "").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                        <span className="text-error-500">*</span>
                      </Label>
                      <Input
                        id={field}
                        name={field}
                        type={field.includes('email') ? 'email' : (field.includes('website') ? 'url' : 'text')}
                        placeholder={`Enter ${field.replace(/organization_/g, "").replace(/_/g, " ")}`}
                        value={value}
                        onChange={handleOrganizationFormChange}
                        required={!['organization_address_line2', 'organization_phone_number', 'organization_website', 'organization_industry_type', 'organization_company_size_range'].includes(field)} // Make some optional
                      />
                    </div>
                  ))}

                  {/* Admin User Details */}
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mt-6 mb-3">Initial Admin User Details</h2>
                  {Object.entries(organizationFormData).filter(([key]) => key.startsWith('admin_')).map(([field, value]) => (
                    <div key={field}>
                      <Label htmlFor={field}>
                        {field.replace(/admin_/g, "").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}{" "}
                        <span className="text-error-500">*</span>
                      </Label>
                      <Input
                        id={field}
                        name={field}
                        type={field.includes('email') ? 'email' : 'text'}
                        placeholder={`Enter ${field.replace(/admin_/g, "").replace(/_/g, " ")}`}
                        value={value}
                        onChange={handleOrganizationFormChange}
                        required
                      />
                    </div>
                  ))}

                  <div>
                    <Button className="w-full" size="sm" type="submit" disabled={isSubmittingOnboarding}>
                      {isSubmittingOnboarding ? "Onboarding..." : "Onboard Organization"}
                    </Button>
                  </div>
                </div>
              </form>
            </>
          )}

          {/* Back to Sign In */}
          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
              <Link
                to="/signin"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}