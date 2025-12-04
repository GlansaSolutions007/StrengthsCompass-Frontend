import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiPlay,
  HiDocumentText,
  HiArrowRight,
  HiRefresh,
  HiFilter,
  HiClock,
  HiLightningBolt,
  HiCheckCircle,
} from "react-icons/hi";
import Navbar from "../components/Navbar";
import apiClient from "../config/api";
import AlertModal from "../components/AlertModal";

export default function TestList() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Check if admin is logged in and redirect
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    
    // If admin is logged in, redirect to admin dashboard
    if (adminToken) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get("/tests");

      if (response.data?.status && response.data.data) {
        // Filter only active tests
        const activeTests = response.data.data
          .filter((test) => test.is_active !== false)
          .map((test) => ({
            id: test.id,
            title: test.title || "",
            description: test.description || "",
            is_active: test.is_active !== undefined ? test.is_active : true,
            clusters: test.clusters || [],
            // Calculate question count from clusters if available
            questions: test.clusters?.reduce((total, cluster) => {
              // Assuming each cluster might have question count info
              // Adjust based on your API response structure
              return total + (cluster.question_count || 0);
            }, 0) || 0,
            // Default duration if not provided
            duration: "30 minutes",
            category: test.clusters?.[0]?.name || "General",
          }));
        setTests(activeTests);
      } else {
        setError("Failed to load tests");
      }
    } catch (err) {
      console.error("Error fetching tests:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load tests. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleStartTest = async (testId) => {
    try {
      // Call the take endpoint to initialize the test
      await apiClient.get(`/tests/${testId}/take`);
      // Navigate to test page with testId
      navigate(`/test/${testId}`);
    } catch (err) {
      console.error("Error starting test:", err);
      setError(
        err.response?.data?.message ||
          "Failed to start test. Please try again."
      );
    }
  };

  const categories = [
    "all",
    ...Array.from(new Set(tests.map((test) => test.category))).filter(Boolean),
  ];

  const filteredTests =
    selectedCategory === "all"
      ? tests
      : tests.filter((test) => test.category === selectedCategory);

  const totalQuestions = tests.reduce((sum, test) => sum + (test.questions || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen w-screen neutral-text bg">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="spinner spinner-lg mx-auto mb-4"></div>
            <p className="neutral-text-muted">Loading tests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen neutral-text blue-bg-50">
      <AlertModal
        isOpen={!!error}
        onClose={() => setError(null)}
        type="error"
        title="Error"
        message={error || ""}
      />
      <Navbar />

      <div className="w-full px-5 sm:px-8 lg:px-12 xl:px-16 py-10 space-y-12">        

        {/* Filters */}
        {/* <section className="bg-white rounded-3xl shadow-lg border border-amber-100 p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Browse</p>
              <h2 className="text-2xl font-bold text-slate-900">
                {selectedCategory === "all" ? "All categories" : selectedCategory}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all ${
                    selectedCategory === category
                      ? "bg-yellow-400 text-slate-900 border-yellow-500 shadow-md"
                      : "border-amber-100 text-slate-600 hover:border-yellow-300 hover:text-slate-900"
                  }`}
                >
                  <HiFilter className="w-4 h-4" />
                  {category === "all" ? "All Tests" : category}
                </button>
              ))}
            </div>
          </div>
        </section> */}

        {/* Test Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTests.map((test) => (
            <article
              key={test.id}
              className="group relative bg-white rounded-[28px] shadow-lg border border-blue-100 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-600" />
              <div className="p-6 flex flex-col h-full gap-5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                    {test.category}
                  </span>
                  <div className="p-2 rounded-2xl bg-blue-50 text-blue-500">
                    <HiDocumentText className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {test.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-3">{test.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100">
                    <p className="text-xs uppercase tracking-[0.3em] text-blue-600">Duration</p>
                    <p className="text-base font-semibold text-slate-900 mt-1">{test.duration || "30 minutes"}</p>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100">
                    <p className="text-xs uppercase tracking-[0.3em] text-blue-600">Questions</p>
                    <p className="text-base font-semibold text-slate-900 mt-1">{test.questions || "N/A"}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleStartTest(test.id)}
                  className="mt-auto w-full py-3 px-4 rounded-2xl yellow-bg-400 yellow-text-950 font-semibold font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-all duration-200 shadow-lg group/btn"
                >
                  <HiPlay className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                  Start test
                  <HiArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </article>
          ))}
        </section>

        {filteredTests.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[32px] shadow-inner border border-dashed border-yellow-400">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-500">
              <HiDocumentText className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-2">No tests in this category</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Adjust your filter or check back soon—new yellow-labeled assessments drop regularly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
