import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiUser, HiMail, HiPhone, HiLockClosed, HiCheck, HiPencil, HiPlay, HiClipboardList, HiClock, HiLocationMarker, HiBriefcase, HiAcademicCap, HiCalendar, HiIdentification, HiShieldCheck, HiCheckCircle, HiLogout, HiEye, HiEyeOff, HiX } from "react-icons/hi";
import Navbar from "../components/Navbar";
import AlertModal from "../components/AlertModal";
import apiClient from "../config/api";

export default function Profile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    whatsapp_number: "",
    // bio: "",
    age: "",
    gender: "",
    city: "",
    state: "",
    country: "",
    profession: "",
    educational_qualification: "",
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalClosing, setPasswordModalClosing] = useState(false);

  const sanitizeDigits = (value) => (value ? value.toString().replace(/\D/g, "") : "");

  // Get user ID from localStorage
  const getUserId = () => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      return parseInt(storedUserId);
    }
    
    const userData = localStorage.getItem("user") || localStorage.getItem("userData");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const id = user.id || user.user_id;
        if (id) {
          localStorage.setItem("userId", id);
          return parseInt(id);
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
    
    return null;
  };

  const getUserToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("userToken") ||
      localStorage.getItem("authToken")
    );
  };

  // Fetch user data from API
  const fetchUserData = async () => {
    const userId = getUserId();
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userToken = getUserToken();
      const headers = userToken
        ? {
            Authorization: `Bearer ${userToken}`,
          }
        : undefined;
      const response = await apiClient.get(`/users/${userId}`, { headers });

      // Handle response structure: { user: {...}, status: 200, message: "..." }
      if (response.data?.user) {
        const user = response.data.user;
        
        // Store all user data
        setUserData(user);
        
        // Map API response to formData for editing
        setFormData({
          firstName: user.first_name || user.firstName || "",
          lastName: user.last_name || user.lastName || "",
          email: user.email || "",
          phone: sanitizeDigits(
            user.phone || user.phone_number || user.contact_number || user.contact || ""
          ),
          whatsapp_number: sanitizeDigits(user.whatsapp_number || user.contact || ""),
          // bio: user.bio || user.description || "",
          age: user.age || "",
          gender: user.gender || "",
          city: user.city || "",
          state: user.state || "",
          country: user.country || "",
          profession: user.profession || "",
          educational_qualification: user.educational_qualification || "",
        });
        
        // Also update localStorage with fresh data
        localStorage.setItem("user", JSON.stringify(user));
        if (user.id) {
          localStorage.setItem("userId", user.id);
        }
      } else if (response.data?.status && response.data.data) {
        // Fallback: handle different response structure
        const user = response.data.data.user || response.data.data;
        setUserData(user);
        setFormData({
          firstName: user.first_name || user.firstName || "",
          lastName: user.last_name || user.lastName || "",
          email: user.email || "",
          phone: sanitizeDigits(user.phone || user.phone_number || user.contact_number || ""),
          whatsapp_number: sanitizeDigits(user.whatsapp_number || user.contact || ""),
          // bio: user.bio || user.description || "",
          age: user.age || "",
          gender: user.gender || "",
          city: user.city || "",
          state: user.state || "",
          country: user.country || "",
          profession: user.profession || "",
          educational_qualification: user.educational_qualification || "",
        });
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      // If API fails, try to use localStorage data
      const storedUserData = localStorage.getItem("user");
      if (storedUserData) {
        try {
          const user = JSON.parse(storedUserData);
          setUserData(user);
          setFormData({
            firstName: user.first_name || user.firstName || "",
            lastName: user.last_name || user.lastName || "",
            email: user.email || "",
            phone: sanitizeDigits(user.phone || user.phone_number || user.contact_number || ""),
            whatsapp_number: sanitizeDigits(user.whatsapp_number || user.contact || ""),
            // bio: user.bio || user.description || "",
            age: user.age || "",
            gender: user.gender || "",
            city: user.city || "",
            state: user.state || "",
            country: user.country || "",
            profession: user.profession || "",
            educational_qualification: user.educational_qualification || "",
          });
        } catch (e) {
          console.error("Error parsing localStorage user data:", e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTestResults = () => {
    // Load test results from localStorage
    const storedTests = JSON.parse(localStorage.getItem("userTestResults") || "[]");
    // Filter tests for current user if needed
    const userId = getUserId();
    
    // Filter by user ID if available, otherwise show all
    const filteredTests = userId 
      ? storedTests.filter(test => test.userId === userId)
      : storedTests;
    
    // Sort by submission date (newest first)
    filteredTests.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    setTestResults(filteredTests);
  };

  useEffect(() => {
    // Check if admin is logged in and redirect
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) {
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    // Check if user is logged in (has token)
    const token = localStorage.getItem("token") || 
                  localStorage.getItem("userToken") || 
                  localStorage.getItem("authToken");
    
    // If no token, redirect to login
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    fetchUserData();
    loadTestResults();
    
    // Listen for storage changes to refresh test results
    const handleStorageChange = () => {
      loadTestResults();
      fetchUserData();
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    // Also check periodically for same-tab changes
    const interval = setInterval(() => {
      loadTestResults();
    }, 1000);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [navigate]);

  const handleChange = (field, value) => {
    let newValue = value;
    if (field === "phone" || field === "whatsapp_number") {
      newValue = value.replace(/\D/g, "").slice(0, 10);
    }
    setFormData({ ...formData, [field]: newValue });
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
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (!phoneDigits) {
      newErrors.phone = "Contact number is required";
    } else if (phoneDigits.length !== 10) {
      newErrors.phone = "Contact number must be exactly 10 digits";
    }
    if (formData.whatsapp_number) {
      const whatsappDigits = formData.whatsapp_number.replace(/\D/g, "");
      if (whatsappDigits.length !== 10) {
        newErrors.whatsapp_number = "WhatsApp number must be exactly 10 digits";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    
    if (!passwordData.current_password) {
      newErrors.current_password = "Current password is required";
    }
    if (!passwordData.password) {
      newErrors.password = "New password is required";
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

  const handleSave = async () => {
    setUpdateError("");
    if (!validateForm()) {
      return;
    }

    const userId = getUserId();
    if (!userId) {
      setUpdateError("User ID not found. Please login again.");
      return;
    }

    const userToken = getUserToken();
    if (!userToken) {
      setUpdateError("Authentication required. Please login again.");
      return;
    }

    const contactDigits = sanitizeDigits(formData.phone);
    const whatsappDigits = sanitizeDigits(formData.whatsapp_number);

    const payload = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      contact_number: contactDigits,
      city: formData.city.trim(),
      state: formData.state.trim(),
      country: formData.country.trim(),
      profession: formData.profession.trim(),
      gender: formData.gender.trim(),
      age: Number(formData.age),
      educational_qualification: formData.educational_qualification.trim(),
    };

    if (whatsappDigits) {
      payload.whatsapp_number = whatsappDigits;
    }

    try {
      setSaveLoading(true);
      const response = await apiClient.put(`/users/${userId}`, payload, {
        headers: { Authorization: `Bearer ${userToken}` },
      });

      if (response.data?.status || response.status === 200) {
        await fetchUserData();
        setSuccess(true);
        setIsEditing(false);
        setUpdateError("");
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setUpdateError(response.data?.message || "Failed to update profile. Please try again.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setUpdateError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const openPasswordModal = () => {
    setPasswordError("");
    setPasswordSuccess(false);
    setErrors({});
    setPasswordData({ current_password: "", password: "", password_confirmation: "" });
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
      setPasswordData({ current_password: "", password: "", password_confirmation: "" });
    }, ANIMATION_MS);
  };

  const handlePasswordSave = async () => {
    if (!validatePassword()) {
      return;
    }

    setPasswordLoading(true);
    setPasswordError("");
    setErrors({});

    try {
      // Get user token for authentication
      const userToken = localStorage.getItem("token") || 
                       localStorage.getItem("userToken") || 
                       localStorage.getItem("authToken");
      
      if (!userToken) {
        setPasswordError("Authentication required. Please login again.");
        setPasswordLoading(false);
        return;
      }

      const payload = {
        current_password: passwordData.current_password,
        password: passwordData.password,
        password_confirmation: passwordData.password_confirmation,
      };

      const response = await apiClient.post("/change-password", payload, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      console.log("Password update response:", response.data);

      if (response.data?.status || response.status === 200 || response.status === 201) {
        setPasswordData({ current_password: "", password: "", password_confirmation: "" });
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
        
        if (validationErrors.current_password) {
          newErrors.current_password = Array.isArray(validationErrors.current_password) 
            ? validationErrors.current_password[0] 
            : validationErrors.current_password;
        }
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

  // const handleStartTest = () => {
  //   navigate("/testlist");
  // };

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
      // Clear all authentication data from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("userToken");
      localStorage.removeItem("authToken");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("user");
      localStorage.removeItem("userData");
      localStorage.removeItem("userTestResults");
      
      // Navigate to login page
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-screen neutral-text bg">
        <Navbar />
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
    <div className="min-h-screen w-screen neutral-text bg">
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
        message="Are you sure you want to logout? You will need to login again to access your profile."
        primaryText="Logout"
        secondaryText="Cancel"
        onPrimary={handleLogout}
        onSecondary={() => setShowLogoutConfirm(false)}
      />
      {(showPasswordModal || passwordModalClosing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={`absolute inset-0 bg-black/40 ${
              passwordModalClosing ? "animate-backdrop-out" : "animate-backdrop-in"
            }`}
            onClick={closePasswordModal}
          />
          <div
            className={`bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative z-10 max-h-[90vh] overflow-y-auto ${
              passwordModalClosing ? "animate-modal-out" : "animate-modal-in"
            }`}
          >
            <div className="flex items-center gap-2 mb-6">
              <HiLockClosed className="w-5 h-5 warning-text" />
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

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold neutral-text mb-2">Current Password <span className="danger-text">*</span></label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.current_password}
                    onChange={(e) => handlePasswordChange("current_password", e.target.value)}
                    className={`input ${errors.current_password ? "input-error" : ""} pr-10`}
                    placeholder="Enter current password"
                    disabled={passwordLoading}
                  />
                  <div
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? (
                      <HiEyeOff className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
                    ) : (
                      <HiEye className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" />
                    )}
                  </div>
                </div>
                <div className="min-h-[20px] mt-1.5">
                  {errors.current_password && (
                    <p className="danger-text text-xs flex items-center gap-1.5">
                      <span>⚠</span> {errors.current_password}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold neutral-text mb-2">New Password <span className="danger-text">*</span></label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.password}
                    onChange={(e) => handlePasswordChange("password", e.target.value)}
                    className={`input ${errors.password ? "input-error" : ""} pr-10`}
                    placeholder="Enter new password"
                    disabled={passwordLoading}
                  />
                  <div
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? (
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
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.password_confirmation}
                    onChange={(e) => handlePasswordChange("password_confirmation", e.target.value)}
                    className={`input ${errors.password_confirmation ? "input-error" : ""} pr-10`}
                    placeholder="Confirm new password"
                    disabled={passwordLoading}
                  />
                  <div
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
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

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={closePasswordModal}
                disabled={passwordLoading}
                className="btn text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSave}
                disabled={passwordLoading}
                className="btn btn-warning text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}
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
      <Navbar />

      <div className="w-full px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Profile Card with Personal Information and Ready to Test */}
          <div className="card p-6 bg-light rounded-lg shadow-md">
            <div className="flex flex-col gap-2">
              {/* Profile Header Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center text-2xl font-bold white-text shadow-lg">
                    {(formData.firstName?.[0] || "U")}{(formData.lastName?.[0] || "")}
                  </div>
               
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-bold neutral-text mb-1">
                    {formData.firstName || formData.lastName 
                      ? `${formData.firstName || ""} ${formData.lastName || ""}`.trim()
                      : "User"
                    }
                  </h2>
                  <p className="neutral-text-muted text-sm mb-2">{formData.email || "No email"}</p>
                  {/* <p className="neutral-text-muted text-sm mb-2">{userData?.role || "N/A"}</p> */}
                  {/* {formData.bio && <p className="neutral-text text-sm mb-2">{formData.bio}</p>} */}
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
                      onClick={openPasswordModal}
                      className="btn btn-warning flex items-center gap-2"
                    >
                      <HiLockClosed className="w-4 h-4" />
                      Change Password
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

             

              {/* Personal Information Section */}
              <div className=" rounded-lg p-6">
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
                            setUpdateError("");
                            fetchUserData();
                          }}
                          className="btn bg-gray-100 hover:bg-gray-200 text-white hover:text-white border border-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saveLoading}
                          className="btn btn-accent flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {saveLoading ? (
                            <>
                              <span className="spinner spinner-sm"></span>
                              Saving...
                            </>
                          ) : (
                            <>
                              <HiCheck className="w-4 h-4" />
                              Save
                            </>
                          )}
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
                            <p className="neutral-text font-medium">{userData?.first_name || formData.firstName || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-medium rounded-lg border border-neutral-border-light">
                          <div className="p-2 primary-bg-light rounded-lg">
                            <HiUser className="w-5 h-5 primary-text" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs neutral-text-muted mb-1">Last Name</p>
                            <p className="neutral-text font-medium">{userData?.last_name || formData.lastName || "N/A"}</p>
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
                            <p className="neutral-text font-medium">{userData?.email || formData.email || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-medium rounded-lg border border-neutral-border-light">
                          <div className="p-2 info-bg-light rounded-lg">
                            <HiPhone className="w-5 h-5 info-text" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs neutral-text-muted mb-1">Contact Number</p>
                            <p className="neutral-text font-medium">
                              {userData?.phone ||
                                userData?.phone_number ||
                                userData?.contact ||
                                formData.phone ||
                                "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-4 bg-medium rounded-lg border border-neutral-border-light">
                          <div className="p-2 info-bg-light rounded-lg">
                            <HiPhone className="w-5 h-5 info-text" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs neutral-text-muted mb-1">WhatsApp Number</p>
                            <p className="neutral-text font-medium">
                              {userData?.whatsapp_number ||
                                userData?.contact_whatsapp ||
                                formData.whatsapp_number ||
                                "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-medium rounded-lg border border-neutral-border-light">
                          <div className="p-2 warning-bg-light rounded-lg">
                            <HiCalendar className="w-5 h-5 warning-text" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs neutral-text-muted mb-1">Age</p>
                            <p className="neutral-text font-medium">
                              {userData?.age || formData.age || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                        <div className="flex items-start gap-3 p-4 bg-medium rounded-lg border border-neutral-border-light">
                          <div className="p-2 secondary-bg-light rounded-lg">
                            <HiUser className="w-5 h-5 secondary-text" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs neutral-text-muted mb-1">Gender</p>
                            <p className="neutral-text font-medium capitalize">{userData?.gender || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-medium rounded-lg border border-neutral-border-light">
                          <div className="p-2 accent-bg-light rounded-lg">
                            <HiBriefcase className="w-5 h-5 accent-text" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs neutral-text-muted mb-1">Profession</p>
                            <p className="neutral-text font-medium">{userData?.profession || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3 p-4 bg-medium rounded-lg border border-neutral-border-light">
                          <div className="p-2 primary-bg-light rounded-lg">
                            <HiAcademicCap className="w-5 h-5 primary-text" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs neutral-text-muted mb-1">Educational Qualification</p>
                            <p className="neutral-text font-medium">{userData?.educational_qualification || "N/A"}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-medium rounded-lg border border-neutral-border-light">
                          <div className="p-2 info-bg-light rounded-lg">
                            <HiLocationMarker className="w-5 h-5 info-text" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs neutral-text-muted mb-1">Country</p>
                            <p className="neutral-text font-medium">{userData?.country || "N/A"}</p>
                          </div>
                        </div>

                      
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3 p-4 bg-medium rounded-lg border border-neutral-border-light">
                          <div className="p-2 info-bg-light rounded-lg">
                            <HiLocationMarker className="w-5 h-5 info-text" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs neutral-text-muted mb-1">State</p>
                            <p className="neutral-text font-medium">{userData?.state || "N/A"}</p>
                          </div>
                        </div>
                     
                   
                        <div className="flex items-start gap-3 p-4 bg-medium rounded-lg border border-neutral-border-light">
                          <div className="p-2 primary-bg-light rounded-lg">
                          <HiLocationMarker className="w-5 h-5 info-text" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs neutral-text-muted mb-1">City</p>
                            <p className="neutral-text font-medium">{userData?.city || "N/A"}</p>
                          </div>
                        </div>
                     
                      </div>

                     
                     
                      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-4 bg-medium rounded-lg border border-neutral-border-light">
                          <div className="p-2 warning-bg-light rounded-lg">
                            <HiClock className="w-5 h-5 warning-text" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs neutral-text-muted mb-1">Account Created</p>
                            <p className="neutral-text font-medium">
                              {userData?.created_at 
                                ? new Date(userData.created_at).toLocaleDateString() + " " + new Date(userData.created_at).toLocaleTimeString()
                                : "N/A"
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-medium rounded-lg border border-neutral-border-light">
                          <div className="p-2 warning-bg-light rounded-lg">
                            <HiClock className="w-5 h-5 warning-text" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs neutral-text-muted mb-1">Last Updated</p>
                            <p className="neutral-text font-medium">
                              {userData?.updated_at 
                                ? new Date(userData.updated_at).toLocaleDateString() + " " + new Date(userData.updated_at).toLocaleTimeString()
                                : "N/A"
                              }
                            </p>
                          </div>
                        </div>
                      </div> */}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {updateError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="danger-text text-sm">{updateError}</p>
                        </div>
                      )}
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
                          <label className="block text-sm font-semibold neutral-text mb-2">Phone</label>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold neutral-text mb-2">WhatsApp Number</label>
                          <input
                            type="tel"
                            value={formData.whatsapp_number}
                            onChange={(e) => handleChange("whatsapp_number", e.target.value)}
                            className={`input ${errors.whatsapp_number ? "input-error" : ""}`}
                          />
                          <div className="min-h-[20px] mt-1.5">
                            {errors.whatsapp_number && (
                              <p className="danger-text text-xs flex items-center gap-1.5">
                                <span>⚠</span> {errors.whatsapp_number}
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold neutral-text mb-2">Age</label>
                          <input
                            type="number"
                            value={formData.age}
                            onChange={(e) => handleChange("age", e.target.value)}
                            className={`input ${errors.age ? "input-error" : ""}`}
                          />
                          <div className="min-h-[20px] mt-1.5">
                            {errors.age && (
                              <p className="danger-text text-xs flex items-center gap-1.5">
                                <span>⚠</span> {errors.age}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold neutral-text mb-2">Gender</label>
                          <select
                            value={formData.gender}
                            onChange={(e) => handleChange("gender", e.target.value)}
                            className={`input ${errors.gender ? "input-error" : ""}`}
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                          <div className="min-h-[20px] mt-1.5">
                            {errors.gender && (
                              <p className="danger-text text-xs flex items-center gap-1.5">
                                <span>⚠</span> {errors.gender}
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold neutral-text mb-2">Profession</label>
                          <input
                            type="text"
                            value={formData.profession}
                            onChange={(e) => handleChange("profession", e.target.value)}
                            className={`input ${errors.profession ? "input-error" : ""}`}
                          />
                          <div className="min-h-[20px] mt-1.5">
                            {errors.profession && (
                              <p className="danger-text text-xs flex items-center gap-1.5">
                                <span>⚠</span> {errors.profession}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold neutral-text mb-2">City</label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => handleChange("city", e.target.value)}
                            className={`input ${errors.city ? "input-error" : ""}`}
                          />
                          <div className="min-h-[20px] mt-1.5">
                            {errors.city && (
                              <p className="danger-text text-xs flex items-center gap-1.5">
                                <span>⚠</span> {errors.city}
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold neutral-text mb-2">State</label>
                          <input
                            type="text"
                            value={formData.state}
                            onChange={(e) => handleChange("state", e.target.value)}
                            className={`input ${errors.state ? "input-error" : ""}`}
                          />
                          <div className="min-h-[20px] mt-1.5">
                            {errors.state && (
                              <p className="danger-text text-xs flex items-center gap-1.5">
                                <span>⚠</span> {errors.state}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold neutral-text mb-2">Country</label>
                          <input
                            type="text"
                            value={formData.country}
                            onChange={(e) => handleChange("country", e.target.value)}
                            className={`input ${errors.country ? "input-error" : ""}`}
                          />
                          <div className="min-h-[20px] mt-1.5">
                            {errors.country && (
                              <p className="danger-text text-xs flex items-center gap-1.5">
                                <span>⚠</span> {errors.country}
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold neutral-text mb-2">Educational Qualification</label>
                          <input
                            type="text"
                            value={formData.educational_qualification}
                            onChange={(e) => handleChange("educational_qualification", e.target.value)}
                            className={`input ${errors.educational_qualification ? "input-error" : ""}`}
                          />
                          <div className="min-h-[20px] mt-1.5">
                            {errors.educational_qualification && (
                              <p className="danger-text text-xs flex items-center gap-1.5">
                                <span>⚠</span> {errors.educational_qualification}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  )}
                </div>
              </div>
            </div>

        </div>
      </div>
    </div>
  );
}
