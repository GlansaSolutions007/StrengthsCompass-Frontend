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
      
      // Get ALL tests from API (no filtering on backend)
      // We will filter on frontend based on age_group_id matching
      // IMPORTANT: Use direct axios call to bypass the interceptor that adds age_group_id
      const API_BASE_URL = "https://strengthscompass.axiscompass.in/v1/api";
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
      
      // Direct axios call WITHOUT age_group_id to get ALL tests
      // This bypasses the interceptor that automatically adds age_group_id
      console.log(`🔵 Fetching ALL tests from API (no age_group_id filter)...`);
      const response = await axios.get(`${API_BASE_URL}/tests`, { headers });
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
        console.log(`=== TEST FILTERING START ===`);
        console.log(`🔵 USER age_group_id: ${ageGroupId}`);
        console.log(`User age: ${userAge || 'N/A'}`);
        console.log(`\n📋 ALL TESTS FETCHED FROM API (Total: ${allTests.length}):`);
        allTests.forEach((test, index) => {
          console.log(`   ${index + 1}. "${test.title}" (ID: ${test.id}) - age_group_id: ${test.age_group_id !== undefined && test.age_group_id !== null ? test.age_group_id : 'NULL/UNDEFINED'}`);
        });
        console.log(`\n🔍 FILTERING TESTS BASED ON MATCHING age_group_id...\n`);
        
        // Filter tests: Only show tests that match user's age group ID exactly
        const activeTests = allTests
          .filter((test) => {
            // Get age_group_id from test - handle various formats
            const testAgeGroupId = test.age_group_id !== undefined && test.age_group_id !== null 
              ? test.age_group_id 
              : null;
            
            // Print user and test age_group_id for comparison
            console.log(`\n🔍 Checking Test: "${test.title}" (ID: ${test.id})`);
            console.log(`   User age_group_id: ${ageGroupId}`);
            console.log(`   Test age_group_id: ${testAgeGroupId !== null ? testAgeGroupId : 'NULL/UNDEFINED'}`);
            
            // First check if test is active
            const isActive = test.is_active !== false && test.is_active !== 0;
            if (!isActive) {
              console.log(`   ❌ Filtered out - test is not active`);
              return false;
            }
            
            // STRICT MATCHING: Only show tests if user has age_group_id from API
            if (ageGroupId === null || ageGroupId === undefined) {
              // If user doesn't have age_group_id from API, show no tests
              console.log(`   ❌ Filtered out - user age_group_id not available from API`);
              return false;
            }
            
            // If test has no age_group_id, filter it out
            if (testAgeGroupId === null || testAgeGroupId === undefined) {
              console.log(`   ❌ Filtered out - test has no age_group_id`);
              return false;
            }
            
            // Convert both to numbers for strict comparison
            const testAgeGroupNum = parseInt(testAgeGroupId);
            const requiredAgeGroupNum = parseInt(ageGroupId);
            
            console.log(`   📊 Comparison: test.age_group_id (${testAgeGroupId}) [${typeof testAgeGroupId}] → ${testAgeGroupNum} [number]`);
            console.log(`    Comparison: user.age_group_id (${ageGroupId}) [${typeof ageGroupId}] → ${requiredAgeGroupNum} [number]`);
            
            // Check for NaN after parsing
            if (isNaN(testAgeGroupNum) || isNaN(requiredAgeGroupNum)) {
              console.log(`   ❌ Filtered out - invalid age_group_id values (test: ${testAgeGroupId}→${testAgeGroupNum}, user: ${ageGroupId}→${requiredAgeGroupNum})`);
              return false;
            }
            
            // Strict matching - must be exact match
            const matches = testAgeGroupNum === requiredAgeGroupNum;
            
            if (!matches) {
              console.log(`   ❌ Filtered out - age_group_id mismatch:`);
              console.log(`      Test age_group_id: ${testAgeGroupNum} (${typeof testAgeGroupNum})`);
              console.log(`      User age_group_id: ${requiredAgeGroupNum} (${typeof requiredAgeGroupNum})`);
              console.log(`      Match: ${testAgeGroupNum} === ${requiredAgeGroupNum} = ${matches}`);
              return false;
            } else {
              console.log(`   ✅✅✅ MATCHED! ✅✅✅`);
              console.log(`      Test age_group_id: ${testAgeGroupId} (${testAgeGroupNum})`);
              console.log(`      User age_group_id: ${ageGroupId} (${requiredAgeGroupNum})`);
              console.log(`      ✅ Both age_group_ids are MATCHING: ${testAgeGroupNum} === ${requiredAgeGroupNum}`);
            }
            
            return true; // Test is active AND age_group_id matches exactly
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
        
        console.log(`\n=== TEST FILTERING COMPLETE ===`);
        console.log(`🔵 USER age_group_id: ${ageGroupId}`);
        console.log(`📊 Total tests from API: ${allTests.length}`);
        console.log(`✅ Matching tests found: ${activeTests.length}`);
        
        if (activeTests.length > 0) {
          console.log(`\n✅✅✅ MATCHED TESTS - age_group_id: ${ageGroupId} ✅✅✅`);
          console.log(`\n📋 Summary of Matched Tests:`);
          activeTests.forEach((test, index) => {
            console.log(`   ${index + 1}. "${test.title}" (ID: ${test.id})`);
            console.log(`      ✅ Test age_group_id: ${test.age_group_id}`);
            console.log(`      ✅ User age_group_id: ${ageGroupId}`);
            console.log(`      ✅ MATCHED: ${test.age_group_id} === ${ageGroupId}`);
          });
          console.log(`\n✅ Showing ${activeTests.length} test(s) to the user with matching age_group_id: ${ageGroupId}`);
        } else {
          console.warn(`\n⚠️ No tests match user's age_group_id: ${ageGroupId}`);
          console.warn(`   User age_group_id: ${ageGroupId}`);
          const availableAgeGroupIds = [...new Set(allTests.map(t => t.age_group_id).filter(id => id !== null && id !== undefined))];
          console.warn(`   Available test age_group_ids in API: ${availableAgeGroupIds.length > 0 ? availableAgeGroupIds.join(', ') : 'None'}`);
          console.warn(`   User needs age_group_id: ${ageGroupId}, but tests have: ${availableAgeGroupIds.join(', ') || 'none'}`);
        }
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

      <div className="w-full px-5 sm:px-8 lg:px-12 xl:px-16 py-10 min-h-[calc(100vh-200px)] flex flex-col justify-center items-center">
        

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
        {/* <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
        </section> */}

        {filteredTests.length === 0 ? (
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
        ): (
         <section className="flex justify-center items-center w-full">
           {filteredTests.length === 1 ? (
             // Single test - centered, no grid
             <div className="w-full max-w-2xl px-4">
               {filteredTests.map((test) => (
                 <article
                   key={test.id}
                   className="group relative bg-white rounded-3xl shadow-xl border border-gray-100 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer mx-auto"
                   onClick={() => handleStartTest(test.id)}
                 >
                   {/* Gradient Top Bar */}
                   <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600" />
                   
                   <div className="p-8 flex flex-col h-full gap-6">
                     {/* Header Section */}
                     <div className="flex items-start justify-between gap-4">
                       <div className="flex-1">
                         <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                           {test.title}
                         </h3>
                         {test.description && (
                           <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                             {test.description}
                           </p>
                         )}
                       </div>
                       <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 group-hover:from-blue-100 group-hover:to-blue-200 transition-all">
                         <HiDocumentText className="w-6 h-6" />
                       </div>
                     </div>

                     {/* Test Info Section */}
                     {test.questions > 0 && (
                       <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                         <HiLightningBolt className="w-4 h-4 text-yellow-500" />
                         <span className="text-sm text-slate-600 font-medium">{test.questions} Questions</span>
                       </div>
                     )}

                     {/* Action Button */}
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         handleStartTest(test.id);
                       }}
                       className="mt-auto w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 font-bold text-sm flex items-center justify-center gap-2 hover:from-yellow-500 hover:to-yellow-600 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] group/btn"
                     >
                       <HiPlay className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                       <span>Start Test</span>
                       <HiArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                     </button>
                   </div>
                 </article>
               ))}
             </div>
           ) : (
             // Multiple tests - grid layout
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-7xl w-full px-4 mx-auto">
            {filteredTests.map((test) => (
              <article
                key={test.id}
                className="group relative bg-white rounded-3xl shadow-xl border border-gray-100 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => handleStartTest(test.id)}
              >
                {/* Gradient Top Bar */}
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600" />
                
                <div className="p-8 flex flex-col h-full gap-6">
                  {/* Header Section */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {test.title}
                      </h3>
                      {test.description && (
                        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {test.description}
                        </p>
                      )}
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 group-hover:from-blue-100 group-hover:to-blue-200 transition-all">
                      <HiDocumentText className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Test Info Section */}
                  {test.questions > 0 && (
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                      <HiLightningBolt className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-slate-600 font-medium">{test.questions} Questions</span>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartTest(test.id);
                    }}
                    className="mt-auto w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 font-bold text-sm flex items-center justify-center gap-2 hover:from-yellow-500 hover:to-yellow-600 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] group/btn"
                  >
                    <HiPlay className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    <span>Start Test</span>
                    <HiArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </article>
            ))}
          </div>
           )}
        </section>
        )}
      </div>
    </div>
  );
}
