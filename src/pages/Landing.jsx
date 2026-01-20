import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiPlay, HiArrowRight } from "react-icons/hi";
import Navbar from "../components/Navbar";

export default function Landing() {
  const navigate = useNavigate();

  // Check if admin is logged in and redirect
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");

    // If admin is logged in, redirect to admin dashboard
    if (adminToken) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const isUserAuthenticated = () => {
    // Check for regular user tokens, explicitly exclude adminToken
    const token = localStorage.getItem("token");
    const userToken = localStorage.getItem("userToken");
    const authToken = localStorage.getItem("authToken");
    
    // Check if user has a token (not adminToken)
    const hasUserToken = !!(token || userToken || authToken);
    
    // Make sure adminToken is NOT present (admin login is separate)
    const hasAdminToken = !!localStorage.getItem("adminToken");
    
    // User is authenticated only if they have a user token and are NOT logged in as admin
    return hasUserToken && !hasAdminToken;
  };

  const handleLetsStart = () => {
    if (isUserAuthenticated()) {
      // User is logged in, navigate to test list
      navigate("/testlist");
    } else {
      // User is not logged in, navigate to login page
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen w-screen blue-bg-100">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden w-full px-4 sm:px-6 md:px-16 py-12 sm:py-16 md:py-20 lg:py-28">
        <div className="absolute inset-0 opacity-15 pointer-events-none" />
        <div />
        <div />

        <div className="relative max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
          {/* LEFT TEXT */}
          <div className="space-y-4 sm:space-y-6 text-center md:text-left">
            <span className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white text-blue-600 text-xs sm:text-sm font-semibold tracking-wide sm:tracking-[0.4em] uppercase shadow-sm">
            Strengths Compass
            </span>

            <h1 className="font-weight-700 text-neutral-900 text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
             Unlock Your Hidden Strengths Today
            </h1>

            <p className="font16 text-neutral-700 mt-2 max-w-lg text-sm sm:text-base mx-auto md:mx-0">
            Discover Your True Strengths with Strengths Compass. Unlock personalized insights through our validated psychometric assessment, guiding you to leverage natural talents for career growth, personal development, and everyday success. Start navigating life with clarity and confidence today.
            </p>
            <button
              onClick={handleLetsStart}
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-2xl yellow-bg-400 yellow-text-950 font-semibold text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 hover:shadow-xl transition-all duration-200 shadow-lg group/btn mx-auto md:mx-0 w-full sm:w-auto"
            >
              <HiPlay className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:translate-x-0.5 transition-transform" />
              Let's Start
              <HiArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* RIGHT BANNER IMAGE */}
          <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/60 bg-white/90 backdrop-blur order-first md:order-last">
            <img
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&h=600&fit=crop&q=80"
              alt="Lightbulb Idea"
              className="w-full h-auto object-cover"
              onError={(e) => {
                e.target.src =
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&h=600&fit=crop&q=80";
              }}
            />
          </div>
        </div>
      </section>

   

    </div>
  );
}
