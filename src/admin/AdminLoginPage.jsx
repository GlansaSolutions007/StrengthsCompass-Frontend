import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiUser, HiLockClosed, HiExclamationCircle, HiEye, HiEyeOff, HiChevronDown } from "react-icons/hi";
import apiClient from "../config/api";
import AlertModal from "../components/AlertModal";
import logoImage from "../../Images/Logo.png";

export default function AdminLoginPage() {
  const navigate = useNavigate();

  // Helper function to format age range display
  // Display "40+" for any age range that starts at 40 or above
  const formatAgeRange = (from, to) => {
    if (typeof from === "number" && from >= 40) {
      return `${from}+`;
    }
    return `${from} - ${to}`;
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ageGroupId, setAgeGroupId] = useState("");
  const [role, setRole] = useState("");
  const [roles, setRoles] = useState([]);
  const [ageGroups, setAgeGroups] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingAgeGroups, setLoadingAgeGroups] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotModalClosing, setForgotModalClosing] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

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
    
    // If admin has a token, redirect to dashboard
    if (adminToken) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  // Fetch roles on component mount. Age groups load after a role is selected.
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true);
        const response = await apiClient.get("/roles", {
          params: { isActive: true },
        });
        
        if (response.data?.status && response.data.data) {
          const roles = Array.isArray(response.data.data) 
            ? response.data.data 
            : [response.data.data];
          
          setRoles(
            roles
              .filter((role) => role.name?.toLowerCase() !== "admin")
              .map((role) => ({
                id: role.id,
                name: role.name || ""
              }))
          );
        }
      } catch (err) {
        console.error("Error fetching roles:", err);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  useEffect(() => {
    const fetchAgeGroups = async () => {
      if (!role) {
        setAgeGroups([]);
        setAgeGroupId("");
        setLoadingAgeGroups(false);
        return;
      }

      try {
        setLoadingAgeGroups(true);
        const response = await apiClient.get("/age-groups", {
          params: { role_id: role, is_active: true },
        });

        if (response.data?.status && response.data.data) {
          const groups = Array.isArray(response.data.data)
            ? response.data.data
            : [response.data.data];

          setAgeGroups(
            groups.map((ag) => ({
              id: ag.id,
              role: ag.role,
              name: ag.name || "",
              from: ag.from || "",
              to: ag.to || "",
            }))
          );
        } else {
          setAgeGroups([]);
        }
      } catch (err) {
        console.error("Error fetching age groups:", err);
        setAgeGroups([]);
      } finally {
        setLoadingAgeGroups(false);
      }
    };

    fetchAgeGroups();
  }, [role]);

  const validateEmail = (email) => {
    if (!email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const validateAgeGroup = (ageGroupId) => {
    if (!ageGroupId || ageGroupId === "") return "Age group is required";
    return "";
  };

  const validateRole = (roleId) => {
    if (!roleId || roleId === "") return "Role is required";
    return "";
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    if (field === "email") {
      setErrors({ ...errors, email: validateEmail(email) });
    } else if (field === "password") {
      setErrors({ ...errors, password: validatePassword(password) });
    } else if (field === "role") {
      setErrors({ ...errors, role: validateRole(role) });
    } else if (field === "ageGroup") {
      setErrors({ ...errors, ageGroup: validateAgeGroup(ageGroupId) });
    }
  };

  const handleChange = (field, value) => {
    if (field === "email") {
      setEmail(value);
      setLoginError(""); 
      if (touched.email) {
        setErrors({ ...errors, email: validateEmail(value) });
      }
    } else if (field === "password") {
      setPassword(value);
      setLoginError(""); 
      if (touched.password) {
        setErrors({ ...errors, password: validatePassword(value) });
      }
    } else if (field === "role") {
      setRole(value);
      setAgeGroupId("");
      setAgeGroups([]);
      localStorage.removeItem("adminSelectedVariantId");
      localStorage.removeItem("adminSelectedRoleId");
      localStorage.removeItem("adminSelectedRoleName");
      setLoginError("");
      if (touched.role) {
        setErrors({ ...errors, role: validateRole(value), ageGroup: "" });
      }
    } else if (field === "ageGroup") {
      setAgeGroupId(value);
      setLoginError("");
      if (touched.ageGroup) {
        setErrors({ ...errors, ageGroup: validateAgeGroup(value) });
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);
    
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const roleError = validateRole(role);
    const ageGroupError = validateAgeGroup(ageGroupId);

    if (emailError || passwordError || roleError || ageGroupError) {
      setErrors({ 
        email: emailError, 
        password: passwordError,
        role: roleError,
        ageGroup: ageGroupError
      });
      setTouched({ email: true, password: true, role: true, ageGroup: true });
      setIsLoading(false);
      return;
    }

    try {
      // First, perform login
      const loginResponse = await apiClient.post("/login", {
        email: email,
        password: password,
      });

      console.log("Login response:", loginResponse.data);

      if (loginResponse.data && (loginResponse.data.status === true || loginResponse.status === 200)) {
        // Check if user is an admin
        const user = loginResponse.data.data?.user;
        const userRole = user?.role || user?.user_type || user?.type;
        
        // Validate that the user is an admin
        if (userRole && userRole.toLowerCase() !== "admin" && userRole.toLowerCase() !== "administrator") {
          setLoginError("Invalid credentials. This account does not have admin access. Please use the user login page.");
          setIsLoading(false);
          return;
        }
        
        if (loginResponse.data.data?.token) {
          localStorage.setItem("adminToken", loginResponse.data.data.token);
        }
        if (user) {
          localStorage.setItem("adminUser", JSON.stringify(user));
        }
        
        // After successful login, set the age group
        try {
          const variantResponse = await apiClient.post("/set-age-group", {
            age_group_id: parseInt(ageGroupId),
          });

          if (variantResponse.data?.status || variantResponse.status === 200) {
            // Store selected age group in localStorage
            localStorage.setItem("adminSelectedVariantId", ageGroupId);
            localStorage.setItem("adminSelectedRoleId", role);
            localStorage.setItem(
              "adminSelectedRoleName",
              roles.find((item) => item.id === parseInt(role))?.name || ""
            );
            console.log("Age group set successfully:", variantResponse.data);
          }
        } catch (variantErr) {
          console.error("Error setting age group:", variantErr);
          // Continue with navigation even if age group setting fails
          // Store locally as fallback
          localStorage.setItem("adminSelectedVariantId", ageGroupId);
          localStorage.setItem("adminSelectedRoleId", role);
          localStorage.setItem(
            "adminSelectedRoleName",
            roles.find((item) => item.id === parseInt(role))?.name || ""
          );
        }
        
        navigate("/admin/dashboard");
      } else {
        setLoginError(loginResponse.data?.message || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      
      let errorMessage = "Login failed. Please try again.";
      
      if (err.response) {
        errorMessage = err.response.data?.message || err.response.data?.error || `Error: ${err.response.statusText}`;
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      setLoginError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const openForgotModal = () => {
    setForgotMessage("");
    setForgotError("");
    setForgotEmail(email || "");
    setForgotModalOpen(true);
  };

  const closeForgotModal = () => {
    if (forgotLoading) return;
    const ANIMATION_MS = 220;
    setForgotModalClosing(true);
    setTimeout(() => {
      setForgotModalClosing(false);
      setForgotModalOpen(false);
      setForgotMessage("");
      setForgotError("");
    }, ANIMATION_MS);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMessage("");
    setForgotError("");

    const emailToSend = forgotEmail.trim() || email.trim();
    const emailError = validateEmail(emailToSend);
    if (emailError) {
      setForgotError("Please enter a valid email before requesting a reset link.");
      return;
    }

    try {
      setForgotLoading(true);
      // Use same forgot-password endpoint as user, but backend should detect admin context
      // and include admin=true in the reset link URL
      const response = await apiClient.post("/forgot-password", {
        email: emailToSend,
      });

      const successMessage =
        response.data?.message ||
        response.data?.data?.message ||
        (response.data?.status
          ? "Password reset instructions have been sent to your email."
          : null);

      const httpSuccess = response.status >= 200 && response.status < 300;

      if (response.data?.status || httpSuccess || successMessage) {
        setForgotMessage(
          successMessage || "Password reset instructions have been sent to your email."
        );
        setForgotEmail(emailToSend);
        setTimeout(() => {
          closeForgotModal();
        }, 1500);
      } else {
        setForgotError(
          response.data?.message ||
            response.data?.errors?.email?.[0] ||
            "Unable to send reset link. Please try again."
        );
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setForgotError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.response?.data?.errors?.email?.[0] ||
          "Unable to send reset link. Please try again."
      );
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={!!loginError}
        onClose={() => setLoginError("")}
        type="error"
        title="Login Failed"
        message={loginError || ""}
      />
      {(forgotModalOpen || forgotModalClosing) && (
        <div className="fixed inset-0 z-20 flex items-center justify-center p-4">
          <div
            className={`absolute inset-0 bg-black/40 ${
              forgotModalClosing ? "animate-backdrop-out" : "animate-backdrop-in"
            }`}
            onClick={closeForgotModal}
          />
          <div
            className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative z-10 ${
              forgotModalClosing ? "animate-modal-out" : "animate-modal-in"
            }`}
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Forgot Password</h3>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium neutral-text-muted">
                  Email
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary"
                />
                {forgotError && (
                  <p className="danger-text text-xs">{forgotError}</p>
                )}
                {forgotMessage && (
                  <p className="success-text text-xs">{forgotMessage}</p>
                )}
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForgotModal}
                  disabled={forgotLoading}
                  className="btn btn-primary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn secondary-bg black-text hover:secondary-bg-dark text-sm"
                >
                  {forgotLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="min-h-screen w-screen flex items-center justify-center blue-bg-100 p-4 relative overflow-hidden">
      <div className="w-full max-w-md bg-white backdrop-blur-xl shadow-2xl rounded-3xl p-8 md:p-10 relative z-10 border border-primary-border-light animate-slide-up">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src={logoImage}
              alt="Psychometric Admin"
              className="h-16 w-auto object-contain"
            />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold primary-text-medium mb-2">
            Admin Portal
          </h2>
          
        
        </div>

        <form onSubmit={handleLogin} noValidate className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium neutral-text-muted">
              Select Role
            </label>
            <div
              className={`group flex w-full rounded-md overflow-hidden border transition-all focus-within:ring-2 focus-within:ring-secondary focus-within:border-secondary ${
                errors.role && touched.role
                  ? "border-red-500"
                  : "border-neutral-300"
              }`}
            >
              {/* Left Icon Box */}
              <div
                className="flex items-center justify-center bg-primary-bg-light px-3 transition-all group-focus-within:bg-secondary-bg-light"
              >
                <HiUser className="h-5 w-5 primary-text group-focus-within:secondary-text transition-colors" />
              </div>

              {/* Select Field */}
              <div className="relative flex-1">
                <select
                  required
                  value={role}
                  onChange={(e) => handleChange("role", e.target.value)}
                  onBlur={() => handleBlur("role")}
                  disabled={loadingRoles || isLoading}
                  className="w-full py-2 px-3 bg-white text-sm focus:outline-none focus:bg-secondary-bg-light transition-colors appearance-none pr-8"
                >
                  {loadingRoles ? (
                    <option value="">Loading roles...</option>
                  ) : roles.length === 0 ? (
                    <option value="">No roles available</option>
                  ) : (
                    <>
                      <option value="" disabled>
                        Select role
                      </option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 neutral-text-muted" />
              </div>
            </div>
            {errors.role && touched.role && (
              <p className="danger-text text-xs mt-1 flex items-center gap-1">
                <HiExclamationCircle className="w-3 h-3" />
                {errors.role}
              </p>
            )}
            <label className="block text-sm font-medium neutral-text-muted">
              Age Group
            </label>
            <div
              className={`group flex w-full rounded-md overflow-hidden border transition-all focus-within:ring-2 focus-within:ring-secondary focus-within:border-secondary ${
                errors.ageGroup && touched.ageGroup
                  ? "border-red-500"
                  : "border-neutral-300"
              }`}
            >
              {/* Left Icon Box */}
              <div
                className="flex items-center justify-center bg-primary-bg-light px-3 transition-all group-focus-within:bg-secondary-bg-light"
              >
                <HiUser className="h-5 w-5 primary-text group-focus-within:secondary-text transition-colors" />
              </div>

              {/* Select Field */}
              <div className="relative flex-1">
                <select
                  required
                  value={ageGroupId}
                  onChange={(e) => handleChange("ageGroup", e.target.value)}
                  onBlur={() => handleBlur("ageGroup")}
                  disabled={!role || loadingAgeGroups || isLoading}
                  className="w-full py-2 px-3 bg-white text-sm focus:outline-none focus:bg-secondary-bg-light transition-colors appearance-none pr-8"
                >
                  {!role ? (
                    <option value="">Select role first</option>
                  ) : loadingAgeGroups ? (
                    <option value="">Loading age groups...</option>
                  ) : ageGroups.length === 0 ? (
                    <option value="">No age groups available</option>
                  ) : (
                    <>
                      <option value="" disabled>
                        Select age group
                      </option>
                      {ageGroups.map((ag) => (
                        <option key={ag.id} value={ag.id}>
                          {ag.name} ({formatAgeRange(ag.from, ag.to)})
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <HiChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 neutral-text-muted" />
              </div>
            </div>
            {errors.ageGroup && touched.ageGroup && (
              <p className="danger-text text-xs mt-1 flex items-center gap-1">
                <HiExclamationCircle className="w-3 h-3" />
                {errors.ageGroup}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium neutral-text-muted">
              Admin Email
            </label>
            <div
              className={`group flex w-full rounded-md overflow-hidden border transition-all focus-within:ring-2 focus-within:ring-secondary focus-within:border-secondary ${
                errors.email && touched.email
                  ? "border-red-500"
                  : "border-neutral-300"
              }`}
            >
              {/* Left Icon Box */}
              <div
                className="flex items-center justify-center bg-primary-bg-light px-3 transition-all group-focus-within:bg-secondary-bg-light"
              >
                <HiUser className="h-5 w-5 primary-text group-focus-within:secondary-text transition-colors" />
              </div>

              {/* Input Field */}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="Enter admin email"
                className="flex-1 py-2 px-3 bg-white text-sm focus:outline-none focus:bg-secondary-bg-light transition-colors"
              />
            </div>
            {errors.email && touched.email && (
              <p className="danger-text text-xs mt-1 flex items-center gap-1">
                <HiExclamationCircle className="w-3 h-3" />
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium neutral-text-muted">
              Admin Password
            </label>
            <div
              className={`group flex w-full rounded-md overflow-hidden border transition-all focus-within:ring-2 focus-within:ring-secondary focus-within:border-secondary ${
                errors.password && touched.password
                  ? "border-red-500"
                  : "border-neutral-300"
              }`}
            >
              {/* Left Icon Box */}
              <div
                className="flex items-center justify-center bg-primary-bg-light px-3 transition-all group-focus-within:bg-secondary-bg-light"
              >
                <HiLockClosed className="h-5 w-5 primary-text group-focus-within:secondary-text transition-colors" />
              </div>

              {/* Input Field */}
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => handleChange("password", e.target.value)}
                onBlur={() => handleBlur("password")}
                placeholder="Enter admin password"
                className="flex-1 py-2 px-3 bg-white text-sm focus:outline-none focus:bg-secondary-bg-light transition-colors"
              />
              
              {/* Eye Icon */}
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

          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center justify-between">
              <span />
              <a
                onClick={openForgotModal}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer"
              >
                Forgot Password?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-lg yellow-bg-400 yellow-text-950 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Access Admin Dashboard"}
          </button>
        </form>

        
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.05);
          }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse-gentle {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
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
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        .animate-pulse-gentle {
          animation: pulse-gentle 3s ease-in-out infinite;
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
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
      </div>
    </>
  );
}