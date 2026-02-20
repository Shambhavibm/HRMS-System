
// frontend/components/auth/SignInForm.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import axios from "axios";

import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../pages/../icons";
import Label from "../../pages/../components/form/Label";
import Input from "../../pages/../components/form/input/InputField";
import Checkbox from "../../pages/../components/form/input/Checkbox";
import Button from "../../pages/../components/ui/button/Button";


export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const envTest = import.meta.env.VITE_ENV_LOADED;

  console.log("✅ ENV TEST VITE_ENV_LOADED:", envTest);
  console.log("🌐 VITE_API_BASE_URL:", apiBaseUrl);

  if (!apiBaseUrl) {
    console.error("❌ VITE_API_BASE_URL is not defined! Check your .env file.");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const postUrl = `${apiBaseUrl}/auth/signin`;
    console.log("📡 Sending login POST request to:", postUrl);

    try {
      const res = await axios.post(postUrl, {
        email,
        password,
      });

      console.log("✅ Login successful, token received");
      localStorage.setItem("token", res.data.token);
      
      // Decode token to get user role and organization_id for initial routing/state
      const base64Url = res.data.token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decodedToken = JSON.parse(window.atob(base64));

      // Redirect based on role, or just to a generic dashboard
      // if (decodedToken.role === 'admin' || decodedToken.role === 'manager') {
      //   navigate("/dashboard"); 
      // } else {
      //   navigate("/profile"); 
      // }
      if (decodedToken.role === 'admin') {
  navigate("/admin/dashboard");
} else if (decodedToken.role === 'manager') {
  navigate("/manager/dashboard");
} else if (decodedToken.role === 'member') {
  navigate('/member/dashboard');
}


    } catch (err) {
      console.error("❌ Login failed", err);
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    }
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
          Back to home
        </Link>
      </div>

      {/* Form Section */}
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in
            </p>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
            <button type="button" className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 dark:bg-white/5 dark:text-white/90">
              <span>🔍</span> Sign in with Google
            </button>
            <button type="button" className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 dark:bg-white/5 dark:text-white/90">
              <span>✖</span> Sign in with X
            </button>
          </div>

          {/* Divider */}
          <div className="relative py-3 sm:py-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="p-2 text-gray-400 bg-white dark:bg-gray-900 sm:px-5 sm:py-2">
                Or
              </span>
            </div>
          </div>

          {error && (
            <p className="mb-4 text-sm text-red-500">{error}</p>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label htmlFor="email">
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="info@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox checked={isChecked} onCheckedChange={setIsChecked} />
                  <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                    Keep me logged in
                  </span>
                </div>
                <Link
                  to="/reset-password"
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Forgot password?
                </Link>
              </div>

              <div>
                <Button className="w-full" size="sm" type="submit">
                  Sign in
                </Button>
              </div>
            </div>
          </form>

          {/* Sign Up */}
          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign Up
              </Link>
            </p>
          </div>

          {/* Superadmin Onboarding Link */}
          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              For Organization Onboarding:{" "}
              <Link
                to="/superadmin-onboarding" // Link to the new superadmin onboarding page
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Superadmin Portal
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}