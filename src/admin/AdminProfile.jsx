import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiUser, HiMail, HiLockClosed, HiCheck, HiPencil, HiLogout, HiEye, HiEyeOff } from "react-icons/hi";
import AlertModal from "../components/AlertModal";
import apiClient from "../config/api";

export default function AdminProfile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "Admin User",
    email: "admin@example.com",
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalClosing, setPasswordModalClosing] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [originalFormData, setOriginalFormData] = useState(null);

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
    
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

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

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      setProfileError("");

      // Get user ID from localStorage
      const adminUser = localStorage.getItem("adminUser");
      let adminUserId = null;
      
      if (adminUser) {
        try {
          const userData = JSON.parse(adminUser);
          adminUserId = userData.id || userData.user_id;
        } catch (e) {
          console.error("Error parsing admin user data:", e);
        }
      }

      if (!adminUserId) {
        setProfileError("User ID not found. Please login again.");
        setLoading(false);
        return;
      }

      setUserId(adminUserId);

      // Fetch admin details from API
      const response = await apiClient.get(`/users/${adminUserId}`);

      // Handle different response structures
      let userData = null;
      if (response.data?.status && response.data.data) {
        userData = response.data.data.user || response.data.data;
      } else if (response.data?.user) {
        userData = response.data.user;
      } else if (response.data) {
        userData = response.data;
      }

      if (userData) {
        // Map API response to formData
        const firstName = userData.first_name || userData.firstName || "";
        const lastName = userData.last_name || userData.lastName || "";
        const fullName = firstName && lastName 
          ? `${firstName} ${lastName}`.trim()
          : firstName || lastName || userData.name || "";
        
        const mappedData = {
          fullName: fullName,
          email: userData.email || "",
          role: userData.role || "Admin",
        };
        setFormData(mappedData);
        setOriginalFormData(mappedData); // Store original data for cancel
        setProfileError(null);
      } else {
        setProfileError("Failed to load admin profile");
      }
    } catch (err) {
      console.error("Error fetching admin profile:", err);
      setProfileError(
        err.response?.data?.message ||
        "Failed to load admin profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    if (!userId) {
      setProfileError("User ID not found. Please login again.");
      return;
    }

    setSaving(true);
    setProfileError("");
    setErrors({});

    try {
      // Split full name into first and last name
      const nameParts = formData.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      
      // Prepare update payload
      const updateData = {
        first_name: firstName,
        last_name: lastName,
        email: formData.email.trim(),
      };

      const response = await apiClient.put(`/users/${userId}`, updateData);

      if (response.data?.status || response.status === 200) {
        // Update original form data with saved values
        setOriginalFormData({ ...formData });
        
        setSuccess(true);
        setIsEditing(false);
        setTimeout(() => setSuccess(false), 3000);
        
        // Update localStorage adminUser if needed
        const adminUser = localStorage.getItem("adminUser");
        if (adminUser) {
          try {
            const userData = JSON.parse(adminUser);
            const nameParts = formData.fullName.trim().split(/\s+/);
            userData.first_name = nameParts[0] || "";
            userData.last_name = nameParts.slice(1).join(" ") || "";
            userData.email = formData.email;
            localStorage.setItem("adminUser", JSON.stringify(userData));
          } catch (e) {
            console.error("Error updating localStorage:", e);
          }
        }
      } else {
        setProfileError(response.data?.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      
      // Handle validation errors
      if (err.response?.status === 422) {
        const validationErrors = err.response.data?.errors || {};
        const newErrors = {};
        
        // Map backend field names to frontend field names
        const fieldMap = {
          'first_name': 'fullName',
          'last_name': 'fullName',
        };
        
        Object.keys(validationErrors).forEach((key) => {
          const frontendKey = fieldMap[key] || key;
          newErrors[frontendKey] = Array.isArray(validationErrors[key]) 
            ? validationErrors[key][0] 
            : validationErrors[key];
        });
        
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
        } else {
          setProfileError(err.response.data?.message || "Validation failed. Please check your input.");
        }
      } else {
        setProfileError(
          err.response?.data?.message ||
          "Failed to update profile. Please try again."
        );
      }
    } finally {
      setSaving(false);
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
        setTimeout(() => {
          setPasswordSuccess(false);
          closePasswordModal();
        }, 2000);
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
      return;
    }

    // Fetch admin profile if authenticated
    fetchAdminProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(true);
  };

  const openPasswordModal = () => {
    setPasswordError("");
    setPasswordSuccess(false);
    setErrors({});
    setPasswordData({ password: "", password_confirmation: "" });
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    if (passwordLoading) return;
    const ANIMATION_MS = 220;
    setPasswordModalClosing(true);
    setTimeout(() => {
      setPasswordModalClosing(false);
      setShowPasswordModal(false);
      setPasswordError("");
      setPasswordSuccess(false);
      setErrors({});
      setPasswordData({ password: "", password_confirmation: "" });
    }, ANIMATION_MS);
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

  if (loading) {
    return (
      <div className="neutral-text bg min-h-screen p-4 md:p-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="spinner spinner-lg mx-auto mb-4"></div>
            <p className="neutral-text-muted">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

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
      <AlertModal
        isOpen={!!profileError}
        onClose={() => setProfileError("")}
        type="error"
        title="Error"
        message={profileError || ""}
      />
      <style>{`
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes modal-out {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(10px) scale(0.985);
          }
        }
        @keyframes backdrop-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes backdrop-out {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        .animate-modal-in {
          animation: modal-in 220ms ease-out forwards;
        }
        .animate-modal-out {
          animation: modal-out 220ms ease-in forwards;
        }
        .animate-backdrop-in {
          animation: backdrop-in 220ms ease-out forwards;
        }
        .animate-backdrop-out {
          animation: backdrop-out 220ms ease-in forwards;
        }
      `}</style>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Profile Header Card with Gradient */}
        <div className="relative overflow-hidden card p-8 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 rounded-2xl shadow-xl border border-primary/20">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50"></div>
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full gradient-primary flex items-center justify-center text-3xl font-bold white-text shadow-2xl ring-4 ring-white/50 transition-transform group-hover:scale-105">
                {(formData.fullName?.[0] || "A").toUpperCase()}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                <HiCheck className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold neutral-text mb-2">
                {formData.fullName || "Admin"}
              </h1>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mb-4">
                <div className="flex items-center gap-2 text-neutral-text-muted">
                  <HiMail className="w-4 h-4" />
                  <p className="text-sm">{formData.email || "No email"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-4 py-2 rounded-full primary-bg-light primary-text-medium text-sm font-semibold shadow-md">
                  <HiUser className="w-4 h-4 mr-2" />
                  {formData.role || "Administrator"}
                </span>
              </div>
            </div>
            {!isEditing && (
              <div className="flex flex-row gap-3">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="btn btn-warning flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <HiLockClosed className="w-4 h-4" />
                  Change Password
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="btn btn-danger flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <HiLogout className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Personal Information */}
        <div className="card p-8 bg-light rounded-2xl shadow-lg border border-neutral-border-light">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-border-light">
            <h3 className="text-xl font-bold neutral-text flex items-center gap-3">
              <div className="p-2 primary-bg-light rounded-lg">
                <HiUser className="w-6 h-6 primary-text" />
              </div>
              Personal Information
            </h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-primary flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <HiPencil className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setErrors({});
                    setProfileError("");
                    // Reset form data to original values
                    if (originalFormData) {
                      setFormData(originalFormData);
                    }
                  }}
                  className="btn btn-primary text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-accent flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all px-4 py-2"
                >
                  {saving ? (
                    <>
                      <div className="spinner spinner-sm"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <HiCheck className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {!isEditing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group flex items-start gap-4 p-5 bg-gradient-to-br from-primary/5 to-transparent rounded-xl border border-primary/20 hover:border-primary/40 hover:shadow-md transition-all">
                  <div className="p-3 primary-bg-light rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                    <HiUser className="w-6 h-6 primary-text" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-neutral-text-muted uppercase tracking-wide mb-2">Full Name</p>
                    <p className="neutral-text font-semibold text-lg">{formData.fullName || "N/A"}</p>
                  </div>
                </div>
                <div className="group flex items-start gap-4 p-5 bg-gradient-to-br from-accent/5 to-transparent rounded-xl border border-accent/20 hover:border-accent/40 hover:shadow-md transition-all">
                  <div className="p-3 accent-bg-light rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                    <HiMail className="w-6 h-6 accent-text" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-neutral-text-muted uppercase tracking-wide mb-2">Email Address</p>
                    <p className="neutral-text font-semibold text-lg break-all">{formData.email || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {profileError && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                  <p className="danger-text text-sm font-medium">{profileError}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold neutral-text mb-2.5 flex items-center gap-2">
                    <HiUser className="w-4 h-4 primary-text" />
                    Full Name <span className="danger-text">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    className={`input w-full ${errors.fullName ? "input-error border-red-500 focus:ring-red-500" : "focus:ring-primary focus:border-primary"} transition-all`}
                    placeholder="Enter full name"
                  />
                  <div className="min-h-[24px] mt-2">
                    {errors.fullName && (
                      <p className="danger-text text-xs flex items-center gap-1.5 animate-fade-in">
                        <span>⚠</span> {errors.fullName}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold neutral-text mb-2.5 flex items-center gap-2">
                    <HiMail className="w-4 h-4 accent-text" />
                    Email Address <span className="danger-text">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className={`input w-full ${errors.email ? "input-error border-red-500 focus:ring-red-500" : "focus:ring-accent focus:border-accent"} transition-all`}
                    placeholder="Enter email address"
                  />
                  <div className="min-h-[24px] mt-2">
                    {errors.email && (
                      <p className="danger-text text-xs flex items-center gap-1.5 animate-fade-in">
                        <span>⚠</span> {errors.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Change Password Modal */}
        {(showPasswordModal || passwordModalClosing) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className={`absolute inset-0 bg-black/40 ${
                passwordModalClosing ? "animate-backdrop-out" : "animate-backdrop-in"
              }`}
              onClick={closePasswordModal}
            />
            <div
              className={`bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative z-10 max-h-[90vh] overflow-y-auto ${
                passwordModalClosing ? "animate-modal-out" : "animate-modal-in"
              }`}
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 warning-bg-light rounded-lg">
                  <HiLockClosed className="w-5 h-5 warning-text" />
                </div>
                <h3 className="text-lg font-semibold neutral-text">Change Password</h3>
              </div>

              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="danger-text text-sm">{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="success-text text-sm">Password updated successfully!</p>
                </div>
              )}

              <div>
                <div>
                  <label className="block text-sm font-semibold neutral-text mb-2.5">New Password <span className="danger-text">*</span></label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordData.password}
                      onChange={(e) => handlePasswordChange("password", e.target.value)}
                      className={`input w-full ${errors.password ? "input-error" : ""} pr-12`}
                      placeholder="Enter new password (min. 6 characters)"
                      disabled={passwordLoading}
                    />
                    <div
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 cursor-pointer hover:opacity-70 transition-opacity"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <HiEyeOff className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
                      ) : (
                        <HiEye className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
                      )}
                    </div>
                  </div>
                  <div className="min-h-[24px] mt-2">
                    {errors.password && (
                      <p className="danger-text text-xs flex items-center gap-1.5">
                        <span>⚠</span> {errors.password}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold neutral-text mb-2.5">Confirm Password <span className="danger-text">*</span></label>
                  <div className="relative">
                    <input
                      type={showPasswordConfirmation ? "text" : "password"}
                      value={passwordData.password_confirmation}
                      onChange={(e) => handlePasswordChange("password_confirmation", e.target.value)}
                      className={`input w-full ${errors.password_confirmation ? "input-error" : ""} pr-12`}
                      placeholder="Confirm new password"
                      disabled={passwordLoading}
                    />
                    <div
                      onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 cursor-pointer hover:opacity-70 transition-opacity"
                      aria-label={showPasswordConfirmation ? "Hide password" : "Show password"}
                    >
                      {showPasswordConfirmation ? (
                        <HiEyeOff className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
                      ) : (
                        <HiEye className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
                      )}
                    </div>
                  </div>
                  <div className="min-h-[24px] mt-2">
                    {errors.password_confirmation && (
                      <p className="danger-text text-xs flex items-center gap-1.5">
                        <span>⚠</span> {errors.password_confirmation}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={passwordLoading}
                  className="btn btn-primary text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSave}
                  disabled={passwordLoading}
                  className="btn btn-warning px-6 py-2.5 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                >
                  {passwordLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="spinner spinner-sm"></div>
                      Updating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <HiLockClosed className="w-4 h-4" />
                      Update Password
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
