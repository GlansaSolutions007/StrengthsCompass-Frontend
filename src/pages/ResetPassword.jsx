import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { HiLockClosed, HiKey, HiShieldCheck, HiExclamationCircle, HiEye, HiEyeOff } from "react-icons/hi";
import logoImage from "../../Images/Logo.png";

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract token, temp password, and admin flag from URL query parameters
  const searchParams = new URLSearchParams(location.search);
  const urlToken = searchParams.get("token") || "";
  const urlTempPwd = searchParams.get("temp") || "";
  const isAdmin = searchParams.get("admin") === "true" || searchParams.get("type") === "admin";

  const [formData, setFormData] = useState({
    token: urlToken,
    temporary_password: urlTempPwd,
    password: "",
    password_confirmation: "",
  });

  // Ensure token is always synced from URL whenever location changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const currentToken = params.get("token") || "";
    const currentTempPwd = params.get("temp") || "";
    
    setFormData((prev) => {
      // Always update token from URL
      // For temporary_password, use URL value if available, otherwise keep user-entered value
      return {
        ...prev,
        token: currentToken,
        temporary_password: currentTempPwd || prev.temporary_password,
      };
    });
  }, [location.search]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  const validate = () => {
    const newErrors = {};
    // Token should always come from URL, validate it exists
    if (!formData.token || !formData.token.trim()) {
      newErrors.token = "Reset token is missing. Please use the link from your email.";
    }
    if (!formData.temporary_password.trim()) newErrors.temporary_password = "Temporary password is required.";
    if (!formData.password.trim()) newErrors.password = "New password is required.";
    if (formData.password && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }
    if (!formData.password_confirmation.trim()) {
      newErrors.password_confirmation = "Please confirm your password.";
    } else if (formData.password_confirmation !== formData.password) {
      newErrors.password_confirmation = "Passwords do not match.";
    }
    return newErrors;
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    const validation = validate();
    if (validation[field]) {
      setErrors({ ...errors, [field]: validation[field] });
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setServerError("");
    setSuccessMessage("");
    if (touched[field]) {
      const validation = validate();
      setErrors({ ...errors, [field]: validation[field] || "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validate();
    if (Object.keys(validation).length) {
      setErrors(validation);
      return;
    }

    try {
      setSubmitting(true);
      setServerError("");
      setSuccessMessage("");

      // Use axios directly without auth headers - only send token from URL
      // Check if this is an admin reset from URL parameters
      const currentParams = new URLSearchParams(location.search);
      const isAdminReset = currentParams.get("admin") === "true" || 
                          currentParams.get("type") === "admin";
      
      // Determine API endpoint based on whether it's an admin reset
      // API_BASE_URL already has trailing slash, so we just append the endpoint
      const apiEndpoint = isAdminReset 
        ? `${API_BASE_URL}admin/reset-password` 
        : `${API_BASE_URL}reset-password`;
      
      console.log("Reset Password - isAdmin:", isAdminReset, "Endpoint:", apiEndpoint);
      
      const response = await axios.post(
        apiEndpoint,
        {
          token: formData.token,
          temporary_password: formData.temporary_password,
          password: formData.password,
          password_confirmation: formData.password_confirmation,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
        }
      );

      if (response.data?.status) {
        setSuccessMessage(response.data?.message || "Password reset successful. You can now log in.");
        setTimeout(() => {
          // Navigate to appropriate login page based on user type
          const currentParams = new URLSearchParams(location.search);
          const isAdminReset = currentParams.get("admin") === "true" || 
                              currentParams.get("type") === "admin";
          navigate(isAdminReset ? "/admin/login" : "/login");
        }, 2000);
      } else {
        setServerError(
          response.data?.message ||
            response.data?.errors?.password?.[0] ||
            response.data?.errors?.token?.[0] ||
            "Failed to reset password. Please try again."
        );
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setServerError(
        err.response?.data?.message ||
          err.response?.data?.errors?.password?.[0] ||
          err.response?.data?.errors?.token?.[0] ||
          "Failed to reset password. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 relative overflow-hidden blue-bg-100">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute -left-16 top-10 w-64 h-64 primary-bg-light rounded-full blur-3xl" />
        <div className="absolute right-0 -bottom-10 w-72 h-72 secondary-bg-light rounded-full blur-3xl" />
      </div>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 md:p-10 relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src={logoImage}
              alt="Logo"
              className="h-16 w-auto object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold yellow-text-950">Reset Password</h2>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {!formData.token && (
            <div className="warning-bg-light border warning-border-light warning-text px-3 py-2 rounded-md text-xs flex items-center gap-2">
              <HiExclamationCircle className="w-4 h-4" />
              Reset token is missing. Please use the link from your email.
            </div>
          )}

          {serverError && (
            <div className="warning-bg-light border warning-border-light warning-text px-3 py-2 rounded-md text-xs flex items-center gap-2">
              <HiExclamationCircle className="w-4 h-4" />
              {serverError}
            </div>
          )}

          {successMessage && (
            <div className="border border-green-200 bg-green-50 text-green-700 px-3 py-2 rounded-md text-xs flex items-center gap-2">
              <HiShieldCheck className="w-4 h-4" />
              {successMessage}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium neutral-text-muted">
              Temporary Password
            </label>
            <div
              className={`group flex w-full rounded-md overflow-hidden border transition-all focus-within:ring-2 focus-within:ring-secondary focus-within:border-secondary ${
                errors.temporary_password && touched.temporary_password
                  ? "border-red-500"
                  : "border-neutral-300"
              }`}
            >
              <div
                className="flex items-center justify-center bg-primary-bg-light px-3 transition-all group-focus-within:bg-secondary-bg-light"
              >
                <HiKey className="h-5 w-5 primary-text group-focus-within:secondary-text transition-colors" />
              </div>
              <input
                type={showTemporaryPassword ? "text" : "password"}
                required
                value={formData.temporary_password}
                onChange={(e) => handleChange("temporary_password", e.target.value)}
                onBlur={() => handleBlur("temporary_password")}
                placeholder="Temporary password from email"
                className="flex-1 py-2 px-3 bg-white text-sm focus:outline-none focus:bg-secondary-bg-light transition-colors"
              />
              <div
                onClick={() => setShowTemporaryPassword(!showTemporaryPassword)}
                className="flex items-center justify-center px-3 cursor-pointer"
                aria-label={showTemporaryPassword ? "Hide password" : "Show password"}
              >
                {showTemporaryPassword ? (
                  <HiEyeOff className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
                ) : (
                  <HiEye className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
                )}
              </div>
            </div>
            {errors.temporary_password && touched.temporary_password && (
              <p className="danger-text text-xs mt-1 flex items-center gap-1">
                <HiExclamationCircle className="w-3 h-3" />
                {errors.temporary_password}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium neutral-text-muted">
              New Password
            </label>
            <div
              className={`group flex w-full rounded-md overflow-hidden border transition-all focus-within:ring-2 focus-within:ring-secondary focus-within:border-secondary ${
                errors.password && touched.password
                  ? "border-red-500"
                  : "border-neutral-300"
              }`}
            >
              <div
                className="flex items-center justify-center bg-primary-bg-light px-3 transition-all group-focus-within:bg-secondary-bg-light"
              >
                <HiLockClosed className="h-5 w-5 primary-text group-focus-within:secondary-text transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                onBlur={() => handleBlur("password")}
                placeholder="Enter new password"
                className="flex-1 py-2 px-3 bg-white text-sm focus:outline-none focus:bg-secondary-bg-light transition-colors"
              />
              <div
                onClick={() => setShowPassword(!showPassword)}
                className="flex items-center justify-center px-3 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <HiEyeOff className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
                ) : (
                  <HiEye className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
                )}
              </div>
            </div>
            {errors.password && touched.password && (
              <p className="danger-text text-xs mt-1 flex items-center gap-1">
                <HiExclamationCircle className="w-3 h-3" />
                {errors.password}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium neutral-text-muted">
              Confirm Password
            </label>
            <div
              className={`group flex w-full rounded-md overflow-hidden border transition-all focus-within:ring-2 focus-within:ring-secondary focus-within:border-secondary ${
                errors.password_confirmation && touched.password_confirmation
                  ? "border-red-500"
                  : "border-neutral-300"
              }`}
            >
              <div
                className="flex items-center justify-center bg-primary-bg-light px-3 transition-all group-focus-within:bg-secondary-bg-light"
              >
                <HiLockClosed className="h-5 w-5 primary-text group-focus-within:secondary-text transition-colors" />
              </div>
              <input
                type={showPasswordConfirmation ? "text" : "password"}
                required
                value={formData.password_confirmation}
                onChange={(e) => handleChange("password_confirmation", e.target.value)}
                onBlur={() => handleBlur("password_confirmation")}
                placeholder="Re-enter new password"
                className="flex-1 py-2 px-3 bg-white text-sm focus:outline-none focus:bg-secondary-bg-light transition-colors"
              />
              <div
                onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                className="flex items-center justify-center px-3 cursor-pointer"
                aria-label={showPasswordConfirmation ? "Hide password" : "Show password"}
              >
                {showPasswordConfirmation ? (
                  <HiEyeOff className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
                ) : (
                  <HiEye className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
                )}
              </div>
            </div>
            {errors.password_confirmation && touched.password_confirmation && (
              <p className="danger-text text-xs mt-1 flex items-center gap-1">
                <HiExclamationCircle className="w-3 h-3" />
                {errors.password_confirmation}
              </p>
            )}
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-3 px-4 rounded-lg yellow-bg-400 yellow-text-950 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <span className="spinner spinner-sm mr-2"></span>
                Resetting Password...
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

