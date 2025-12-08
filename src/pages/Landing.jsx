import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiX, HiCheckCircle, HiPlay, HiArrowRight, HiDocumentText } from "react-icons/hi";
import Navbar from "../components/Navbar";
import apiClient from "../config/api";

export default function Landing() {
  const navigate = useNavigate();
  const [isFetchingTest, setIsFetchingTest] = useState(false);
  const [startError, setStartError] = useState("");
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [ageGroups, setAgeGroups] = useState([]);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(null);
  const [loadingAgeGroups, setLoadingAgeGroups] = useState(true);
  const [tests, setTests] = useState([]);
  const [isClosingModal, setIsClosingModal] = useState(false);

  // Check if admin is logged in and redirect
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");

    // If admin is logged in, redirect to admin dashboard
    if (adminToken) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  // Check if age group is already selected
  useEffect(() => {
    const savedAgeGroupId = localStorage.getItem("selectedAgeGroupId");
    if (savedAgeGroupId) {
      setSelectedAgeGroup(parseInt(savedAgeGroupId));
      setShowAgeModal(false);
      fetchTests(parseInt(savedAgeGroupId));
    } else {
      setShowAgeModal(true);
      fetchAgeGroups();
    }
  }, []);

  const fetchAgeGroups = async () => {
    try {
      setLoadingAgeGroups(true);
      const response = await apiClient.get("/age-groups");
      
      if (response.data?.status && response.data.data) {
        const groups = Array.isArray(response.data.data) 
          ? response.data.data 
          : [response.data.data];
        
        setAgeGroups(
          groups
            .filter((ag) => ag.is_active !== false)
            .map((ag) => ({
              id: ag.id,
              name: ag.name || "",
              from: ag.from || "",
              to: ag.to || "",
            }))
        );
      }
    } catch (err) {
      console.error("Error fetching age groups:", err);
      // Try alternative endpoint
      try {
        const altResponse = await apiClient.get("/current-age-group");
        if (altResponse.data?.status && altResponse.data.data) {
          const groups = Array.isArray(altResponse.data.data) 
            ? altResponse.data.data 
            : [altResponse.data.data];
          setAgeGroups(
            groups
              .filter((ag) => ag.is_active !== false)
              .map((ag) => ({
                id: ag.id,
                name: ag.name || "",
                from: ag.from || "",
                to: ag.to || "",
              }))
          );
        }
      } catch (altErr) {
        console.error("Error fetching age groups from alternative endpoint:", altErr);
      }
    } finally {
      setLoadingAgeGroups(false);
    }
  };

  const fetchTests = async (ageGroupId) => {
    try {
      setIsFetchingTest(true);
      setStartError("");
      
      const response = await apiClient.get("/tests", {
        params: {
          age_group_id: ageGroupId,
        },
        headers: {
          "X-Age-Group-Id": ageGroupId.toString(),
        },
      });

      if (response.data?.status && Array.isArray(response.data.data)) {
        const activeTests = response.data.data.filter(
          (test) => test.is_active !== false
        );
        setTests(activeTests);
        if (activeTests.length === 0) {
          setStartError("No active tests available right now.");
        }
      } else {
        setStartError("Unable to load tests. Please try again later.");
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

  const handleAgeSelection = (ageGroup) => {
    setSelectedAgeGroup(ageGroup.id);
  };

  const handleContinue = () => {
    if (!selectedAgeGroup) return;
    
    const selectedGroup = ageGroups.find(ag => ag.id === selectedAgeGroup);
    if (selectedGroup) {
      localStorage.setItem("selectedAgeGroupId", selectedGroup.id.toString());
      handleCloseModal();
      fetchTests(selectedGroup.id);
      
      // Scroll to tests section after a short delay
      setTimeout(() => {
        const testsSection = document.getElementById('tests-section');
        if (testsSection) {
          testsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  };

  const handleOpenAgeModal = () => {
    // Keep current selection when reopening modal (don't reset)
    // If no age group is selected, it will be null
    setShowAgeModal(true);
    // Fetch age groups if not already loaded
    if (ageGroups.length === 0) {
      fetchAgeGroups();
    }
  };

  const handleCloseModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setIsClosingModal(false);
      setShowAgeModal(false);
    }, 220);
  };

  const isUserAuthenticated = () => {
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) return false;
    return !!(
      localStorage.getItem("token") ||
      localStorage.getItem("userToken") ||
      localStorage.getItem("authToken")
    );
  };

  const handleStartTest = async (testId) => {
    if (!testId) {
      setStartError("No active tests available right now. Please try again later.");
      return;
    }

    try {
      // Call the take endpoint to initialize the test
      await apiClient.get(`/tests/${testId}/take`);
      
      const targetPath = `/test/${testId}`;

      if (isUserAuthenticated()) {
        navigate(targetPath);
        return;
      }

      sessionStorage.setItem("redirectAfterAuth", targetPath);
      navigate("/login", { state: { redirectTo: targetPath } });
    } catch (err) {
      console.error("Error starting test:", err);
      setStartError(
        err.response?.data?.message ||
          "Failed to start test. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen w-screen blue-bg-100">
      {/* Age Selection Modal */}
      {(showAgeModal || isClosingModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={`absolute inset-0 bg-black/40 ${
              isClosingModal ? "animate-backdrop-out" : "animate-backdrop-in"
            }`}
            onClick={(e) => {
              // Prevent closing on backdrop click - user must select age and click Continue
              e.stopPropagation();
            }}
          />
          <div
            className={`relative bg-white rounded-2xl max-w-2xl w-full shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)] overflow-hidden border border-neutral-200 ${
              isClosingModal ? "animate-modal-out" : "animate-modal-in"
            }`}
          >
            <div className="px-6 md:px-8 py-6 md:py-8">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-blue-50">
                    <HiCheckCircle className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                   Let's begin your Strengths Compass journey
                </h3>
                <p className="text-neutral-700 text-lg">
                   Please choose your age to load the right version of the assessment.
                </p>
              </div>

              {loadingAgeGroups ? (
                <div className="text-center py-8">
                  <div className="spinner spinner-lg mx-auto mb-4"></div>
                  <p className="text-neutral-600">Loading age groups...</p>
                </div>
              ) : ageGroups.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-red-600">No age groups available. Please try again later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {ageGroups.map((ageGroup) => (
                    <button
                      key={ageGroup.id}
                      onClick={() => handleAgeSelection(ageGroup)}
                      className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
                        selectedAgeGroup === ageGroup.id
                          ? "border-blue-500 bg-blue-50 shadow-lg"
                          : "border-neutral-200 bg-white hover:border-blue-300 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-neutral-900 mb-1">
                            {ageGroup.name}
                          </h4>
                          <p className="text-sm text-neutral-600">
                            {ageGroup.from} - {ageGroup.to} years
                          </p>
                        </div>
                        {selectedAgeGroup === ageGroup.id && (
                          <HiCheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={handleContinue}
                  disabled={!selectedAgeGroup}
                  className="px-8 py-3 rounded-full bg-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

      <Navbar onSelectAgeGroup={handleOpenAgeModal} selectedAgeGroup={selectedAgeGroup} ageGroups={ageGroups} />

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

      {/* Tests Section */}
      {selectedAgeGroup && (
        <section id="tests-section" className="w-full px-6 md:px-16 py-12 md:py-20">
          <div className="max-w-7xl mx-auto">
            {isFetchingTest ? (
              <div className="flex items-center justify-center min-h-[40vh]">
                <div className="text-center">
                  <div className="spinner spinner-lg mx-auto mb-4"></div>
                  <p className="text-neutral-600">Loading tests...</p>
                </div>
              </div>
            ) : tests.length > 0 ? (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
                    Available Tests
                  </h2>
                  <p className="text-neutral-600">
                    {tests.length} {tests.length === 1 ? "test" : "tests"} available for your age group
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {tests.map((test) => (
                    <article
                      key={test.id}
                      className="group relative bg-white rounded-[28px] shadow-lg border border-blue-100 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-600" />
                      <div className="p-6 flex flex-col h-full gap-5">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                            {test.clusters?.[0]?.name || "General"}
                          </span>
                          <div className="p-2 rounded-2xl bg-blue-50 text-blue-500">
                            <HiDocumentText className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {test.title}
                          </h3>
                          <p className="text-sm text-slate-500 line-clamp-3">
                            {test.description || "Take this assessment to discover your strengths."}
                          </p>
                        </div>

                        {/* <div className="grid grid-cols-2 gap-3 text-sm d-none">
                          <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100">
                            <p className="text-xs uppercase tracking-[0.3em] text-blue-600">Duration</p>
                            <p className="text-base font-semibold text-slate-900 mt-1">30 minutes</p>
                          </div>
                          <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100">
                            <p className="text-xs uppercase tracking-[0.3em] text-blue-600">Questions</p>
                            <p className="text-base font-semibold text-slate-900 mt-1">
                              {test.clusters?.reduce((total, cluster) => total + (cluster.question_count || 0), 0) || "N/A"}
                            </p>
                          </div>
                        </div> */}

                        <button
                          onClick={() => handleStartTest(test.id)}
                          className="mt-auto w-full py-3 px-4 rounded-2xl yellow-bg-400 yellow-text-950 font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-xl transition-all duration-200 shadow-lg group/btn"
                        >
                          <HiPlay className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                          Let's Start
                          <HiArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-20 bg-white rounded-[32px] shadow-inner border border-dashed border-yellow-400">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-500">
                  <HiDocumentText className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 mb-2">No tests available</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  There are no active tests available for your selected age group at the moment.
                </p>
              </div>
            )}
            {startError && (
              <div className="mt-4 text-center">
                <p className="text-sm text-red-600">{startError}</p>
              </div>
            )}
          </div>
        </section>
      )}

    </div>
  );
}
