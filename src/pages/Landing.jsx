import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import apiClient from "../config/api";

export default function Landing() {
  const navigate = useNavigate();
  const [primaryTestId, setPrimaryTestId] = useState(null);
  const [isFetchingTest, setIsFetchingTest] = useState(true);
  const [startError, setStartError] = useState("");

  // Check if admin is logged in and redirect
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");

    // If admin is logged in, redirect to admin dashboard
    if (adminToken) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const fetchPrimaryTest = async () => {
      try {
        setIsFetchingTest(true);
        setStartError("");
        const response = await apiClient.get("/tests");

        if (response.data?.status && Array.isArray(response.data.data)) {
          const activeTests = response.data.data.filter(
            (test) => test.is_active !== false
          );
          if (activeTests.length > 0) {
            setPrimaryTestId(activeTests[0].id);
          } else if (response.data.data.length > 0) {
            setPrimaryTestId(response.data.data[0].id);
          } else {
            setStartError("No active tests available right now.");
          }
        } else {
          setStartError("Unable to load test. Please try again later.");
        }
      } catch (error) {
        console.error("Error loading test:", error);
        setStartError(
          error.response?.data?.message ||
            "Unable to load test. Please try again later."
        );
      } finally {
        setIsFetchingTest(false);
      }
    };

    fetchPrimaryTest();
  }, []);

  const isUserAuthenticated = () => {
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) return false;
    return !!(
      localStorage.getItem("token") ||
      localStorage.getItem("userToken") ||
      localStorage.getItem("authToken")
    );
  };

  const handleStartTest = () => {
    if (!primaryTestId) {
      setStartError("No active tests available right now. Please try again later.");
      return;
    }

    const targetPath = `/test/${primaryTestId}`;

    if (isUserAuthenticated()) {
      navigate(targetPath);
      return;
    }

    sessionStorage.setItem("redirectAfterAuth", targetPath);
    navigate("/login", { state: { redirectTo: targetPath } });
  };

  return (
    <div className="min-h-screen w-screen blue-bg-100">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden w-full px-6 md:px-16 py-20 md:py-28">
        <div className="absolute inset-0 opacity-15 pointer-events-none" />
        <div />
        <div />

        <div className="relative max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* LEFT TEXT */}
          <div className="space-y-6">
            <span className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white text-blue-600 text-xs font-semibold tracking-[0.4em] uppercase shadow-sm">
              Bright Futures
            </span>

            <h1 className="font-weight-700 text-neutral-900 text-4xl md:text-6xl leading-tight">
              Discover the{" "}
              <span className="text-secondary-300">colorful power</span> of
              smart assessments.
            </h1>

            <p className="font16 text-neutral-700 mt-2 max-w-lg">
              Practice aptitude, reasoning, and behavioral tests with vivid
              dashboards, instant feedback, and personalized insights that guide
              your next move.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleStartTest}
                
                disabled={isFetchingTest || !primaryTestId}
                className="px-8 py-3 rounded-full yellow-bg-400 yellow-text-950 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isFetchingTest ? "Preparing..." : "Let's Start"}
              </button>
              {startError && (
                <p className="text-sm text-red-600">{startError}</p>
              )}
            </div>
          </div>

          {/* RIGHT BANNER IMAGE */}
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/60 bg-white/90 backdrop-blur">
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
