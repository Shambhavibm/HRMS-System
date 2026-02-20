

// frontend/pages/AuthPages/ResetPassword.jsx
import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

import { ChevronLeftIcon } from "../../icons"; // Assuming you have these icons
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token"); // This token is now the invite_token from the backend
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  // Initial check for token presence
  if (!token) {
    // console.warn("⚠️ No token found in URL. Redirecting to signin.");
    // navigate("/signin"); // Uncomment if you want immediate redirect
    // return null; // Prevent component from rendering if no token
  }
  console.log("🔑 Token in URL:", token); // Log token for debugging

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("No reset token found. Please use the link from your email.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    const postUrl = `${apiBaseUrl}/auth/reset-password`;
    console.log("📡 Sending POST request to:", postUrl);
    console.log("📦 Payload:", {
      // For security, only log `token` and not the actual password in production
      token: token ? 'Token_Present' : 'Token_Missing',
      password: password ? 'Password_Present' : 'Password_Missing'
    });

    try {
      setIsSubmitting(true);
      const res = await axios.post(postUrl, { token, password });

      console.log("✅ Password set/reset successful. Server response:", res.data);
      alert("Password set successfully! You can now sign in."); // Changed alert
      navigate("/signin");
    } catch (err) {
      console.error("❌ Password set/reset failed:", err);

      if (err.response) {
        setError(err.response.data?.message || "Server error during password setup/reset.");
      } else if (err.request) {
        setError("No response from server. Please try again.");
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
          to="/signin" // Always link back to sign-in
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400"
        >
          <ChevronLeftIcon className="size-5" />
          Back to Sign In
        </Link>
      </div>

      {/* Form Section */}
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Set Your Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please enter and confirm your new password.
            </p>
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-500">{error}</p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label htmlFor="password">
                  New Password <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <Button className="w-full" size="sm" type="submit" disabled={isSubmitting || !token}>
                  {isSubmitting ? "Setting Password..." : "Set Password"}
                </Button>
              </div>
            </div>
          </form>

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
