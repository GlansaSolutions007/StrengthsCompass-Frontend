import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HiCheck, HiChevronLeft, HiChevronRight } from "react-icons/hi";
import Navbar from "../components/Navbar";
import AlertModal from "../components/AlertModal";
import apiClient from "../config/api";

export default function Test() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [testName, setTestName] = useState("Assessment Test");
  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const itemsPerPage = 10;

  // Check if admin is logged in and redirect
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    
    // If admin is logged in, redirect to admin dashboard
    if (adminToken) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);
  
  // Get user ID from API or localStorage
  const fetchUserId = useCallback(async () => {
    try {
      // First check localStorage for user ID
      const storedUser = localStorage.getItem("user");
      const storedUserId = localStorage.getItem("userId");
      
      if (storedUserId) {
        const userId = parseInt(storedUserId);
        setUserId(userId);
        return userId;
      }
      
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          const id = user.id || user.user_id;
          if (id) {
            const userId = parseInt(id);
            setUserId(userId);
            localStorage.setItem("userId", userId);
            return userId;
          }
        } catch (e) {
          console.error("Error parsing stored user:", e);
        }
      }
      
      // If not in localStorage, try API endpoints (only if token exists)
      const token = localStorage.getItem("token") || 
                   localStorage.getItem("userToken") || 
                   localStorage.getItem("authToken");
      
      if (token) {
        // Try user profile endpoint if available
        try {
          const response = await apiClient.get("/users/me");
          if (response.data?.status && response.data.data) {
            const user = response.data.data.user || response.data.data;
            const id = user.id || user.user_id;
            if (id) {
              const userId = parseInt(id);
              setUserId(userId);
              localStorage.setItem("userId", userId);
              return userId;
            }
          }
        } catch (err) {
          // Endpoint doesn't exist or failed, continue
          console.log("User profile endpoint not available");
        }
      }
      
      return null;
    } catch (err) {
      console.error("Error fetching user ID:", err);
      return null;
    }
  }, []);

  const fetchOptions = async () => {
    try {
      const response = await apiClient.get("/options");
      if (response.data?.status && response.data.data) {
        // Sort options by value to maintain order
        const sortedOptions = response.data.data
          .map((o) => ({
            id: o.id,
            label: o.label || o.option_text || o.optionText || o.name || "",
            value: o.value !== undefined ? o.value : null,
          }))
          .sort((a, b) => {
            // Sort by value (numeric) if both are numbers
            if (a.value !== null && b.value !== null) {
              return a.value - b.value;
            }
            return 0;
          });
        setOptions(sortedOptions);
      }
    } catch (err) {
      console.error("Error fetching options:", err);
      // Don't set error here, just log it - options are not critical
    }
  };

  const fetchTestData = async () => {
    if (!testId) {
      setError("Test ID is required. Please select a test from the test list.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/tests/${testId}/take`);

      if (response.data?.status && response.data.data) {
        const testData = response.data.data;
        const extractedName =
          testData.title ||
          testData.name ||
          testData.test_name ||
          testData.testName ||
          testData?.test?.title ||
          testData?.test?.name ||
          response.data?.data?.test?.title ||
          response.data?.data?.test?.name;
        setTestName(extractedName || "Assessment Test");
        
        // Extract questions from test data
        if (testData.questions && Array.isArray(testData.questions)) {
          setQuestions(
            testData.questions.map((q) => ({
              id: q.id,
              question_text: q.question_text || q.questionText || q.question || "",
              category: q.category || "",
              order_no: q.order_no || q.orderNo || 0,
            }))
          );
        } else if (testData.data?.questions) {
          setQuestions(
            testData.data.questions.map((q) => ({
              id: q.id,
              question_text: q.question_text || q.questionText || q.question || "",
              category: q.category || "",
              order_no: q.order_no || q.orderNo || 0,
            }))
          );
        } else if (Array.isArray(testData)) {
          // If testData is directly an array of questions
          setQuestions(
            testData.map((q) => ({
              id: q.id,
              question_text: q.question_text || q.questionText || q.question || "",
              category: q.category || "",
              order_no: q.order_no || q.orderNo || 0,
            }))
          );
        }
      } else if (response.data?.data) {
        // Handle case where data is directly in response.data.data
        const testData = response.data.data;
        const extractedName =
          testData.title ||
          testData.name ||
          testData.test_name ||
          testData.testName ||
          testData?.test?.title ||
          testData?.test?.name;
        setTestName(extractedName || "Assessment Test");
        if (Array.isArray(testData)) {
          setQuestions(
            testData.map((q) => ({
              id: q.id,
              question_text: q.question_text || q.questionText || q.question || "",
              category: q.category || "",
              order_no: q.order_no || q.orderNo || 0,
            }))
          );
        }
      } else {
        setError("Failed to load test data");
      }
    } catch (err) {
      console.error("Error fetching test data:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load test. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
    fetchTestData();
    fetchUserId(); // Fetch user ID from API
  }, [testId]);

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) return;

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("userToken") ||
      localStorage.getItem("authToken");

    if (!token) {
      const targetPath = testId ? `/test/${testId}` : "/testlist";
      sessionStorage.setItem("redirectAfterAuth", targetPath);
      navigate("/login", { replace: true, state: { redirectTo: targetPath } });
    }
  }, [navigate, testId]);

  const handleAnswerSelect = (questionId, optionIndex) => {
    const updatedAnswers = { ...answers, [questionId]: optionIndex };
    setAnswers(updatedAnswers);
  };

  const getUnansweredQuestions = useCallback(
    (questionList) =>
      (questionList || []).filter(
        (question) => answers[question.id] === undefined || answers[question.id] === null
      ),
    [answers]
  );

  const isAuthenticated = () => {
    const token = localStorage.getItem("token") || 
                  localStorage.getItem("userToken") || 
                  localStorage.getItem("authToken");
    const adminToken = localStorage.getItem("adminToken");
    return !!token && !adminToken;
  };

  const submitTestData = useCallback(async (currentUserId) => {
    setSubmitError(null);
    setSubmitting(true);

    try {
      let finalUserId = currentUserId || userId;
      if (!finalUserId) {
        finalUserId = await fetchUserId();
      }
      
      if (!finalUserId) {
        setSubmitError("User ID not found. Please login again.");
        setSubmitting(false);
        return;
      }

      // Map answers to the required format - only include answered questions
      const answersArray = questions
        .filter((question) => answers[question.id] !== undefined && answers[question.id] !== null)
        .map((question) => {
          const optionIndex = answers[question.id];
          const selectedOption = options[optionIndex];
          const answerValue = selectedOption?.value !== null && selectedOption?.value !== undefined
            ? selectedOption.value
            : optionIndex + 1; // Fallback to index + 1 if value is null

          return {
            question_id: question.id,
            answer_value: answerValue,
          };
        });

      if (!testId) {
        setSubmitError("Test ID is required for submission");
        setSubmitting(false);
        return;
      }

      const payload = {
        user_id: finalUserId,
        answers: answersArray,
      };

      const response = await apiClient.post(`/tests/${testId}/submit`, payload);

      if (response.data?.status) {
        // Store test results in localStorage
        const testResult = {
          testId: testId ? parseInt(testId) : (response.data.data?.test_id || Date.now()),
          userId: finalUserId,
          submittedAt: new Date().toISOString(),
          answers: answersArray,
          totalQuestions: questions.length,
          answeredQuestions: answersArray.length
        };
        
        // Update userId state
        setUserId(finalUserId);
        
        // Get existing test results
        const existingTests = JSON.parse(localStorage.getItem("userTestResults") || "[]");
        existingTests.push(testResult);
        localStorage.setItem("userTestResults", JSON.stringify(existingTests));
        
        // Show success modal
        setShowSuccessModal(true);
      } else {
        setSubmitError(response.data?.message || "Failed to submit test");
      }
    } catch (err) {
      console.error("Error submitting test:", err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error ||
                          (err.response?.status === 404 
                            ? `Endpoint not found. Please check if the test ID (${testId}) is valid.`
                            : err.response?.statusText || "Failed to submit test. Please try again.");
      setSubmitError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [answers, questions, options, testId, userId, fetchUserId]);

  const handleSubmit = useCallback(async () => {
    // Ensure all questions have been answered
    const unanswered = getUnansweredQuestions(questions);
    if (unanswered.length > 0) {
      setSubmitError("Please answer all the questions before submitting the test.");
      return;
    }

    // Check if user is authenticated first
    if (!isAuthenticated()) {
      const targetPath = testId ? `/test/${testId}` : "/testlist";
      sessionStorage.setItem("redirectAfterAuth", targetPath);
      navigate("/login", { state: { redirectTo: targetPath } });
      return;
    }

    // User is authenticated, fetch user ID from API
    let currentUserId = userId;
    if (!currentUserId) {
      currentUserId = await fetchUserId();
    }
    
    if (!currentUserId) {
      setSubmitError("User ID not found. Please login again.");
      return;
    }

    // User ID exists, submit directly
    await submitTestData(currentUserId);
  }, [
    navigate,
    getUnansweredQuestions,
    questions,
    userId,
    isAuthenticated,
    testId,
    submitTestData,
    fetchUserId,
  ]);

  // Calculate pagination
  const totalPages = Math.ceil(questions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQuestions = questions.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page > currentPage) {
      const currentSliceStart = (currentPage - 1) * itemsPerPage;
      const currentSliceEnd = Math.min(currentPage * itemsPerPage, questions.length);
      const currentSlice = questions.slice(currentSliceStart, currentSliceEnd);
      const unansweredOnPage = getUnansweredQuestions(currentSlice);
      if (unansweredOnPage.length > 0) {
        setSubmitError("Please answer all the questions before continuing.");
        return;
      }
    }

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen w-screen neutral-text bg">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="spinner spinner-lg mx-auto mb-4"></div>
            <p className="neutral-text-muted">Loading questions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-screen neutral-text bg">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="danger-text mb-4">{error}</p>
            <button onClick={fetchTestData} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen blue-bg-50 text-slate-900">
      <AlertModal
        isOpen={!!submitError}
        onClose={() => setSubmitError(null)}
        type="error"
        title=" Error"
        message={submitError || ""}
      />
      <AlertModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate("/profile");
        }}
        type="success"
        title="Test Submitted Successfully!"
        message="Your test has been submitted successfully. You can view your results in your profile."
        primaryText="View Profile"
        onPrimary={() => {
          setShowSuccessModal(false);
          navigate("/profile");
        }}
      />
      <Navbar />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 rounded-2xl border border-blue-100 bg-white/80 backdrop-blur p-5 shadow-sm">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2">
            {testName}
          </h1>
          <p className="text-sm text-slate-600">
          Read each sentence and think about how true it is for you in your daily life. Answer based on how you really are, not how you wish to be. There are no right or wrong answers.          </p>
        </div>

        {/* Questions Table */}
        <div className="bg-white rounded-3xl shadow-lg border border-blue-100 p-4 md:p-6 mb-6 w-full">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                
              </thead>
              <tbody>
                {currentQuestions.map((question, qIndex) => {
                  const selectedAnswer = answers[question.id];

                  return (
                    <React.Fragment key={question.id}>
                      <tr className="border-b neutral-border-light">
                        <td className="py-4 px-4 md:px-6">
                          <p className="font-semibold neutral-text text-base md:text-lg flex items-center gap-2">
                            <span className="secondary-text text-2xl font-bold">•</span>
                            <span>{question.question_text}</span>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 md:px-6 pb-5">
                          <div className="flex flex-wrap gap-2 md:gap-2.5">
                            {options.length > 0 ? (
                              options.map((option, optionIndex) => {
                                const isSelected = selectedAnswer === optionIndex;
                                const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D, E

                          return (
                            <button
                                    key={option.id || optionIndex}
                                    type="button"
                                    onClick={() => handleAnswerSelect(question.id, optionIndex)}
                                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                      isSelected
                                        ? "secondary-bg neutral-text shadow-sm"
                                        : "primary-bg-light primary-text border-2 primary-border-light hover:primary-bg-medium"
                                    }`}
                                  >
                                    <span className="font-semibold">{optionLetter}.</span>
                                    <span>{option.label}</span>
                                  </button>
                                );
                              })
                            ) : (
                              <div className="p-4 neutral-bg-medium rounded-lg">
                                <p className="neutral-text-muted text-sm">
                                  Loading options...
                                </p>
                                  </div>
                                )}
                              </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
              </div>

        {/* Pagination and Submit */}
        <div className="flex flex-col gap-4">
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn btn-primary btn-sm flex items-center gap-2"
              >
                <HiChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn btn-primary btn-sm flex items-center gap-2"
              >
                Next
                <HiChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Submit Button - Only on Last Page */}
          {currentPage === totalPages && (
            <div className="card p-4 md:p-6 primary-bg-light border-2 primary-border">
                    <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full btn btn-secondary"
              >
                {submitting ? (
                  <>
                    <span className="spinner spinner-sm mr-2"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Test
                    <HiCheck className="w-4 h-4" />
                  </>
                )}
                    </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
