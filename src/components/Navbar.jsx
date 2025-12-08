import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HiUserCircle, HiClipboardList, HiChevronDown } from "react-icons/hi";
import logoImage from "../../Images/Logo.png";

export default function Navbar({ onSelectAgeGroup, selectedAgeGroup, ageGroups = [] }) {
  const [userIsSignedIn, setUserIsSignedIn] = useState(false);

  // Check if user is authenticated
  const checkAuthentication = () => {
    // Only check for regular user tokens, explicitly exclude adminToken
    const token = localStorage.getItem("token");
    const userToken = localStorage.getItem("userToken");
    const authToken = localStorage.getItem("authToken");
    
    // Only show profile if there's a user token (not adminToken)
    // Check each token individually to avoid false positives
    const hasUserToken = !!(token || userToken || authToken);
    
    // Make sure adminToken is NOT present (admin login is separate)
    const hasAdminToken = !!localStorage.getItem("adminToken");
    
    // User is signed in only if they have a user token and are NOT logged in as admin
    setUserIsSignedIn(hasUserToken && !hasAdminToken);
  };

  useEffect(() => {
    // Check authentication on mount
    checkAuthentication();

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = () => {
      checkAuthentication();
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Also check periodically in case of same-tab changes
    const interval = setInterval(checkAuthentication, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="w-full px-6 md:px-12 py-4 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo Section */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex items-center">
            <img
              src={logoImage}
              alt="Psychometric logo"
              className="h-10 w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        </Link>
   
        {/* Right Side - Navigation Links and Action Buttons */}
        <div className="flex items-center gap-4">
          {/* Age Group Selector - Only show if onSelectAgeGroup is provided */}
          {onSelectAgeGroup && (
            <button
              onClick={onSelectAgeGroup}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium border border-gray-200 hover:border-blue-300"
              title="Change Age Group"
            >
              <span className="text-sm">
                {selectedAgeGroup && ageGroups.length > 0
                  ? ageGroups.find(ag => ag.id === selectedAgeGroup)?.name || "Select Age"
                  : "Select Age"}
              </span>
              <HiChevronDown className="w-4 h-4" />
            </button>
          )}

          {/* Navigation Links */}
          {/* <nav className="hidden md:flex items-center gap-1">
       
            <Link 
              to="/testlist" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:text-primary-text hover:bg-primary-bg-light transition-all duration-200 font-medium"
              title="Tests"
            >
              <HiClipboardList className="w-5 h-5" />
              <span>Tests</span>
            </Link>
          </nav> */}

          {/* Sign In/Out Button */}
          {/* <Link 
            to="/reset-password" 
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all duration-200 font-medium"
          >
            Reset Password
          </Link> */}

          {userIsSignedIn ? (
            <Link 
              to="/profile" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:text-primary-text hover:bg-primary-bg-light transition-all duration-200 font-medium"
              title="Profile"
            >
              <HiUserCircle className="w-5 h-5" />
              <span>Profile</span>
            </Link>
          ) : (
            <Link 
              to="/login" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:text-primary-text hover:bg-primary-bg-light transition-all duration-200 font-medium"
            >
              Sign In
            </Link>
          )}
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
