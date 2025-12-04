import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiUser, HiLockClosed, HiExclamationCircle, HiEye, HiEyeOff } from "react-icons/hi";
import apiClient from "../config/api";
import AlertModal from "../components/AlertModal";
import logoImage from "../../Images/Logo.png";

export default function AdminLoginPage() {
  const navigate = useNavigate();

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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      console.log("Login response:", response.data);

      if (response.data && (response.data.status === true || response.status === 200)) {
        if (response.data.data?.token) {
          localStorage.setItem("adminToken", response.data.data.token);
        }
        if (response.data.data?.user) {
          localStorage.setItem("adminUser", JSON.stringify(response.data.data.user));
        }
        
        navigate("/admin/dashboard");
      } else {
        setLoginError(response.data?.message || "Login failed. Please check your credentials.");
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

  return (
    <>
      <AlertModal
        isOpen={!!loginError}
        onClose={() => setLoginError("")}
        type="error"
        title="Login Failed"
        message={loginError || ""}
      />
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
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        .animate-pulse-gentle {
          animation: pulse-gentle 3s ease-in-out infinite;
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

