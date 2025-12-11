import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  HiLightBulb,
  HiMail,
  HiLockClosed,
  HiExclamationCircle,
  HiEye,
  HiEyeOff,
  HiX,
} from "react-icons/hi";
import apiClient from "../config/api";
import logoImage from "../../Images/Logo.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication and separate admin/user routes
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    
    // If admin is logged in, redirect to admin dashboard
    if (adminToken) {
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    const token = localStorage.getItem("token") || 
                  localStorage.getItem("userToken") || 
                  localStorage.getItem("authToken");
    
    // If user has a token, redirect to test list page or pending destination
    if (token) {
      const redirectTarget =
        location.state?.redirectTo || sessionStorage.getItem("redirectAfterAuth");
      if (redirectTarget) {
        sessionStorage.removeItem("redirectAfterAuth");
        navigate(redirectTarget, { replace: true });
      } else {
        navigate("/testlist", { replace: true });
      }
    }
  }, [navigate, location]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const validateEmail = (email) => {
    if (!email) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const handleBlur = (field) => {
    setTouched({ ...touched, [field]: true });
    if (field === "email") {
      setErrors({ ...errors, email: validateEmail(email) });
    } else if (field === "password") {
      setErrors({ ...errors, password: validatePassword(password) });
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
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoading(true);
    
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      setTouched({ email: true, password: true });
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.post("/login", {
        email: email,
        password: password,
      });

      if (response.data?.status || response.status === 200) {
        // Check if user is an admin
        const user = response.data.data?.user;
        const userRole = user?.role || user?.user_type || user?.type;
        
        // Validate that the user is NOT an admin
        if (userRole && (userRole.toLowerCase() === "admin" || userRole.toLowerCase() === "administrator")) {
          setLoginError("Invalid credentials. This account has admin access. Please use the admin login page.");
          setIsLoading(false);
          return;
        }
        
        // Store user data in localStorage
        const userId = user?.id || user?.user_id;
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("userId", userId);
          localStorage.setItem("adminSelectedVariantId", response.data.data.user.age_group_id ? response.data.data.user.age_group_id : response.data.data.age_group_id);
        }
        if (response.data.data?.token) {
          localStorage.setItem("token", response.data.data.token);
          localStorage.setItem("adminSelectedVariantId", response.data.data.user.age_group_id ? response.data.data.user.age_group_id : response.data.data.age_group_id);
        }
        
        // Navigate to redirect target or test list page
        const redirectTarget =
          location.state?.redirectTo || sessionStorage.getItem("redirectAfterAuth");
        if (redirectTarget) {
          sessionStorage.removeItem("redirectAfterAuth");
          navigate(redirectTarget, { replace: true });
        } else {
          navigate("/testlist", { replace: true });
        }
      } else {
        setLoginError(response.data?.message || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Login failed. Please try again."
      );
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
      setForgotError(emailError);
      setForgotError("Please enter a valid email before requesting a reset link.");
      return;
    }

    try {
      setForgotLoading(true);
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
    <div className="min-h-screen w-screen flex items-center justify-center p-4 relative overflow-hidden blue-bg-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 md:p-10 relative z-10">
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
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src={logoImage}
              alt="Logo"
              className="h-16 w-auto object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">User Login</h2>
        </div>

        <form onSubmit={handleLogin} noValidate className="space-y-4">
          {loginError && (
            <div className="warning-bg-light border warning-border-light warning-text px-3 py-2 rounded-md text-xs flex items-center gap-2">
              <HiExclamationCircle className="w-4 h-4" />
              {loginError}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium neutral-text-muted">
              Email
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
                <HiMail className="h-5 w-5 primary-text group-focus-within:secondary-text transition-colors" />
              </div>

              {/* Input Field */}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="Enter email address"
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
              Password
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
                placeholder="Enter password"
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
          {/* Placeholder for remember me if needed */}
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
            className="w-full py-3 px-4 rounded-lg yellow-bg-400 yellow-text-950 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="spinner spinner-sm mr-2"></span>
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

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

        <div className="mt-6 border-t neutral-border-light pt-4">
          <p className="text-center text-xs neutral-text-muted">
            New to Strengths Compass?
          </p>
          <Link
            to="/register"
            className="mt-3 inline-flex items-center justify-center w-full btn btn-ghost"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
