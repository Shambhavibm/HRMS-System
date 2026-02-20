/*
================================================================================
 FILE 1: /src/auth/RouteProtection.jsx (NEW FILE)
================================================================================
 PURPOSE: Centralizes frontend route protection logic. This is a best practice.
          Create this new file in the /src/auth/ directory.
*/

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

/**
 * A component to protect routes that require specific user roles.
 * This is the primary component for ensuring secure page access.
 * It checks for a valid token and then verifies the user's role.
 * @param {object} props
 * @param {React.ReactNode} props.children The component to render if authorization succeeds.
 * @param {string[]} props.allowedRoles An array of roles that are allowed to access this route.
 */
export const RoleRoute = ({ children, allowedRoles }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  // 1. Check if a token exists. If not, redirect to sign-in.
  if (!token) {
    // Redirect to signin, but remember where the user was trying to go.
    navigate(`/signin?redirect=${location.pathname}`);
    return null; // Stop rendering the component.
  }

  try {
    // 2. Decode the token to get the user's role.
    const decodedToken = jwtDecode(token);
    const userRole = decodedToken.role;

    // 3. Check if the user's role is in the allowed list.
    if (!userRole || !allowedRoles.includes(userRole)) {
      // User is logged in, but not authorized for this page.
      // Send them to a safe, default page (their own dashboard).
      // This prevents a confusing loop.
      console.warn(`Access denied for role "${userRole}" to path "${location.pathname}".`);
      navigate(`/${userRole}/dashboard`); // e.g., /admin/dashboard or /member/dashboard
      return null; // Stop rendering.
    }

    // 4. If all checks pass, render the protected component.
    return children;

  } catch (error) {
    // This catches errors from a malformed, expired, or invalid token.
    console.error("Invalid token detected:", error);
    localStorage.removeItem('token');
    navigate(`/signin?redirect=${location.pathname}`);
    return null; // Stop rendering.
  }
};

/**
 * A component to protect routes that require ANY logged-in user, regardless of role.
 * Use this ONLY for truly common pages like a user profile or a general calendar.
 * @param {object} props
 * @param {React.ReactNode} props.children The component to render if the user is logged in.
 */
export const ProtectedRoute = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('token');
    if (!token) {
      navigate(`/signin?redirect=${location.pathname}`);
      return null;
    }
    return children;
};