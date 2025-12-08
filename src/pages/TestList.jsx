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
  const [userAge, setUserAge] = useState(null);
  const [ageGroupId, setAgeGroupId] = useState(null);

  // Check if admin is logged in and redirect
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    
    // If admin is logged in, redirect to admin dashboard
    if (adminToken) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  // Helper function to determine age group ID based on user age
  const getAgeGroupId = (age) => {
    const ageNum = parseInt(age);
    if (isNaN(ageNum)) return null;
    
    // Fixed age group ranges:
    // age_group_id 1: 13-17
    // age_group_id 2: 18-25
    // age_group_id 3: 26-39
    // age_group_id 4: 40-100
    if (ageNum >= 13 && ageNum <= 17) return 1;
    if (ageNum >= 18 && ageNum <= 25) return 2;
    if (ageNum >= 26 && ageNum <= 39) return 3;
    if (ageNum >= 40 && ageNum <= 100) return 4;
    
    return null;
  };

  // Get user age and determine matching age group
  useEffect(() => {
    const getUserAge = async () => {
      try {
        // Try to get user data from localStorage first
        const userDataStr = localStorage.getItem("user");
        let userAgeValue = null;

        if (userDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            userAgeValue = userData.age || null;
          } catch (e) {
            console.error("Error parsing user data:", e);
          }
        }

        // If not in localStorage, fetch from API
        if (!userAgeValue) {
          const userId = localStorage.getItem("userId");
          if (userId) {
            const userToken = localStorage.getItem("token") || 
                            localStorage.getItem("userToken") || 
                            localStorage.getItem("authToken");
            const headers = userToken ? { Authorization: `Bearer ${userToken}` } : undefined;
            const response = await apiClient.get(`/users/${userId}`, { headers });
            
            const user = response.data?.data || response.data?.user || response.data;
            userAgeValue = user?.age || null;
          }
        }

        if (userAgeValue) {
          const age = parseInt(userAgeValue);
          setUserAge(age);
          
          // Determine age group ID based on fixed ranges
          const determinedAgeGroupId = getAgeGroupId(age);
          console.log(`User age: ${age}, Determined age group ID: ${determinedAgeGroupId}`);
          if (determinedAgeGroupId) {
            setAgeGroupId(determinedAgeGroupId);
          } else {
            // Age is outside valid ranges, set to null
            console.warn(`User age ${age} is outside valid age group ranges (13-100)`);
            setAgeGroupId(null);
          }
        } else {
          // If no age found, set userAge to null to trigger fetch without filter
          console.warn("User age not found, will fetch all tests");
          setUserAge(null);
        }
      } catch (err) {
        console.error("Error getting user age:", err);
        setUserAge(null);
      }
    };

    getUserAge();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build request config with age group filter
      const config = {};
      if (ageGroupId) {
        config.params = { age_group_id: ageGroupId };
        config.headers = { "X-Age-Group-Id": ageGroupId.toString() };
      }
      
      const response = await apiClient.get("/tests", config);

      if (response.data?.status && response.data.data) {
        // Filter tests based on age group ID
        let filteredData = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
        
        console.log(`Total tests fetched: ${filteredData.length}, Age Group ID filter: ${ageGroupId}, User Age: ${userAge}`);
        
        // If we have an age group ID, filter tests to only show matching ones
        if (ageGroupId !== null) {
          filteredData = filteredData.filter((test) => {
            // Get age_group_id from test - handle various formats
            const testAgeGroupId = test.age_group_id !== undefined && test.age_group_id !== null 
              ? test.age_group_id 
              : null;
            
            if (testAgeGroupId === null) {
              console.log(`Test "${test.title}" (ID: ${test.id}) has no age_group_id, filtering out`);
              return false;
            }
            
            // Convert both to numbers for comparison
            const testAgeGroupNum = parseInt(testAgeGroupId);
            const requiredAgeGroupNum = parseInt(ageGroupId);
            
            // Strict matching - must be exact match
            const matches = testAgeGroupNum === requiredAgeGroupNum;
            
            if (!matches) {
              console.log(`Test "${test.title}" (ID: ${test.id}) filtered out - age_group_id: ${testAgeGroupId} (${testAgeGroupNum}), required: ${ageGroupId} (${requiredAgeGroupNum})`);
            } else {
              console.log(`Test "${test.title}" (ID: ${test.id}) matches - age_group_id: ${testAgeGroupId}`);
            }
            
            return matches;
          });
          console.log(`Tests after age group filtering: ${filteredData.length}`);
        } else {
          console.warn("No age group ID determined, showing all tests");
        }
        
        // Filter only active tests and ensure age_group_id matches (double check)
        const activeTests = filteredData
          .filter((test) => {
            // First check if test is active
            const isActive = test.is_active !== false && test.is_active !== 0;
            
            // If we have an age group ID, double-check the match
            if (ageGroupId !== null) {
              const testAgeGroupId = test.age_group_id !== undefined && test.age_group_id !== null 
                ? parseInt(test.age_group_id) 
                : null;
              const matchesAgeGroup = testAgeGroupId === parseInt(ageGroupId);
              
              if (!matchesAgeGroup) {
                console.log(`Test "${test.title}" filtered out in final check - age_group_id mismatch`);
                return false;
              }
            }
            
            return isActive;
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
        
        console.log(`Final tests to display: ${activeTests.length}`);
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
    // Fetch tests when ageGroupId is set, or if we've determined user has no age
    // This ensures we wait for age group determination before fetching
    if (ageGroupId !== null) {
      fetchTests();
    } else if (userAge === null) {
      // If user age couldn't be determined, fetch all tests
      fetchTests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ageGroupId, userAge]);

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
            <h3 className="text-2xl font-semibold text-slate-900 mb-2">No tests available</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              {ageGroupId 
                ? `No tests are available for your age group. Please check back later.`
                : `No tests found. Please check back later.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
