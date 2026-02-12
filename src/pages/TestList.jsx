import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
import apiClient, { API_BASE_URL } from "../config/api";
import AlertModal from "../components/AlertModal";

export default function TestList() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [userAge, setUserAge] = useState(null);
  const [ageGroupId, setAgeGroupId] = useState(null);
  const [ageCheckComplete, setAgeCheckComplete] = useState(false);

  // Check if admin is logged in and redirect
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    
    // If admin is logged in, redirect to admin dashboard
    if (adminToken) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);


  // Get user age_group_id from profile/API
  useEffect(() => {
    const getUserAgeGroupId = async () => {
      try {
        let userAgeGroupId = null;
        let userAgeValue = null;

        // ALWAYS fetch from API first (most reliable source)
        const userId = localStorage.getItem("userId");
        if (userId) {
          const userToken = localStorage.getItem("token") || 
                          localStorage.getItem("userToken") || 
                          localStorage.getItem("authToken");
          const headers = userToken ? { Authorization: `Bearer ${userToken}` } : undefined;
          
          console.log(`🔵 Fetching user profile from API for userId: ${userId}`);
          const response = await apiClient.get(`/users/${userId}`, { headers });
          
          // Handle different response structures
          const user = response.data?.user || response.data?.data?.user || response.data?.data || response.data;
          
          console.log(`🔵 Full user object from API:`, user);
          
          // Get age_group_id directly from API response (PRIORITY)
          if (user?.age_group_id !== undefined && user?.age_group_id !== null) {
            userAgeGroupId = parseInt(user.age_group_id);
            console.log(`✅ Found age_group_id from API: ${userAgeGroupId}`);
          } else {
            console.warn(`⚠️ age_group_id not found in API response for user`);
          }
          
          // Also get age for display
          userAgeValue = user?.age || null;
          
          // Update localStorage with fresh data from API
          if (user) {
            localStorage.setItem("user", JSON.stringify(user));
            if (user.age_group_id !== undefined && user.age_group_id !== null) {
              localStorage.setItem("adminSelectedVariantId", user.age_group_id.toString());
              console.log(`✅ Updated localStorage with age_group_id: ${user.age_group_id}`);
            }
          }
        } else {
          // Fallback: try localStorage if no userId
          console.warn(`⚠️ No userId found, trying localStorage...`);
          const storedVariantId = localStorage.getItem("adminSelectedVariantId");
          if (storedVariantId) {
            userAgeGroupId = parseInt(storedVariantId);
            console.log(`Found age_group_id in localStorage (fallback): ${userAgeGroupId}`);
          }

          const userDataStr = localStorage.getItem("user");
          if (userDataStr) {
            try {
              const userData = JSON.parse(userDataStr);
              if (userData.age_group_id !== undefined && userData.age_group_id !== null) {
                userAgeGroupId = parseInt(userData.age_group_id);
                console.log(`Found age_group_id in user localStorage (fallback): ${userAgeGroupId}`);
              }
              userAgeValue = userData.age || null;
            } catch (e) {
              console.error("Error parsing user data:", e);
            }
          }
        }

        // Set user age for display
        if (userAgeValue) {
          const age = parseInt(userAgeValue);
          setUserAge(age);
        }

        // Set age_group_id ONLY from API - no frontend calculation
        if (userAgeGroupId !== null && !isNaN(userAgeGroupId)) {
          setAgeGroupId(userAgeGroupId);
          console.log(`User age_group_id from API: ${userAgeGroupId}, User age: ${userAgeValue || 'N/A'}`);
        } else {
          // If age_group_id is not available from API, set to null
          // This will result in no tests being shown (strict matching required)
          console.warn("User age_group_id not found in API response. Cannot filter tests.");
          setAgeGroupId(null);
        }
      } catch (err) {
        console.error("Error getting user age_group_id:", err);
        setUserAge(null);
        setAgeGroupId(null);
      } finally {
        // Mark age check as complete so we can fetch tests
        setAgeCheckComplete(true);
      }
    };

    getUserAgeGroupId();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userToken = localStorage.getItem("token") || 
                       localStorage.getItem("userToken") || 
                       localStorage.getItem("authToken");
      
      const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
      };
      
      if (userToken) {
        headers.Authorization = `Bearer ${userToken}`;
      }
      
      // Send age_group_id so API can filter; also filter on frontend for display
      const params = {};
      if (ageGroupId != null && ageGroupId !== "") {
        params.age_group_id = ageGroupId;
      }
      
      console.log(`🔵 Fetching tests from API (age_group_id: ${ageGroupId ?? "none"})...`);
      const response = await axios.get(`${API_BASE_URL}/tests`, { headers, params });
      console.log(`🔵 API Response:`, response.data);

      // Handle different response structures
      let allTests = [];
      if (response.data?.status && response.data.data) {
        allTests = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      } else if (Array.isArray(response.data)) {
        allTests = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        allTests = response.data.data;
      }

      if (allTests.length > 0) {
        // Filter by age_group_id (show only tests for user's age group when we have one)
        let byAge = allTests;
        if (ageGroupId != null && ageGroupId !== "") {
          const id = Number(ageGroupId);
          byAge = allTests.filter((test) => {
            const tid = test.age_group_id != null ? Number(test.age_group_id) : null;
            return tid === id;
          });
        }
        const activeTests = byAge
          .filter((test) => {
            const active = test.is_active;
            const isActive = active === 1;
            if (!isActive) return false;
            const source = (test.source || test.test_type || "").toString().trim().toLowerCase();
            return source === "sc pro";
          })
          .map((test) => ({
            id: test.id,
            title: test.title || "",
            description: test.description || "",
            is_active: test.is_active !== undefined ? test.is_active : true,
            clusters: test.clusters || [],
            age_group_id: test.age_group_id || null,
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
    // Only fetch tests after age check is complete
    // This prevents multiple fetches and ensures we have the correct ageGroupId
    if (ageCheckComplete) {
      fetchTests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ageGroupId, ageCheckComplete]);

  const handleStartTest = async (testId) => {
    try {
      // Call the take endpoint to initialize the test
      await apiClient.get(`/tests/${testId}/take`);
      // Navigate to test page with testId in state (not in URL)
      navigate(`/strengthcompass`, { state: { testId } });
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
      <div className="min-h-screen w-screen neutral-text neutral-bg">
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
    <div className="min-h-screen w-screen neutral-text blue-bg-50 flex flex-col">
      <AlertModal
        isOpen={!!error}
        onClose={() => setError(null)}
        type="error"
        title="Error"
        message={error || ""}
      />
      <Navbar />

      <main className="flex-1 flex flex-col min-h-0 w-full overflow-auto">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col min-h-0 flex-1">
        {/* Compact Hero Header */}
        <header className="relative text-center mb-5 sm:mb-6 overflow-hidden rounded-2xl bg-light border blue-border-100 shadow-md p-5 sm:p-6 gradient-soft shrink-0">
          <div className="absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blue-bg-100 opacity-40" />
            <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full yellow-bg-100 opacity-30" />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-center sm:gap-4">
            <div className="inline-flex w-12 h-12 sm:w-14 sm:h-14 rounded-xl gradient-primary items-center justify-center shadow-primary mb-3 sm:mb-0 ring-2 ring-blue-100/50">
              <HiDocumentText className="w-6 h-6 sm:w-7 sm:h-7 white-text" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold neutral-text tracking-tight">
                Available Assessments
              </h1>
              <p className="neutral-text-muted text-xs sm:text-sm mt-0.5 max-w-md sm:mx-0 mx-auto">
                Choose an assessment to discover your strengths.
              </p>
            </div>
          </div>
        </header>

        {filteredTests.length === 0 ? (
          <div className="card bg-light text-center py-20 sm:py-24 rounded-3xl blue-border-200 border-2 max-w-lg mx-auto px-10 gradient-yellow-soft shadow-lg">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl yellow-bg-200 flex items-center justify-center secondary-text-dark shadow-secondary ring-4 ring-yellow-100/50">
              <HiDocumentText className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold neutral-text mb-3">No tests available</h2>
            <p className="neutral-text-muted text-sm leading-relaxed max-w-sm mx-auto">
              {ageGroupId
                ? "No tests are available for your age group. Please check back later."
                : "No tests found. Please check back later."}
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-3 sm:mb-4 shrink-0">
              <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider neutral-text-muted">
                Your assessments
              </h2>
              <span className="badge badge-primary text-xs font-semibold">
                {filteredTests.length} {filteredTests.length === 1 ? "test" : "tests"}
              </span>
            </div>
            <section className="space-y-4 sm:space-y-5 flex-1 min-h-0">
              {filteredTests.map((test) => (
                <article
                  key={test.id}
                  className="group relative bg-light rounded-3xl border-2 blue-border-100 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:blue-border-300 hover:-translate-y-0.5 flex flex-row flex-wrap sm:flex-nowrap gap-0 shadow-lg"
                  onClick={() => handleStartTest(test.id)}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-2 gradient-primary rounded-l-3xl group-hover:opacity-100 transition-all duration-300 opacity-90" />
                <div className="w-full sm:flex-1 min-w-0 pl-6 sm:pl-7 pr-4 sm:pr-5 py-5 sm:py-6 flex flex-col justify-center">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl blue-bg-100 flex items-center justify-center blue-text-600 group-hover:blue-bg-200 group-hover:scale-105 transition-all duration-300">
                      <HiDocumentText className="w-6 h-6 sm:w-7 sm:h-7" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl sm:text-2xl font-bold neutral-text leading-snug group-hover:primary-text-medium transition-colors">
                          {test.title}
                        </h3>
                        {test.description && (
                          <p className="mt-2.5 text-sm neutral-text-muted leading-relaxed line-clamp-2">
                            {test.description}
                          </p>
                        )}
                        {test.questions > 0 && (
                          <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold neutral-text-muted primary-bg-light blue-border-100 border px-3 py-1.5 rounded-xl w-fit">
                            <HiLightningBolt className="w-4 h-4 yellow-text-500 shrink-0" />
                            {test.questions} questions
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto sm:shrink-0 p-4 sm:py-6 sm:pr-6 sm:pl-5 flex items-center sm:border-l-2 neutral-border-light neutral-bg-light sm:bg-transparent">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartTest(test.id);
                      }}
                      className="w-full sm:w-auto btn btn-gradient-secondary flex items-center justify-center gap-2.5 min-w-[160px] font-bold text-sm py-3 px-5 rounded-xl"
                    >
                      <HiPlay className="w-5 h-5" />
                      Start Test
                      <HiArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </article>
              ))}
            </section>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
