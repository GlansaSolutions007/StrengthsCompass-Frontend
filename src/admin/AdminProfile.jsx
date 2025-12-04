import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiUser, HiMail, HiPhone, HiCamera, HiLockClosed, HiCheck, HiPencil, HiLogout, HiEye, HiEyeOff } from "react-icons/hi";
import AlertModal from "../components/AlertModal";
import apiClient from "../config/api";

export default function AdminProfile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "Admin",
    lastName: "User",
    email: "admin@example.com",
    phone: "+1 234 567 8900",
    role: "Admin",
  });
  const [passwordData, setPasswordData] = useState({
    password: "",
    password_confirmation: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData({ ...passwordData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    
    if (!passwordData.password) {
      newErrors.password = "Password is required";
    } else if (passwordData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (!passwordData.password_confirmation) {
      newErrors.password_confirmation = "Please confirm your password";
    } else if (passwordData.password !== passwordData.password_confirmation) {
      newErrors.password_confirmation = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const handlePasswordSave = async () => {
    if (!validatePassword()) {
      return;
    }

    setPasswordLoading(true);
    setPasswordError("");
    setErrors({});

    try {
      // Get user ID from localStorage
      const adminUser = localStorage.getItem("adminUser");
      let userId = null;
      
      if (adminUser) {
        try {
          const userData = JSON.parse(adminUser);
          userId = userData.id || userData.user_id;
        } catch (e) {
          console.error("Error parsing admin user data:", e);
        }
      }

      if (!userId) {
        setPasswordError("User ID not found. Please login again.");
        setPasswordLoading(false);
        return;
      }

      const payload = {
        password: passwordData.password,
        password_confirmation: passwordData.password_confirmation,
      };

      const response = await apiClient.post(`/users/${userId}/change-password`, payload);

      if (response.data?.status || response.status === 200) {
        setPasswordData({ password: "", password_confirmation: "" });
        setPasswordError(""); // Clear any previous errors
        setPasswordSuccess(true);
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        setPasswordError(response.data?.message || "Failed to update password. Please try again.");
      }
    } catch (err) {
      console.error("Error updating password:", err);
      
      // Handle validation errors
      if (err.response?.status === 422) {
        const validationErrors = err.response.data?.errors || {};
        const newErrors = {};
        
        if (validationErrors.password) {
          newErrors.password = Array.isArray(validationErrors.password) 
            ? validationErrors.password[0] 
            : validationErrors.password;
        }
        if (validationErrors.password_confirmation) {
          newErrors.password_confirmation = Array.isArray(validationErrors.password_confirmation)
            ? validationErrors.password_confirmation[0]
            : validationErrors.password_confirmation;
        }
        
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
        } else {
          setPasswordError(err.response.data?.message || "Validation failed. Please check your input.");
        }
      } else {
        setPasswordError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to update password. Please try again."
        );
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // Check authentication and separate admin/user routes
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    const userToken = localStorage.getItem("token") || 
                     localStorage.getItem("userToken") || 
                     localStorage.getItem("authToken");
    
    // If user is logged in (but not admin), redirect to user profile
    if (userToken && !adminToken) {
      navigate("/profile", { replace: true });
      return;
    }
    
    // If no admin token, redirect to admin login
    if (!adminToken) {
      navigate("/admin/login", { replace: true });
    }
  }, [navigate]);

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      // Call logout API
      await apiClient.post("/logout");
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with logout even if API call fails
    } finally {
      // Clear all admin authentication data from localStorage
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      
      // Navigate to admin login page
      navigate("/admin/login");
    }
  };

  return (
    <div className="neutral-text bg min-h-screen p-4 md:p-8">
      <AlertModal
        isOpen={success}
        onClose={() => setSuccess(false)}
        type="success"
        title="Success"
        message="Profile updated successfully!"
        autoClose={3000}
      />
      <AlertModal
        isOpen={passwordSuccess}
        onClose={() => setPasswordSuccess(false)}
        type="success"
        title="Success"
        message="Password updated successfully!"
        autoClose={3000}
      />
      <AlertModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        type="warning"
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to login again to access the admin dashboard."
        primaryText="Logout"
        secondaryText="Cancel"
        onPrimary={handleLogout}
        onSecondary={() => setShowLogoutConfirm(false)}
      />

      {/* Simple Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold neutral-text">Profile Settings</h1>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="card p-6 bg-light rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold white-text shadow-lg">
                {formData.firstName[0]}{formData.lastName[0]}
              </div>
            
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold neutral-text mb-1">
                {formData.firstName} {formData.lastName}
              </h2>
              <p className="neutral-text-muted text-sm mb-2">{formData.email}</p>
              <span className="inline-block px-3 py-1 rounded-full primary-bg-light primary-text-medium text-xs font-medium">
                {formData.role}
              </span>
            </div>
            {!isEditing && (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <HiPencil className="w-4 h-4" />
                  Edit Profile
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="btn btn-danger flex items-center gap-2"
                >
                  <HiLogout className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Personal Information */}
        <div className="card p-6 bg-light rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold neutral-text flex items-center gap-2">
              <HiUser className="w-5 h-5 primary-text" />
              Personal Information
            </h3>
            {isEditing && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setErrors({});
                  }}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="btn btn-accent flex items-center gap-2"
                >
                  <HiCheck className="w-4 h-4" />
                  Save
                </button>
              </div>
            )}
          </div>

          {!isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-medium rounded-lg border border-neutral-border-light">
                  <div className="p-2 primary-bg-light rounded-lg">
                    <HiUser className="w-5 h-5 primary-text" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs neutral-text-muted mb-1">First Name</p>
                    <p className="neutral-text font-medium">{formData.firstName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-medium rounded-lg border border-neutral-border-light">
                  <div className="p-2 primary-bg-light rounded-lg">
                    <HiUser className="w-5 h-5 primary-text" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs neutral-text-muted mb-1">Last Name</p>
                    <p className="neutral-text font-medium">{formData.lastName}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-medium rounded-lg border border-neutral-border-light">
                  <div className="p-2 accent-bg-light rounded-lg">
                    <HiMail className="w-5 h-5 accent-text" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs neutral-text-muted mb-1">Email</p>
                    <p className="neutral-text font-medium">{formData.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-medium rounded-lg border border-neutral-border-light">
                  <div className="p-2 info-bg-light rounded-lg">
                    <HiPhone className="w-5 h-5 info-text" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs neutral-text-muted mb-1">Phone</p>
                    <p className="neutral-text font-medium">{formData.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold neutral-text mb-2">First Name <span className="danger-text">*</span></label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    className={`input ${errors.firstName ? "input-error" : ""}`}
                  />
                  <div className="min-h-[20px] mt-1.5">
                    {errors.firstName && (
                      <p className="danger-text text-xs flex items-center gap-1.5">
                        <span>⚠</span> {errors.firstName}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold neutral-text mb-2">Last Name <span className="danger-text">*</span></label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    className={`input ${errors.lastName ? "input-error" : ""}`}
                  />
                  <div className="min-h-[20px] mt-1.5">
                    {errors.lastName && (
                      <p className="danger-text text-xs flex items-center gap-1.5">
                        <span>⚠</span> {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold neutral-text mb-2">Email <span className="danger-text">*</span></label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className={`input ${errors.email ? "input-error" : ""}`}
                  />
                  <div className="min-h-[20px] mt-1.5">
                    {errors.email && (
                      <p className="danger-text text-xs flex items-center gap-1.5">
                        <span>⚠</span> {errors.email}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold neutral-text mb-2">Phone <span className="danger-text">*</span></label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className={`input ${errors.phone ? "input-error" : ""}`}
                  />
                  <div className="min-h-[20px] mt-1.5">
                    {errors.phone && (
                      <p className="danger-text text-xs flex items-center gap-1.5">
                        <span>⚠</span> {errors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
             
            </div>
          )}
        </div>

        {/* Change Password */}
        <div className="card p-6 bg-light rounded-lg shadow-md">
          <div className="flex items-center gap-2 mb-6">
            <HiLockClosed className="w-5 h-5 warning-text" />
            <h3 className="text-lg font-semibold neutral-text">Change Password</h3>
          </div>

          {passwordError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="danger-text text-sm">{passwordError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold neutral-text mb-2">New Password <span className="danger-text">*</span></label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordData.password}
                  onChange={(e) => handlePasswordChange("password", e.target.value)}
                  className={`input ${errors.password ? "input-error" : ""} pr-10`}
                  placeholder="Enter new password"
                  disabled={passwordLoading}
                />
                <div
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <HiEyeOff className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
                  ) : (
                    <HiEye className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
                  )}
                </div>
              </div>
              <div className="min-h-[20px] mt-1.5">
                {errors.password && (
                  <p className="danger-text text-xs flex items-center gap-1.5">
                    <span>⚠</span> {errors.password}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold neutral-text mb-2">Confirm Password <span className="danger-text">*</span></label>
              <div className="relative">
                <input
                  type={showPasswordConfirmation ? "text" : "password"}
                  value={passwordData.password_confirmation}
                  onChange={(e) => handlePasswordChange("password_confirmation", e.target.value)}
                  className={`input ${errors.password_confirmation ? "input-error" : ""} pr-10`}
                  placeholder="Confirm new password"
                  disabled={passwordLoading}
                />
                <div
                  onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                  aria-label={showPasswordConfirmation ? "Hide password" : "Show password"}
                >
                  {showPasswordConfirmation ? (
                    <HiEyeOff className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
                  ) : (
                    <HiEye className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
                  )}
                </div>
              </div>
              <div className="min-h-[20px] mt-1.5">
                {errors.password_confirmation && (
                  <p className="danger-text text-xs flex items-center gap-1.5">
                    <span>⚠</span> {errors.password_confirmation}
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handlePasswordSave}
            disabled={passwordLoading}
            className="mt-6 btn btn-warning w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {passwordLoading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
